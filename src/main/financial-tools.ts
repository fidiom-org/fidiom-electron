import type { Tool, ToolCall } from '@qvac/sdk'
import * as secureStore from './secure-store'
import { retrieve } from './rag'

export interface FinancialTools {
  tools: Tool[]
  run: (call: ToolCall) => Promise<string>
}

const str = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined

const int = (value: unknown, fallback: number): number => {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? Math.floor(n) : fallback
}

const projectCurrency = (projectId: number): string =>
  secureStore.query<{ currency: string }>('SELECT currency FROM projects WHERE id = ?', [
    projectId
  ])[0]?.currency ?? ''

export const createFinancialTools = (projectId: number): FinancialTools => {
  const cur = projectCurrency(projectId)
  const money = (v: number): string => `${v.toFixed(2)} ${cur}`

  const tools: Tool[] = [
    {
      type: 'function',
      name: 'list_transactions',
      description:
        'List individual transactions, newest first. Filter by type, category name, and date range.',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            description: 'Filter by transaction type',
            enum: ['income', 'expense', 'transfer']
          },
          category: { type: 'string', description: 'Exact category name to filter by' },
          since: { type: 'string', description: 'Earliest date, ISO YYYY-MM-DD' },
          until: { type: 'string', description: 'Latest date, ISO YYYY-MM-DD' },
          limit: { type: 'integer', description: 'Max rows to return (default 20, max 100)' }
        },
        required: []
      }
    },
    {
      type: 'function',
      name: 'sum_spending',
      description:
        'Sum total expense (or income) over a period, optionally for one category. Use for "how much did I spend on X" questions.',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            description: 'Which side to total (default expense)',
            enum: ['income', 'expense']
          },
          category: { type: 'string', description: 'Exact category name to filter by' },
          since: { type: 'string', description: 'Earliest date, ISO YYYY-MM-DD' },
          until: { type: 'string', description: 'Latest date, ISO YYYY-MM-DD' }
        },
        required: []
      }
    },
    {
      type: 'function',
      name: 'account_balances',
      description: 'Current balance of every account in the project, plus the total.',
      parameters: { type: 'object', properties: {}, required: [] }
    },
    {
      type: 'function',
      name: 'list_goals',
      description: 'Savings goals with current vs target amounts and deadlines.',
      parameters: { type: 'object', properties: {}, required: [] }
    },
    {
      type: 'function',
      name: 'search_records',
      description:
        'Semantic search over the user financial records (transactions, receipts, goals) using on-device embeddings. Use for fuzzy/natural questions like "anything about coffee" or "subscriptions".',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Natural-language search query' }
        },
        required: ['query']
      }
    }
  ]

  const listTransactions = (args: Record<string, unknown>): string => {
    const clauses = ['t.project_id = ?']
    const params: unknown[] = [projectId]
    const type = str(args.type)
    if (type) {
      clauses.push('t.type = ?')
      params.push(type)
    }
    const category = str(args.category)
    if (category) {
      clauses.push('c.name = ? COLLATE NOCASE')
      params.push(category)
    }
    const since = str(args.since)
    if (since) {
      clauses.push('t.date >= ?')
      params.push(since)
    }
    const until = str(args.until)
    if (until) {
      clauses.push('t.date <= ?')
      params.push(until)
    }
    const limit = Math.min(Math.max(int(args.limit, 20), 1), 100)
    params.push(limit)

    const rows = secureStore.query<{
      date: string
      type: string
      amount: number
      description: string | null
      category: string | null
    }>(
      `SELECT t.date, t.type, t.amount, t.description, c.name AS category
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE ${clauses.join(' AND ')}
       ORDER BY t.date DESC, t.id DESC
       LIMIT ?`,
      params
    )
    if (rows.length === 0) return 'No matching transactions.'
    return rows
      .map((r) => {
        const cat = r.category ? ` (${r.category})` : ''
        const desc = r.description ? ` — ${r.description}` : ''
        return `${r.date} ${r.type} ${money(r.amount)}${cat}${desc}`
      })
      .join('\n')
  }

  const sumSpending = (args: Record<string, unknown>): string => {
    const clauses = ['t.project_id = ?']
    const params: unknown[] = [projectId]
    const type = str(args.type) ?? 'expense'
    clauses.push('t.type = ?')
    params.push(type)
    const category = str(args.category)
    if (category) {
      clauses.push('c.name = ? COLLATE NOCASE')
      params.push(category)
    }
    const since = str(args.since)
    if (since) {
      clauses.push('t.date >= ?')
      params.push(since)
    }
    const until = str(args.until)
    if (until) {
      clauses.push('t.date <= ?')
      params.push(until)
    }

    const row = secureStore.query<{ total: number; n: number }>(
      `SELECT COALESCE(SUM(t.amount), 0) AS total, COUNT(*) AS n
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE ${clauses.join(' AND ')}`,
      params
    )[0]
    const scope = category ? ` on ${category}` : ''
    const range = since || until ? ` (${since ?? '…'} to ${until ?? '…'})` : ''
    return `Total ${type}${scope}${range}: ${money(row.total)} across ${row.n} transactions.`
  }

  const accountBalances = (): string => {
    const rows = secureStore.query<{
      name: string
      type: string
      currency: string
      balance: number
    }>(
      `SELECT a.name, a.type, a.currency,
              a.initial_balance + COALESCE((
                SELECT SUM(CASE t.type WHEN 'income' THEN t.amount
                                       WHEN 'expense' THEN -t.amount
                                       ELSE 0 END)
                FROM transactions t WHERE t.account_id = a.id
              ), 0) AS balance
       FROM accounts a
       WHERE a.project_id = ?
       ORDER BY a.name`,
      [projectId]
    )
    if (rows.length === 0) return 'No accounts.'
    const lines = rows.map((a) => `- ${a.name} [${a.type}]: ${a.balance.toFixed(2)} ${a.currency}`)
    const total = rows.filter((a) => a.currency === cur).reduce((sum, a) => sum + a.balance, 0)
    lines.push(`Total (${cur} accounts): ${money(total)}`)
    return lines.join('\n')
  }

  const listGoals = (): string => {
    const rows = secureStore.query<{
      name: string
      target_amount: number
      current_amount: number
      deadline: string | null
    }>('SELECT name, target_amount, current_amount, deadline FROM goals WHERE project_id = ?', [
      projectId
    ])
    if (rows.length === 0) return 'No goals set.'
    return rows
      .map((g) => {
        const deadline = g.deadline ? `, by ${g.deadline}` : ''
        return `- ${g.name}: ${money(g.current_amount)} / ${money(g.target_amount)}${deadline}`
      })
      .join('\n')
  }

  const searchRecords = async (args: Record<string, unknown>): Promise<string> => {
    const query = str(args.query)
    if (!query) return 'No query provided.'
    const hits = await retrieve(projectId, query)
    return hits.length === 0 ? 'No relevant records found.' : hits.map((h) => `- ${h}`).join('\n')
  }

  const run = async (call: ToolCall): Promise<string> => {
    const args = (call.arguments ?? {}) as Record<string, unknown>
    try {
      switch (call.name) {
        case 'list_transactions':
          return listTransactions(args)
        case 'sum_spending':
          return sumSpending(args)
        case 'account_balances':
          return accountBalances()
        case 'list_goals':
          return listGoals()
        case 'search_records':
          return await searchRecords(args)
        default:
          return `Unknown tool: ${call.name}`
      }
    } catch (err) {
      return `Tool ${call.name} failed: ${err instanceof Error ? err.message : String(err)}`
    }
  }

  return { tools, run }
}
