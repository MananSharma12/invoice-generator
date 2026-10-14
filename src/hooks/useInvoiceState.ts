import { useState, useEffect, useMemo, useCallback } from 'react';
import type {
  InvoiceMeta,
  PartyDetails,
  LineItem,
  BankDetails,
  InvoiceSettings,
  ComputedInvoice,
  SavedClientPreset,
  SavedInvoiceRecord,
} from '../types/invoice';
import {
  computeInvoice,
  parseGstin,
  incrementInvoiceNumber,
  STATE_CODES,
} from '../lib/gst';

const STORAGE_KEYS = {
  DRAFT: 'invoicr_draft_v1',
  HISTORY: 'invoicr_history_v1',
  SUPPLIER: 'invoicr_supplier_v1',
  CLIENTS: 'invoicr_clients_v1',
  BANK: 'invoicr_bank_v1',
  SETTINGS: 'invoicr_settings_v1',
};

const getTodayDate = () => new Date().toISOString().split('T')[0];
const getFutureDate = (days = 15) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

const DEFAULT_SUPPLIER: PartyDetails = {
  name: '',
  companyName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  pincode: '',
  state: 'Rajasthan',
  stateCode: '08',
  gstin: '',
  pan: '',
};

const DEFAULT_CLIENT: PartyDetails = {
  name: '',
  companyName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  pincode: '',
  state: '',
  stateCode: '',
  gstin: '',
  pan: '',
};

const DEFAULT_ITEMS: LineItem[] = [
  {
    id: 'item-1',
    description: 'Frontend Architecture & UI Development (React/TypeScript)',
    sacCode: '998314',
    quantity: 22,
    unit: 'days',
    rate: 150000,
    amount: 150000,
    pricingType: 'working_days',
    daysInMonth: 22,
    daysWorked: 22,
    monthlyRate: 150000,
  },
];

const DEFAULT_BANK: BankDetails = {
  bankName: '',
  accountHolder: '',
  accountNumber: '',
  accountType: 'Current',
  ifscCode: '',
  branch: '',
  upiId: '',
};

const DEFAULT_SETTINGS: InvoiceSettings = {
  accentColor: '#18181b',
  notes: 'Thank you for your business. Please remit payment within the due date.',
  terms: 'Payment is due within 15 days of invoice date. Late payments attract 1.5% interest per month.',
  showSignature: false,
  showDueDate: true,
  showSacCode: true,
  showQuantity: true,
  showContractorDaysColumns: false,
  dateFormat: 'DD/MM/YYYY',
  qtyColumnLabel: 'Days Worked',
  showQrCode: false,
};

