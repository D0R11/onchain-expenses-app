export interface Expenses {
  label?: string;
  tx_hash: string;
}

export interface Results {
  date_executed: Date;
  label?: string;
  tx_hash: string;
  gas_fee: number;
  gas_fee_in_usd: number;
}
