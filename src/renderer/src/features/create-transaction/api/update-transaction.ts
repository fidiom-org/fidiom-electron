import { type TransactionDraft } from '@renderer/entities/transaction'
import { loadCategories } from '@renderer/features/settings'

export const updateTransaction = async (id: number, draft: TransactionDraft): Promise<void> => {
  const categories = await loadCategories()
  const label = categories.find((c) => c.value === draft.category)?.label
  const categoryRows = label
    ? await window.dbAPI.query<{ id: number }>('SELECT id FROM categories WHERE name = ? LIMIT 1', [
        label
      ])
    : []
  const categoryId = categoryRows[0]?.id ?? null

  await window.dbAPI.exec(
    'UPDATE transactions SET amount = ?, type = ?, category_id = ?, description = ?, date = ? WHERE id = ?',
    [draft.amount, draft.type, categoryId, draft.description ?? null, draft.date, id]
  )
}
