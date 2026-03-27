import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Download, ArrowLeft, Edit } from 'lucide-react';

import ecoLogo from '../assets/images/eco-solutions-logo-.jpeg';

const formatCurrency = (value) =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);

// ─── Same defaults as EditContractPage (fallback if contractData not yet saved) ───
const DEFAULT_ARTICLES = [
  { id: 'art-tempi', title: 'Tempi di esecuzione', body: `I lavori avranno inizio entro la data concordata tra le parti e avranno una durata presunta indicata nel preventivo di riferimento, espressa in giorni lavorativi, salvo imprevisti o cause di forza maggiore.\n\nEventuali ritardi dovuti a cause di forza maggiore, condizioni meteorologiche avverse, ritardi nella fornitura di materiali da terzi, impedimenti nell'accesso ai locali o variazioni richieste dal Committente non potranno essere imputati all'Appaltatore e comporteranno una proroga automatica dei termini.` },
  { id: 'art-obblighi-comm', title: 'Obblighi del Committente', body: `Il Committente si impegna a:\na) Garantire il libero e sicuro accesso alle aree oggetto dell'intervento per tutta la durata dei lavori;\nb) Fornire l'allacciamento alla rete elettrica e idrica ove necessario per l'esecuzione dei lavori;\nc) Sgomberare preventivamente le aree di lavoro da arredi, oggetti personali e materiali fragili;\nd) Comunicare tempestivamente eventuali impedimenti o variazioni;\ne) Provvedere, ove necessario, all'ottenimento di permessi, autorizzazioni e comunicazioni a norma di legge;\nf) Qualora nel cantiere intervengano più imprese, il Committente è tenuto a nominare il Coordinatore per la Sicurezza in fase di Progettazione e di Esecuzione ai sensi del D.Lgs. 81/2008, sollevando l'Appaltatore da tale responsabilità.\n\nEventuali danni a beni non rimossi dal Committente non saranno imputabili all'Appaltatore.` },
  { id: 'art-obblighi-app', title: "Obblighi dell'Appaltatore", body: `L'Appaltatore si impegna a:\na) Eseguire i lavori a regola d'arte, conformemente alle normative vigenti e agli standard tecnici applicabili;\nb) Utilizzare materiali di qualità conforme a quanto indicato nel preventivo;\nc) Rispettare le norme di sicurezza sul lavoro (D.Lgs. 81/2008);\nd) Mantenere in ordine e pulite le aree di lavoro durante e al termine dell'intervento;\ne) Comunicare tempestivamente eventuali problematiche o ritardi nell'esecuzione.` },
  { id: 'art-variazioni', title: "Variazioni in corso d'opera", body: `Eventuali variazioni, integrazioni o lavorazioni aggiuntive rispetto a quanto descritto nel presente contratto e nel preventivo di riferimento dovranno essere concordate per iscritto tra le parti prima della loro esecuzione.\n\nLe variazioni comporteranno un adeguamento proporzionale dei costi e dei tempi di consegna, che sarà formalizzato mediante addendum al presente contratto.` },
  { id: 'art-garanzia', title: 'Garanzia', body: `L'Appaltatore garantisce la corretta esecuzione delle opere a regola d'arte, conformemente alle normative vigenti. La garanzia sui lavori eseguiti ha durata di 24 (ventiquattro) mesi dalla data di fine lavori, salvo diverso accordo scritto.\n\nLa garanzia non copre difetti derivanti da uso improprio, mancata manutenzione ordinaria, interventi di terzi non autorizzati, o eventi di forza maggiore.\n\nSono esclusi dalla garanzia i normali fenomeni di assestamento, ritiro e movimenti naturali dei materiali.` },
  { id: 'art-responsabilita', title: 'Responsabilità e assicurazione', body: `L'Appaltatore è coperto da polizza assicurativa di responsabilità civile per danni a terzi derivanti dall'esecuzione dei lavori. Resta esclusa ogni responsabilità per danni preesistenti o non direttamente riconducibili alle opere oggetto del presente contratto.` },
  { id: 'art-smaltimento', title: 'Smaltimento materiali', body: `Lo smaltimento dei materiali di risulta è incluso nel corrispettivo solo se espressamente indicato nelle singole voci del preventivo. In caso contrario, lo smaltimento sarà a carico del Committente.` },
  { id: 'art-recesso', title: 'Risoluzione e recesso', body: `Ciascuna parte potrà recedere dal presente contratto con comunicazione scritta inviata all'altra parte con un preavviso di almeno 15 (quindici) giorni.\n\nIn caso di recesso unilaterale da parte del Committente dopo l'accettazione, l'Appaltatore avrà diritto al pagamento dei lavori già eseguiti, dei materiali già acquistati e di un indennizzo pari al 20% dell'importo residuo non eseguito.\n\nL'Appaltatore potrà risolvere il contratto in caso di morosità del Committente superiore a 30 giorni dalla scadenza di qualsivoglia rata, previa diffida scritta.` },
  { id: 'art-privacy', title: 'Trattamento dei dati personali', body: `Le parti si impegnano reciprocamente al trattamento dei dati personali in conformità al Regolamento UE 2016/679 (GDPR). I dati raccolti saranno utilizzati esclusivamente per le finalità connesse all'esecuzione del presente contratto e degli obblighi di legge.` },
  { id: 'art-foro', title: 'Foro competente', body: `Per qualsiasi controversia derivante dall'interpretazione o dall'esecuzione del presente contratto, sarà competente in via esclusiva il Foro del luogo di residenza o domicilio del Committente, ai sensi dell'art. 33, comma 2, lettera u) del D.Lgs. 206/2005 (Codice del Consumo).` },
  { id: 'art-finali', title: 'Disposizioni finali', body: `Il presente contratto, unitamente al Preventivo allegato, costituisce l'accordo completo tra le parti in relazione all'oggetto dello stesso e sostituisce ogni precedente accordo o intesa, orale o scritta.\n\nEventuali modifiche o integrazioni al presente contratto dovranno essere stipulate per iscritto e sottoscritte da entrambe le parti.\n\nPer quanto non espressamente previsto dal presente contratto, si applicano le disposizioni del Codice Civile in materia di appalto (artt. 1655 e ss. c.c.) e le normative vigenti in materia.` },
];

