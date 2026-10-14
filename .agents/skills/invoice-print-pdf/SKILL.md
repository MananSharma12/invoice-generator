---
name: invoice-print-pdf
description: Best practices, CSS Paged Media rules, and reliable A4 print styling for pixel-perfect invoice PDF generation and printing.
---

# A4 Print & PDF Export Rules for Invoices

This skill outlines best practices for rendering and exporting pixel-perfect, single-page or multi-page A4 invoices using CSS Paged Media and browser print capabilities.

---

## 1. A4 Geometry & Page Standards

- **Paper Size:** ISO A4 (`210mm` width $\times$ `297mm` height).
- In standard 96 DPI screen units, A4 is roughly `794px` $\times$ `1123px`.
- Use millimeters (`mm`) for print dimensions and strict page wrappers to avoid scaling discrepancies across displays and operating systems.

```css
@page {
  size: A4 portrait;
  margin: 10mm 12mm; /* Standard clean print margin */
}
```

---

## 2. Screen vs. Print Dual-Mode Pattern

The application should present the invoice as a realistic sheet of paper on screen, while automatically converting into an unadorned document when printed.

### Screen Mode (`@media screen`):
- Background: Subtle neutral/slate backdrop (`bg-zinc-100` / `bg-zinc-900`).
- Canvas: Elevated white card centered in the viewport (`shadow-xl rounded-sm border border-zinc-200`).
- Maximum width: `max-w-[210mm]`, min-height: `min-h-[297mm]`.
- Interactive elements (drag handles, delete buttons, add row button, placeholders, tooltips) are visible.

### Print Mode (`@media print`):
- Background: Force pure white (`bg-white !important`).
- Elevation: Remove all box shadows, rounded corners, and outer borders.
- Canvas: Full-width container with zero outer margin.
- Chrome removal: Hide all UI elements (`.no-print`, `print:hidden`).
- Color fidelity: Force background colors and borders to print properly:
  ```css
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  ```

---

## 3. Page Break & Flow Control

To prevent awkward layout splits (e.g. half a row sliced between pages, or bank details detached from totals):

```css
/* Avoid breaking within critical components */
.print-avoid-break {
  break-inside: avoid;
  page-break-inside: avoid;
}

/* Force page break when starting an appendix/multi-page section */
.print-page-break {
  break-before: page;
  page-break-before: always;
}
```

### Apply `break-inside: avoid` to:
1. Each individual line item row in the table (`<tr>` or flex row).
2. The entire Tax Summary & Totals block.
3. The Payment Details / UPI QR Code box.
4. The Terms & Conditions + Authorized Signatory block.

---

## 4. Typography & Spacing Guidelines for 1-Page Invoices

Most contractor/freelance invoices have 1–6 line items and should comfortably fit on a **single A4 sheet** without scrolling or spilling onto a blank second page.

- **Header / Meta:** Compact grid, clear distinction between Supplier (From) and Client (Billed To).
- **Line Item Table:**
  - Table header: `text-[10px]` uppercase, tracking-wider, subtle background (`bg-zinc-50`).
  - Item rows: `py-2` or `py-2.5` padding, concise description, numeric alignment (`text-right font-mono`).
- **Footer / Totals:**
  - Totals box right-aligned with clear visual emphasis on Grand Total.
  - Payment details (Bank + QR) left-aligned side-by-side with Totals.

---

## 5. Print Trigger & Lifecycle Execution

In Tauri (and modern web engines), triggering printing is straightforward and doesn't require bulky headless PDF server runtimes:

```ts
export function triggerInvoicePrint() {
  // 1. Temporarily deselect any active inline input
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }

  // 2. Trigger native print / PDF dialog
  window.print();
}
```

When `window.print()` runs inside Tauri's Windows WebView2, it opens the native Windows print preview dialog where the user can directly choose **"Save as PDF"** or select a physical printer with full vector sharpness.
