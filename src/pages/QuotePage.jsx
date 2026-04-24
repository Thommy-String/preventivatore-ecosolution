import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { MapPin, Check, User, Calendar, FileText, Download } from 'lucide-react';

// Logo aziendale
import ecoLogo from '../assets/images/eco-solutions-logo-.jpeg';

// Helper per Termini e Condizioni
import { getDefaultTermsAndConditions, getCompanyDisplayName } from '../utils/defaultTermsAndConditions';

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

  // --- DOWNLOAD PREVENTIVO: Print nativo del browser → PDF perfetto su desktop e mobile ---
  const handleDownloadPreventivo = () => {
    const originalTitle = document.title;
    document.title = `Preventivo ${quote.clientName || 'Cliente'} - EcoSolution`;
    window.print();
    // Ripristina il titolo originale dopo la stampa
    setTimeout(() => { document.title = originalTitle; }, 1000);
  };

  return (
    <div className="min-h-screen font-sans selection:bg-[#cce9ff] pb-20 pt-6 md:pt-12 overflow-x-hidden print:pt-0 print:pb-0 print:bg-white">

      <main ref={printRef} className="max-w-[960px] mx-auto bg-white min-h-[1000px] shadow-[0_24px_60px_-12px_rgba(0,0,0,0.06)] sm:rounded-[32px] overflow-hidden relative print:max-w-full print:shadow-none print:rounded-none">

        {/* --- BANNER AZIENDALE ELEGANTE & RESPONSIVE --- */}
        <div data-pdf-block="banner" className="bg-white border-b border-gray-100 print:break-inside-avoid">
          
          {/* TOP ROW: Logo + Company | Preventivo */}
          <div className="px-6 md:px-24 py-6 md:py-7 flex items-center justify-between border-b border-gray-100/50">
            
            {/* SINISTRA: Logo + Company Name */}
            <div className="flex items-center gap-3 shrink-0">
              {(() => {
                const customData = quote.companyData?.useCustom ? quote.companyData : null;
                const logoSrc = customData?.logo || ecoLogo;
                const companyName = customData?.name || 'ECO SOLUTION S.a.s';
                
                return (
                  <>
                    <img
                      src={logoSrc}
                      alt={companyName}
                      className="w-14 h-14 md:w-16 md:h-16 object-contain rounded-[8px] border border-black/5 shrink-0"
                    />
                    <div className="min-w-0">
                      <h2 className="text-[13px] md:text-[14px] font-bold text-[#1d1d1f] tracking-tight leading-tight">
                        {companyName}
                      </h2>
                      {!customData && <p className="text-[10px] text-[#a1a1a6] font-medium">Azienda Edile</p>}
                    </div>
                  </>
                );
              })()}
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

          {/* MIDDLE ROW: Company Info — Mostra solo se dati personalizzati */}
          {quote.companyData?.useCustom && (() => {
            const customData = quote.companyData;
            const companyAddress = customData.address;
            const companyPhone = customData.phone;
            const companyEmail = customData.email;
            const companyVatId = customData.vatId;

            return (
              <div className="px-6 md:px-24 py-5 md:py-6 border-b border-gray-100/50 bg-gray-50/30">
                
                {/* DESKTOP: Riga compatta con info */}
                <div className="hidden md:flex items-center justify-between gap-10">
                  
                  {/* Sede Operativa */}
                  {companyAddress && (
                    <div className="flex-1 min-w-0">
                      <p className="text-[8px] font-bold text-[#86868b] uppercase tracking-[0.15em] mb-1">Sede Operativa</p>
                      <p className="text-[10px] text-[#1d1d1f] font-medium leading-tight whitespace-pre-line">{companyAddress}</p>
                    </div>
                  )}

                  {/* Contatti */}
                  {(companyPhone || companyEmail) && (
                    <div className="flex-1 min-w-0">
                      <p className="text-[8px] font-bold text-[#86868b] uppercase tracking-[0.15em] mb-1">Contatti</p>
                      <div className="space-y-0.5">
                        {companyPhone && (
                          <a href={`tel:${companyPhone}`} className="block text-[10px] text-blue-600 font-medium hover:text-blue-700 transition-colors underline decoration-blue-600 decoration-1 underline-offset-2">
                            {companyPhone}
                          </a>
                        )}
                        {companyEmail && (
                          <a href={`mailto:${companyEmail}`} className="block text-[10px] text-blue-600 font-medium hover:text-blue-700 transition-colors underline decoration-blue-600 decoration-1 underline-offset-2">
                            {companyEmail}
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Emissione */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[8px] font-bold text-[#86868b] uppercase tracking-[0.15em] mb-1">Emissione</p>
                    <p className="text-[10px] text-[#1d1d1f] font-medium">{quote.date}</p>
                    <p className="text-[9px] text-[#a1a1a6]">Valido 30 giorni</p>
                  </div>

                  {/* P.IVA */}
                  {companyVatId && (
                    <div className="flex-1 min-w-0 text-right">
                      <p className="text-[8px] font-bold text-[#86868b] uppercase tracking-[0.15em] mb-1">P.IVA</p>
                      <p className="text-[10px] text-[#1d1d1f] font-medium">{companyVatId}</p>
                    </div>
                  )}

                </div>

                {/* MOBILE: Layout flessibile */}
                <div className="md:hidden flex flex-col gap-4">

                  {/* Sede Operativa */}
                  {companyAddress && (
                    <div>
                      <p className="text-[8px] font-bold text-[#86868b] uppercase tracking-[0.15em] mb-1">Sede Operativa</p>
                      <p className="text-[11px] text-[#1d1d1f] font-medium leading-tight whitespace-pre-line">{companyAddress}</p>
                    </div>
                  )}

                  {/* Contatti + P.IVA */}
                  <div className="flex gap-4">
                    {(companyPhone || companyEmail) && (
                      <div className="flex-1">
                        <p className="text-[8px] font-bold text-[#86868b] uppercase tracking-[0.15em] mb-1">Contatti</p>
                        <div className="space-y-1">
                          {companyPhone && (
                            <a href={`tel:${companyPhone}`} className="block text-[11px] text-blue-600 font-medium hover:text-blue-700">
                              {companyPhone}
                            </a>
                          )}
                          {companyEmail && (
                            <a href={`mailto:${companyEmail}`} className="block text-[11px] text-blue-600 font-medium hover:text-blue-700">
                              {companyEmail}
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                    {companyVatId && (
                      <div className="flex-1 text-right">
                        <p className="text-[8px] font-bold text-[#86868b] uppercase tracking-[0.15em] mb-1">P.IVA</p>
                        <p className="text-[11px] text-[#1d1d1f] font-medium">{companyVatId}</p>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            );
          })()}

          {/* MIDDLE ROW: Company Info DEFAULT — ECO SOLUTION (quando personalizzati disabilitati) */}
          {!quote.companyData?.useCustom && (
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

              {/* MOBILE: 2 colonne bilanciate */}
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

                {/* DESTRA: Contatti + Emissione */}
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
          )}

          {/* BOTTOM ROW: Validity info — Desktop only */}
          <div className="hidden md:block px-24 py-4 text-right">
            <p className="text-[9px] text-[#86868b] font-medium">
              Valido per 30 giorni dalla data di emissione
            </p>
          </div>

        </div>

        {/* --- HEADER STILE LINEAR/NOTION --- */}
        <header data-pdf-block="header" className="px-10 py-12 md:px-24 md:pt-20 md:pb-16 bg-white print:break-inside-avoid print:py-8">
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

        <hr data-pdf-block="hr" className="border-[#f0f0f0] mx-10 md:mx-24 mb-16 print:hidden" />

        {/* --- CRONOPROGRAMMA --- */}
        <div data-pdf-block="timeline" className="px-0 md:px-10 mb-12 print:break-inside-avoid print:mb-6">
          {quote.sections && quote.sections.some(s => s.slots && s.slots.length > 0) && (
            <WorkTimeline sections={quote.sections}
            daySettings={quote.daySettings || {}} />
          )}
        </div>

        <QuoteSections sections={quote.sections} />

        {/* --- MATERIALI UTILIZZATI --- */}
        {quote.materials && quote.materials.length > 0 && (
          <div data-pdf-block="global-materials" className="print:break-inside-avoid">
            <MaterialsSection materials={quote.materials} />
          </div>
        )}

        {/* --- FOOTER: TOTALI, TEAM E AZIONI --- */}
        <footer data-pdf-block="footer-wrapper" className="border-t border-gray-100 print:border-t-0">

          <div className="px-10 md:px-24 py-20 bg-white print:py-8">
            <div className="max-w-3xl mx-auto">

              {/* Riepilogo Costi — Apple-style table */}
              <div data-pdf-block="riepilogo" className="mb-20 print:mb-10 print:break-inside-avoid">
                <h3 data-pdf-block="riepilogo-header" className="text-[11px] font-black text-[#86868b] uppercase tracking-[0.2em] mb-6">
                  Riepilogo costi
                </h3>

                {/* Table */}
                <div className="border-t border-[#e8e8ed]">
                  {quote.sections.map((section, sIdx) => {
                    const sectionTotal = section.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
                    const sectionOriginalTotal = section.items.reduce((acc, item) => {
                      const op = parseFloat(item.originalPrice);
                      return acc + ((op > 0 ? op : item.price) * item.quantity);
                    }, 0);
                    const sectionHasDiscount = sectionOriginalTotal > sectionTotal + 0.01;
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
                            {sectionHasDiscount && (
                              <span className="text-[13px] text-[#ff3b30] line-through tabular-nums tracking-tight opacity-70 mr-2">
                                {formatCurrency(sectionOriginalTotal)}
                              </span>
                            )}
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
                  <div className="text-right">
                    {(() => {
                      // Originale per-item (sommatoria di originalPrice o price se mancante)
                      const itemsOriginalTotal = quote.sections.reduce((acc, s) => acc + s.items.reduce((a, i) => {
                        const op = parseFloat(i.originalPrice);
                        return a + ((op > 0 ? op : i.price) * i.quantity);
                      }, 0), 0);
                      // Imponibile lordo (somma price * qty senza sconto globale)
                      const grossSubtotal = quote.summary.originalSubtotal != null
                        ? quote.summary.originalSubtotal
                        : quote.sections.reduce((acc, s) => acc + s.items.reduce((a, i) => a + (i.price * i.quantity), 0), 0);
                      // Prezzo "originale" da mostrare barrato: il maggiore tra item-original e gross
                      const displayOriginal = Math.max(itemsOriginalTotal, grossSubtotal);
                      const finalTotal = quote.summary.subtotal;
                      const hasDiscount = displayOriginal > finalTotal + 0.01;
                      return hasDiscount ? (
                        <span className="text-[16px] md:text-[18px] text-[#ff3b30] line-through tabular-nums tracking-tight opacity-70 mr-3">
                          {formatCurrency(displayOriginal)}
                        </span>
                      ) : null;
                    })()}
                    <span className="text-[26px] md:text-[32px] text-[#1d1d1f] font-bold tabular-nums tracking-tight">
                      {formatCurrency(quote.summary.subtotal)}
                    </span>
                  </div>
                </div>
                {quote.summary.discountAmount > 0.01 && (
                  <p className="text-[12px] text-emerald-600 mt-1.5 text-right font-semibold">
                    Sconto applicato: − {formatCurrency(quote.summary.discountAmount)}
                  </p>
                )}
                {quote.summary.vatPercentage > 0 ? (
                  <>
                    <div className="flex items-baseline justify-between pt-3 mt-2 gap-4 text-[#86868b]">
                      <span className="text-[14px] font-medium">IVA {quote.summary.vatPercentage}%</span>
                      <span className="text-[15px] tabular-nums font-medium">
                        + {formatCurrency(quote.summary.vatAmount || (quote.summary.subtotal * quote.summary.vatPercentage / 100))}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between pt-4 mt-3 border-t border-[#e8e8ed] gap-4">
                      <span className="text-[15px] md:text-[17px] text-[#1d1d1f] font-bold tracking-tight">
                        Totale IVA inclusa
                      </span>
                      <span className="text-[22px] md:text-[26px] text-[#1d1d1f] font-black tabular-nums tracking-tight">
                        {formatCurrency(quote.summary.totalWithVat || (quote.summary.subtotal * (1 + quote.summary.vatPercentage / 100)))}
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-[12px] text-[#86868b] mt-1.5 text-right">
                    * al netto di IVA
                  </p>
                )}
              </div>

              {/* --- PIANO PAGAMENTI --- */}
              {quote.paymentPlan && quote.paymentPlan.length > 0 && (
                <div data-pdf-block="payments-section" className="mb-20 print:mb-10 print:break-inside-avoid">
                  <PaymentPlan payments={quote.paymentPlan} />
                </div>
              )}

              {/* --- TEAM --- */}
              {quote.teamMembers && quote.teamMembers.length > 0 && (
                <div data-pdf-block="team" className="mb-20 print:mb-10 print:break-inside-avoid">
                  <TeamSection teamMembers={quote.teamMembers} />
                </div>
              )}

              {/* --- NOTE --- */}
              {quote.publicNotes && (
                <div data-pdf-block="notes" className="mb-20 print:mb-10 print:break-inside-avoid">
                  <h3 className="text-[11px] font-black text-[#86868b] uppercase tracking-[0.2em] mb-5">
                    Note
                  </h3>
                  <div className="text-[14px] text-[#1d1d1f] leading-relaxed whitespace-pre-line">
                    {quote.publicNotes}
                  </div>
                </div>
              )}

              {/* --- TERMINI E CONDIZIONI --- */}
              <div data-pdf-block="termini" className="mb-20 print:mb-10 print:break-inside-avoid">
                <h3 className="text-[11px] font-black text-[#86868b] uppercase tracking-[0.2em] mb-5">
                  Termini e Condizioni
                </h3>
                <div className="text-[12px] text-[#86868b] leading-[1.8] space-y-3">
                  {quote.termsAndConditions ? (
                    <div className="whitespace-pre-line">{quote.termsAndConditions}</div>
                  ) : (
                    <div className="whitespace-pre-line">
                      {getDefaultTermsAndConditions(getCompanyDisplayName(quote.companyData))}
                    </div>
                  )}
                </div>
              </div>

              {/* --- ACCETTAZIONE E FIRMA --- */}
              <div data-pdf-block="firma" className="mb-20 print:mb-10 print:break-inside-avoid">
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
                    <p className="text-[10px] font-bold text-[#86868b] uppercase tracking-[0.15em] mb-3">Per {getCompanyDisplayName(quote.companyData)}</p>
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

              {/* 4. DATI AZIENDALI E COORDINATE BANCARIE */}
              {quote.companyData?.useCustom && (() => {
                const customData = quote.companyData;
                const companyLogo = customData.logo;
                const companyName = customData.name;
                const companyAddress = customData.address;
                const companyPhone = customData.phone;
                const companyEmail = customData.email;
                const companyWebsite = customData.website;
                const companyVatId = customData.vatId;
                const companyTaxId = customData.taxId;
                const companySdi = customData.sdi;
                const companyBankName = customData.bankName;
                const companyBankBranch = customData.bankBranch;
                const companyAccountNumber = customData.accountNumber;
                const companyIban = customData.iban;

                return (
                  <div data-pdf-block="company-footer" className="pt-12 border-t border-gray-100 print:break-inside-avoid print:pt-6">
                    
                    <div className="flex items-center gap-3 mb-8 print:mb-4">
                      {companyLogo && (
                        <img
                          src={companyLogo}
                          alt="Company Logo"
                          className="w-12 h-12 object-contain rounded-lg opacity-80"
                        />
                      )}
                      <div>
                        <p className="text-[13px] font-bold text-[#1d1d1f] uppercase tracking-tight">
                          {companyName}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[11px] text-[#86868b] leading-[1.7]">
                      {/* Sedi / Contatti */}
                      <div>
                        {companyAddress && (
                          <div>
                            <p className="text-[9px] font-black text-[#a1a1a6] uppercase tracking-[0.15em] mb-2">Sede</p>
                            <p className="whitespace-pre-line">{companyAddress}</p>
                          </div>
                        )}
                        {(companyPhone || companyEmail || companyWebsite) && (
                          <div className="mt-3">
                            <p className="text-[9px] font-black text-[#a1a1a6] uppercase tracking-[0.15em] mb-2">Contatti</p>
                            {companyPhone && <p>Tel: <span className="text-[#1d1d1f] font-medium">{companyPhone}</span></p>}
                            {companyEmail && <p>Email: <span className="text-[#1d1d1f] font-medium">{companyEmail}</span></p>}
                            {companyWebsite && <p>Web: <span className="text-[#1d1d1f] font-medium">{companyWebsite}</span></p>}
                          </div>
                        )}
                      </div>

                      {/* Dati Fiscali */}
                      <div>
                        <p className="text-[9px] font-black text-[#a1a1a6] uppercase tracking-[0.15em] mb-2">Dati Fiscali</p>
                        {companyVatId && <p>Partita IVA: <span className="text-[#1d1d1f] font-medium">{companyVatId}</span></p>}
                        {companyTaxId && <p>Codice Fiscale: <span className="text-[#1d1d1f] font-medium">{companyTaxId}</span></p>}
                        {companySdi && <p>Codice SDI: <span className="text-[#1d1d1f] font-medium">{companySdi}</span></p>}
                        <div className="mt-3">
                          <p className="text-[9px] font-black text-[#a1a1a6] uppercase tracking-[0.15em] mb-2">Documento</p>
                          <p>Emesso il: <span className="text-[#1d1d1f] font-medium">{quote.date}</span></p>
                          <p>Valido per 30 giorni dalla data di emissione</p>
                        </div>
                      </div>

                      {/* Coordinate Bancarie */}
                      <div>
                        <p className="text-[9px] font-black text-[#a1a1a6] uppercase tracking-[0.15em] mb-2">Coordinate Bancarie</p>
                        {companyBankName && <p className="font-medium text-[#1d1d1f]">{companyBankName}</p>}
                        {companyBankBranch && <p>{companyBankBranch}</p>}
                        {companyAccountNumber && <div className="mt-2"><p>C/C N. <span className="text-[#1d1d1f] font-medium">{companyAccountNumber}</span></p></div>}
                        {companyIban && <p>IBAN: <span className="text-[#1d1d1f] font-mono font-medium tracking-wide">{companyIban}</span></p>}
                      </div>
                    </div>

                    <div className="mt-8 pt-4 border-t border-gray-50 text-center">
                      <p className="text-[10px] text-[#a1a1a6] tracking-wider uppercase font-medium opacity-60">
                        Documento generato dal sistema di gestione
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Footer DEFAULT - Dati ECO SOLUTION (quando personalizzati disabilitati) */}
              {!quote.companyData?.useCustom && (
                <div data-pdf-block="company-footer" className="pt-12 border-t border-gray-100 print:break-inside-avoid print:pt-6">
                  
                  <div className="flex items-center gap-3 mb-8 print:mb-4">
                    <img
                      src={ecoLogo}
                      alt="Eco Solution Logo"
                      className="w-12 h-12 object-contain rounded-lg opacity-80"
                    />
                    <div>
                      <p className="text-[13px] font-bold text-[#1d1d1f] uppercase tracking-tight">
                        ECO SOLUTION S.a.s.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[11px] text-[#86868b] leading-[1.7]">
                    {/* Sedi */}
                    <div>
                      <p className="text-[9px] font-black text-[#a1a1a6] uppercase tracking-[0.15em] mb-2">Sede Legale</p>
                      <p>Via Primo Maggio, 3</p>
                      <p>23892 Bulciago (LC)</p>
                      <div className="mt-3">
                        <p className="text-[9px] font-black text-[#a1a1a6] uppercase tracking-[0.15em] mb-2">Sede Operativa</p>
                        <p>Via Roma, 8</p>
                        <p>20823 Lentate sul Seveso (MB)</p>
                      </div>
                    </div>

                    {/* Dati Fiscali */}
                    <div>
                      <p className="text-[9px] font-black text-[#a1a1a6] uppercase tracking-[0.15em] mb-2">Dati Fiscali</p>
                      <p>Partita IVA: <span className="text-[#1d1d1f] font-medium">04640600161</span></p>
                      <p>Codice Fiscale: <span className="text-[#1d1d1f] font-medium">04640600161</span></p>
                      <p>Codice SDI: <span className="text-[#1d1d1f] font-medium">T9K4ZHO</span></p>
                      <div className="mt-3">
                        <p className="text-[9px] font-black text-[#a1a1a6] uppercase tracking-[0.15em] mb-2">Documento</p>
                        <p>Emesso il: <span className="text-[#1d1d1f] font-medium">{quote.date}</span></p>
                        <p>Valido per 30 giorni dalla data di emissione</p>
                      </div>
                    </div>

                    {/* Coordinate Bancarie */}
                    <div>
                      <p className="text-[9px] font-black text-[#a1a1a6] uppercase tracking-[0.15em] mb-2">Coordinate Bancarie</p>
                      <p className="font-medium text-[#1d1d1f]">Banca di Credito Cooperativo di Barlassina</p>
                      <p>Filiale di Lentate sul Seveso (MB)</p>
                      <p>Via Papa Giovanni XXIII, 6</p>
                      <p>20823 Lentate sul Seveso (MB)</p>
                      <div className="mt-2">
                        <p>C/C N. <span className="text-[#1d1d1f] font-medium">06/605276</span></p>
                        <p>IBAN: <span className="text-[#1d1d1f] font-mono font-medium tracking-wide">IT29 L083 7433 2400 0000 6605 276</span></p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-4 border-t border-gray-50 text-center">
                    <p className="text-[10px] text-[#a1a1a6] tracking-wider uppercase font-medium opacity-60">
                      Documento generato dal sistema di gestione ECO SOLUTION S.a.s.
                    </p>
                  </div>
                </div>
              )}

            </div>
          </div>
        </footer>

      </main>

      <div className="max-w-[960px] mx-auto mt-8 px-6 text-center space-y-4 print:hidden">
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button
            onClick={handleDownloadPreventivo}
            className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-[#1d1d1f] text-white text-[15px] font-semibold rounded-xl hover:bg-[#333] transition-all shadow-lg shadow-black/10"
          >
            <Download size={18} />
            Scarica Preventivo
          </button>

        </div>
        <p className="text-[12px] text-gray-400 font-medium tracking-tight">
          Documento creato con il sistema di gestione interno di Eco Solution S.a.s. Sviluppato e mantenuto da Thomas.
        </p>
      </div>
    </div>
  );
}