// Articles whose clauses require double-signature under Art. 1341/1342 C.C.
const VESSATORIE_IDS = ['art-garanzia', 'art-recesso'];

export default function ContractPage() {
  const { quoteId } = useParams();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const docRef = doc(db, "preventivi", quoteId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setQuote(docSnap.data());
      } catch (error) {
        console.error("Errore download contratto:", error);
      } finally {
        setLoading(false);
      }
    };
    if (quoteId) fetchQuote();
  }, [quoteId]);

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `Contratto ${quote.clientName || 'Cliente'} - EcoSolution`;
    window.print();
    setTimeout(() => { document.title = originalTitle; }, 1000);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[#86868b] text-sm">Caricamento contratto...</div>;
  if (!quote) return <div className="min-h-screen flex items-center justify-center text-[#86868b] text-sm">Contratto non trovato.</div>;

  // ─── Read contractData (or use defaults) ───
  const cd = quote.contractData || {};
  const vatRate = cd.vatRate ?? 10;
  const articles = cd.articles?.length ? cd.articles : DEFAULT_ARTICLES;

  const contractNumber = quote.quoteNumber || quoteId.slice(-4).toUpperCase();
  const netto = quote.summary?.subtotal || quote.summary?.total || 0;
  const ivaAmount = netto * (vatRate / 100);
  const lordo = netto + ivaAmount;

  const premesseText = cd.premesseText ||
    `Con il presente contratto, il Committente affida all'Appaltatore — e quest'ultimo accetta — l'esecuzione dei lavori descritti nel progetto denominato "${quote.projectName}", da eseguirsi presso: ${quote.address || 'indirizzo da definire'}.\n\nIl presente contratto è redatto sulla base del Preventivo n. #${contractNumber} del ${quote.date}, che le parti dichiarano di conoscere e accettare integralmente e che costituisce parte integrante del presente accordo.`;

  const corrispettivoText = cd.corrispettivoText ||
    `Eventuali variazioni in corso d'opera, concordate per iscritto tra le parti, comporteranno un adeguamento proporzionale del corrispettivo e dei tempi di esecuzione.`;

  const pagamentiText = cd.pagamentiText ||
    `I pagamenti dovranno essere effettuati a mezzo bonifico bancario sulle coordinate indicate in calce al presente contratto. In caso di mancato o ritardato pagamento, l'Appaltatore si riserva il diritto di sospendere l'esecuzione dei lavori e di applicare gli interessi moratori previsti dal D.Lgs. 231/2002.`;

  // Article numbering: Art.1 (lavori), Art.2 (corrispettivo), Art.3 (pagamenti), then Art.4+ from articles array
  const artOffset = 4;

  // Identify vessatorie articles for double-signature reference
  const vessatorieRefs = articles
    .map((art, idx) => ({ ...art, artNum: artOffset + idx }))
    .filter(a => VESSATORIE_IDS.includes(a.id));

  return (
    <div className="min-h-screen font-sans selection:bg-[#cce9ff] pb-20 pt-6 md:pt-12 overflow-x-hidden print:pt-0 print:pb-0 print:bg-white bg-[#f5f5f7]">

      {/* ─── Navigation bar (hidden on print) ─── */}
      <div className="max-w-[800px] mx-auto mb-4 px-6 print:hidden flex items-center justify-between">
        <Link to={`/quote/${quoteId}`} className="inline-flex items-center gap-1.5 text-[13px] text-[#86868b] hover:text-[#1d1d1f] transition-colors font-medium">
          <ArrowLeft size={14} />
          Torna al preventivo
        </Link>
        <Link 
          to={`/admin/contract/${quoteId}/edit`}
          className="inline-flex items-center gap-1.5 text-[13px] text-blue-600 hover:text-blue-700 transition-colors font-medium"
        >
          <Edit size={14} />
          Modifica contratto
        </Link>
      </div>

      <main className="max-w-[800px] mx-auto bg-white min-h-[1000px] shadow-[0_24px_60px_-12px_rgba(0,0,0,0.06)] sm:rounded-[24px] overflow-hidden relative print:max-w-full print:shadow-none print:rounded-none">

        {/* ═══════════════════════════════════════════
            INTESTAZIONE CONTRATTO
        ═══════════════════════════════════════════ */}
        <div data-pdf-block="contract-header" className="px-12 md:px-16 pt-14 pb-10 border-b border-gray-100">
          
          <div className="flex items-start justify-between gap-6 mb-10">
            <div className="flex items-center gap-4">
              <img src={ecoLogo} alt="Eco Solution" className="w-14 h-14 object-contain rounded-lg border border-black/5" />
              <div>
                <h2 className="text-[15px] font-bold text-[#1d1d1f] tracking-tight leading-tight uppercase">ECO SOLUTION S.a.s.</h2>
                <p className="text-[11px] text-[#a1a1a6] font-medium mt-0.5">Impresa Edile</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[9px] font-bold text-[#86868b] uppercase tracking-[0.15em] mb-1">Contratto N.</p>
              <p className="text-[22px] font-bold text-[#1d1d1f] tabular-nums tracking-tight">#{contractNumber}</p>
            </div>
          </div>

          <div className="text-center mb-10">
            <h1 className="text-[22px] md:text-[26px] font-bold text-[#1d1d1f] tracking-tight uppercase">Contratto di Appalto</h1>
            <p className="text-[13px] text-[#86868b] mt-2 font-medium">per l'esecuzione di lavori edili</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-[#fafafa] rounded-2xl p-6">
              <p className="text-[9px] font-black text-[#a1a1a6] uppercase tracking-[0.15em] mb-3">Appaltatore</p>
              <p className="text-[14px] font-bold text-[#1d1d1f]">ECO SOLUTION S.a.s.</p>
              <div className="text-[12px] text-[#86868b] leading-[1.8] mt-2">
                <p>Sede Legale: Via Primo Maggio, 3 — 23892 Bulciago (LC)</p>
                <p>Sede Operativa: Via Roma, 8 — 20823 Lentate sul Seveso (MB)</p>
                <p>P.IVA / C.F.: 04640600161</p>
                <p>Tel: +39 334 222 1212</p>
                <p>Email: info@ecosolutionsas.it</p>
              </div>
            </div>
            <div className="bg-[#fafafa] rounded-2xl p-6">
              <p className="text-[9px] font-black text-[#a1a1a6] uppercase tracking-[0.15em] mb-3">Committente</p>
              <p className="text-[14px] font-bold text-[#1d1d1f]">{quote.clientName || '—'}</p>
              <div className="text-[12px] text-[#86868b] leading-[1.8] mt-2">
                {quote.address && <p>Indirizzo lavori: {quote.address}</p>}
                <div className="mt-3 space-y-2.5">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[11px] font-semibold text-[#1d1d1f] shrink-0">C.F.*</span>
                    <div className="flex-1 border-b border-[#1d1d1f]/30 pb-0.5 min-h-[18px]"></div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[11px] text-[#86868b] shrink-0">P.IVA</span>
                    <div className="flex-1 border-b border-dashed border-gray-200 pb-0.5 min-h-[18px]"></div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[11px] text-[#86868b] shrink-0">Residenza</span>
                    <div className="flex-1 border-b border-dashed border-gray-200 pb-0.5 min-h-[18px]"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[11px] text-[#86868b] shrink-0">Tel</span>
                      <div className="flex-1 border-b border-dashed border-gray-200 pb-0.5 min-h-[18px]"></div>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-[11px] text-[#86868b] shrink-0">Email</span>
                      <div className="flex-1 border-b border-dashed border-gray-200 pb-0.5 min-h-[18px]"></div>
                    </div>
                  </div>
                </div>
                <p className="text-[9px] text-[#a1a1a6] mt-2 italic">* Campo obbligatorio ai fini della fatturazione e delle detrazioni fiscali</p>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ PREMESSE ═══ */}
        <div data-pdf-block="premesse" className="px-12 md:px-16 py-10 border-b border-gray-100">
          <h3 className="text-[11px] font-black text-[#86868b] uppercase tracking-[0.2em] mb-5">Premesse</h3>
          <div className="text-[13px] text-[#1d1d1f] leading-[1.9] whitespace-pre-line">{premesseText}</div>
        </div>

        {/* ═══ ART. 1 — OGGETTO DEI LAVORI (Dettagliato) ═══ */}
        <div data-pdf-block="art-1-lavori" className="px-12 md:px-16 py-10 border-b border-gray-100">
          <h3 className="text-[11px] font-black text-[#86868b] uppercase tracking-[0.2em] mb-5">Art. 1 — Oggetto dei lavori</h3>
          <p className="text-[13px] text-[#1d1d1f] leading-[1.9] mb-8">
            L'Appaltatore si impegna ad eseguire a regola d'arte le seguenti lavorazioni:
          </p>

          <div className="space-y-8">
            {quote.sections?.map((section, sIdx) => {
              const sectionTotal = section.items?.reduce((a, i) => a + ((parseFloat(i.price) || 0) * (parseFloat(i.quantity) || 0)), 0) || 0;
              return (
                <div key={section.id || sIdx} data-pdf-block={`lavori-${sIdx}`}>
                  {/* ── Section header ── */}
                  <div>
                    <div className="flex items-baseline justify-between gap-6">
                      <h4 className="text-[14px] font-semibold text-[#1d1d1f] tracking-tight leading-snug">
                        <span className="text-[12px] text-[#c7c7cc] font-medium tabular-nums mr-2">{String(sIdx + 1).padStart(2, '0')}</span>
                        {section.title}
                      </h4>
                      <span className="text-[14px] font-bold text-[#1d1d1f] tabular-nums tracking-tight shrink-0">
                        {formatCurrency(sectionTotal)}
                      </span>
                    </div>
                    {section.description && (
                      <p className="text-[11px] text-[#a1a1a6] leading-[1.7] mt-1.5 ml-7">
                        {section.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Riepilogo totali con IVA ── */}
          <div data-pdf-block="totali-iva" className="mt-10 pt-5 border-t-[1.5px] border-[#1d1d1f]/10">
            <div className="flex items-baseline justify-between py-[6px]">
              <span className="text-[11px] text-[#86868b] font-medium tracking-wide uppercase">Imponibile</span>
              <span className="text-[14px] text-[#1d1d1f] font-semibold tabular-nums tracking-tight">{formatCurrency(netto)}</span>
            </div>
            <div className="flex items-baseline justify-between py-[6px]">
              <span className="text-[11px] text-[#86868b] font-medium tracking-wide uppercase">IVA ({vatRate}%)</span>
              <span className="text-[14px] text-[#1d1d1f] font-semibold tabular-nums tracking-tight">{formatCurrency(ivaAmount)}</span>
            </div>
            <div className="flex items-baseline justify-between pt-4 mt-2 border-t border-[#1d1d1f]/10">
              <span className="text-[13px] text-[#1d1d1f] font-bold uppercase tracking-tight">Totale Complessivo</span>
              <span className="text-[22px] text-[#1d1d1f] font-bold tabular-nums tracking-tight">{formatCurrency(lordo)}</span>
            </div>
          </div>
        </div>

        {/* ═══ ART. 2 — CORRISPETTIVO ═══ */}
        <div data-pdf-block="art-2-corrispettivo" className="px-12 md:px-16 py-10 border-b border-gray-100">
          <h3 className="text-[11px] font-black text-[#86868b] uppercase tracking-[0.2em] mb-5">Art. 2 — Corrispettivo</h3>
          <div className="text-[13px] text-[#1d1d1f] leading-[1.9]">
            <p>
              Il corrispettivo complessivo per l'esecuzione delle opere di cui all'Art. 1 è stabilito 
              in <strong>{formatCurrency(netto)}</strong> (imponibile) oltre IVA al {vatRate}% pari 
              a <strong>{formatCurrency(ivaAmount)}</strong>, per un totale 
              di <strong>{formatCurrency(lordo)}</strong>.
            </p>
            {corrispettivoText && (
              <div className="mt-3 whitespace-pre-line">{corrispettivoText}</div>
            )}
          </div>
        </div>

        {/* ═══ ART. 3 — MODALITÀ DI PAGAMENTO ═══ */}
        <div data-pdf-block="art-3-pagamenti" className="px-12 md:px-16 py-10 border-b border-gray-100">
          <h3 className="text-[11px] font-black text-[#86868b] uppercase tracking-[0.2em] mb-5">Art. 3 — Modalità di pagamento</h3>
          <p className="text-[13px] text-[#1d1d1f] leading-[1.9] mb-6">
            Il pagamento del corrispettivo avverrà secondo il seguente piano:
          </p>

          {quote.paymentPlan && quote.paymentPlan.length > 0 ? (
            <div className="rounded-2xl border border-[#e8e8ed] overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-5 py-3 bg-[#fafafa] border-b border-[#e8e8ed]">
                <span className="text-[9px] font-black text-[#a1a1a6] uppercase tracking-[0.12em]">Descrizione</span>
                <span className="text-[9px] font-black text-[#a1a1a6] uppercase tracking-[0.12em] text-right w-14">Quota</span>
                <span className="text-[9px] font-black text-[#a1a1a6] uppercase tracking-[0.12em] text-right w-24">Importo</span>
              </div>
              {/* Rows */}
              {quote.paymentPlan.map((p, idx) => (
                <div key={idx} data-pdf-block={`contract-payment-${idx}`} className={`grid grid-cols-[1fr_auto_auto] gap-4 px-5 py-4 items-baseline ${idx < quote.paymentPlan.length - 1 ? 'border-b border-[#f0f0f3]' : ''}`}>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-[#1d1d1f] leading-snug">{p.label}</p>
                    {p.dueDate && <p className="text-[11px] text-[#a1a1a6] mt-0.5">{p.dueDate}</p>}
                  </div>
                  <span className="text-[11px] text-[#86868b] tabular-nums text-right w-14 shrink-0">
                    {p.percentage ? `${p.percentage}%` : '—'}
                  </span>
                  <span className="text-[14px] font-bold text-[#1d1d1f] tabular-nums tracking-tight text-right w-24 shrink-0">
                    {formatCurrency(p.amount)}
                  </span>
                </div>
              ))}
              {/* Total row */}
              <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-5 py-3.5 bg-[#fafafa] border-t border-[#e8e8ed]">
                <span className="text-[12px] font-bold text-[#1d1d1f] uppercase tracking-tight">Totale</span>
                <span className="text-[11px] text-[#86868b] tabular-nums text-right w-14">100%</span>
                <span className="text-[14px] font-bold text-[#1d1d1f] tabular-nums tracking-tight text-right w-24">{formatCurrency(netto)}</span>
              </div>
            </div>
          ) : (
            <p className="text-[13px] text-[#86868b] italic">
              Le modalità di pagamento saranno concordate separatamente tra le parti.
            </p>
          )}

          {pagamentiText && (
            <div className="mt-6 text-[13px] text-[#1d1d1f] leading-[1.9] whitespace-pre-line">
              {pagamentiText}
            </div>
          )}
        </div>

        {/* ═══ ARTICOLI DINAMICI (Art. 4, 5, 6...) ═══ */}
        {articles.map((art, idx) => (
          <div key={art.id} data-pdf-block={`art-${artOffset + idx}`} className="px-12 md:px-16 py-10 border-b border-gray-100">
            <h3 className="text-[11px] font-black text-[#86868b] uppercase tracking-[0.2em] mb-5">
              Art. {artOffset + idx} — {art.title}
            </h3>
            <div className="text-[13px] text-[#1d1d1f] leading-[1.9] whitespace-pre-line">
              {art.body}
            </div>
          </div>
        ))}

        {/* ═══ FIRME ═══ */}
        <div data-pdf-block="firme" className="px-12 md:px-16 py-14">
          <h3 className="text-[11px] font-black text-[#86868b] uppercase tracking-[0.2em] mb-5">Sottoscrizione del contratto</h3>
          <p className="text-[13px] text-[#1d1d1f] leading-[1.9] mb-10">
            Le parti dichiarano di aver letto, compreso e accettato integralmente tutte le clausole del presente contratto.
            In fede, si sottoscrive in duplice copia originale.
          </p>

          <div className="flex items-center gap-8 mb-12">
            <div>
              <p className="text-[9px] font-black text-[#a1a1a6] uppercase tracking-[0.15em] mb-2">Luogo</p>
              <div className="border-b border-[#1d1d1f]/20 w-52 pb-1 min-h-[28px]"></div>
            </div>
            <div>
              <p className="text-[9px] font-black text-[#a1a1a6] uppercase tracking-[0.15em] mb-2">Data</p>
              <div className="border-b border-[#1d1d1f]/20 w-52 pb-1 min-h-[28px]"></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <p className="text-[9px] font-black text-[#a1a1a6] uppercase tracking-[0.15em] mb-3">Il Committente</p>
              <div className="border border-gray-100 rounded-xl bg-[#fafafa] min-h-[100px] mb-3 p-4">
                <p className="text-[11px] text-[#a1a1a6] italic">Firma per accettazione</p>
              </div>
              <div className="border-b border-[#1d1d1f]/20 pb-1 mb-1.5"></div>
              <p className="text-[10px] text-[#a1a1a6]">{quote.clientName || 'Nome e Cognome'}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-[#a1a1a6] uppercase tracking-[0.15em] mb-3">Per ECO SOLUTION S.a.s.</p>
              <div className="border border-gray-100 rounded-xl bg-[#fafafa] min-h-[100px] mb-3 p-4">
                <p className="text-[11px] text-[#a1a1a6] italic">Timbro e firma</p>
              </div>
              <div className="border-b border-[#1d1d1f]/20 pb-1 mb-1.5"></div>
              <p className="text-[10px] text-[#a1a1a6]">Il Legale Rappresentante</p>
            </div>
          </div>
        </div>

        {/* ═══ CLAUSOLE VESSATORIE — DOPPIA FIRMA (Artt. 1341-1342 C.C.) ═══ */}
        <div data-pdf-block="clausole-vessatorie" className="px-12 md:px-16 py-12 border-t border-gray-100 bg-[#fafafa]">
          <h3 className="text-[11px] font-black text-[#86868b] uppercase tracking-[0.2em] mb-4">
            Approvazione specifica ai sensi degli Artt. 1341 e 1342 C.C.
          </h3>
          <div className="text-[12px] text-[#1d1d1f] leading-[1.9] mb-8">
            <p className="mb-3">
              Il Committente dichiara di aver letto, compreso e di approvare specificamente, ai sensi e per gli effetti degli Artt. 1341 e 1342 del Codice Civile, le seguenti clausole del presente contratto:
            </p>
            <ul className="list-disc list-inside space-y-1 text-[12px] text-[#424245]">
              {vessatorieRefs.length > 0 ? (
                vessatorieRefs.map(a => (
                  <li key={a.id}><strong>Art. {a.artNum}</strong> — {a.title}</li>
                ))
              ) : (
                <>
                  <li><strong>Garanzia</strong> — limitazioni della copertura</li>
                  <li><strong>Risoluzione e recesso</strong> — indennizzo del 20% in caso di recesso</li>
                </>
              )}
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <p className="text-[9px] font-black text-[#a1a1a6] uppercase tracking-[0.15em] mb-3">Il Committente — Firma per approvazione specifica</p>
              <div className="border border-gray-200 rounded-xl bg-white min-h-[80px] mb-3 p-4">
                <p className="text-[11px] text-[#a1a1a6] italic">Seconda firma obbligatoria</p>
              </div>
              <div className="border-b border-[#1d1d1f]/20 pb-1 mb-1.5"></div>
              <p className="text-[10px] text-[#a1a1a6]">{quote.clientName || 'Nome e Cognome'}</p>
            </div>
            <div className="flex items-end pb-6">
              <p className="text-[10px] text-[#a1a1a6] leading-[1.7]">
                La presente approvazione specifica è necessaria ai fini della validità delle clausole sopra elencate, ai sensi degli Artt. 1341 e 1342 del Codice Civile italiano.
              </p>
            </div>
          </div>
        </div>

        {/* ═══ FOOTER AZIENDALE ═══ */}
        <div data-pdf-block="contract-footer" className="px-12 md:px-16 py-12 border-t border-gray-100 bg-[#fafafa]">
          <div className="flex items-center gap-3 mb-8">
            <img src={ecoLogo} alt="Eco Solution Logo" className="w-10 h-10 object-contain rounded-lg opacity-80" />
            <p className="text-[12px] font-bold text-[#1d1d1f] uppercase tracking-tight">ECO SOLUTION S.a.s.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[10px] text-[#86868b] leading-[1.7]">
            <div>
              <p className="text-[8px] font-black text-[#a1a1a6] uppercase tracking-[0.15em] mb-2">Sede Legale</p>
              <p>Via Primo Maggio, 3</p>
              <p>23892 Bulciago (LC)</p>
              <div className="mt-3">
                <p className="text-[8px] font-black text-[#a1a1a6] uppercase tracking-[0.15em] mb-2">Sede Operativa</p>
                <p>Via Roma, 8</p>
                <p>20823 Lentate sul Seveso (MB)</p>
              </div>
            </div>
            <div>
              <p className="text-[8px] font-black text-[#a1a1a6] uppercase tracking-[0.15em] mb-2">Dati Fiscali</p>
              <p>Partita IVA: <span className="text-[#1d1d1f] font-medium">04640600161</span></p>
              <p>Codice Fiscale: <span className="text-[#1d1d1f] font-medium">04640600161</span></p>
              <p>Codice SDI: <span className="text-[#1d1d1f] font-medium">T9K4ZHO</span></p>
            </div>
            <div>
              <p className="text-[8px] font-black text-[#a1a1a6] uppercase tracking-[0.15em] mb-2">Coordinate Bancarie</p>
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
        </div>

      </main>

      {/* ─── Action buttons (hidden on print) ─── */}
      <div className="max-w-[800px] mx-auto mt-8 px-6 text-center space-y-4 print:hidden">
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-[#1d1d1f] text-white text-[15px] font-semibold rounded-xl hover:bg-[#333] transition-all shadow-lg shadow-black/10"
          >
            <Download size={18} />
            Scarica Contratto
          </button>
          <Link
            to={`/admin/contract/${quoteId}/edit`}
            className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-white text-[#1d1d1f] text-[15px] font-semibold rounded-xl hover:bg-gray-50 transition-all shadow-lg shadow-black/5 border border-gray-200"
          >
            <Edit size={18} />
            Modifica Contratto
          </Link>
        </div>
      </div>
    </div>
  );
}
