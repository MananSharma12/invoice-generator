---
name: gst-india-engine
description: Rules, validation, calculations, and data specifications for Indian GST invoices (SAC codes, state codes, IGST vs CGST/SGST, amount in words, and INR formatting).
---

# Indian GST Invoicing Rules & Calculation Engine

This skill provides domain knowledge and programmatic specifications for generating legally compliant, friction-free Indian GST invoices for freelancers, contractors, and IT service providers.

---

## 1. GSTIN Structure & Automatic Parsing

A Goods and Services Tax Identification Number (GSTIN) is a 15-character alphanumeric identifier.

### Format
`\d{2}[A-Z]{5}\d{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}`

- **Digits 1–2:** 2-digit State Code (e.g., `27` for Maharashtra, `29` for Karnataka).
- **Characters 3–12:** 10-character PAN of the entity.
- **Character 13:** Entity number of the same PAN in the state (usually `1`, `2`, etc.).
- **Character 14:** Default alphabet `Z`.
- **Character 15:** Checksum digit.

### Behavior Rule: Automatic State Derivation
Whenever a user types or pastes a GSTIN (for themselves or a client):
1. Extract `gstin.slice(0, 2)`.
2. Automatically look up and populate the **State Name** and **State Code**.
3. Default the **Place of Supply (POS)** to the client's state code.

---

## 2. Complete State Code Mapping Table

| Code | State / UT | Code | State / UT |
|:---|:---|:---|:---|
| `01` | Jammu and Kashmir | `20` | Jharkhand |
| `02` | Himachal Pradesh | `21` | Odisha |
| `03` | Punjab | `22` | Chhattisgarh |
| `04` | Chandigarh | `23` | Madhya Pradesh |
| `05` | Uttarakhand | `24` | Gujarat |
| `06` | Haryana | `26` | Dadra and Nagar Haveli & Daman and Diu |
| `07` | Delhi | `27` | Maharashtra |
| `08` | Rajasthan | `29` | Karnataka |
| `09` | Uttar Pradesh | `30` | Goa |
| `10` | Bihar | `31` | Lakshadweep |
| `11` | Sikkim | `32` | Kerala |
| `12` | Arunachal Pradesh | `33` | Tamil Nadu |
| `13` | Nagaland | `34` | Puducherry |
| `14` | Manipur | `35` | Andaman and Nicobar Islands |
| `15` | Mizoram | `36` | Telangana |
| `16` | Tripura | `37` | Andhra Pradesh |
| `17` | Meghalaya | `38` | Ladakh |
| `18` | Assam | `97` | Other Territory |
| `19` | West Bengal | `99` | Centre Jurisdiction |

---

## 3. Tax Routing & Calculation Engine

Tax is calculated on the **Taxable Value** (Subtotal after any discounts).

### Tax Rate Routing
Let `SupplierState` = State Code of Supplier (You).  
Let `PlaceOfSupply` = State Code of Recipient (Client).

1. **Interstate Supply (`SupplierState !== PlaceOfSupply`):**
   - Apply **IGST** (Integrated GST) at the full rate (typically **18%** for IT/software services).
   - $\text{IGST Amount} = \text{Taxable Value} \times \frac{\text{IGST Rate}}{100}$
   - CGST = 0, SGST = 0.

2. **Intrastate Supply (`SupplierState === PlaceOfSupply`):**
   - Split tax equally between **CGST** (Central GST) and **SGST** (State GST).
   - Rate: 9% CGST + 9% SGST (for an 18% total tax rate).
   - $\text{CGST Amount} = \text{Taxable Value} \times \frac{\text{Rate}}{2 \times 100}$
   - $\text{SGST Amount} = \text{Taxable Value} \times \frac{\text{Rate}}{2 \times 100}$
   - IGST = 0.

3. **Reverse Charge Mechanism (RCM):**
   - Flag: `Tax Payable on Reverse Charge: Yes / No` (default: `No` for direct consulting).

4. **Total Invoice Value:**
   - $\text{Total Value} = \text{Taxable Value} + \text{IGST Amount} + (\text{CGST Amount} + \text{SGST Amount})$
   - Standard practice is to round off to the nearest integer (`Math.round(total)`).

---

## 4. Common SAC Codes (IT & Tech Services)

Provide autocomplete or quick-selection for standard Services Accounting Codes:

| SAC Code | Description | Standard GST Rate |
|:---|:---|:---:|
| **`998314`** | Information technology design and development services (Web, Mobile, Software) | 18% |
| **`998315`** | Hosting and infrastructure provisioning services (DevOps, Cloud, Server) | 18% |
| **`998313`** | IT consulting, advisory, and technical support services | 18% |
| **`998316`** | IT infrastructure and network management services | 18% |
| **`998311`** | Information technology systems and software consulting services | 18% |
| **`998319`** | Other information technology services n.e.c. | 18% |

---

## 5. Indian Currency Formatting (`en-IN`)

Always format currency values using the Indian numbering system (Lakhs and Crores):

```ts
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
// Example: 152340.5 -> "₹1,52,340.50"
```

---

## 6. Number to Words (Indian Numbering System)

Indian tax invoices require the total amount in words.

### Conversion Rules:
- Groups: Units, Hundreds, Thousands (1,000), Lakhs (1,00,000), Crores (1,00,00,000).
- Format: `"INR One Lakh Fifty-Two Thousand Three Hundred Forty-One Only"` or `"Rupees ... Only"`.
- Handle Paise (cents): e.g., `"and Fifty Paise Only"`.

```ts
export function numberToIndianWords(num: number): string {
  if (num === 0) return "Zero Rupees Only";
  
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(n: number): string {
    if (n === 0) return '';
    if (n < 20) return a[n];
    return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
  }

  function convertThreeDigits(n: number): string {
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    let res = '';
    if (hundred > 0) res += a[hundred] + ' Hundred';
    if (rest > 0) res += (res ? ' ' : '') + convertTwoDigits(rest);
    return res;
  }

  const [rupeesStr, paiseStr] = num.toFixed(2).split('.');
  let rupees = parseInt(rupeesStr, 10);
  const paise = parseInt(paiseStr, 10);

  const crore = Math.floor(rupees / 10000000);
  rupees %= 10000000;
  const lakh = Math.floor(rupees / 100000);
  rupees %= 100000;
  const thousand = Math.floor(rupees / 1000);
  rupees %= 1000;
  const hundreds = rupees;

  let words = '';
  if (crore > 0) words += convertThreeDigits(crore) + ' Crore ';
  if (lakh > 0) words += convertTwoDigits(lakh) + ' Lakh ';
  if (thousand > 0) words += convertTwoDigits(thousand) + ' Thousand ';
  if (hundreds > 0) words += convertThreeDigits(hundreds);

  words = words.trim();
  let result = words ? `Rupees ${words}` : '';
  if (paise > 0) {
    result += (result ? ' and ' : '') + `${convertTwoDigits(paise)} Paise`;
  }
  return (result + ' Only').replace(/\s+/g, ' ');
}
```

---

## 7. UPI QR Code Specification

For fast payment scanning on mobile:
- **UPI URI Scheme:**  
  `upi://pay?pa={VPA}&pn={NAME}&am={AMOUNT}&cu=INR&tn={INVOICE_NO}`
  - `pa`: Payee UPI address (e.g., `user@okaxis` or `user@okhdfcbank`)
  - `pn`: Payee business/personal name (URL encoded)
  - `am`: Exact total amount (e.g. `75000.00`)
  - `cu`: `INR`
  - `tn`: Transaction note (e.g. `Invoice INV-2026-001`)
- Render with a clean, high-contrast QR code component in the payment details section.
