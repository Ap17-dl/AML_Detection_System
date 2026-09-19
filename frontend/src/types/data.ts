/** Mirrors the backend TransactionOut schema. */
export interface Transaction {
  transaction_id: string;
  external_ref: string | null;
  origin_account_id: string;
  destination_account_id: string;
  amount: number;
  currency: string;
  transaction_type: string | null;
  channel: string | null;
  occurred_at: string;
  ingested_at: string;
  ingestion_status: string;
  ingestion_error: string | null;
  created_at: string;
  risk_category: string | null;
  risk_probability: number | null;
  model_version: string | null;
}

export interface TransactionDetail extends Transaction {
  origin_account_number: string | null;
  destination_account_number: string | null;
}

export interface TransactionListResponse {
  items: Transaction[];
  total: number;
  page: number;
  page_size: number;
}

/** Mirrors the backend CustomerOut schema. */
export interface Customer {
  customer_id: string;
  external_ref: string | null;
  full_name: string;
  date_of_birth: string | null;
  country: string | null;
  occupation: string | null;
  kyc_level: string | null;
  onboarded_at: string | null;
  current_risk_score: number | null;
  current_risk_category: string | null;
  risk_updated_at: string | null;
  created_at: string;
}

export interface CustomerListResponse {
  items: Customer[];
  total: number;
  page: number;
  page_size: number;
}

export interface Account {
  account_id: string;
  customer_id: string;
  account_number: string;
  account_type: string | null;
  currency: string;
  opened_at: string | null;
  status: string;
  created_at: string;
}

/** Mirrors the backend IngestionReportOut schema. */
export interface IngestionRowError {
  row: number;
  field: string;
  message: string;
}

export interface IngestionReport {
  batch_id: string;
  filename: string | null;
  total_rows: number;
  accepted_rows: number;
  rejected_rows: number;
  status: string;
  errors: IngestionRowError[];
}
