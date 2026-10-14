import type {
  ComputedInvoice,
  InvoiceMeta,
  PartyDetails,
  LineItem,
  BankDetails,
  InvoiceSettings,
  ComputedTaxBreakdown,
  DateFormat,
} from '../types/invoice';

export interface StateCodeEntry {
  code: string;
  name: string;
}

export const STATE_CODES: Record<string, string> = {
  '01': 'Jammu and Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '26': 'Dadra and Nagar Haveli and Daman and Diu',
  '27': 'Maharashtra',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman and Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
  '38': 'Ladakh',
  '97': 'Other Territory',
  '99': 'Centre Jurisdiction',
};

export const COMMON_SAC_CODES = [
  { code: '998314', title: 'IT Design & Development', description: 'Custom software, web applications, frontend development' },
  { code: '998313', title: 'IT Consulting & Advisory', description: 'Technical architecture, code reviews, tech advisory' },
  { code: '998315', title: 'Hosting & Infrastructure', description: 'DevOps, cloud hosting setup, system maintenance' },
  { code: '998316', title: 'Network & System Management', description: 'Infrastructure monitoring, security operations' },
  { code: '998311', title: 'Software Systems Consulting', description: 'Enterprise systems implementation and strategy' },
  { code: '998319', title: 'Other IT Services n.e.c.', description: 'Miscellaneous software engineering services' },
];

/**
 * Validates GSTIN structure and extracts State Code, State Name, and PAN.
 */
export function parseGstin(rawGstin: string): {
  isValid: boolean;
  stateCode: string;
  stateName: string;
  pan: string;
} {
  const clean = rawGstin.trim().toUpperCase();
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  const isValid = gstinRegex.test(clean);

  if (clean.length >= 2) {
    const code = clean.slice(0, 2);
    const stateName = STATE_CODES[code] || '';
    const pan = clean.length >= 12 ? clean.slice(2, 12) : '';
    return { isValid, stateCode: code, stateName, pan };
  }

  return { isValid: false, stateCode: '', stateName: '', pan: '' };
}

/**
 * Format currency in Indian Numbering System (e.g., ₹1,50,000.00)
 */
export function formatINR(amount: number): string {
  if (isNaN(amount)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats YYYY-MM-DD input date into selectable user locale/format
 */
export function formatDisplayDate(dateStr: string, format: DateFormat = 'DD/MM/YYYY'): string {
  if (!dateStr) return '—';
  try {
    const [yearStr, monthStr, dayStr] = dateStr.split('-');
    if (!yearStr || !monthStr || !dayStr) return dateStr;
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);

    const pad = (n: number) => n.toString().padStart(2, '0');
    const monthsShort = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    switch (format) {
      case 'DD/MM/YYYY':
        return `${pad(day)}/${pad(month)}/${year}`;
      case 'DD MMM YYYY':
        return `${pad(day)} ${monthsShort[month - 1] || ''} ${year}`;
      case 'YYYY-MM-DD':
        return `${year}-${pad(month)}-${pad(day)}`;
      default:
        return `${pad(day)}/${pad(month)}/${year}`;
    }
  } catch {
    return dateStr;
  }
}

/**
 * Converts numeric value into legal Indian English words ("Rupees One Lakh ... Only")
 */
export function numberToIndianWords(num: number): string {
  if (isNaN(num) || num === 0) return 'Rupees Zero Only';

  const singleDigits = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];

  function twoDigits(n: number): string {
    if (n === 0) return '';
    if (n < 20) return singleDigits[n];
    return `${tens[Math.floor(n / 10)]}${n % 10 !== 0 ? ` ${singleDigits[n % 10]}` : ''}`;
  }

  function threeDigits(n: number): string {
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    let res = '';
    if (hundred > 0) res += `${singleDigits[hundred]} Hundred`;
    if (rest > 0) res += `${res ? ' ' : ''}${twoDigits(rest)}`;
    return res;
  }

  const [rupeesPart, paisePart] = Math.abs(num).toFixed(2).split('.');
  let rupees = parseInt(rupeesPart, 10);
  const paise = parseInt(paisePart, 10);

  const crore = Math.floor(rupees / 10000000);
  rupees %= 10000000;
  const lakh = Math.floor(rupees / 100000);
  rupees %= 100000;
  const thousand = Math.floor(rupees / 1000);
  rupees %= 1000;
  const hundreds = rupees;

  const parts: string[] = [];
  if (crore > 0) parts.push(`${threeDigits(crore)} Crore`);
  if (lakh > 0) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand > 0) parts.push(`${twoDigits(thousand)} Thousand`);
  if (hundreds > 0) parts.push(threeDigits(hundreds));

  const words = parts.filter(Boolean).join(' ').trim();
  let result = words ? `Rupees ${words}` : 'Rupees Zero';

  if (paise > 0) {
    result += ` and ${twoDigits(paise)} Paise`;
  }

  return `${result} Only`;
}

/**
 * Generate UPI deep link URI for QR code payment
 */
export function generateUpiUri(params: {
  upiId: string;
  payeeName: string;
  amount: number;
  invoiceNumber: string;
}): string {
  if (!params.upiId) return '';
  const cleanId = params.upiId.trim();
  const cleanName = encodeURIComponent(params.payeeName.trim());
  const cleanAmount = params.amount.toFixed(2);
  const note = encodeURIComponent(`Invoice ${params.invoiceNumber.trim()}`);

  return `upi://pay?pa=${cleanId}&pn=${cleanName}&am=${cleanAmount}&cu=INR&tn=${note}`;
}

