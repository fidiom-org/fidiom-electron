export interface WalletIdentity {
  label: string
  evm: string | null
  solana: string | null
  spark: string | null
}

export interface WalletAccounts {
  evm: string[]
  solana: string | null
  spark: string | null
}

export interface WalletBalances {
  spark: string | null
}

const SIGN_TIMEOUT_MS = 120_000

export const walletRpc = {
  identify: (key: string): Promise<WalletIdentity> =>
    window.p2pAPI.request<WalletIdentity>(key, 'identify'),

  getAccounts: (key: string): Promise<WalletAccounts> =>
    window.p2pAPI.request<WalletAccounts>(key, 'getAccounts'),

  getBalances: (key: string): Promise<WalletBalances> =>
    window.p2pAPI.request<WalletBalances>(key, 'getBalances'),

  signPersonal: (key: string, message: string, address: string): Promise<string> =>
    window.p2pAPI.request<string>(
      key,
      'sign',
      { kind: 'personal_sign', params: [message, address] },
      SIGN_TIMEOUT_MS
    )
}
