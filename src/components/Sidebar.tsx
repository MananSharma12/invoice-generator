import React, { useState } from 'react';
import {
  FileDown,
  Plus,
  Trash2,
  Download,
  Upload,
  BookmarkPlus,
  Building2,
  FileText,
  CreditCard,
  Settings,
  Sparkles,
  SlidersHorizontal,
  History,
  FilePlus,
} from 'lucide-react';
import type { useInvoiceState } from '../hooks/useInvoiceState';
import type { DateFormat } from '../types/invoice';
import { STATE_CODES, COMMON_SAC_CODES, formatINR, formatDisplayDate } from '../lib/gst';

type InvoiceStateReturn = ReturnType<typeof useInvoiceState>;

interface SidebarProps {
  state: InvoiceStateReturn;
}

export const Sidebar: React.FC<SidebarProps> = ({ state }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'client' | 'items' | 'invoice' | 'history' | 'settings'>('profile');

  const {
    meta,
    setMeta,
    supplier,
    setSupplier,
    handleSupplierGstinChange,
    client,
    setClient,
    handleClientGstinChange,
    items,
    addLineItem,
    updateLineItem,
    removeLineItem,
    bank,
    setBank,
    settings,
    setSettings,
    duplicateForNewMonth,
    savedClients,
    saveClientAsPreset,
    deleteClientPreset,
    loadClientPreset,
    invoiceHistory,
    saveInvoiceToHistory,
    loadInvoiceFromHistory,
    deleteInvoiceFromHistory,
    createNewInvoice,
    exportAllToJson,
    importFromJson,
  } = state;

  const handleExportPdf = () => {
    // 1. Auto-save invoice to persistent history
    saveInvoiceToHistory();

    // 2. Set document title dynamically for clean digital PDF file save
    const originalTitle = document.title;
    const clientSlug = (client.companyName || client.name || 'Client')
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    document.title = `${meta.invoiceNumber || 'Invoice'}_${clientSlug}`;

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    // 3. Trigger native print/PDF dialog
    window.print();

    // 4. Restore original window title
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setSettings((prev) => ({
          ...prev,
          signatureUrl: event.target?.result as string,
          showSignature: true,
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleJsonImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        const success = importFromJson(event.target.result);
        if (success) {
          alert('Data restored successfully!');
        } else {
          alert('Invalid backup file.');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <aside className="w-full md:w-[430px] bg-zinc-950 text-zinc-100 border-r border-zinc-800 flex flex-col h-screen no-print select-none">
      {/* App Header & Direct PDF Export */}
      <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-white text-zinc-950 flex items-center justify-center font-bold text-xs tracking-wider">
            IV
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-white flex items-center gap-1.5">
              Invoicr
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-zinc-800 text-zinc-400 rounded-sm">
                GST
              </span>
            </h1>
          </div>
        </div>

        {/* Primary Action: Export to PDF */}
        <button
          onClick={handleExportPdf}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-colors shadow-sm cursor-pointer"
          title="Export vector PDF and auto-save to history"
        >
          <FileDown size={14} />
          <span>Export to PDF</span>
        </button>
      </div>

      {/* Secondary Bar: Actions & Backups */}
      <div className="px-3 py-2 bg-zinc-900/50 border-b border-zinc-800/60 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={duplicateForNewMonth}
            className="flex items-center gap-1 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title="Auto-increments invoice # and updates dates to today"
          >
            <Sparkles size={12} className="text-amber-400" />
            <span>New Month</span>
          </button>
          <span className="text-zinc-700">|</span>
          <button
            onClick={createNewInvoice}
            className="flex items-center gap-1 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title="Start a blank invoice"
          >
            <FilePlus size={12} />
            <span>New Blank</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-zinc-400">
          <button
            onClick={exportAllToJson}
            className="hover:text-zinc-200 transition-colors cursor-pointer flex items-center gap-1"
            title="Export all data to JSON backup"
          >
            <Download size={12} />
            <span className="text-[11px]">Backup</span>
          </button>
          <span>|</span>
          <label
            className="hover:text-zinc-200 transition-colors cursor-pointer flex items-center gap-1"
            title="Restore from JSON backup"
          >
            <Upload size={12} />
            <span className="text-[11px]">Restore</span>
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleJsonImport}
            />
          </label>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800/80 bg-zinc-900/30 text-xs">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 py-2.5 px-1.5 text-center font-medium transition-colors border-b-2 cursor-pointer flex items-center justify-center gap-1 ${
            activeTab === 'profile'
              ? 'border-emerald-500 text-white bg-zinc-900/50'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
          title="Your details and bank account"
        >
          <CreditCard size={13} />
          <span>You</span>
        </button>

        <button
          onClick={() => setActiveTab('client')}
          className={`flex-1 py-2.5 px-1.5 text-center font-medium transition-colors border-b-2 cursor-pointer flex items-center justify-center gap-1 ${
            activeTab === 'client'
              ? 'border-emerald-500 text-white bg-zinc-900/50'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
          title="Client details & presets"
        >
          <Building2 size={13} />
          <span>Client</span>
        </button>

        <button
          onClick={() => setActiveTab('items')}
          className={`flex-1 py-2.5 px-1.5 text-center font-medium transition-colors border-b-2 cursor-pointer flex items-center justify-center gap-1 ${
            activeTab === 'items'
              ? 'border-emerald-500 text-white bg-zinc-900/50'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
          title="Line items & column options"
        >
          <Plus size={13} />
          <span>Items ({items.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('invoice')}
          className={`flex-1 py-2.5 px-1.5 text-center font-medium transition-colors border-b-2 cursor-pointer flex items-center justify-center gap-1 ${
            activeTab === 'invoice'
              ? 'border-emerald-500 text-white bg-zinc-900/50'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
          title="Invoice number, dates, and tax mode"
        >
          <FileText size={13} />
          <span>Invoice</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2.5 px-1.5 text-center font-medium transition-colors border-b-2 cursor-pointer flex items-center justify-center gap-1 ${
            activeTab === 'history'
              ? 'border-emerald-500 text-white bg-zinc-900/50'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
          title="Past exported invoices"
        >
          <History size={13} />
          <span>History ({invoiceHistory.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`py-2.5 px-2.5 text-center font-medium transition-colors border-b-2 cursor-pointer ${
            activeTab === 'settings'
              ? 'border-emerald-500 text-white bg-zinc-900/50'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
          title="Settings, date format, and notes"
        >
          <Settings size={13} />
        </button>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-sans">
        {/* TAB 1: PROFILE (YOU & BANK) */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-zinc-800">
              <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">
                Your Details (Supplier)
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">Saved locally</span>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Your Legal / Business Name
              </label>
              <input
                type="text"
                value={supplier.companyName || supplier.name}
                onChange={(e) =>
                  setSupplier((p) => ({
                    ...p,
                    companyName: e.target.value,
                    name: e.target.value,
                  }))
                }
                className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-zinc-100 focus:outline-hidden focus:border-zinc-600"
                placeholder="e.g. Your Name or Design Studio"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[11px] font-medium text-zinc-400">
                  Your GSTIN
                </label>
                <span className="text-[10px] text-zinc-500">Auto-derives State & PAN</span>
              </div>
              <input
                type="text"
                value={supplier.gstin}
                onChange={(e) => handleSupplierGstinChange(e.target.value)}
                maxLength={15}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-zinc-100 font-mono tracking-wider focus:outline-hidden focus:border-zinc-600"
                placeholder="08XXXXX1234F1Z5"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Your PAN
                </label>
                <input
                  type="text"
                  value={supplier.pan}
                  onChange={(e) => setSupplier((p) => ({ ...p, pan: e.target.value.toUpperCase() }))}
                  maxLength={10}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-zinc-100 font-mono focus:outline-hidden focus:border-zinc-600"
                  placeholder="ABCDE1234F"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  State Code
                </label>
                <input
                  type="text"
                  value={supplier.stateCode}
                  onChange={(e) => setSupplier((p) => ({ ...p, stateCode: e.target.value }))}
                  maxLength={2}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-zinc-100 font-mono focus:outline-hidden focus:border-zinc-600"
                  placeholder="08"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                State Name
              </label>
              <input
                type="text"
                value={supplier.state}
                onChange={(e) => setSupplier((p) => ({ ...p, state: e.target.value }))}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-zinc-100 focus:outline-hidden focus:border-zinc-600"
                placeholder="Rajasthan"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Full Address
              </label>
              <textarea
                rows={2}
                value={supplier.address}
                onChange={(e) => setSupplier((p) => ({ ...p, address: e.target.value }))}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-zinc-100 focus:outline-hidden focus:border-zinc-600"
                placeholder="Street address, city, pincode"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Email
              </label>
              <input
                type="email"
                value={supplier.email}
                onChange={(e) => setSupplier((p) => ({ ...p, email: e.target.value }))}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-zinc-100 focus:outline-hidden focus:border-zinc-600"
                placeholder="you@domain.com"
              />
            </div>

            {/* Bank Information */}
            <div className="pt-3 border-t border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">
                  Bank & Payment Info
                </span>
                <span className="text-[10px] text-zinc-500">Empty fields are hidden</span>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={bank.bankName}
                  onChange={(e) => setBank((p) => ({ ...p, bankName: e.target.value }))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-zinc-100 focus:outline-hidden focus:border-zinc-600"
                  placeholder="HDFC Bank"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    value={bank.accountHolder}
                    onChange={(e) => setBank((p) => ({ ...p, accountHolder: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-zinc-100 focus:outline-hidden focus:border-zinc-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                    A/C Type (leave blank to hide)
                  </label>
                  <input
                    type="text"
                    value={bank.accountType}
                    onChange={(e) => setBank((p) => ({ ...p, accountType: e.target.value }))}
                    list="ac-types"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-zinc-100 focus:outline-hidden focus:border-zinc-600"
                    placeholder="Current, Savings, etc."
                  />
                  <datalist id="ac-types">
                    <option value="Current" />
                    <option value="Savings" />
                    <option value="Overdraft" />
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={bank.accountNumber}
                    onChange={(e) => setBank((p) => ({ ...p, accountNumber: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-zinc-100 font-mono focus:outline-hidden focus:border-zinc-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    value={bank.ifscCode}
                    onChange={(e) => setBank((p) => ({ ...p, ifscCode: e.target.value.toUpperCase() }))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-zinc-100 font-mono focus:outline-hidden focus:border-zinc-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  UPI ID / VPA (leave blank to hide)
                </label>
                <input
                  type="text"
                  value={bank.upiId}
                  onChange={(e) => setBank((p) => ({ ...p, upiId: e.target.value }))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-zinc-100 font-mono focus:outline-hidden focus:border-zinc-600"
                  placeholder="yourname@okaxis (optional)"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CLIENT */}
        {activeTab === 'client' && (
          <div className="space-y-4">
            {/* Saved Presets with Delete Option */}
            {savedClients.length > 0 && (
              <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-md space-y-2">
                <span className="text-[11px] font-medium text-zinc-400 block">
                  Saved Client Presets
                </span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {savedClients.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-2 bg-zinc-950 border border-zinc-800/80 rounded text-xs hover:border-zinc-700 transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => loadClientPreset(c)}
                        className="text-left flex-1 cursor-pointer truncate"
                      >
                        <div className="font-medium text-zinc-200 truncate">
                          {c.client.companyName || c.client.name}
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono">
                          {c.client.gstin || 'Unregistered'} • Code {c.client.stateCode}
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteClientPreset(c.id)}
                        className="text-zinc-500 hover:text-red-400 p-1 cursor-pointer transition-colors ml-2"
                        title="Delete client preset"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Client Company / Name
              </label>
              <input
                type="text"
                value={client.companyName}
                onChange={(e) => setClient((p) => ({ ...p, companyName: e.target.value }))}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-zinc-100 focus:outline-hidden focus:border-zinc-600"
                placeholder="Acme Corp"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[11px] font-medium text-zinc-400">
                  Client GSTIN
                </label>
                <span className="text-[10px] text-zinc-500">Auto-detects State & PAN</span>
              </div>
              <input
                type="text"
                value={client.gstin}
                onChange={(e) => handleClientGstinChange(e.target.value)}
                maxLength={15}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-zinc-100 font-mono tracking-wider focus:outline-hidden focus:border-zinc-600"
                placeholder="29ABCDE1234F1Z8"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Client PAN
                </label>
                <input
                  type="text"
                  value={client.pan}
                  onChange={(e) => setClient((p) => ({ ...p, pan: e.target.value.toUpperCase() }))}
                  maxLength={10}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-zinc-100 font-mono focus:outline-hidden focus:border-zinc-600"
                  placeholder="ABCDE1234F"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  State Code
                </label>
                <input
                  type="text"
                  value={client.stateCode}
                  onChange={(e) => setClient((p) => ({ ...p, stateCode: e.target.value }))}
                  maxLength={2}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-zinc-100 font-mono focus:outline-hidden focus:border-zinc-600"
                  placeholder="29"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                State Name
              </label>
              <input
                type="text"
                value={client.state}
                onChange={(e) => setClient((p) => ({ ...p, state: e.target.value }))}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-zinc-100 focus:outline-hidden focus:border-zinc-600"
                placeholder="Karnataka"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Full Billing Address
              </label>
              <textarea
                rows={2}
                value={client.address}
                onChange={(e) => setClient((p) => ({ ...p, address: e.target.value }))}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-zinc-100 focus:outline-hidden focus:border-zinc-600"
                placeholder="Street address, Tech park, City, Pincode"
              />
            </div>

            <button
              onClick={saveClientAsPreset}
              className="w-full py-1.5 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-md font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <BookmarkPlus size={13} />
              <span>Save as Client Preset</span>
            </button>
          </div>
        )}

        {/* TAB 3: LINE ITEMS & COLUMN CONTROLS */}
        {activeTab === 'items' && (
          <div className="space-y-4">
            {/* Table Column Options */}
            <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-md space-y-2">
              <span className="text-[11px] font-medium text-zinc-300 flex items-center gap-1">
                <SlidersHorizontal size={12} />
                Table Column Options
              </span>

              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                <label className="flex items-center gap-1.5 cursor-pointer text-zinc-400 hover:text-zinc-200">
                  <input
                    type="checkbox"
                    checked={settings.showSacCode}
                    onChange={(e) => setSettings((p) => ({ ...p, showSacCode: e.target.checked }))}
                    className="rounded bg-zinc-950 border-zinc-700 text-emerald-500"
                  />
                  <span>Show SAC Code</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer text-zinc-400 hover:text-zinc-200">
                  <input
                    type="checkbox"
                    checked={settings.showQuantity}
                    onChange={(e) => setSettings((p) => ({ ...p, showQuantity: e.target.checked }))}
                    className="rounded bg-zinc-950 border-zinc-700 text-emerald-500"
                  />
                  <span>Show Quantity Column</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer text-zinc-400 hover:text-zinc-200 col-span-2 pt-1.5 border-t border-zinc-800">
                  <input
                    type="checkbox"
                    checked={settings.showContractorDaysColumns || false}
                    onChange={(e) => setSettings((p) => ({ ...p, showContractorDaysColumns: e.target.checked }))}
                    className="rounded bg-zinc-950 border-zinc-700 text-emerald-500"
                  />
                  <span>Show separate "Days in Month" & "Days Worked" columns</span>
                </label>
              </div>

              {!settings.showContractorDaysColumns && settings.showQuantity && (
                <div className="pt-2 border-t border-zinc-800">
                  <label className="block text-[10px] text-zinc-400 mb-1">
                    Qty Column Header:
                  </label>
                  <div className="flex gap-1.5">
                    {['Days Worked', 'Qty', 'Days', 'Hours'].map((label) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setSettings((p) => ({ ...p, qtyColumnLabel: label }))}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium cursor-pointer transition-colors ${
                          settings.qtyColumnLabel === label
                            ? 'bg-emerald-500 text-zinc-950 font-semibold'
                            : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center">
              <span className="text-zinc-400 font-medium">Line Items</span>
              <button
                onClick={addLineItem}
                className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-xs flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus size={12} />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => {
                const isWorkingDays = item.pricingType === 'working_days';
                const totalDays = Number(item.daysInMonth) || 0;
                const workedDays = Number(item.daysWorked ?? item.quantity) || 0;
                const unpaid = totalDays > 0 ? totalDays - workedDays : 0;
                const base = Number(item.monthlyRate ?? item.rate) || 0;
                const perDay = totalDays > 0 ? (base / totalDays).toFixed(2) : '0';

                return (
                  <div
                    key={item.id}
                    className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-md space-y-2.5 relative group"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[10px] font-mono text-zinc-500 mt-1">#{idx + 1}</span>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateLineItem(item.id, { description: e.target.value })}
                        placeholder="Item description / milestone"
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1 text-zinc-100 font-medium text-xs focus:outline-hidden focus:border-zinc-600"
                      />
                      {items.length > 1 && (
                        <button
                          onClick={() => removeLineItem(item.id)}
                          className="text-zinc-500 hover:text-red-400 p-1 cursor-pointer transition-colors"
                          title="Delete item"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>

                    {/* Pricing Mode Toggle */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex gap-1 bg-zinc-950 p-0.5 rounded border border-zinc-800">
                        <button
                          type="button"
                          onClick={() =>
                            updateLineItem(item.id, {
                              pricingType: 'working_days',
                              daysInMonth: item.daysInMonth ?? 22,
                              daysWorked: item.daysWorked ?? 22,
                              monthlyRate: item.monthlyRate ?? item.rate,
                            })
                          }
                          className={`px-2 py-0.5 text-[10px] rounded cursor-pointer font-medium transition-colors ${
                            isWorkingDays
                              ? 'bg-emerald-500 text-zinc-950 font-semibold'
                              : 'text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          Working Days (Contractor)
                        </button>
                        <button
                          type="button"
                          onClick={() => updateLineItem(item.id, { pricingType: 'standard' })}
                          className={`px-2 py-0.5 text-[10px] rounded cursor-pointer font-medium transition-colors ${
                            !isWorkingDays
                              ? 'bg-emerald-500 text-zinc-950 font-semibold'
                              : 'text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          Standard (Qty × Rate)
                        </button>
                      </div>

                      <div className="font-mono text-emerald-400 font-semibold text-xs">
                        ₹{item.amount?.toLocaleString('en-IN') || 0}
                      </div>
                    </div>

                    {/* Contractor Working Days Inputs */}
                    {isWorkingDays ? (
                      <div className="space-y-2 pt-1">
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[10px] text-zinc-500 mb-0.5">
                              Days in Month
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={item.daysInMonth ?? 22}
                              onChange={(e) =>
                                updateLineItem(item.id, {
                                  daysInMonth: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-zinc-200 font-mono text-xs focus:outline-hidden focus:border-zinc-600"
                              placeholder="22"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] text-zinc-500 mb-0.5">
                              Days Worked
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={item.daysWorked ?? 22}
                              onChange={(e) =>
                                updateLineItem(item.id, {
                                  daysWorked: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-zinc-200 font-mono text-xs focus:outline-hidden focus:border-zinc-600"
                              placeholder="20"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] text-zinc-500 mb-0.5">
                              Monthly Base (₹)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={item.monthlyRate ?? item.rate}
                              onChange={(e) =>
                                updateLineItem(item.id, {
                                  monthlyRate: parseFloat(e.target.value) || 0,
                                  rate: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-zinc-200 font-mono text-xs focus:outline-hidden focus:border-zinc-600"
                              placeholder="150000"
                            />
                          </div>
                        </div>

                        {/* Live calculation banner */}
                        <div className="p-2 bg-zinc-950 rounded border border-zinc-800/80 text-[10px] flex items-center justify-between">
                          <span>
                            {unpaid > 0 ? (
                              <span className="text-amber-400 font-medium">
                                {unpaid} unpaid day{unpaid > 1 ? 's' : ''} deducted
                              </span>
                            ) : (
                              <span className="text-emerald-400 font-medium">
                                Full month (no unpaid leave)
                              </span>
                            )}
                            <span className="text-zinc-500 ml-1.5 font-mono">
                              (@ ₹{Number(perDay).toLocaleString('en-IN')}/day)
                            </span>
                          </span>
                          <span className="font-mono text-zinc-200 font-semibold">
                            ₹{item.amount.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    ) : (
                      /* Standard Qty x Rate Inputs */
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        <div>
                          <label className="block text-[10px] text-zinc-500 mb-0.5">Qty</label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.quantity}
                            onChange={(e) =>
                              updateLineItem(item.id, {
                                quantity: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-zinc-200 font-mono text-xs focus:outline-hidden focus:border-zinc-600"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-zinc-500 mb-0.5">Unit</label>
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => updateLineItem(item.id, { unit: e.target.value })}
                            list="unit-suggestions"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-zinc-200 text-xs focus:outline-hidden focus:border-zinc-600"
                            placeholder="hrs / days"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-zinc-500 mb-0.5">Rate (₹)</label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.rate}
                            onChange={(e) =>
                              updateLineItem(item.id, {
                                rate: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-zinc-200 font-mono text-xs focus:outline-hidden focus:border-zinc-600"
                          />
                        </div>
                      </div>
                    )}

                    {/* SAC Code */}
                    {settings.showSacCode && (
                      <div className="pt-1 flex items-center gap-2">
                        <label className="text-[10px] text-zinc-500 w-16">SAC Code:</label>
                        <input
                          type="text"
                          value={item.sacCode}
                          onChange={(e) => updateLineItem(item.id, { sacCode: e.target.value })}
                          list="sac-suggestions"
                          className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-zinc-200 font-mono text-xs focus:outline-hidden focus:border-zinc-600"
                          placeholder="998314"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <datalist id="sac-suggestions">
              {COMMON_SAC_CODES.map((sac) => (
                <option key={sac.code} value={sac.code}>
                  {sac.title}
                </option>
              ))}
            </datalist>
          </div>
        )}

        {/* TAB 4: INVOICE META */}
        {activeTab === 'invoice' && (
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Invoice Number
              </label>
              <input
                type="text"
                value={meta.invoiceNumber}
                onChange={(e) => setMeta((p) => ({ ...p, invoiceNumber: e.target.value }))}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-zinc-100 font-mono focus:outline-hidden focus:border-zinc-600"
                placeholder="INV-2026-001"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Invoice Date
                </label>
                <input
                  type="date"
                  value={meta.invoiceDate}
                  onChange={(e) => setMeta((p) => ({ ...p, invoiceDate: e.target.value }))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-zinc-100 font-mono focus:outline-hidden focus:border-zinc-600"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[11px] font-medium text-zinc-400">
                    Due Date
                  </label>
                  <label className="text-[10px] text-zinc-500 flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.showDueDate}
                      onChange={(e) => setSettings((p) => ({ ...p, showDueDate: e.target.checked }))}
                      className="rounded bg-zinc-900 border-zinc-700 text-emerald-500"
                    />
                    <span>Show</span>
                  </label>
                </div>
                <input
                  type="date"
                  disabled={!settings.showDueDate}
                  value={meta.dueDate}
                  onChange={(e) => setMeta((p) => ({ ...p, dueDate: e.target.value }))}
                  className={`w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-zinc-100 font-mono focus:outline-hidden focus:border-zinc-600 ${
                    !settings.showDueDate ? 'opacity-40 cursor-not-allowed' : ''
                  }`}
                />
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-800/80">
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Tax Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMeta((p) => ({ ...p, taxMode: 'domestic' }))}
                  className={`py-1.5 px-3 rounded-md font-medium text-xs cursor-pointer border transition-colors ${
                    meta.taxMode === 'domestic'
                      ? 'bg-zinc-800 border-zinc-600 text-white'
                      : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Domestic (GST)
                </button>
                <button
                  type="button"
                  onClick={() => setMeta((p) => ({ ...p, taxMode: 'export_lut' }))}
                  className={`py-1.5 px-3 rounded-md font-medium text-xs cursor-pointer border transition-colors ${
                    meta.taxMode === 'export_lut'
                      ? 'bg-zinc-800 border-zinc-600 text-white'
                      : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Export under LUT (0%)
                </button>
              </div>
            </div>

            {meta.taxMode === 'export_lut' && (
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  LUT ARN Number (Optional)
                </label>
                <input
                  type="text"
                  value={meta.lutNumber || ''}
                  onChange={(e) => setMeta((p) => ({ ...p, lutNumber: e.target.value }))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-zinc-100 font-mono focus:outline-hidden focus:border-zinc-600"
                  placeholder="AD270326001234F"
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Place of Supply (State)
              </label>
              <select
                value={meta.placeOfSupplyStateCode}
                onChange={(e) => {
                  const code = e.target.value;
                  setMeta((p) => ({
                    ...p,
                    placeOfSupplyStateCode: code,
                    placeOfSupplyStateName: STATE_CODES[code] || '',
                  }));
                }}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-zinc-100 focus:outline-hidden focus:border-zinc-600"
              >
                <option value="">Select State</option>
                {Object.entries(STATE_CODES).map(([code, name]) => (
                  <option key={code} value={code}>
                    {code} - {name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* TAB 5: HISTORY OF EXPORTED INVOICES */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-zinc-800">
              <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">
                Generated Invoices
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">{invoiceHistory.length} saved</span>
            </div>

            {invoiceHistory.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 space-y-1">
                <History size={24} className="mx-auto text-zinc-600 mb-2" />
                <p className="text-xs">No invoices in history yet.</p>
                <p className="text-[11px] text-zinc-600">
                  Exporting to PDF automatically records each invoice here!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {invoiceHistory.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3 bg-zinc-900/70 border border-zinc-800 rounded-md hover:border-zinc-700 transition-colors flex items-center justify-between"
                  >
                    <div className="flex-1 cursor-pointer truncate" onClick={() => loadInvoiceFromHistory(rec)}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-zinc-100 text-xs">
                          {rec.invoiceNumber}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-medium">
                          {formatDisplayDate(rec.invoiceDate, settings.dateFormat)}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-300 truncate mt-0.5">
                        {rec.clientName}
                      </div>
                      <div className="text-[11px] font-mono font-semibold text-emerald-400 mt-0.5">
                        {formatINR(rec.grandTotal)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => loadInvoiceFromHistory(rec)}
                        className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-[11px] cursor-pointer"
                        title="Load this invoice into canvas"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => deleteInvoiceFromHistory(rec.id)}
                        className="text-zinc-500 hover:text-red-400 p-1 cursor-pointer transition-colors"
                        title="Delete from history"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1.5">
                Date Display Format
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['DD/MM/YYYY', 'DD MMM YYYY', 'YYYY-MM-DD'] as DateFormat[]).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setSettings((p) => ({ ...p, dateFormat: fmt }))}
                    className={`py-1 px-2 rounded text-[11px] font-mono cursor-pointer border transition-colors ${
                      settings.dateFormat === fmt
                        ? 'bg-zinc-800 border-zinc-600 text-white font-medium'
                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-800 space-y-2.5">
              <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider block">
                Signature Block
              </span>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showSignature}
                  onChange={(e) => setSettings((p) => ({ ...p, showSignature: e.target.checked }))}
                  className="rounded border-zinc-700 bg-zinc-900 text-emerald-500"
                />
                <span className="text-zinc-300 text-xs">Show Authorized Signatory Block</span>
              </label>

              {settings.showSignature && (
                <div className="ml-5 p-2.5 bg-zinc-900/60 rounded border border-zinc-800 space-y-1.5">
                  <span className="text-[10px] text-zinc-400 block">Digital Signature (Optional PNG):</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={handleSignatureUpload}
                    className="w-full text-[10px] text-zinc-400 file:mr-2 file:py-0.5 file:px-2 file:rounded file:border-0 file:text-[10px] file:bg-zinc-800 file:text-zinc-200 cursor-pointer"
                  />
                  {settings.signatureUrl && (
                    <div className="flex items-center justify-between pt-1">
                      <img
                        src={settings.signatureUrl}
                        alt="Signature"
                        className="h-6 max-w-28 object-contain bg-white/10 rounded px-1"
                      />
                      <button
                        onClick={() => setSettings((p) => ({ ...p, signatureUrl: undefined }))}
                        className="text-zinc-500 hover:text-red-400 text-[10px]"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={settings.showAmountInWords !== false}
                  onChange={(e) => setSettings((p) => ({ ...p, showAmountInWords: e.target.checked }))}
                  className="rounded border-zinc-700 bg-zinc-900 text-emerald-500"
                />
                <span className="text-zinc-300 text-xs">Show Amount in Words</span>
              </label>
            </div>

            {/* TDS Advisory Section (Section 194J) */}
            <div className="pt-2 border-t border-zinc-800 space-y-2">
              <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider block">
                TDS Advisory (Section 194J)
              </span>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showTds || false}
                  onChange={(e) => setSettings((p) => ({ ...p, showTds: e.target.checked }))}
                  className="rounded border-zinc-700 bg-zinc-900 text-emerald-500"
                />
                <span className="text-zinc-300 text-xs">Show TDS Deduction & Net Payable</span>
              </label>

              {settings.showTds && (
                <div className="ml-5 p-2 bg-zinc-900/70 rounded border border-zinc-800 space-y-1.5">
                  <span className="text-[10px] text-zinc-400 block">TDS Rate (on Subtotal only):</span>
                  <div className="flex gap-1.5">
                    {[10, 2, 1].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => setSettings((p) => ({ ...p, tdsRatePercent: rate }))}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium cursor-pointer transition-colors ${
                          (settings.tdsRatePercent ?? 10) === rate
                            ? 'bg-emerald-500 text-zinc-950 font-semibold'
                            : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                        }`}
                      >
                        {rate}% {rate === 10 ? '(194J Tech / Prof)' : ''}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-tight">
                    TDS is legally deducted strictly from the Subtotal (taxable amount), not on GST.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-zinc-800 space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Terms & Conditions
                </label>
                <textarea
                  rows={2}
                  value={settings.terms}
                  onChange={(e) => setSettings((p) => ({ ...p, terms: e.target.value }))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-zinc-100 text-xs focus:outline-hidden focus:border-zinc-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Notes / Memo
                </label>
                <textarea
                  rows={2}
                  value={settings.notes}
                  onChange={(e) => setSettings((p) => ({ ...p, notes: e.target.value }))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-zinc-100 text-xs focus:outline-hidden focus:border-zinc-600"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="p-3 border-t border-zinc-800/80 bg-zinc-900/40 text-[11px] text-zinc-400 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>
            {state.computedInvoice.tax.taxType === 'IGST'
              ? 'Interstate (IGST 18%)'
              : state.computedInvoice.tax.taxType === 'CGST_SGST'
              ? 'Intrastate (CGST+SGST 18%)'
              : 'Export (0% LUT)'}
          </span>
        </div>
        <div className="font-mono text-zinc-200 font-semibold">
          ₹{state.computedInvoice.grandTotal.toLocaleString('en-IN')}
        </div>
      </div>
    </aside>
  );
};
