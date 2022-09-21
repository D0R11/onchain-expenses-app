export interface Expenses {
  label?: string;
  tx_hash: string;
}

export interface Results {
  label?: string;
  tx_hash: string;
  gas_fee?: number;
}