/**
 * Increments an invoice number identifier intelligently
 * Examples:
 *   "INV-2026-004" -> "INV-2026-005"
 *   "FY26-27/009"  -> "FY26-27/010"
 *   "101"          -> "102"
 */
export function incrementInvoiceNumber(invNum: string): string {
  if (!invNum) return 'INV-001';

  // Match the trailing digits
  const match = invNum.match(/^(.*?)(\d+)$/);
  if (!match) {
    return `${invNum}-1`;
  }

  const prefix = match[1];
  const digits = match[2];
  const nextNum = (parseInt(digits, 10) + 1).toString();
  const padded = nextNum.padStart(digits.length, '0');

  return `${prefix}${padded}`;
}

/**
 * Pure calculation engine: transforms raw invoice inputs into a strictly computed invoice
 */
export function computeInvoice(input: {
  meta: InvoiceMeta;
  supplier: PartyDetails;
  client: PartyDetails;
  items: LineItem[];
  bank: BankDetails;
  settings: InvoiceSettings;
}): ComputedInvoice {
  const { meta, supplier, client, items, bank, settings } = input;

  // 1. Calculate items with their amounts (supports standard and contractor working-days proration)
  const computedItems: LineItem[] = items.map((item) => {
    let amount = 0;
    if (item.pricingType === 'working_days') {
      const totalDays = Number(item.daysInMonth) || 0;
      const worked = Number(item.daysWorked) || 0;
      const baseRate = Number(item.monthlyRate ?? item.rate) || 0;

      if (totalDays > 0) {
        if (worked === totalDays) {
          amount = baseRate;
        } else {
          amount = Math.round((baseRate / totalDays) * worked);
        }
      }
      return {
        ...item,
        rate: baseRate,
        amount,
      };
    }

    amount = Math.round((Number(item.quantity) || 0) * (Number(item.rate) || 0));
    return {
      ...item,
      amount,
    };
  });

  // 2. Round off the Subtotal first before charging GST
  const rawSubtotal = computedItems.reduce((acc, item) => acc + item.amount, 0);
  const subtotal = Math.round(rawSubtotal);

  // 3. Determine tax logic with rounded tax amounts
  const supplierState = supplier.stateCode.trim();
  const placeOfSupply = meta.placeOfSupplyStateCode.trim() || client.stateCode.trim();

  let tax: ComputedTaxBreakdown;

  if (meta.taxMode === 'export_lut') {
    tax = {
      taxType: 'EXEMPT_LUT',
      taxableAmount: subtotal,
      taxRatePercent: 0,
      igstRate: 0,
      igstAmount: 0,
      cgstRate: 0,
      cgstAmount: 0,
      sgstRate: 0,
      sgstAmount: 0,
      totalTax: 0,
      lutDisclaimer:
        'SUPPLY MEANT FOR EXPORT UNDER BOND OR LETTER OF UNDERTAKING WITHOUT PAYMENT OF INTEGRATED TAX',
    };
  } else if (supplierState && placeOfSupply && supplierState !== placeOfSupply) {
    // Interstate: 18% IGST rounded to nearest whole rupee
    const igstAmount = Math.round(subtotal * 0.18);
    tax = {
      taxType: 'IGST',
      taxableAmount: subtotal,
      taxRatePercent: 18,
      igstRate: 18,
      igstAmount,
      cgstRate: 0,
      cgstAmount: 0,
      sgstRate: 0,
      sgstAmount: 0,
      totalTax: igstAmount,
    };
  } else {
    // Intrastate: 9% CGST + 9% SGST rounded to nearest whole rupee
    const cgstAmount = Math.round(subtotal * 0.09);
    const sgstAmount = Math.round(subtotal * 0.09);
    const totalTax = cgstAmount + sgstAmount;
    tax = {
      taxType: 'CGST_SGST',
      taxableAmount: subtotal,
      taxRatePercent: 18,
      igstRate: 0,
      igstAmount: 0,
      cgstRate: 9,
      cgstAmount,
      sgstRate: 9,
      sgstAmount,
      totalTax,
    };
  }

  const grandTotal = subtotal + tax.totalTax;
  const roundOff = 0;

  // 4. TDS Calculation (Section 194J - strictly on Subtotal / Taxable amount, NOT on GST)
  const showTds = settings.showTds || false;
  const tdsRate = settings.tdsRatePercent ?? 10;
  const tdsAmount = showTds ? Math.round(subtotal * (tdsRate / 100)) : 0;
  const netPayable = grandTotal - tdsAmount;

  // Amount in words reflects either net payable (if TDS is deducted) or grand total
  const amountInWords = numberToIndianWords(showTds ? netPayable : grandTotal);

  const upiPaymentUri = generateUpiUri({
    upiId: bank.upiId,
    payeeName: bank.accountHolder || supplier.name,
    amount: showTds ? netPayable : grandTotal,
    invoiceNumber: meta.invoiceNumber,
  });

  return {
    meta: {
      ...meta,
      placeOfSupplyStateCode: placeOfSupply,
      placeOfSupplyStateName: STATE_CODES[placeOfSupply] || '',
    },
    supplier,
    client,
    items: computedItems,
    bank,
    settings,
    subtotal,
    tax,
    total: grandTotal,
    roundOff,
    grandTotal,
    tdsAmount,
    netPayable,
    amountInWords,
    upiPaymentUri,
  };
}