export function useInvoiceState() {
  // 1. Load permanent Supplier profile
  const [supplier, setSupplier] = useState<PartyDetails>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SUPPLIER);
      return saved ? JSON.parse(saved) : DEFAULT_SUPPLIER;
    } catch {
      return DEFAULT_SUPPLIER;
    }
  });

  // 2. Load permanent Bank profile
  const [bank, setBank] = useState<BankDetails>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BANK);
      return saved ? JSON.parse(saved) : DEFAULT_BANK;
    } catch {
      return DEFAULT_BANK;
    }
  });

  // 3. Load saved Clients list
  const [savedClients, setSavedClients] = useState<SavedClientPreset[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CLIENTS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 4. Load Invoice History
  const [invoiceHistory, setInvoiceHistory] = useState<SavedInvoiceRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 5. Load Settings
  const [settings, setSettings] = useState<InvoiceSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // 6. Load or initialize active working draft
  const initialDraft = useMemo(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DRAFT);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return null;
  }, []);

  const [meta, setMeta] = useState<InvoiceMeta>(() => {
    if (initialDraft?.meta) return initialDraft.meta;
    return {
      invoiceNumber: 'INV-2026-001',
      invoiceDate: getTodayDate(),
      dueDate: getFutureDate(15),
      placeOfSupplyStateCode: '',
      placeOfSupplyStateName: '',
      reverseCharge: false,
      taxMode: 'domestic',
      currency: 'INR',
    };
  });

  const [client, setClient] = useState<PartyDetails>(() => {
    if (initialDraft?.client) return initialDraft.client;
    return DEFAULT_CLIENT;
  });

  const [items, setItems] = useState<LineItem[]>(() => {
    if (initialDraft?.items && initialDraft.items.length > 0) return initialDraft.items;
    return DEFAULT_ITEMS;
  });

  // Auto-save permanent profiles & settings
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SUPPLIER, JSON.stringify(supplier));
  }, [supplier]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BANK, JSON.stringify(bank));
  }, [bank]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(savedClients));
  }, [savedClients]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(invoiceHistory));
  }, [invoiceHistory]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  // Auto-save working draft on every change
  useEffect(() => {
    const draft = {
      meta,
      client,
      items,
    };
    localStorage.setItem(STORAGE_KEYS.DRAFT, JSON.stringify(draft));
  }, [meta, client, items]);

  // Handle Supplier GSTIN change with auto-derivation
  const handleSupplierGstinChange = useCallback((rawGstin: string) => {
    const parsed = parseGstin(rawGstin);
    setSupplier((prev) => ({
      ...prev,
      gstin: rawGstin.toUpperCase(),
      stateCode: parsed.stateCode || prev.stateCode,
      state: parsed.stateName || prev.state,
      pan: parsed.pan || prev.pan,
    }));
  }, []);

  // Handle Client GSTIN change with auto-derivation
  const handleClientGstinChange = useCallback((rawGstin: string) => {
    const parsed = parseGstin(rawGstin);
    setClient((prev) => ({
      ...prev,
      gstin: rawGstin.toUpperCase(),
      stateCode: parsed.stateCode || prev.stateCode,
      state: parsed.stateName || prev.state,
      pan: parsed.pan || prev.pan,
    }));

    if (parsed.stateCode) {
      setMeta((prev) => ({
        ...prev,
        placeOfSupplyStateCode: parsed.stateCode,
        placeOfSupplyStateName: parsed.stateName,
      }));
    }
  }, []);

  // Line item handlers
  const addLineItem = useCallback(() => {
    const newItem: LineItem = {
      id: `item-${Date.now()}`,
      description: 'Software Engineering Services',
      sacCode: '998314',
      quantity: 22,
      unit: 'days',
      rate: 150000,
      amount: 150000,
      pricingType: 'working_days',
      daysInMonth: 22,
      daysWorked: 22,
      monthlyRate: 150000,
    };
    setItems((prev) => [...prev, newItem]);
  }, []);

  const updateLineItem = useCallback((id: string, updates: Partial<LineItem>) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const merged = { ...item, ...updates };

        if (merged.pricingType === 'working_days') {
          const totalDays = Number(merged.daysInMonth) || 0;
          const worked = Number(merged.daysWorked) || 0;
          const baseRate = Number(merged.monthlyRate ?? merged.rate) || 0;
          merged.rate = baseRate;
          merged.quantity = worked;
          merged.unit = 'days';

          if (totalDays > 0) {
            merged.amount =
              worked === totalDays
                ? baseRate
                : Math.round((baseRate / totalDays) * worked);
          } else {
            merged.amount = 0;
          }
        } else {
          const qty = Number(merged.quantity) || 0;
          const rate = Number(merged.rate) || 0;
          merged.amount = Math.round(qty * rate);
        }

        return merged;
      })
    );
  }, []);

  const removeLineItem = useCallback((id: string) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((item) => item.id !== id) : prev));
  }, []);

  // 1-Click Monthly Clone
  const duplicateForNewMonth = useCallback(() => {
    setMeta((prev) => ({
      ...prev,
      invoiceNumber: incrementInvoiceNumber(prev.invoiceNumber),
      invoiceDate: getTodayDate(),
      dueDate: getFutureDate(15),
    }));
  }, []);

  // Save current client as a preset
  const saveClientAsPreset = useCallback(() => {
    if (!client.name && !client.companyName) return;
    const newPreset: SavedClientPreset = {
      id: `client-${Date.now()}`,
      client,
      defaultSacCode: items[0]?.sacCode || '998314',
      defaultRate: items[0]?.rate || 0,
      defaultUnit: items[0]?.unit || 'month',
    };
    setSavedClients((prev) => [
      ...prev.filter(
        (p) =>
          p.client.gstin !== client.gstin ||
          p.client.companyName !== client.companyName
      ),
      newPreset,
    ]);
  }, [client, items]);

  // Delete a client preset
  const deleteClientPreset = useCallback((id: string) => {
    setSavedClients((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // Load a client preset
  const loadClientPreset = useCallback((preset: SavedClientPreset) => {
    setClient(preset.client);
    setMeta((prev) => ({
      ...prev,
      placeOfSupplyStateCode: preset.client.stateCode,
      placeOfSupplyStateName: STATE_CODES[preset.client.stateCode] || preset.client.state,
    }));
  }, []);

  // Compute live invoice
  const computedInvoice: ComputedInvoice = useMemo(() => {
    return computeInvoice({
      meta,
      supplier,
      client,
      items,
      bank,
      settings,
    });
  }, [meta, supplier, client, items, bank, settings]);

  // Save invoice to history (called on PDF export or manual save)
  const saveInvoiceToHistory = useCallback(() => {
    const record: SavedInvoiceRecord = {
      id: meta.invoiceNumber || `INV-${Date.now()}`,
      invoiceNumber: meta.invoiceNumber || 'INV-001',
      invoiceDate: meta.invoiceDate,
      clientName: client.companyName || client.name || 'Unnamed Client',
      clientGstin: client.gstin || '',
      grandTotal: computedInvoice.grandTotal,
      savedAt: new Date().toISOString(),
      data: {
        meta,
        supplier,
        client,
        items,
        bank,
        settings,
      },
    };

    setInvoiceHistory((prev) => {
      const filtered = prev.filter((item) => item.invoiceNumber !== record.invoiceNumber);
      return [record, ...filtered];
    });
  }, [meta, client, computedInvoice.grandTotal, supplier, items, bank, settings]);

  // Load an invoice from history
  const loadInvoiceFromHistory = useCallback((record: SavedInvoiceRecord) => {
    setMeta(record.data.meta);
    setClient(record.data.client);
    setItems(record.data.items);
    if (record.data.settings) setSettings(record.data.settings);
  }, []);

  // Delete an invoice from history
  const deleteInvoiceFromHistory = useCallback((id: string) => {
    setInvoiceHistory((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Create a brand new blank invoice
  const createNewInvoice = useCallback(() => {
    setMeta((prev) => ({
      ...prev,
      invoiceNumber: incrementInvoiceNumber(prev.invoiceNumber),
      invoiceDate: getTodayDate(),
      dueDate: getFutureDate(15),
    }));
    setClient(DEFAULT_CLIENT);
    setItems(DEFAULT_ITEMS);
  }, []);

  // Export full backup as JSON
  const exportAllToJson = useCallback(() => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      supplier,
      client,
      bank,
      meta,
      items,
      settings,
      savedClients,
      invoiceHistory,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoicr-backup-${getTodayDate()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [supplier, client, bank, meta, items, settings, savedClients, invoiceHistory]);

  // Import from JSON
  const importFromJson = useCallback((jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.supplier) setSupplier(parsed.supplier);
      if (parsed.client) setClient(parsed.client);
      if (parsed.bank) setBank(parsed.bank);
      if (parsed.meta) setMeta(parsed.meta);
      if (parsed.items) setItems(parsed.items);
      if (parsed.settings) setSettings(parsed.settings);
      if (parsed.savedClients) setSavedClients(parsed.savedClients);
      if (parsed.invoiceHistory) setInvoiceHistory(parsed.invoiceHistory);
      return true;
    } catch (e) {
      console.error('Failed to import JSON', e);
      return false;
    }
  }, []);

  return {
    meta,
    setMeta,
    supplier,
    setSupplier,
    handleSupplierGstinChange,
    client,
    setClient,
    handleClientGstinChange,
    items,
    setItems,
    addLineItem,
    updateLineItem,
    removeLineItem,
    bank,
    setBank,
    settings,
    setSettings,
    computedInvoice,
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
  };
}
