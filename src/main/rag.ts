import * as secureStore from './secure-store'
import { embedText, embedTexts } from './embeddings'

const TOP_K = 6
const MIN_SCORE = 0.25

interface PendingDoc {
  sourceType: string
  sourceId: number
  content: string
}

interface ChunkRow {
  content: string
  embedding: string
}

const money = (value: number): string => value.toFixed(2)

const cosine = (a: number[], b: number[]): number => {
  let dot = 0
  let na = 0
  let nb = 0
  const len = Math.min(a.length, b.length)
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb)
  return denom === 0 ? 0 : dot / denom
}

const collectPending = (projectId: number): PendingDoc[] => {
  const docs: PendingDoc[] = []

  const transactions = secureStore.query<{
    id: number
    date: string
    type: string
    amount: number
    description: string | null
    category: string | null
    account: string | null
    currency: string
  }>(
    `SELECT t.id, t.date, t.type, t.amount, t.description,
            c.name AS category, a.name AS account, p.currency AS currency
     FROM transactions t
     LEFT JOIN categories c ON c.id = t.category_id
     LEFT JOIN accounts a ON a.id = t.account_id
     JOIN projects p ON p.id = t.project_id
     WHERE t.project_id = ?
       AND NOT EXISTS (
         SELECT 1 FROM rag_chunks r
         WHERE r.project_id = t.project_id
           AND r.source_type = 'transaction' AND r.source_id = t.id
       )`,
    [projectId]
  )
  for (const t of transactions) {
    const parts = [
      `${t.date}: ${t.type} of ${money(t.amount)} ${t.currency}`,
      t.category ? `category ${t.category}` : null,
      t.account ? `account ${t.account}` : null,
      t.description ? `— ${t.description}` : null
    ].filter(Boolean)
    docs.push({
      sourceType: 'transaction',
      sourceId: t.id,
      content: parts.join(' ')
    })
  }

  const goals = secureStore.query<{
    id: number
    name: string
    target_amount: number
    current_amount: number
    deadline: string | null
  }>(
    `SELECT g.id, g.name, g.target_amount, g.current_amount, g.deadline
     FROM goals g
     WHERE g.project_id = ?
       AND NOT EXISTS (
         SELECT 1 FROM rag_chunks r
         WHERE r.project_id = g.project_id
           AND r.source_type = 'goal' AND r.source_id = g.id
       )`,
    [projectId]
  )
  for (const g of goals) {
    const deadline = g.deadline ? `, deadline ${g.deadline}` : ''
    docs.push({
      sourceType: 'goal',
      sourceId: g.id,
      content: `Goal "${g.name}": saved ${money(g.current_amount)} of ${money(g.target_amount)}${deadline}`
    })
  }

  const receipts = secureStore.query<{
    id: number
    parsed_data: string | null
  }>(
    `SELECT rc.id, rc.parsed_data
     FROM receipts rc
     JOIN transactions t ON t.id = rc.transaction_id
     WHERE t.project_id = ? AND rc.parsed_data IS NOT NULL
       AND NOT EXISTS (
         SELECT 1 FROM rag_chunks r
         WHERE r.project_id = t.project_id
           AND r.source_type = 'receipt' AND r.source_id = rc.id
       )`,
    [projectId]
  )
  for (const rc of receipts) {
    const content = receiptToText(rc.parsed_data)
    if (content) docs.push({ sourceType: 'receipt', sourceId: rc.id, content })
  }

  return docs
}

const receiptToText = (parsed: string | null): string | null => {
  if (!parsed) return null
  try {
    const data = JSON.parse(parsed) as {
      merchant?: string
      date?: string
      total?: number | string
      items?: { name?: string }[]
    }
    const parts = [
      data.merchant ? `Receipt from ${data.merchant}` : 'Receipt',
      data.date ? `dated ${data.date}` : null,
      data.total != null ? `total ${data.total}` : null,
      data.items?.length
        ? `items: ${data.items
            .map((i) => i.name)
            .filter(Boolean)
            .join(', ')}`
        : null
    ].filter(Boolean)
    return parts.join(', ')
  } catch {
    return null
  }
}

export const indexProject = async (projectId: number): Promise<void> => {
  const pending = collectPending(projectId)
  if (pending.length === 0) return

  console.log(`[rag] embedding ${pending.length} new record(s) for project ${projectId}`)
  const vectors = await embedTexts(pending.map((d) => d.content))
  for (let i = 0; i < pending.length; i++) {
    const doc = pending[i]
    secureStore.exec(
      `INSERT INTO rag_chunks (project_id, source_type, source_id, content, embedding)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(project_id, source_type, source_id)
       DO UPDATE SET content = excluded.content,
                     embedding = excluded.embedding,
                     updated_at = datetime('now')`,
      [projectId, doc.sourceType, doc.sourceId, doc.content, JSON.stringify(vectors[i])]
    )
  }
}

export const retrieve = async (projectId: number, queryText: string): Promise<string[]> => {
  const rows = secureStore.query<ChunkRow>(
    'SELECT content, embedding FROM rag_chunks WHERE project_id = ?',
    [projectId]
  )
  if (rows.length === 0) return []

  const queryVec = await embedText(queryText)
  const hits = rows
    .map((row) => ({
      content: row.content,
      score: cosine(queryVec, JSON.parse(row.embedding) as number[])
    }))
    .filter((hit) => hit.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_K)
  console.log(`[rag] retrieved ${hits.length}/${rows.length} chunk(s) for query "${queryText}"`)
  return hits.map((hit) => hit.content)
}

export const buildRagContext = async (projectId: number, queryText: string): Promise<string> => {
  if (!queryText.trim()) return ''
  try {
    await indexProject(projectId)
    const hits = await retrieve(projectId, queryText)
    if (hits.length === 0) return ''
    return ['Most relevant records (semantic search):', ...hits.map((h) => `- ${h}`)].join('\n')
  } catch (err) {
    console.error('[rag] retrieval failed, continuing without it:', err)
    return ''
  }
}
