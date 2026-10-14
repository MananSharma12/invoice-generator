import React from 'react';
import type { InvoiceTemplateProps } from '../types/invoice';
import { formatINR, formatDisplayDate } from '../lib/gst';

export const SwissModernTemplate: React.FC<InvoiceTemplateProps> = ({ data }) => {
  const { meta, supplier, client, items, bank, settings, tax } = data;

  return (
    <div
      id="invoice-document"
      className="w-full max-w-[210mm] min-h-[297mm] mx-auto bg-white p-10 md:p-12 text-zinc-900 shadow-lg border border-zinc-200 print-page font-sans text-xs leading-relaxed flex flex-col justify-between"
      style={{ boxSizing: 'border-box' }}
    >
      <div>
        {/* Top Header: Bold "TAX INVOICE" + Business Name */}
        <div className="flex justify-between items-start pb-6 border-b border-zinc-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-extrabold tracking-tight text-zinc-950 uppercase">
                Tax Invoice
              </h1>
              {meta.taxMode === 'export_lut' && (
                <span className="inline-block px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase rounded-sm bg-blue-50 text-blue-700 border border-blue-200">
                  Export under LUT
                </span>
              )}
            </div>
            <div className="text-sm font-semibold text-zinc-700 tracking-tight">
              {supplier.companyName || supplier.name || 'Your Company / Business'}
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium">Invoice Number</div>
            <div className="font-mono text-base font-bold text-zinc-900 tracking-tight">
              {meta.invoiceNumber || 'INV-001'}
            </div>
            <div className="mt-2 text-[11px] text-zinc-600">
              <span className="text-zinc-400">Date:</span>{' '}
              <span className="font-medium text-zinc-800">
                {formatDisplayDate(meta.invoiceDate, settings.dateFormat)}
              </span>
            </div>
            {settings.showDueDate && (
              <div className="text-[11px] text-zinc-600">
                <span className="text-zinc-400">Due:</span>{' '}
                <span className="font-medium text-zinc-800">
                  {formatDisplayDate(meta.dueDate, settings.dateFormat)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Legal Disclaimer for LUT if applicable */}
        {meta.taxMode === 'export_lut' && (
          <div className="mt-3 p-2 bg-zinc-50 border border-zinc-200 rounded-xs text-[10px] text-zinc-600 text-center font-medium">
            {tax.lutDisclaimer}
            {meta.lutNumber && ` (LUT ARN: ${meta.lutNumber})`}
          </div>
        )}

        {/* Parties Grid (Supplier & Client) */}
        <div className="grid grid-cols-2 gap-8 my-6 py-4 border-b border-zinc-100">
          {/* Supplier (Billed By) */}
          <div className="space-y-1">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 mb-1">
              Billed By
            </div>
            <div className="font-semibold text-zinc-800 text-[13px]">
              {supplier.name || supplier.companyName}
            </div>
            {supplier.address && <div className="text-zinc-600 text-[11px]">{supplier.address}</div>}
            <div className="text-zinc-600 text-[11px]">
              {supplier.state} {supplier.stateCode ? `(Code: ${supplier.stateCode})` : ''}
            </div>

            <div className="pt-2 mt-2 border-t border-zinc-100 space-y-0.5 text-[11px]">
              {supplier.gstin && (
                <div className="flex gap-1.5">
                  <span className="text-zinc-400 w-12">GSTIN:</span>
                  <span className="font-mono font-medium text-zinc-800">{supplier.gstin}</span>
                </div>
              )}
              {supplier.pan && (
                <div className="flex gap-1.5">
                  <span className="text-zinc-400 w-12">PAN:</span>
                  <span className="font-mono font-medium text-zinc-800">{supplier.pan}</span>
                </div>
              )}
              {supplier.email && (
                <div className="flex gap-1.5">
                  <span className="text-zinc-400 w-12">Email:</span>
                  <span className="text-zinc-700">{supplier.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Client (Billed To) */}
          <div className="space-y-1">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 mb-1">
              Billed To (Client)
            </div>
            <div className="font-semibold text-zinc-800 text-[13px]">
              {client.companyName || client.name || 'Client Name / Business'}
            </div>
            {client.address && <div className="text-zinc-600 text-[11px]">{client.address}</div>}
            <div className="text-zinc-600 text-[11px]">
              {client.state} {client.stateCode ? `(Code: ${client.stateCode})` : ''}
            </div>

            <div className="pt-2 mt-2 border-t border-zinc-100 space-y-0.5 text-[11px]">
              <div className="flex gap-1.5">
                <span className="text-zinc-400 w-24">GSTIN:</span>
                <span className="font-mono font-medium text-zinc-800">
                  {client.gstin || 'Unregistered / B2C'}
                </span>
              </div>
              {client.pan && (
                <div className="flex gap-1.5">
                  <span className="text-zinc-400 w-24">PAN:</span>
                  <span className="font-mono font-medium text-zinc-800">{client.pan}</span>
                </div>
              )}
              <div className="flex gap-1.5">
                <span className="text-zinc-400 w-24">Place of Supply:</span>
                <span className="font-medium text-zinc-800">
                  {meta.placeOfSupplyStateName || client.state || '—'}
                  {meta.placeOfSupplyStateCode ? ` (${meta.placeOfSupplyStateCode})` : ''}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="my-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-zinc-900 text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
                <th className="py-2 w-8 text-center">#</th>
                <th className="py-2">Item & Description</th>
                {settings.showSacCode && (
                  <th className="py-2 text-center w-20">SAC Code</th>
                )}
                {settings.showContractorDaysColumns ? (
                  <>
                    <th className="py-2 text-right w-24">Days in Month</th>
                    <th className="py-2 text-right w-24">Days Worked</th>
                  </>
                ) : (
                  settings.showQuantity && (
                    <th className="py-2 text-right w-24">{settings.qtyColumnLabel || 'Qty'}</th>
                  )
                )}
                <th className="py-2 text-right w-28">
                  {settings.showContractorDaysColumns ? 'Base Rate (INR)' : 'Rate (INR)'}
                </th>
                <th className="py-2 text-right w-28">Amount (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {items.map((item, index) => {
                const isWorkingDays = item.pricingType === 'working_days';
                const totalDays = Number(item.daysInMonth) || 0;
                const workedDays = Number(item.daysWorked ?? item.quantity) || 0;
                const unpaid = totalDays > 0 ? totalDays - workedDays : 0;

                return (
                  <tr key={item.id || index} className="print-avoid-break">
                    <td className="py-3 text-center text-zinc-400 font-mono text-[11px] align-top">
                      {index + 1}
                    </td>
                    <td className="py-3 pr-4 align-top">
                      <div className="font-medium text-zinc-900 text-[12px]">{item.description}</div>
                      {isWorkingDays && totalDays > 0 && (
                        <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                          {unpaid > 0
                            ? `(${workedDays} of ${totalDays} working days • ${unpaid} unpaid day${unpaid > 1 ? 's' : ''} deducted)`
                            : `(Full month • ${workedDays} working days)`}
                        </div>
                      )}
                    </td>
                    {settings.showSacCode && (
                      <td className="py-3 text-center font-mono text-zinc-600 text-[11px] align-top">
                        {item.sacCode || '—'}
                      </td>
                    )}
                    {settings.showContractorDaysColumns ? (
                      <>
                        <td className="py-3 text-right font-mono text-zinc-700 text-[11px] align-top">
                          {isWorkingDays ? totalDays : '—'}
                        </td>
                        <td className="py-3 text-right font-mono text-zinc-700 text-[11px] align-top">
                          {isWorkingDays ? workedDays : `${item.quantity} ${item.unit || ''}`}
                        </td>
                      </>
                    ) : (
                      settings.showQuantity && (
                        <td className="py-3 text-right font-mono text-zinc-700 text-[11px] align-top">
                          {isWorkingDays
                            ? `${workedDays} / ${totalDays} days`
                            : `${item.quantity} ${item.unit ? item.unit : ''}`}
                        </td>
                      )
                    )}
                    <td className="py-3 text-right font-mono text-zinc-800 text-[11px] align-top">
                      {formatINR(isWorkingDays ? (item.monthlyRate ?? item.rate) : item.rate)}
                    </td>
                    <td className="py-3 text-right font-mono font-medium text-zinc-900 text-[11px] align-top">
                      {formatINR(item.amount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Tax Summary & Totals Block */}
        <div className="flex justify-end my-6 print-avoid-break">
          <div className="w-80 space-y-2 text-[11px]">
            <div className="flex justify-between py-1 border-b border-zinc-100">
              <span className="text-zinc-500">Taxable Amount (Subtotal):</span>
              <span className="font-mono font-medium text-zinc-800">{formatINR(data.subtotal)}</span>
            </div>

            {/* Tax Breakdown */}
            {tax.taxType === 'IGST' && (
              <div className="flex justify-between py-1 border-b border-zinc-100">
                <span className="text-zinc-600">Integrated GST (IGST 18%):</span>
                <span className="font-mono font-medium text-zinc-800">{formatINR(tax.igstAmount)}</span>
              </div>
            )}

            {tax.taxType === 'CGST_SGST' && (
              <>
                <div className="flex justify-between py-1 border-b border-zinc-100">
                  <span className="text-zinc-600">Central GST (CGST 9%):</span>
                  <span className="font-mono font-medium text-zinc-800">{formatINR(tax.cgstAmount)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-100">
                  <span className="text-zinc-600">State GST (SGST 9%):</span>
                  <span className="font-mono font-medium text-zinc-800">{formatINR(tax.sgstAmount)}</span>
                </div>
              </>
            )}

            {tax.taxType === 'EXEMPT_LUT' && (
              <div className="flex justify-between py-1 border-b border-zinc-100">
                <span className="text-zinc-500">IGST (Export LUT):</span>
                <span className="font-mono text-zinc-500">₹0.00 (0%)</span>
              </div>
            )}

            {/* Invoice Total */}
            <div className="flex justify-between items-baseline py-2 border-t-2 border-zinc-900 mt-2">
              <span className="text-[12px] font-bold uppercase tracking-wider text-zinc-900">
                {settings.showTds ? 'Invoice Value:' : 'Total Due:'}
              </span>
              <span className="font-mono text-base font-bold text-zinc-900">
                {formatINR(data.grandTotal)}
              </span>
            </div>

            {/* Optional TDS Deduction (u/s 194J) & Net Payable */}
            {settings.showTds && (
              <div className="pt-1.5 border-t border-dashed border-zinc-200 space-y-1.5">
                <div className="flex justify-between text-zinc-500 text-[10px]">
                  <span>Less: TDS @ {settings.tdsRatePercent || 10}% (u/s 194J):</span>
                  <span className="font-mono font-medium text-red-600">
                    -{formatINR(data.tdsAmount || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline py-1.5 bg-zinc-50 px-2 rounded-xs border border-zinc-200">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                    Net Payable to Bank:
                  </span>
                  <span className="font-mono text-sm font-bold text-emerald-700">
                    {formatINR(data.netPayable || data.grandTotal)}
                  </span>
                </div>
              </div>
            )}

            {/* Compact Amount in Words (Aligned with Totals) */}
            {settings.showAmountInWords !== false && (
              <div className="pt-2 mt-2 border-t border-zinc-100 text-right">
                <span className="text-[9px] uppercase tracking-wider font-semibold text-zinc-400 block mb-0.5">
                  Amount in Words
                </span>
                <span className="font-medium text-zinc-700 text-[11px] italic leading-tight block">
                  {data.amountInWords}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Section: Payment Info & Optional Authorized Signatory */}
      <div className="pt-6 border-t border-zinc-200 print-avoid-break mt-auto">
        <div className={`grid ${settings.showSignature ? 'grid-cols-2' : 'grid-cols-1'} gap-8 items-end`}>
          {/* Bank / Payment Details */}
          <div className="space-y-1.5 text-[11px]">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 mb-1">
              Bank & Payment Details
            </div>
            {bank.bankName && (
              <div className="flex gap-2">
                <span className="text-zinc-400 w-24">Bank Name:</span>
                <span className="font-medium text-zinc-800">{bank.bankName}</span>
              </div>
            )}
            {bank.accountHolder && (
              <div className="flex gap-2">
                <span className="text-zinc-400 w-24">A/C Name:</span>
                <span className="text-zinc-700">{bank.accountHolder}</span>
              </div>
            )}
            {bank.accountNumber && (
              <div className="flex gap-2">
                <span className="text-zinc-400 w-24">Account No:</span>
                <span className="font-mono font-medium text-zinc-900">{bank.accountNumber}</span>
              </div>
            )}
            {bank.ifscCode && (
              <div className="flex gap-2">
                <span className="text-zinc-400 w-24">IFSC Code:</span>
                <span className="font-mono font-medium text-zinc-900">{bank.ifscCode}</span>
              </div>
            )}
            {bank.accountType?.trim() && (
              <div className="flex gap-2">
                <span className="text-zinc-400 w-24">A/C Type:</span>
                <span className="text-zinc-700">{bank.accountType}</span>
              </div>
            )}
            {bank.upiId?.trim() && (
              <div className="flex gap-2 pt-1 border-t border-zinc-100">
                <span className="text-zinc-400 w-24">UPI ID:</span>
                <span className="font-mono font-medium text-emerald-700">{bank.upiId}</span>
              </div>
            )}
          </div>

          {/* Optional Authorized Signatory */}
          {settings.showSignature && (
            <div className="text-right flex flex-col items-end justify-end">
              <div className="h-16 flex items-end justify-end mb-2">
                {settings.signatureUrl ? (
                  <img
                    src={settings.signatureUrl}
                    alt="Authorized Signature"
                    className="max-h-16 max-w-44 object-contain"
                  />
                ) : (
                  <div className="text-[10px] text-zinc-300 italic mb-2">
                    (Signature)
                  </div>
                )}
              </div>
              <div className="w-52 border-t border-zinc-300 pt-1 text-[11px]">
                <div className="font-semibold text-zinc-800">
                  {supplier.name || supplier.companyName}
                </div>
                <div className="text-[10px] text-zinc-400 uppercase tracking-wider">
                  Authorized Signatory
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notes & Terms */}
        {(settings.notes || settings.terms) && (
          <div className="mt-6 pt-3 border-t border-zinc-100 text-[10px] text-zinc-500 space-y-1">
            {settings.terms && (
              <div>
                <span className="font-semibold text-zinc-600">Terms: </span>
                {settings.terms}
              </div>
            )}
            {settings.notes && (
              <div>
                <span className="font-semibold text-zinc-600">Note: </span>
                {settings.notes}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
