import * as secureStore from './secure-store'

/**
 * Builds a compact, plain-text snapshot of a project's finances for the on-device
 * LLM to ground its answers in. Everything here comes straight from the encrypted
 * SQLite store, so the model never sees data the user has not unlocked.
 *
 * Kept deliberately small (recent rows + aggregates) so it fits comfortably inside
 * the model's context window alongside the chat history.
 */

interface ProjectRow {
  id: number
  name: string
  type: string
  currency: string
  description: string | null
}

interface AccountRow {
  name: string
  type: string
  currency: string
  balance: number
}

interface TransactionRow {
  date: string
  type: string
  amount: number
  description: string | null
  category: string | null
}

interface CategoryTotalRow {
  category: string | null
  total: number
}

interface BudgetRow {
  amount: number
  period: string
  category: string | null
}

interface GoalRow {
  name: string
  target_amount: number
  current_amount: number
  deadline: string | null
}

const RECENT_TX_LIMIT = 25

const money = (value: number): string => value.toFixed(2)

export const projectIdForChat = (chatId: number): number | null => {
  const row = secureStore.query<{ project_id: number }>(
    'SELECT project_id FROM chats WHERE id = ?',
    [chatId]
  )[0]
  return row?.project_id ?? null
}

export const buildFinancialContext = (projectId: number): string => {
  const project = secureStore.query<ProjectRow>(
    'SELECT id, name, type, currency, description FROM projects WHERE id = ?',
    [projectId]
  )[0]
  if (!project) return 'No project data is available yet.'

  const accounts = secureStore.query<AccountRow>(
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

  const monthlySpend = secureStore.query<CategoryTotalRow>(
    `SELECT c.name AS category, SUM(t.amount) AS total
     FROM transactions t
     LEFT JOIN categories c ON c.id = t.category_id
     WHERE t.project_id = ? AND t.type = 'expense'
       AND t.date >= date('now', 'start of month')
     GROUP BY t.category_id
     ORDER BY total DESC
     LIMIT 10`,
    [projectId]
  )

  const recent = secureStore.query<TransactionRow>(
    `SELECT t.date, t.type, t.amount, t.description, c.name AS category
     FROM transactions t
     LEFT JOIN categories c ON c.id = t.category_id
     WHERE t.project_id = ?
     ORDER BY t.date DESC, t.id DESC
     LIMIT ?`,
    [projectId, RECENT_TX_LIMIT]
  )

  const budgets = secureStore.query<BudgetRow>(
    `SELECT b.amount, b.period, c.name AS category
     FROM budgets b
     LEFT JOIN categories c ON c.id = b.category_id
     WHERE b.project_id = ?`,
    [projectId]
  )

  const goals = secureStore.query<GoalRow>(
    'SELECT name, target_amount, current_amount, deadline FROM goals WHERE project_id = ?',
    [projectId]
  )

  const lines: string[] = []
  const cur = project.currency

  lines.push(`Project: ${project.name} (${project.type}, base currency ${cur})`)
  if (project.description) lines.push(`Description: ${project.description}`)

  if (accounts.length) {
    lines.push('', 'Accounts (current balance):')
    for (const a of accounts) {
      lines.push(`- ${a.name} [${a.type}]: ${money(a.balance)} ${a.currency}`)
    }
    const total = accounts.filter((a) => a.currency === cur).reduce((sum, a) => sum + a.balance, 0)
    lines.push(`Total (${cur} accounts): ${money(total)} ${cur}`)
  }

  if (monthlySpend.length) {
    lines.push('', 'Spending this month by category:')
    for (const s of monthlySpend) {
      lines.push(`- ${s.category ?? 'Uncategorized'}: ${money(s.total)} ${cur}`)
    }
  }

  if (budgets.length) {
    lines.push('', 'Budgets:')
    for (const b of budgets) {
      lines.push(`- ${b.category ?? 'Overall'}: ${money(b.amount)} ${cur} / ${b.period}`)
    }
  }

  if (goals.length) {
    lines.push('', 'Goals:')
    for (const g of goals) {
      const deadline = g.deadline ? `, by ${g.deadline}` : ''
      lines.push(
        `- ${g.name}: ${money(g.current_amount)} / ${money(g.target_amount)} ${cur}${deadline}`
      )
    }
  }

  if (recent.length) {
    lines.push('', `Recent transactions (latest ${recent.length}):`)
    for (const t of recent) {
      const desc = t.description ? ` — ${t.description}` : ''
      const cat = t.category ? ` (${t.category})` : ''
      lines.push(`- ${t.date} ${t.type} ${money(t.amount)} ${cur}${cat}${desc}`)
    }
  } else {
    lines.push('', 'No transactions recorded yet.')
  }

  return lines.join('\n')
}
