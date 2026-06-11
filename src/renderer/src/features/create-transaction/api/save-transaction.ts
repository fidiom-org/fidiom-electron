import { type TransactionDraft } from '@renderer/entities/transaction'
import { loadCategories } from '@renderer/features/settings'

export async function saveTransaction(draft: TransactionDraft): Promise<void> {
  const [project] = await window.dbAPI.query<{ id: number }>(
    'SELECT id FROM projects ORDER BY id LIMIT 1'
  )
  const [account] = await window.dbAPI.query<{ id: number }>(
    'SELECT id FROM accounts ORDER BY id LIMIT 1'
  )
  if (!project || !account) {
    throw new Error('No default project or account found')
  }

  const categories = await loadCategories()
  const label = categories.find((c) => c.value === draft.category)?.label
  const categoryRows = label
    ? await window.dbAPI.query<{ id: number }>('SELECT id FROM categories WHERE name = ? LIMIT 1', [
        label
      ])
    : []
  const categoryId = categoryRows[0]?.id ?? null

  await window.dbAPI.exec(
    'INSERT INTO transactions (project_id, account_id, category_id, amount, type, description, date) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [
      project.id,
      account.id,
      categoryId,
      draft.amount,
      draft.type,
      draft.description ?? null,
      draft.date
    ]
  )
}
