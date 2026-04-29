import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { MapPin, Check, User, Calendar, FileText, Download } from 'lucide-react';

// Logo aziendale
import ecoLogo from '../assets/images/eco-solutions-logo-.jpeg';

// Preset aziendali (ECO + Pro Casa Parquet + custom)
import { resolveCompanyData } from '../config/companyPresets';

// Helper per Termini e Condizioni
import { getDefaultTermsAndConditions, getCompanyDisplayName } from '../utils/defaultTermsAndConditions';

// Toolbar admin (mostrata SOLO quando adminMode=true)
import AdminToolbar from '../components/AdminToolbar';

// Componenti Custom
import QuoteSections from '../components/QuoteSections';
import WorkTimeline from '../components/WorkTimeline';
import PaymentPlan from '../components/PaymentPlan';
import TeamSection from '../components/TeamSection';
import MaterialsSection from '../components/MaterialsSection';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);
};

// Componente per renderizzare T&C con titoli grassetti/neri
function TermsAndConditionsDisplay({ text }) {
  const lines = text.split('\n');
  return (
    <div className="whitespace-pre-line">
      {lines.map((line, idx) => {
        const titleMatch = line.match(/^(\d+\.\s+[^.]+\.)/);
        if (titleMatch) {
          const title = titleMatch[1];
          const rest = line.substring(title.length);
          return (
            <div key={idx}>
              <strong className="text-[#1d1d1f]">{title}</strong>
              {rest}
            </div>
          );
        }
        return <div key={idx}>{line}</div>;
      })}
    </div>
  );
}

