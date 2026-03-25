import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { MapPin, Check, User, Calendar, FileText, Download, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

// Logo aziendale
import ecoLogo from '../assets/images/eco-solutions-logo-.jpeg';

// Componenti Custom
import QuoteSections from '../components/QuoteSections';
import WorkTimeline from '../components/WorkTimeline';
import PaymentPlan from '../components/PaymentPlan';
import TeamSection from '../components/TeamSection';
import MaterialsSection from '../components/MaterialsSection';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);
};

export default function QuotePage() {
  const { quoteId } = useParams();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState('');
  const printRef = useRef(null);

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const docRef = doc(db, "preventivi", quoteId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setQuote(docSnap.data());
      } catch (error) {
        console.error("Errore download:", error);
      } finally {
        setLoading(false);
      }
    };
    if (quoteId) fetchQuote();
  }, [quoteId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[#86868b]">Caricamento...</div>;
  if (!quote) return <div className="min-h-screen flex items-center justify-center text-[#86868b]">Documento non trovato.</div>;

  const calculatedDays = quote.sections ? Math.ceil(
    quote.sections.reduce((acc, s) => acc + parseFloat(s.durationHours || 0), 0) / 8
  ) : 0;
  const displayDuration = quote.duration || (calculatedDays > 0 ? `${calculatedDays} Giorni` : "Da definire");

  // --- DOWNLOAD PREVENTIVO: Screenshot pixel-perfect → PDF A4 ---
  const handleDownloadPreventivo = async () => {
    setGeneratingPdf(true);
    setPdfProgress('Preparazione...');

    try {
      const container = printRef.current;
      if (!container) throw new Error('Container not found');

      // Force desktop width for consistent rendering
      const originalMaxWidth = container.style.maxWidth;
      const originalWidth = container.style.width;
      const originalBorderRadius = container.style.borderRadius;
      container.style.maxWidth = '960px';
      container.style.width = '960px';
      container.style.borderRadius = '0';

      // Disable animations during capture
      const styleTag = document.createElement('style');
      styleTag.textContent = `*, *::before, *::after { animation: none !important; transition: none !important; }`;
      document.head.appendChild(styleTag);

      await new Promise(r => setTimeout(r, 300));
      setPdfProgress('Rendering pagina...');
      await new Promise(r => setTimeout(r, 50));

      // Full-page screenshot at 2x
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 960,
        scrollX: 0,
        scrollY: -window.scrollY,
      });

      // Restore originals
      container.style.maxWidth = originalMaxWidth;
      container.style.width = originalWidth;
      container.style.borderRadius = originalBorderRadius;
      document.head.removeChild(styleTag);

      setPdfProgress('Generazione PDF A4...');
      await new Promise(r => setTimeout(r, 50));

      // --- PDF A4: image fills width, flows across pages ---
      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      const pdfWidthMM = 210; // A4 width
      const pdfHeightMM = 297; // A4 height
      const marginMM = 0; // No margins — nudo e crudo

      const usableWidth = pdfWidthMM - marginMM * 2;
      const imgAspect = canvas.height / canvas.width;
      const totalImgHeightMM = usableWidth * imgAspect;
      const usableHeight = pdfHeightMM - marginMM * 2;

      const pdf = new jsPDF('p', 'mm', 'a4');
      let yOffset = 0;
      let pageNum = 0;

      while (yOffset < totalImgHeightMM) {
        if (pageNum > 0) pdf.addPage();

        // Calculate source crop in canvas pixels
        const sliceTopPx = (yOffset / totalImgHeightMM) * canvas.height;
        const sliceHeightPx = (usableHeight / totalImgHeightMM) * canvas.height;
        const actualSliceHeight = Math.min(sliceHeightPx, canvas.height - sliceTopPx);

        // Create a temp canvas for this page slice
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = Math.ceil(actualSliceHeight);
        const ctx = pageCanvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        ctx.drawImage(canvas, 0, sliceTopPx, canvas.width, actualSliceHeight, 0, 0, canvas.width, actualSliceHeight);

        const sliceData = pageCanvas.toDataURL('image/jpeg', 0.92);
        const sliceHeightMM = (actualSliceHeight / canvas.height) * totalImgHeightMM;

        pdf.addImage(sliceData, 'JPEG', marginMM, marginMM, usableWidth, sliceHeightMM);

        yOffset += usableHeight;
        pageNum++;
      }

      // Download PDF
      const fileName = `Preventivo_${quote.quoteNumber || quoteId.slice(-4)}_${(quote.clientName || 'Cliente').replace(/\s+/g, '_')}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('Errore generazione PDF:', error);
      alert('Errore durante la generazione del PDF. Riprova.');
    } finally {
      setGeneratingPdf(false);
      setPdfProgress('');
    }
  };

  return (
    <div className="min-h-screen font-sans selection:bg-[#cce9ff] pb-20 pt-6 md:pt-12 overflow-x-hidden">

      <main ref={printRef} className="max-w-[960px] mx-auto bg-white min-h-[1000px] shadow-[0_24px_60px_-12px_rgba(0,0,0,0.06)] sm:rounded-[32px] overflow-hidden relative">

        {/* --- BANNER AZIENDALE ELEGANTE & RESPONSIVE --- */}
        <div data-pdf-block="banner" className="bg-white border-b border-gray-100">
          
          {/* TOP ROW: Logo + Company | Preventivo */}
          <div className="px-6 md:px-24 py-6 md:py-7 flex items-center justify-between border-b border-gray-100/50">
            
            {/* SINISTRA: Logo + Company Name */}
            <div className="flex items-center gap-3 shrink-0">
              <img
                src={ecoLogo}
                alt="Eco Solution"
                className="w-14 h-14 md:w-16 md:h-16 object-contain rounded-[8px] border border-black/5 shrink-0"
              />
              <div className="min-w-0">
                <h2 className="text-[13px] md:text-[14px] font-bold text-[#1d1d1f] tracking-tight leading-tight">
                  ECO SOLUTION S.a.s
                </h2>
                <p className="text-[10px] text-[#a1a1a6] font-medium">Azienda Edile</p>
              </div>
            </div>

            {/* DESTRA: Numero Preventivo con icon */}
            <div className="flex items-center gap-2.5 md:gap-3 shrink-0 pl-4 md:pl-6 border-l border-gray-200">
              <div className="text-right">
                <p className="text-[8px] md:text-[9px] font-bold text-[#86868b] uppercase tracking-[0.15em] mb-0.5">Preventivo</p>
                <p className="text-[20px] md:text-[24px] font-bold text-[#1d1d1f] tabular-nums tracking-tight">
                  #{quote.quoteNumber || quoteId.slice(-4).toUpperCase()}
                </p>
              </div>
              <div className="hidden md:flex items-center justify-center w-8 h-8 bg-blue-50 rounded-lg shrink-0">
                <FileText size={16} className="text-blue-500" />
              </div>
            </div>

          </div>

          {/* MIDDLE ROW: Company Info — Smart layout per mobile/desktop */}
          <div className="px-6 md:px-24 py-5 md:py-6 border-b border-gray-100/50 bg-gray-50/30">
            
            {/* DESKTOP: Riga compatta con info */}
            <div className="hidden md:flex items-center justify-between gap-10">
              
              {/* Sede Operativa */}
              <div className="flex-1 min-w-0">
                <p className="text-[8px] font-bold text-[#86868b] uppercase tracking-[0.15em] mb-1">Sede Operativa</p>
                <p className="text-[10px] text-[#1d1d1f] font-medium leading-tight">Via Roma, 8</p>
                <p className="text-[9px] text-[#a1a1a6] leading-tight">20823 Lentate sul Seveso (MB)</p>
              </div>

              {/* Contatti */}
              <div className="flex-1 min-w-0">
                <p className="text-[8px] font-bold text-[#86868b] uppercase tracking-[0.15em] mb-1">Contatti</p>
                <div className="space-y-0.5">
                  <a href="tel:+39334222122" className="block text-[10px] text-blue-600 font-medium hover:text-blue-700 transition-colors underline decoration-blue-600 decoration-1 underline-offset-2">
                    +39 334 222 1212
                  </a>
                  <a href="mailto:info@ecosolutionsas.it" className="block text-[10px] text-blue-600 font-medium hover:text-blue-700 transition-colors underline decoration-blue-600 decoration-1 underline-offset-2">
                    info@ecosolutionsas.it
                  </a>
                </div>
              </div>

              {/* Emissione */}
              <div className="flex-1 min-w-0">
                <p className="text-[8px] font-bold text-[#86868b] uppercase tracking-[0.15em] mb-1">Emissione</p>
                <p className="text-[10px] text-[#1d1d1f] font-medium">{quote.date}</p>
                <p className="text-[9px] text-[#a1a1a6]">Valido 30 giorni</p>
              </div>

              {/* P.IVA */}
              <div className="flex-1 min-w-0 text-right">
                <p className="text-[8px] font-bold text-[#86868b] uppercase tracking-[0.15em] mb-1">P.IVA</p>
                <p className="text-[10px] text-[#1d1d1f] font-medium">04640600161</p>
              </div>

            </div>

            {/* MOBILE: 2 colonne bilanciate, senza separatori */}
            <div className="md:hidden flex items-stretch gap-6">

              {/* SINISTRA: Sede + P.IVA */}
              <div className="flex-1 min-w-0 flex flex-col gap-4">
                <div className="min-h-[52px]">
                  <p className="text-[8px] font-bold text-[#86868b] uppercase tracking-[0.15em] mb-1">Sede Operativa</p>
                  <p className="text-[11px] text-[#1d1d1f] font-medium leading-tight">Via Roma, 8</p>
                  <p className="text-[10px] text-[#a1a1a6] leading-tight">20823 Lentate sul Seveso (MB)</p>
                </div>
                <div>
                  <p className="text-[8px] font-bold text-[#86868b] uppercase tracking-[0.15em] mb-1">P.IVA</p>
                  <p className="text-[11px] text-[#1d1d1f] font-medium">04640600161</p>
                  <p className="text-[10px] text-[#a1a1a6] leading-tight">SDI T9K4ZHO</p>
                </div>
              </div>

              {/* DESTRA: Contatti + Emissione — allineato a destra */}
              <div className="flex-1 min-w-0 flex flex-col gap-4 text-right">
                <div className="min-h-[52px]">
                  <p className="text-[8px] font-bold text-[#86868b] uppercase tracking-[0.15em] mb-1">Contatti</p>
                  <a href="tel:+39334222122" className="block text-[11px] text-blue-600 font-medium underline decoration-blue-600 decoration-1 underline-offset-2">
                    +39 334 222 1212
                  </a>
                  <a href="mailto:info@ecosolutionsas.it" className="block text-[11px] text-blue-600 font-medium underline decoration-blue-600 decoration-1 underline-offset-2 break-all">
                    info@ecosolutionsas.it
                  </a>
                </div>
                <div>
                  <p className="text-[8px] font-bold text-[#86868b] uppercase tracking-[0.15em] mb-1">Emissione</p>
                  <p className="text-[11px] text-[#1d1d1f] font-medium">{quote.date}</p>
                  <p className="text-[10px] text-[#a1a1a6] leading-tight">Valido 30 giorni</p>
                </div>
              </div>

            </div>

          </div>

          {/* BOTTOM ROW: Validity info — Desktop only */}
          <div className="hidden md:block px-24 py-4 text-right">
            <p className="text-[9px] text-[#86868b] font-medium">
              Valido per 30 giorni dalla data di emissione
            </p>
          </div>

        </div>

        {/* --- HEADER STILE LINEAR/NOTION --- */}
        <header data-pdf-block="header" className="px-10 py-12 md:px-24 md:pt-20 md:pb-16 bg-white">
          <div className="max-w-4xl">

            {/* 1. TITOLO PROGETTO */}
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-[#1d1d1f] mb-3 leading-[1.1] break-words">
              {quote.projectName}
            </h1>

            {/* 2. META DATA */}
            <div className="flex items-center gap-2 text-sm text-gray-300 mb-10 font-medium">
              <span>Creato il {quote.date}</span>
            </div>

            {/* 3. GRIGLIA PROPRIETÀ */}
            <div className="flex flex-col gap-1 w-full">

              <div className="group flex items-center min-h-[34px] py-1 px-2 -mx-2 hover:bg-gray-100/50 rounded-md transition-colors">
                <div className="w-[180px] flex items-center gap-2 text-[14px] text-gray-500 shrink-0">
                  <User size={16} className="text-gray-400 opacity-80" />
                  <span>Cliente</span>
                </div>
                <div className="flex-1 flex items-center">
                  <div className="inline-flex items-center gap-2 pl-1 pr-3 py-1 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50 transition-colors cursor-default">
                    <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-[9px] font-bold uppercase">
                      {quote.clientName ? quote.clientName.charAt(0) : 'C'}
                    </div>
                    <span className="text-[13px] font-medium text-gray-700">{quote.clientName}</span>
                  </div>
                </div>
              </div>

              <div className="group flex items-center min-h-[34px] py-1 px-2 -mx-2 hover:bg-gray-100/50 rounded-md transition-colors">
                <div className="w-[180px] flex items-center gap-2 text-[14px] text-gray-500 shrink-0">
                  <div className="w-4 h-4 flex flex-col justify-center opacity-80 pl-[2px]"><div className="w-3.5 h-3.5 border-2 border-gray-400 border-dashed rounded-full" /></div>
                  <span className="pl-1">Stato</span>
                </div>
                <div className="flex-1 flex items-center">
                  {(() => {
                    const statusColors = {
                      blue: { bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-500', border: 'border-blue-100' },
                      green: { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500', border: 'border-emerald-100' },
                      yellow: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', border: 'border-amber-100' },
                      gray: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400', border: 'border-gray-200' },
                      purple: { bg: 'bg-purple-50', text: 'text-purple-600', dot: 'bg-purple-500', border: 'border-purple-100' },
                      red: { bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500', border: 'border-red-100' },
                    };
                    const style = statusColors[quote.statusColor] || statusColors.blue;
                    return (
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-medium border ${style.bg} ${style.text} ${style.border}`}>
                        <div className={`w-2 h-2 rounded-full animate-pulse ${style.dot}`} />
                        {quote.statusText || "In elaborazione"}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {quote.estimatedStart && (
                <div className="group flex items-center min-h-[34px] py-1 px-2 -mx-2 hover:bg-gray-100/50 rounded-md transition-colors">
                  <div className="w-[180px] flex items-center gap-2 text-[14px] text-gray-500 shrink-0">
                    <Calendar size={16} className="text-gray-400 opacity-80" />
                    <span>Inizio Previsto</span>
                  </div>
                  <div className="flex-1 flex items-center">
                    <span className="text-[14px] text-[#1d1d1f]">{quote.estimatedStart}</span>
                  </div>
                </div>
              )}

              <div className="group flex items-center min-h-[34px] py-1 px-2 -mx-2 hover:bg-gray-100/50 rounded-md transition-colors">
                <div className="w-[180px] flex items-center gap-2 text-[14px] text-gray-500 shrink-0">
                  <Calendar size={16} className="text-gray-400 opacity-80" />
                  <span>Durata</span>
                </div>
                <div className="flex-1 flex items-center">
                  <span className="text-[14px] text-[#1d1d1f] hover:text-black cursor-default">{displayDuration} di lavoro previsto</span>
                </div>
              </div>

              <div className="group flex items-center min-h-[34px] py-1 px-2 -mx-2 hover:bg-gray-100/50 rounded-md transition-colors">
                <div className="w-[180px] flex items-center gap-2 text-[14px] text-gray-500 shrink-0">
                  <MapPin size={16} className="text-gray-400 opacity-80" />
                  <span>Luogo</span>
                </div>
                <div className="flex-1 flex items-center">
                  <span className="text-[14px] text-[#1d1d1f] underline decoration-gray-300 decoration-1 underline-offset-2 hover:decoration-gray-400 cursor-pointer">{quote.address || "Milano, IT"}</span>
                </div>
              </div>

            </div>
          </div>
        </header>

        <hr data-pdf-block="hr" className="border-[#f0f0f0] mx-10 md:mx-24 mb-16" />

        {/* --- CRONOPROGRAMMA --- */}
        <div data-pdf-block="timeline" className="px-0 md:px-10 mb-12">
          {quote.sections && quote.sections.some(s => s.slots && s.slots.length > 0) && (
            <WorkTimeline sections={quote.sections}
            daySettings={quote.daySettings || {}} />
          )}
        </div>

        <QuoteSections sections={quote.sections} />

        {/* --- MATERIALI UTILIZZATI --- */}
        {quote.materials && quote.materials.length > 0 && (
          <div data-pdf-block="global-materials">
            <MaterialsSection materials={quote.materials} />
          </div>
        )}

        {/* --- FOOTER: TOTALI, TEAM E AZIONI --- */}
        <footer data-pdf-block="footer-wrapper" className="border-t border-gray-100">

          <div className="px-10 md:px-24 py-20 bg-white">
            <div className="max-w-3xl mx-auto">

              {/* Riepilogo Costi — Apple-style table */}
              <div data-pdf-block="riepilogo" className="mb-20">
                <h3 data-pdf-block="riepilogo-header" className="text-[11px] font-black text-[#86868b] uppercase tracking-[0.2em] mb-6">
                  Riepilogo costi
                </h3>

                {/* Table */}
                <div className="border-t border-[#e8e8ed]">
                  {quote.sections.map((section, sIdx) => {
                    const sectionTotal = section.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
                    const totalQty = section.items.reduce((acc, item) => acc + parseFloat(item.quantity || 0), 0);
                    const mainUnit = section.items.length > 0 ? section.items[0].unit : '';

                    return (
                      <div key={section.id} data-pdf-block={`riepilogo-row-${sIdx}`} className="py-4 border-b border-[#e8e8ed]/60">
                        <div className="flex items-start justify-between gap-4">
                          {/* Left: section title */}
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] text-[#86868b] font-medium leading-snug">
                              {section.title}
                            </p>
                          </div>
                          {/* Right: price + quantity */}
                          <div className="shrink-0 text-right">
                            <span className="text-[16px] text-[#1d1d1f] font-bold tabular-nums tracking-tight">
                              {formatCurrency(sectionTotal)}
                            </span>
                            <p className="text-[11px] text-[#a1a1a6] mt-0.5 tabular-nums">
                              {totalQty % 1 === 0 ? totalQty.toFixed(0) : totalQty.toFixed(1)} {mainUnit}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Totale */}
                <div data-pdf-block="riepilogo-totale" className="flex items-baseline justify-between pt-6 mt-2 gap-4">
                  <span className="text-[17px] md:text-[19px] text-[#1d1d1f] font-bold tracking-tight">
                    Totale Preventivo
                  </span>
                  <span className="text-[26px] md:text-[32px] text-[#1d1d1f] font-bold tabular-nums tracking-tight text-right">
                    {formatCurrency(quote.summary.subtotal)}
                  </span>
                </div>
                <p className="text-[12px] text-[#86868b] mt-1.5 text-right">
                  * al netto di IVA
                </p>
              </div>

              {/* --- PIANO PAGAMENTI --- */}
              {quote.paymentPlan && quote.paymentPlan.length > 0 && (
                <div data-pdf-block="payments-section" className="mb-20">
                  <PaymentPlan payments={quote.paymentPlan} />
                </div>
              )}

              {/* --- TEAM --- */}
              {quote.teamMembers && quote.teamMembers.length > 0 && (
                <div data-pdf-block="team" className="mb-20">
                  <TeamSection teamMembers={quote.teamMembers} />
                </div>
              )}

              {/* --- NOTE --- */}
              {quote.publicNotes && (
                <div data-pdf-block="notes" className="mb-20">
                  <h3 className="text-[11px] font-black text-[#86868b] uppercase tracking-[0.2em] mb-5">
                    Note
                  </h3>
                  <div className="text-[14px] text-[#1d1d1f] leading-relaxed whitespace-pre-line">
                    {quote.publicNotes}
                  </div>
                </div>
              )}

              {/* --- TERMINI E CONDIZIONI --- */}
              <div data-pdf-block="termini" className="mb-20">
                <h3 className="text-[11px] font-black text-[#86868b] uppercase tracking-[0.2em] mb-5">
                  Termini e Condizioni
                </h3>
                <div className="text-[13px] text-[#86868b] leading-relaxed whitespace-pre-line">
                  {quote.termsAndConditions || `1. Il presente preventivo ha validità di 30 giorni dalla data di emissione.\n2. I prezzi indicati sono al netto di IVA.\n3. Eventuali variazioni in corso d'opera saranno concordate preventivamente.\n4. I tempi di esecuzione sono indicativi e possono variare in base a condizioni meteo o imprevisti.\n5. Il committente garantisce libero accesso alle aree di lavoro.\n6. Eco Solution S.a.s. si riserva il diritto di sospendere i lavori in caso di mancato pagamento.`}
                </div>
              </div>

              {/* --- ACCETTAZIONE E FIRMA --- */}
              <div data-pdf-block="firma" className="mb-20">
                <h3 className="text-[11px] font-black text-[#86868b] uppercase tracking-[0.2em] mb-8">
                  Accettazione e Firma
                </h3>
                
                <p className="text-[13px] text-[#1d1d1f] leading-relaxed mb-10">
                  Il/La sottoscritto/a dichiara di aver preso visione del presente preventivo e di accettarne integralmente i termini, le condizioni e gli importi indicati.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  {/* Firma Committente */}
                  <div>
                    <p className="text-[10px] font-bold text-[#86868b] uppercase tracking-[0.15em] mb-3">Il Committente</p>
                    <div className="border-b border-[#1d1d1f]/20 pb-1 mb-2 min-h-[60px]"></div>
                    <p className="text-[11px] text-[#a1a1a6]">Nome, Cognome e Firma</p>
                  </div>

                  {/* Firma Eco Solution */}
                  <div>
                    <p className="text-[10px] font-bold text-[#86868b] uppercase tracking-[0.15em] mb-3">Per Eco Solution S.a.s.</p>
                    <div className="border-b border-[#1d1d1f]/20 pb-1 mb-2 min-h-[60px]"></div>
                    <p className="text-[11px] text-[#a1a1a6]">Timbro e Firma</p>
                  </div>
                </div>

                <div className="mt-8 flex items-center gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-[#86868b] uppercase tracking-[0.15em] mb-2">Data</p>
                    <div className="border-b border-[#1d1d1f]/20 w-48 pb-1 mb-2 min-h-[24px]"></div>
                  </div>
                  <div className="ml-auto">
                    <p className="text-[10px] font-bold text-[#86868b] uppercase tracking-[0.15em] mb-2">Luogo</p>
                    <div className="border-b border-[#1d1d1f]/20 w-48 pb-1 mb-2 min-h-[24px]"></div>
                  </div>
                </div>
              </div>

              {/* 4. INFO AZIENDALI */}
              <div data-pdf-block="company-footer" className="pt-12 border-t border-gray-100 flex flex-col items-center text-center gap-6">
                <img
                  src={ecoLogo}
                  alt="Eco Solution Logo"
                  className="w-16 h-16 object-contain rounded-xl opacity-80"
                />
                <div className="flex flex-col items-center gap-2">
                  <p className="text-[14px] font-bold text-[#1d1d1f] uppercase tracking-tight">
                    ECO SOLUTION S.a.s.
                  </p>
                </div>

                <div className="text-[12px] text-[#86868b] leading-relaxed max-w-sm uppercase tracking-wider font-medium opacity-60">
                  P.IVA 04640600161 • Documento emesso il {quote.date} <br />
                  Valido per 30 giorni dalla data di emissione.
                </div>
              </div>

            </div>
          </div>
        </footer>

      </main>

      <div className="max-w-[960px] mx-auto mt-8 px-6 text-center space-y-4">
        <button
          onClick={handleDownloadPreventivo}
          disabled={generatingPdf}
          className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-[#1d1d1f] text-white text-[15px] font-semibold rounded-xl hover:bg-[#333] transition-all shadow-lg shadow-black/10 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {generatingPdf ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              {pdfProgress || 'Preparazione...'}
            </>
          ) : (
            <>
              <Download size={18} />
              Scarica Preventivo
            </>
          )}
        </button>
        <p className="text-[12px] text-gray-400 font-medium tracking-tight">
          Documento creato con il sistema di gestione interno di Eco Solution S.a.s. Sviluppato e mantenuto da Thomas.
        </p>
      </div>
    </div>
  );
}