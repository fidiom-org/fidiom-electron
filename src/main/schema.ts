import type Database from 'better-sqlite3-multiple-ciphers'

const V1 = `
  CREATE TABLE IF NOT EXISTS users (
    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
    master_password_hash TEXT NOT NULL,
    created_at           TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS projects (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    type        TEXT NOT NULL CHECK (type IN ('personal', 'business')),
    currency    TEXT NOT NULL,
    description TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);

  -- business projects only: the people who share the project
  CREATE TABLE IF NOT EXISTS project_members (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    email      TEXT,
    role       TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_members_project ON project_members(project_id);

  -- bank / crypto wallet / cash / card
  CREATE TABLE IF NOT EXISTS accounts (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id      INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    type            TEXT NOT NULL CHECK (type IN ('bank', 'crypto', 'cash', 'card')),
    currency        TEXT NOT NULL,
    initial_balance REAL NOT NULL DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_accounts_project ON accounts(project_id);

  -- project_id NULL = global category shared across projects
  CREATE TABLE IF NOT EXISTS categories (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    color      TEXT,
    icon       TEXT,
    type       TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    parent_id  INTEGER REFERENCES categories(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_categories_project ON categories(project_id);
  CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);

  CREATE TABLE IF NOT EXISTS transactions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    account_id  INTEGER NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    member_id   INTEGER REFERENCES project_members(id) ON DELETE SET NULL,
    amount      REAL NOT NULL,
    type        TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
    description TEXT,
    date        TEXT NOT NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_tx_project ON transactions(project_id);
  CREATE INDEX IF NOT EXISTS idx_tx_account ON transactions(account_id);
  CREATE INDEX IF NOT EXISTS idx_tx_category ON transactions(category_id);
  CREATE INDEX IF NOT EXISTS idx_tx_date ON transactions(date);

  -- receipt photos; parsed_data is JSON from QVAC parsing
  CREATE TABLE IF NOT EXISTS receipts (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    file_path      TEXT NOT NULL,
    parsed_data    TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_receipts_tx ON receipts(transaction_id);

  CREATE TABLE IF NOT EXISTS tags (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    UNIQUE (project_id, name)
  );

  CREATE TABLE IF NOT EXISTS transaction_tags (
    transaction_id INTEGER NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    tag_id         INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (transaction_id, tag_id)
  );
  CREATE INDEX IF NOT EXISTS idx_txtags_tag ON transaction_tags(tag_id);

  -- category_id NULL = overall project budget
  CREATE TABLE IF NOT EXISTS budgets (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    amount      REAL NOT NULL,
    period      TEXT NOT NULL CHECK (period IN ('monthly', 'quarterly', 'yearly')),
    start_date  TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_budgets_project ON budgets(project_id);

  CREATE TABLE IF NOT EXISTS goals (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id     INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name           TEXT NOT NULL,
    target_amount  REAL NOT NULL,
    current_amount REAL NOT NULL DEFAULT 0,
    deadline       TEXT,
    created_at     TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_goals_project ON goals(project_id);

  -- AI CFO chat history
  CREATE TABLE IF NOT EXISTS ai_chats (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    role       TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content    TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_chats_project ON ai_chats(project_id);
`

const V2 = `
  CREATE TABLE IF NOT EXISTS chats (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id   INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title        TEXT,
    title_status TEXT NOT NULL DEFAULT 'pending'
                 CHECK (title_status IN ('pending', 'ready', 'failed')),
    created_at   TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_chats_project_updated ON chats(project_id, updated_at DESC);

  CREATE TABLE IF NOT EXISTS chat_messages (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id    INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    role       TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content    TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_chat_messages_chat ON chat_messages(chat_id, created_at);
`

const migrateAiChatsToConversations = (db: Database.Database): void => {
  const legacy = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'ai_chats'")
    .get()
  if (!legacy) return

  const projects = db
    .prepare('SELECT DISTINCT project_id FROM ai_chats ORDER BY project_id')
    .all() as { project_id: number }[]

  const insertChat = db.prepare(
    "INSERT INTO chats (project_id, title, title_status, created_at, updated_at) VALUES (?, NULL, ?, datetime('now'), datetime('now'))"
  )
  const insertMessage = db.prepare(
    'INSERT INTO chat_messages (chat_id, role, content, created_at) VALUES (?, ?, ?, ?)'
  )
  const selectMessages = db.prepare(
    'SELECT role, content, created_at FROM ai_chats WHERE project_id = ? ORDER BY created_at ASC, id ASC'
  )

  for (const { project_id } of projects) {
    const { lastInsertRowid } = insertChat.run(project_id, 'pending')
    const chatId = Number(lastInsertRowid)
    for (const row of selectMessages.all(project_id) as {
      role: string
      content: string
      created_at: string
    }[]) {
      insertMessage.run(chatId, row.role, row.content, row.created_at)
    }
  }

  db.exec('DROP TABLE IF EXISTS ai_chats')
}

const V3 = `
  -- app-wide key/value settings (active model, default currency, …)
  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`

const migrations: ((db: Database.Database) => void)[] = [
  (db) => db.exec(V1),
  (db) => {
    db.exec(V2)
    migrateAiChatsToConversations(db)
  },
  (db) => db.exec(V3)
]

export const runMigrations = (db: Database.Database): void => {
  const current = db.pragma('user_version', { simple: true }) as number
  for (let v = current; v < migrations.length; v++) {
    db.transaction(() => {
      migrations[v](db)
      db.pragma(`user_version = ${v + 1}`)
    })()
  }
}