export default function QuotePage({ adminMode = false }) {
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

      {adminMode && (
        <div className="-mt-6 md:-mt-12 mb-6 print:hidden">
          <AdminToolbar
            quoteId={quoteId}
            clientName={quote.clientName}
            projectName={quote.projectName}
            active="preview-quote"
            hasContract={!!quote.contractData}
            onDownloadPdf={handleDownloadPreventivo}
          />
        </div>
      )}

      <main ref={printRef} className="max-w-[960px] mx-auto bg-white min-h-[1000px] shadow-[0_24px_60px_-12px_rgba(0,0,0,0.06)] sm:rounded-[32px] overflow-hidden relative print:max-w-full print:shadow-none print:rounded-none">

        {/* --- BANNER AZIENDALE ELEGANTE & RESPONSIVE --- */}
        <div data-pdf-block="banner" className="bg-white border-b border-gray-100 print:break-inside-avoid">
          
          {/* TOP ROW: Logo + Company | Preventivo */}
          <div className="px-6 md:px-24 py-6 md:py-7 flex items-center justify-between border-b border-gray-100/50">
            
            {/* SINISTRA: Logo + Company Name */}
            <div className="flex items-center gap-3 shrink-0">
              {(() => {
                const companyInfo = resolveCompanyData(quote.companyData);
                const logoSrc = companyInfo.logo || ecoLogo;
                const initials = (companyInfo.name || '?').split(/\s+/).slice(0, 2).map(s => s[0]).join('').toUpperCase();

                return (
                  <>
                    {companyInfo.logo ? (
                      <img
                        src={logoSrc}
                        alt={companyInfo.name}
                        className="w-14 h-14 md:w-16 md:h-16 object-contain rounded-[8px] border border-black/5 shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 md:w-16 md:h-16 rounded-[8px] bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-700 flex items-center justify-center text-base font-bold border border-black/5 shrink-0">
                        {initials}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h2 className="text-[16px] md:text-[17px] font-bold text-[#1d1d1f] tracking-tight leading-tight">
                        {companyInfo.name}
                      </h2>
                      {companyInfo.tagline && (
                        <p className="text-[13px] text-[#a1a1a6] font-medium">{companyInfo.tagline}</p>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>

            {/* DESTRA: Numero Preventivo con icon */}
            <div className="flex items-center gap-2.5 md:gap-3 shrink-0 pl-4 md:pl-6 border-l border-gray-200">
              <div className="text-right">
                <p className="text-[11px] md:text-[12px] font-bold text-[#86868b] uppercase tracking-[0.15em] mb-0.5">Preventivo</p>
                <p className="text-[23px] md:text-[27px] font-bold text-[#1d1d1f] tabular-nums tracking-tight">
                  #{quote.quoteNumber || quoteId.slice(-4).toUpperCase()}
                </p>
              </div>
              <div className="hidden md:flex items-center justify-center w-8 h-8 bg-blue-50 rounded-lg shrink-0">
                <FileText size={16} className="text-blue-500" />
              </div>
            </div>

          </div>

          {/* MIDDLE ROW: Company Info — unica per tutti i preset (ECO / Pro Casa / Custom) */}
          {(() => {
            const companyInfo = resolveCompanyData(quote.companyData);
            const companyAddress = [companyInfo.address, companyInfo.addressLine2].filter(Boolean).join('\n');
            const companyPhone = companyInfo.phone;
            const companyEmail = companyInfo.email;
            const companyVatId = companyInfo.vatId;
            const companySdi = companyInfo.sdi;
            const companyWebsite = companyInfo.website;

            return (
              <div className="px-6 md:px-24 py-5 md:py-6 border-b border-gray-100/50 bg-gray-50/30">

                {/* DESKTOP */}
                <div className="hidden md:flex items-center justify-between gap-10">

                  {companyAddress && (
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-[#86868b] uppercase tracking-[0.15em] mb-1">Sede Operativa</p>
                      <p className="text-[13px] text-[#1d1d1f] font-medium leading-tight whitespace-pre-line">{companyAddress}</p>
                    </div>
                  )}

                  {(companyPhone || companyEmail) && (
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-[#86868b] uppercase tracking-[0.15em] mb-1">Contatti</p>
                      <div className="space-y-0.5">
                        {companyPhone && (
                          <a href={`tel:${companyPhone.replace(/\s/g, '')}`} className="block text-[13px] text-blue-600 font-medium hover:text-blue-700 transition-colors underline decoration-blue-600 decoration-1 underline-offset-2">
                            {companyPhone}
                          </a>
                        )}
                        {companyEmail && (
                          <a href={`mailto:${companyEmail}`} className="block text-[13px] text-blue-600 font-medium hover:text-blue-700 transition-colors underline decoration-blue-600 decoration-1 underline-offset-2">
                            {companyEmail}
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-[#86868b] uppercase tracking-[0.15em] mb-1">Emissione</p>
                    <p className="text-[13px] text-[#1d1d1f] font-medium">{quote.date}</p>
                    <p className="text-[12px] text-[#a1a1a6]">Valido 30 giorni</p>
                  </div>

                  {companyVatId && (
                    <div className="flex-1 min-w-0 text-right">
                      <p className="text-[11px] font-bold text-[#86868b] uppercase tracking-[0.15em] mb-1">P.IVA</p>
                      <p className="text-[13px] text-[#1d1d1f] font-medium">{companyVatId}</p>
                      {companySdi && <p className="text-[12px] text-[#a1a1a6]">SDI {companySdi}</p>}
                    </div>
                  )}
                </div>

                {/* MOBILE */}
                <div className="md:hidden flex items-stretch gap-6">
                  <div className="flex-1 min-w-0 flex flex-col gap-4">
                    {companyAddress && (
                      <div className="min-h-[52px]">
                        <p className="text-[11px] font-bold text-[#86868b] uppercase tracking-[0.15em] mb-1">Sede Operativa</p>
                        <p className="text-[14px] text-[#1d1d1f] font-medium leading-tight whitespace-pre-line">{companyAddress}</p>
                      </div>
                    )}
                    {companyVatId && (
                      <div>
                        <p className="text-[11px] font-bold text-[#86868b] uppercase tracking-[0.15em] mb-1">P.IVA</p>
                        <p className="text-[14px] text-[#1d1d1f] font-medium">{companyVatId}</p>
                        {companySdi && <p className="text-[13px] text-[#a1a1a6] leading-tight">SDI {companySdi}</p>}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col gap-4 text-right">
                    {(companyPhone || companyEmail) && (
                      <div className="min-h-[52px]">
                        <p className="text-[11px] font-bold text-[#86868b] uppercase tracking-[0.15em] mb-1">Contatti</p>
                        {companyPhone && (
                          <a href={`tel:${companyPhone.replace(/\s/g, '')}`} className="block text-[14px] text-blue-600 font-medium underline decoration-blue-600 decoration-1 underline-offset-2">
                            {companyPhone}
                          </a>
                        )}
                        {companyEmail && (
                          <a href={`mailto:${companyEmail}`} className="block text-[14px] text-blue-600 font-medium underline decoration-blue-600 decoration-1 underline-offset-2 break-all">
                            {companyEmail}
                          </a>
                        )}
                      </div>
                    )}
                    <div>
                      <p className="text-[11px] font-bold text-[#86868b] uppercase tracking-[0.15em] mb-1">Emissione</p>
                      <p className="text-[14px] text-[#1d1d1f] font-medium">{quote.date}</p>
                      <p className="text-[13px] text-[#a1a1a6] leading-tight">Valido 30 giorni</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* BOTTOM ROW: Validity info — Desktop only */}
          <div className="hidden md:block px-24 py-4 text-right">
            <p className="text-[12px] text-[#86868b] font-medium">
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
                <div className="w-[180px] flex items-center gap-2 text-[17px] text-gray-500 shrink-0">
                  <User size={16} className="text-gray-400 opacity-80" />
                  <span>Cliente</span>
                </div>
                <div className="flex-1 flex items-center">
                  <div className="inline-flex items-center gap-2 pl-1 pr-3 py-1 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50 transition-colors cursor-default">
                    <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-[12px] font-bold uppercase">
                      {quote.clientName ? quote.clientName.charAt(0) : 'C'}
                    </div>
                    <span className="text-[16px] font-medium text-gray-700">{quote.clientName}</span>
                  </div>
                </div>
              </div>

              <div className="group flex items-center min-h-[34px] py-1 px-2 -mx-2 hover:bg-gray-100/50 rounded-md transition-colors">
                <div className="w-[180px] flex items-center gap-2 text-[17px] text-gray-500 shrink-0">
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
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[16px] font-medium border ${style.bg} ${style.text} ${style.border}`}>
                        <div className={`w-2 h-2 rounded-full animate-pulse ${style.dot}`} />
                        {quote.statusText || "In elaborazione"}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {quote.estimatedStart && (
                <div className="group flex items-center min-h-[34px] py-1 px-2 -mx-2 hover:bg-gray-100/50 rounded-md transition-colors">
                  <div className="w-[180px] flex items-center gap-2 text-[17px] text-gray-500 shrink-0">
                    <Calendar size={16} className="text-gray-400 opacity-80" />
                    <span>Inizio Previsto</span>
                  </div>
                  <div className="flex-1 flex items-center">
                    <span className="text-[17px] text-[#1d1d1f]">{quote.estimatedStart}</span>
                  </div>
                </div>
              )}

              <div className="group flex items-center min-h-[34px] py-1 px-2 -mx-2 hover:bg-gray-100/50 rounded-md transition-colors">
                <div className="w-[180px] flex items-center gap-2 text-[17px] text-gray-500 shrink-0">
                  <Calendar size={16} className="text-gray-400 opacity-80" />
                  <span>Durata</span>
                </div>
                <div className="flex-1 flex items-center">
                  <span className="text-[17px] text-[#1d1d1f] hover:text-black cursor-default">{displayDuration} di lavoro previsto</span>
                </div>
              </div>

              <div className="group flex items-center min-h-[34px] py-1 px-2 -mx-2 hover:bg-gray-100/50 rounded-md transition-colors">
                <div className="w-[180px] flex items-center gap-2 text-[17px] text-gray-500 shrink-0">
                  <MapPin size={16} className="text-gray-400 opacity-80" />
                  <span>Luogo</span>
                </div>
                <div className="flex-1 flex items-center">
                  <span className="text-[17px] text-[#1d1d1f] underline decoration-gray-300 decoration-1 underline-offset-2 hover:decoration-gray-400 cursor-pointer">{quote.address || "Milano, IT"}</span>
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
                <h3 data-pdf-block="riepilogo-header" className="text-[14px] font-black text-[#86868b] uppercase tracking-[0.2em] mb-6">
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
                            <p className="text-[16px] text-[#86868b] font-medium leading-snug">
                              {section.title}
                            </p>
                          </div>
                          {/* Right: price + quantity */}
                          <div className="shrink-0 text-right">
                            {sectionHasDiscount && (
                              <span className="text-[16px] text-[#ff3b30] line-through tabular-nums tracking-tight opacity-70 mr-2">
                                {formatCurrency(sectionOriginalTotal)}
                              </span>
                            )}
                            <span className="text-[19px] text-[#1d1d1f] font-bold tabular-nums tracking-tight">
                              {formatCurrency(sectionTotal)}
                            </span>
                            <p className="text-[14px] text-[#a1a1a6] mt-0.5 tabular-nums">
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
                  <span className="text-[20px] md:text-[22px] text-[#1d1d1f] font-bold tracking-tight">
                    Totale
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
                        <span className="text-[16px] md:text-[21px] text-[#ff3b30] line-through tabular-nums tracking-tight opacity-70 mr-3">
                          {formatCurrency(displayOriginal)}
                        </span>
                      ) : null;
                    })()}
                    <span className="text-[26px] md:text-[35px] text-[#1d1d1f] font-bold tabular-nums tracking-tight">
                      {formatCurrency(quote.summary.subtotal)}
                    </span>
                  </div>
                </div>
                {quote.summary.discountAmount > 0.01 && (
                  <p className="text-[14px] text-green-500 mt-1.5 text-right italic font-thin">
                    Sconto applicato: − {formatCurrency(quote.summary.discountAmount)}
                  </p>
                )}
                {quote.summary.vatPercentage > 0 ? (
                  <>
                    <div className="flex items-baseline justify-between pt-3 mt-2 gap-4 text-[#86868b]">
                      <span className="text-[17px] font-medium">IVA {quote.summary.vatPercentage}%</span>
                      <span className="text-[18px] tabular-nums font-medium">
                        + iva {formatCurrency(quote.summary.vatAmount || (quote.summary.subtotal * quote.summary.vatPercentage / 100))}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between pt-4 mt-3 border-t border-[#e8e8ed] gap-4">
                      <span className="text-[20px] md:text-[20px] text-[#1d1d1f] font-bold tracking-tight">
                        Totale IVA inclusa
                      </span>
                      <span className="text-[28px] md:text-[29px] text-[#1d1d1f] font-black tabular-nums tracking-[-0.05em]">
                        {formatCurrency(quote.summary.totalWithVat || (quote.summary.subtotal * (1 + quote.summary.vatPercentage / 100)))}
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-[24px] text-[#86868b] mt-1.5 text-right">
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
                  <h3 className="text-[14px] font-black text-[#86868b] uppercase tracking-[0.2em] mb-5">
                    Note
                  </h3>
                  <div className="text-[17px] text-[#1d1d1f] leading-relaxed whitespace-pre-line">
                    {quote.publicNotes}
                  </div>
                </div>
              )}

              {/* --- TERMINI E CONDIZIONI --- */}
              <div data-pdf-block="termini" className="mb-20 print:mb-10 print:break-inside-avoid">
                <h3 className="text-[14px] font-black text-[#86868b] uppercase tracking-[0.2em] mb-5">
                  Termini e Condizioni
                </h3>
                <div className="text-[15px] text-[#86868b] leading-[1.8] space-y-3">
                  {quote.termsAndConditions ? (
                    <TermsAndConditionsDisplay text={quote.termsAndConditions} />
                  ) : (
                    <TermsAndConditionsDisplay text={getDefaultTermsAndConditions(getCompanyDisplayName(quote.companyData))} />
                  )}
                </div>
              </div>

              {/* --- ACCETTAZIONE E FIRMA --- */}
              <div data-pdf-block="firma" className="mb-20 print:mb-10 print:break-inside-avoid">
                <h3 className="text-[14px] font-black text-[#86868b] uppercase tracking-[0.2em] mb-8">
                  Accettazione e Firma
                </h3>
                
                <p className="text-[16px] text-[#1d1d1f] leading-relaxed mb-10">
                  Il/La sottoscritto/a dichiara di aver preso visione del presente preventivo e di accettarne integralmente i termini, le condizioni e gli importi indicati.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  {/* Firma Committente */}
                  <div>
                    <p className="text-[13px] font-bold text-[#86868b] uppercase tracking-[0.15em] mb-3">Il Committente</p>
                    <div className="border-b border-[#1d1d1f]/20 pb-1 mb-2 min-h-[60px]"></div>
                    <p className="text-[14px] text-[#a1a1a6]">Nome, Cognome e Firma</p>
                  </div>

                  {/* Firma Eco Solution */}
                  <div>
                    <p className="text-[13px] font-bold text-[#86868b] uppercase tracking-[0.15em] mb-3">Per {getCompanyDisplayName(quote.companyData)}</p>
                    <div className="border-b border-[#1d1d1f]/20 pb-1 mb-2 min-h-[60px]"></div>
                    <p className="text-[14px] text-[#a1a1a6]">Timbro e Firma</p>
                  </div>
                </div>

                <div className="mt-8 flex items-center gap-4">
                  <div>
                    <p className="text-[13px] font-bold text-[#86868b] uppercase tracking-[0.15em] mb-2">Data</p>
                    <div className="border-b border-[#1d1d1f]/20 w-48 pb-1 mb-2 min-h-[24px]"></div>
                  </div>
                  <div className="ml-auto">
                    <p className="text-[13px] font-bold text-[#86868b] uppercase tracking-[0.15em] mb-2">Luogo</p>
                    <div className="border-b border-[#1d1d1f]/20 w-48 pb-1 mb-2 min-h-[24px]"></div>
                  </div>
                </div>
              </div>

              {/* 4. DATI AZIENDALI E COORDINATE BANCARIE — unificato per tutti i preset */}
              {(() => {
                const c = resolveCompanyData(quote.companyData);
                const sedeOperativa = [c.address, c.addressLine2].filter(Boolean).join('\n');
                const hasContacts = c.phone || c.email || c.website;
                const hasFiscal = c.vatId || c.taxId || c.sdi;
                const hasBank = c.bankName || c.bankBranch || c.accountNumber || c.iban;

                return (
                  <div data-pdf-block="company-footer" className="pt-12 border-t border-gray-100 print:break-inside-avoid print:pt-6">

                    <div className="flex items-center gap-3 mb-8 print:mb-4">
                      {c.logo ? (
                        <img
                          src={c.logo}
                          alt={c.name}
                          className="w-12 h-12 object-contain rounded-lg opacity-80"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-700 flex items-center justify-center text-sm font-bold opacity-90">
                          {(c.name || '?').split(/\s+/).slice(0, 2).map(s => s[0]).join('').toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-[16px] font-bold text-[#1d1d1f] uppercase tracking-tight">
                          {c.name}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[14px] text-[#86868b] leading-[1.7]">
                      {/* Sedi / Contatti */}
                      <div>
                        {c.legalAddress && (
                          <div>
                            <p className="text-[12px] font-black text-[#a1a1a6] uppercase tracking-[0.15em] mb-2">Sede Legale</p>
                            <p className="whitespace-pre-line">{c.legalAddress}</p>
                          </div>
                        )}
                        {sedeOperativa && (
                          <div className={c.legalAddress ? 'mt-3' : ''}>
                            <p className="text-[12px] font-black text-[#a1a1a6] uppercase tracking-[0.15em] mb-2">
                              {c.legalAddress ? 'Sede Operativa' : 'Sede'}
                            </p>
                            <p className="whitespace-pre-line">{sedeOperativa}</p>
                          </div>
                        )}
                        {hasContacts && (
                          <div className="mt-3">
                            <p className="text-[12px] font-black text-[#a1a1a6] uppercase tracking-[0.15em] mb-2">Contatti</p>
                            {c.phone && <p>Tel: <span className="text-[#1d1d1f] font-medium">{c.phone}</span></p>}
                            {c.email && <p>Email: <span className="text-[#1d1d1f] font-medium">{c.email}</span></p>}
                            {c.website && <p>Web: <a href={c.website.startsWith('http') ? c.website : `https://${c.website}`} target="_blank" rel="noreferrer" className="text-[#1d1d1f] font-medium underline decoration-1 underline-offset-2 hover:text-[#86868b] transition-colors">{c.website}</a></p>}
                          </div>
                        )}
                      </div>

                      {/* Dati Fiscali */}
                      <div>
                        {hasFiscal && (
                          <>
                            <p className="text-[12px] font-black text-[#a1a1a6] uppercase tracking-[0.15em] mb-2">Dati Fiscali</p>
                            {c.vatId && <p>Partita IVA: <span className="text-[#1d1d1f] font-medium">{c.vatId}</span></p>}
                            {c.taxId && <p>Codice Fiscale: <span className="text-[#1d1d1f] font-medium">{c.taxId}</span></p>}
                            {c.sdi && <p>Codice SDI: <span className="text-[#1d1d1f] font-medium">{c.sdi}</span></p>}
                          </>
                        )}
                        <div className={hasFiscal ? 'mt-3' : ''}>
                          <p className="text-[12px] font-black text-[#a1a1a6] uppercase tracking-[0.15em] mb-2">Documento</p>
                          <p>Emesso il: <span className="text-[#1d1d1f] font-medium">{quote.date}</span></p>
                          <p>Valido per 30 giorni dalla data di emissione</p>
                        </div>
                      </div>

                      {/* Coordinate Bancarie */}
                      {hasBank && (
                        <div>
                          <p className="text-[12px] font-black text-[#a1a1a6] uppercase tracking-[0.15em] mb-2">Coordinate Bancarie</p>
                          {c.bankName && <p className="font-medium text-[#1d1d1f]">{c.bankName}</p>}
                          {c.bankBranch && <p className="whitespace-pre-line">{c.bankBranch}</p>}
                          {c.accountNumber && <div className="mt-2"><p>C/C N. <span className="text-[#1d1d1f] font-medium">{c.accountNumber}</span></p></div>}
                          {c.iban && <p>IBAN: <span className="text-[#1d1d1f] font-mono font-medium tracking-wide">{c.iban}</span></p>}
                        </div>
                      )}
                    </div>

                    <div className="mt-8 pt-4 border-t border-gray-50 text-center">
                      <p className="text-[13px] text-[#a1a1a6] tracking-wider uppercase font-medium opacity-60">
                        Documento generato dal sistema di gestione {c.name}
                      </p>
                    </div>
                  </div>
                );
              })()}

            </div>
          </div>
        </footer>

      </main>

      <div className="max-w-[960px] mx-auto mt-8 px-6 text-center space-y-4 print:hidden">
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button
            onClick={handleDownloadPreventivo}
            className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-[#1d1d1f] text-white text-[18px] font-semibold rounded-xl hover:bg-[#333] transition-all shadow-lg shadow-black/10"
          >
            <Download size={18} />
            Scarica Preventivo
          </button>

        </div>
        <p className="text-[15px] text-gray-400 font-medium tracking-tight">
          Documento creato con il sistema di gestione interno di Eco Solution S.a.s. Sviluppato e mantenuto da Thomas.
        </p>
      </div>
    </div>
  );
}