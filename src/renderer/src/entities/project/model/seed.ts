import type { Payment, Project } from './types'

const now = (): string => new Date().toISOString()

export const SEED_PROJECTS: Project[] = [
  {
    id: 'proj-acme',
    name: 'Acme Labs',
    currency: 'USD',
    initialCash: 42_000,
    description: 'Infrastructure-heavy startup',
    createdAt: now()
  },
  {
    id: 'proj-streampay',
    name: 'StreamPay',
    currency: 'USD',
    initialCash: 85_000,
    description: 'Subscription business with mixed revenue',
    createdAt: now()
  }
]

export const SEED_PAYMENTS: Payment[] = [
  {
    id: 'pay-vercel-acme',
    projectId: 'proj-acme',
    direction: 'expense',
    vendor: 'Vercel',
    amount: 5,
    type: 'recurring',
    category: 'SaaS',
    date: null,
    billingDay: 1,
    note: null,
    deletedAt: null,
    history: [],
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'pay-aws-acme',
    projectId: 'proj-acme',
    direction: 'expense',
    vendor: 'AWS',
    amount: 500,
    type: 'recurring',
    category: 'Infrastructure',
    date: null,
    billingDay: 1,
    note: null,
    deletedAt: null,
    history: [],
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'pay-ip-acme',
    projectId: 'proj-acme',
    direction: 'expense',
    vendor: 'IP for music',
    amount: 1000,
    type: 'one-time',
    category: 'Legal',
    date: '2026-05-15',
    billingDay: null,
    note: 'Music licensing',
    deletedAt: null,
    history: [],
    createdAt: '2026-05-15T00:00:00.000Z'
  },
  {
    id: 'pay-vercel-stream',
    projectId: 'proj-streampay',
    direction: 'expense',
    vendor: 'Vercel',
    amount: 5,
    type: 'recurring',
    category: 'SaaS',
    date: null,
    billingDay: 1,
    note: null,
    deletedAt: null,
    history: [],
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'pay-aws-stream',
    projectId: 'proj-streampay',
    direction: 'expense',
    vendor: 'AWS',
    amount: 500,
    type: 'recurring',
    category: 'Infrastructure',
    date: null,
    billingDay: 1,
    note: null,
    deletedAt: null,
    history: [],
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'pay-client-stream',
    projectId: 'proj-streampay',
    direction: 'income',
    vendor: 'Client A',
    amount: 200,
    type: 'recurring',
    category: 'Subscriptions',
    date: null,
    billingDay: 1,
    note: null,
    deletedAt: null,
    history: [],
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'pay-seed-stream',
    projectId: 'proj-streampay',
    direction: 'income',
    vendor: 'Seed round',
    amount: 50_000,
    type: 'one-time',
    category: 'Investment',
    date: '2026-03-01',
    billingDay: null,
    note: null,
    deletedAt: null,
    history: [],
    createdAt: '2026-03-01T00:00:00.000Z'
  }
]
