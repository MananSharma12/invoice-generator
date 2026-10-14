export type TaxMode = 'domestic' | 'export_lut';

export type TaxType = 'IGST' | 'CGST_SGST' | 'EXEMPT_LUT';

export type DateFormat = 'DD/MM/YYYY' | 'DD MMM YYYY' | 'YYYY-MM-DD';

export interface PartyDetails {
  name: string;
  companyName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  state: string;
  stateCode: string; // 2-digit code e.g. "27"
  gstin: string; // 15 alphanumeric
  pan: string; // 10 alphanumeric
}

export type ItemPricingType = 'standard' | 'working_days';

export interface LineItem {
  id: string;
  description: string;
  sacCode: string; // IT service code e.g. "998314"
  quantity: number;
  unit: string; // "hrs", "units", "months", "days", "working days"
  rate: number;
  amount: number; // auto-computed

  // Contractor Proration fields
  pricingType?: ItemPricingType; // 'standard' | 'working_days'
  daysInMonth?: number; // Total working days in month (e.g. 22)
  daysWorked?: number; // Days actually worked (e.g. 20 after 2 unpaid leaves)
  monthlyRate?: number; // Full monthly retainer (e.g. 150000)
}

export interface BankDetails {
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  accountType: string; // "Current" | "Savings" | custom string (empty = hidden)
  ifscCode: string;
  branch: string;
  upiId: string; // empty = hidden
}

export interface InvoiceMeta {
  invoiceNumber: string; // e.g. "INV-2026-001" or "FY26-27/001"
  invoiceDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  placeOfSupplyStateCode: string; // 2-digit state code
  placeOfSupplyStateName: string;
  reverseCharge: boolean; // default false
  taxMode: TaxMode; // 'domestic' | 'export_lut'
  lutNumber?: string; // Optional Letter of Undertaking number for export
  currency: string; // default "INR"
}

export interface InvoiceSettings {
  accentColor: string;
  notes: string;
  terms: string;
  signatureUrl?: string;
  showSignature: boolean;
  showDueDate: boolean;
  showSacCode: boolean;
  showQuantity: boolean;
  showContractorDaysColumns?: boolean; // Show separate "Days in Month" and "Days Worked" columns
  showTds?: boolean; // Option to show TDS (Tax Deducted at Source u/s 194J)
  tdsRatePercent?: number; // e.g. 10 or 2
  showAmountInWords?: boolean; // Toggle for amount in words
  dateFormat: DateFormat;
  qtyColumnLabel: string; // e.g. "Qty", "Days", "Working Days", "Hours"
  showQrCode: boolean;
}

export interface ComputedTaxBreakdown {
  taxType: TaxType;
  taxableAmount: number;
  taxRatePercent: number;
  igstRate: number;
  igstAmount: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  totalTax: number;
  lutDisclaimer?: string;
}

export interface ComputedInvoice {
  meta: InvoiceMeta;
  supplier: PartyDetails;
  client: PartyDetails;
  items: LineItem[];
  bank: BankDetails;
  settings: InvoiceSettings;
  subtotal: number;
  tax: ComputedTaxBreakdown;
  total: number;
  roundOff: number;
  grandTotal: number;
  tdsAmount?: number;
  netPayable?: number;
  amountInWords: string;
  upiPaymentUri: string;
}

export interface InvoiceTemplateProps {
  data: ComputedInvoice;
}

export interface SavedClientPreset {
  id: string;
  client: PartyDetails;
  defaultSacCode?: string;
  defaultRate?: number;
  defaultUnit?: string;
}

export interface SavedInvoiceRecord {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  clientName: string;
  clientGstin: string;
  grandTotal: number;
  savedAt: string;
  data: {
    meta: InvoiceMeta;
    supplier: PartyDetails;
    client: PartyDetails;
    items: LineItem[];
    bank: BankDetails;
    settings: InvoiceSettings;
  };
}
