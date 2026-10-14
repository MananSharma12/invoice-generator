import { useInvoiceState } from './hooks/useInvoiceState';
import { Sidebar } from './components/Sidebar';
import { SwissModernTemplate } from './templates/SwissModernTemplate';
import './App.css';

function App() {
  const invoiceState = useInvoiceState();

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100 font-sans">
      {/* Left Control Panel / Sidebar */}
      <Sidebar state={invoiceState} />

      {/* Right Canvas: Live A4 Document Sheet */}
      <main className="flex-1 overflow-y-auto bg-zinc-900/70 p-4 md:p-10 flex justify-center items-start print:p-0 print:bg-white print:overflow-visible">
        <div className="w-full max-w-[210mm] transition-all duration-150">
          <SwissModernTemplate data={invoiceState.computedInvoice} />
        </div>
      </main>
    </div>
  );
}

export default App;
