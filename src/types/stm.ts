export type RecordStatus = 'Added' | 'Modified' | 'Approved' | 'Pending Approval' | 'Rejected';
export type LegApplicability = 'Yes' | 'No' | 'NA';

export interface STMBusinessRule {
  id: string;
  productTypes: string[]; // e.g. ["Cross Currency Basis Swap"], ["FX Spot"]
  ccy1: string; // Base currency (e.g. "INR", "EUR", "USD")
  ccy2?: string; // Counter currency for FX (e.g. "USD", "JPY"), or "NA" for Rates
  ccy: string[]; // Display convenience: [ccy1] or [ccy1, ccy2]
  indices: string[]; // e.g. ["INR-MIBOR"] or ["NA"]
  floatingLeg: LegApplicability; // 'Yes' | 'No' | 'NA' (NA for FX)
  fixedLeg: LegApplicability; // 'Yes' | 'No' | 'NA' (NA for FX)
  minTenor?: string; // e.g. "1D", "2D", "1M" (default FX: 1D or 2D)
  maxTenor?: string; // e.g. "2Y", "5Y", "10Y" (default FX: 2Y)
  fixingPage?: string; // e.g. "Reuters-AUDFIX", "NA"
  description?: string;
  createdBy: string;
  createdOn: string;
  updatedBy?: string;
  updatedOn?: string;
  approvedBy?: string;
  approvedOn?: string;
  recordStatus: RecordStatus;
  rejectionReason?: string;
  history?: RuleAuditEntry[];
}

export interface RuleAuditEntry {
  action: 'Created' | 'Modified' | 'Approved' | 'Rejected';
  user: string;
  timestamp: string;
  comment?: string;
}

export interface UserPersona {
  id: string;
  name: string;
  email: string;
  role: 'Maker' | 'Modifier' | 'Checker';
  title: string;
  department: string;
}
