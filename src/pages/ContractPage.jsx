import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Download, ArrowLeft } from 'lucide-react';

import ecoLogo from '../assets/images/eco-solutions-logo-.jpeg';

const formatCurrency = (value) =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);

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

  const contractNumber = quote.quoteNumber || quoteId.slice(-4).toUpperCase();
  const totalAmount = quote.summary?.subtotal || quote.summary?.total || 0;

  return (
    <div className="min-h-screen font-sans selection:bg-[#cce9ff] pb-20 pt-6 md:pt-12 overflow-x-hidden print:pt-0 print:pb-0 print:bg-white bg-[#f5f5f7]">

      {/* --- BACK LINK (hidden on print) --- */}
      <div className="max-w-[800px] mx-auto mb-4 px-6 print:hidden">
        <Link to={`/quote/${quoteId}`} className="inline-flex items-center gap-1.5 text-[13px] text-[#86868b] hover:text-[#1d1d1f] transition-colors font-medium">
          <ArrowLeft size={14} />
          Torna al preventivo
        </Link>
      </div>

      <main className="max-w-[800px] mx-auto bg-white min-h-[1000px] shadow-[0_24px_60px_-12px_rgba(0,0,0,0.06)] sm:rounded-[24px] overflow-hidden relative print:max-w-full print:shadow-none print:rounded-none">

        {/* ═══════════════════════════════════════════
            INTESTAZIONE CONTRATTO
        ═══════════════════════════════════════════ */}
        <div data-pdf-block="contract-header" className="px-12 md:px-16 pt-14 pb-10 border-b border-gray-100">
          
          {/* Logo + Titolo Documento */}
          <div className="flex items-start justify-between gap-6 mb-10">
            <div className="flex items-center gap-4">
              <img
                src={ecoLogo}
                alt="Eco Solution"
                className="w-14 h-14 object-contain rounded-lg border border-black/5"
              />
              <div>
                <h2 className="text-[15px] font-bold text-[#1d1d1f] tracking-tight leading-tight uppercase">
                  ECO SOLUTION S.a.s.
                </h2>
                <p className="text-[11px] text-[#a1a1a6] font-medium mt-0.5">Impresa Edile</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[9px] font-bold text-[#86868b] uppercase tracking-[0.15em] mb-1">Contratto N.</p>
              <p className="text-[22px] font-bold text-[#1d1d1f] tabular-nums tracking-tight">
                #{contractNumber}
              </p>
            </div>
          </div>

          {/* Titolo Contratto */}
          <div className="text-center mb-10">
            <h1 className="text-[22px] md:text-[26px] font-bold text-[#1d1d1f] tracking-tight uppercase">
              Contratto di Appalto
            </h1>
            <p className="text-[13px] text-[#86868b] mt-2 font-medium">
              per l'esecuzione di lavori edili
            </p>
          </div>

          {/* Parti Contrattuali */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Appaltatore */}
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

            {/* Committente */}
            <div className="bg-[#fafafa] rounded-2xl p-6">
              <p className="text-[9px] font-black text-[#a1a1a6] uppercase tracking-[0.15em] mb-3">Committente</p>
              <p className="text-[14px] font-bold text-[#1d1d1f]">{quote.clientName || '—'}</p>
              <div className="text-[12px] text-[#86868b] leading-[1.8] mt-2">
                {quote.address && <p>Indirizzo: {quote.address}</p>}
                <p className="mt-3 border-b border-dashed border-gray-200 pb-1">C.F. / P.IVA: ___________________________</p>
                <p className="mt-2 border-b border-dashed border-gray-200 pb-1">Tel: ___________________________</p>
                <p className="mt-2 border-b border-dashed border-gray-200 pb-1">Email: ___________________________</p>
              </div>
            </div>

          </div>
        </div>


        {/* ═══════════════════════════════════════════
            PREMESSE
        ═══════════════════════════════════════════ */}
        <div data-pdf-block="premesse" className="px-12 md:px-16 py-10 border-b border-gray-100">
          <h3 className="text-[11px] font-black text-[#86868b] uppercase tracking-[0.2em] mb-5">
            Premesse
          </h3>
          <div className="text-[13px] text-[#1d1d1f] leading-[1.9]">
            <p>
              Con il presente contratto, il Committente affida all'Appaltatore — e quest'ultimo accetta — l'esecuzione 
              dei lavori descritti nel progetto denominato <strong>"{quote.projectName}"</strong>, 
              da eseguirsi presso: <strong>{quote.address || 'indirizzo da definire'}</strong>.
            </p>
            <p className="mt-3">
              Il presente contratto è redatto sulla base del Preventivo n. <strong>#{contractNumber}</strong> del <strong>{quote.date}</strong>, 
              che le parti dichiarano di conoscere e accettare integralmente e che costituisce parte integrante del presente accordo.
            </p>
          </div>
        </div>


        {/* ═══════════════════════════════════════════
            ART. 1 — OGGETTO DEI LAVORI
        ═══════════════════════════════════════════ */}
        <div data-pdf-block="art-1-lavori" className="px-12 md:px-16 py-10 border-b border-gray-100">
          <h3 className="text-[11px] font-black text-[#86868b] uppercase tracking-[0.2em] mb-5">
            Art. 1 — Oggetto dei lavori
          </h3>
          <p className="text-[13px] text-[#1d1d1f] leading-[1.9] mb-6">
            L'Appaltatore si impegna ad eseguire a regola d'arte le seguenti lavorazioni:
          </p>

          {/* Tabella lavorazioni */}
          <div className="border border-gray-100 rounded-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#fafafa]">
                  <th className="px-5 py-3 text-[9px] font-black text-[#86868b] uppercase tracking-[0.15em]">N.</th>
                  <th className="px-5 py-3 text-[9px] font-black text-[#86868b] uppercase tracking-[0.15em]">Lavorazione</th>
                  <th className="px-5 py-3 text-[9px] font-black text-[#86868b] uppercase tracking-[0.15em] text-right">Importo</th>
                </tr>
              </thead>
              <tbody>
                {quote.sections && quote.sections.map((section, idx) => {
                  const sectionTotal = section.items
                    ? section.items.reduce((acc, item) => acc + (item.price * item.quantity), 0)
                    : 0;
                  return (
                    <tr key={section.id || idx} className="border-t border-gray-50">
                      <td className="px-5 py-3.5 text-[12px] text-[#a1a1a6] font-medium tabular-nums">
                        {String(idx + 1).padStart(2, '0')}
                      </td>
                      <td className="px-5 py-3.5 text-[13px] text-[#1d1d1f] font-medium">
                        {section.title}
                      </td>
                      <td className="px-5 py-3.5 text-[14px] text-[#1d1d1f] font-bold tabular-nums text-right">
                        {formatCurrency(sectionTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200 bg-[#fafafa]">
                  <td className="px-5 py-4" colSpan={2}>
                    <span className="text-[13px] font-bold text-[#1d1d1f] uppercase tracking-tight">
                      Totale Complessivo
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="text-[18px] font-bold text-[#1d1d1f] tabular-nums tracking-tight">
                      {formatCurrency(totalAmount)}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <p className="text-[11px] text-[#a1a1a6] mt-3 italic">
            * Tutti gli importi sono da intendersi al netto di IVA, che verrà applicata nella misura di legge.
          </p>
        </div>


        {/* ═══════════════════════════════════════════
            ART. 2 — CORRISPETTIVO
        ═══════════════════════════════════════════ */}
        <div data-pdf-block="art-2-corrispettivo" className="px-12 md:px-16 py-10 border-b border-gray-100">
          <h3 className="text-[11px] font-black text-[#86868b] uppercase tracking-[0.2em] mb-5">
            Art. 2 — Corrispettivo
          </h3>
          <div className="text-[13px] text-[#1d1d1f] leading-[1.9]">
            <p>
              Il corrispettivo complessivo per l'esecuzione delle opere di cui all'Art. 1 è stabilito in <strong>{formatCurrency(totalAmount)}</strong> (IVA esclusa), 
              secondo quanto dettagliato nel preventivo di riferimento.
            </p>
            <p className="mt-3">
              Eventuali variazioni in corso d'opera, concordate per iscritto tra le parti, comporteranno un adeguamento proporzionale 
              del corrispettivo e dei tempi di esecuzione.
            </p>
          </div>
        </div>


        {/* ═══════════════════════════════════════════
            ART. 3 — MODALITÀ DI PAGAMENTO
        ═══════════════════════════════════════════ */}
        <div data-pdf-block="art-3-pagamenti" className="px-12 md:px-16 py-10 border-b border-gray-100">
          <h3 className="text-[11px] font-black text-[#86868b] uppercase tracking-[0.2em] mb-5">
            Art. 3 — Modalità di pagamento
          </h3>
          <p className="text-[13px] text-[#1d1d1f] leading-[1.9] mb-6">
            Il pagamento del corrispettivo avverrà secondo il seguente piano:
          </p>

          {quote.paymentPlan && quote.paymentPlan.length > 0 ? (
            <div className="space-y-0">
              {quote.paymentPlan.map((p, idx) => (
                <div key={idx} data-pdf-block={`contract-payment-${idx}`} className="flex items-start gap-5 py-4 border-b border-gray-50 last:border-b-0">
                  <div className="w-7 h-7 rounded-full bg-[#fafafa] border border-gray-200 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-[#86868b]">{idx + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-1 mb-1">
                      <p className="text-[13px] font-bold text-[#1d1d1f]">{p.label}</p>
                      <span className="text-[16px] font-bold text-[#1d1d1f] tabular-nums tracking-tight">
                        {formatCurrency(p.amount)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-[#86868b]">
                      {p.dueDate && <span>Scadenza: {p.dueDate}</span>}
                      {p.percentage && (
                        <>
                          <span className="text-gray-200">•</span>
                          <span>{p.percentage}% del totale</span>
                        </>
                      )}
                    </div>
                    {p.description && (
                      <p className="text-[12px] text-[#a1a1a6] mt-1.5 leading-relaxed">{p.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-[#86868b] italic">
              Le modalità di pagamento saranno concordate separatamente tra le parti.
            </p>
          )}

          <div className="mt-6 text-[13px] text-[#1d1d1f] leading-[1.9]">
            <p>
              I pagamenti dovranno essere effettuati a mezzo bonifico bancario sulle coordinate indicate in calce al presente contratto. 
              In caso di mancato o ritardato pagamento, l'Appaltatore si riserva il diritto di sospendere l'esecuzione 
              dei lavori e di applicare gli interessi moratori previsti dal D.Lgs. 231/2002.
            </p>
          </div>
        </div>


        {/* ═══════════════════════════════════════════
            ART. 4 — TEMPI DI ESECUZIONE
        ═══════════════════════════════════════════ */}
        <div data-pdf-block="art-4-tempi" className="px-12 md:px-16 py-10 border-b border-gray-100">
          <h3 className="text-[11px] font-black text-[#86868b] uppercase tracking-[0.2em] mb-5">
            Art. 4 — Tempi di esecuzione
          </h3>
          <div className="text-[13px] text-[#1d1d1f] leading-[1.9]">
            <p>
              {quote.estimatedStart 
                ? <>I lavori avranno inizio indicativamente il <strong>{quote.estimatedStart}</strong>.</>
                : <>La data di inizio lavori sarà concordata tra le parti.</>
              }
              {' '}La durata prevista è di <strong>{quote.duration || 'da definire'}</strong>.
            </p>
            <p className="mt-3">
              I tempi indicati sono da considerarsi indicativi. Eventuali ritardi dovuti a cause di forza maggiore, 
              condizioni meteorologiche avverse, ritardi nella fornitura di materiali da terzi, impedimenti nell'accesso 
              ai locali o variazioni richieste dal Committente non potranno essere imputati all'Appaltatore.
            </p>
          </div>
        </div>


        {/* ═══════════════════════════════════════════
            ART. 5 — OBBLIGHI DEL COMMITTENTE
        ═══════════════════════════════════════════ */}
        <div data-pdf-block="art-5-obblighi" className="px-12 md:px-16 py-10 border-b border-gray-100">
          <h3 className="text-[11px] font-black text-[#86868b] uppercase tracking-[0.2em] mb-5">
            Art. 5 — Obblighi del Committente
          </h3>
          <div className="text-[13px] text-[#1d1d1f] leading-[1.9]">
            <p>Il Committente si impegna a:</p>
            <ul className="list-none mt-3 space-y-2">
              <li className="flex gap-2"><span className="text-[#a1a1a6] shrink-0">a)</span> Garantire il libero e sicuro accesso alle aree oggetto dell'intervento per tutta la durata dei lavori;</li>
              <li className="flex gap-2"><span className="text-[#a1a1a6] shrink-0">b)</span> Fornire l'allacciamento alla rete elettrica e idrica ove necessario per l'esecuzione dei lavori;</li>
              <li className="flex gap-2"><span className="text-[#a1a1a6] shrink-0">c)</span> Sgomberare preventivamente le aree di lavoro da arredi, oggetti personali e materiali fragili;</li>
              <li className="flex gap-2"><span className="text-[#a1a1a6] shrink-0">d)</span> Comunicare tempestivamente eventuali impedimenti o variazioni;</li>
              <li className="flex gap-2"><span className="text-[#a1a1a6] shrink-0">e)</span> Provvedere, ove necessario, all'ottenimento di permessi, autorizzazioni e comunicazioni a norma di legge.</li>
            </ul>
            <p className="mt-3">
              Eventuali danni a beni non rimossi dal Committente non saranno imputabili all'Appaltatore.
            </p>
          </div>
        </div>


        {/* ═══════════════════════════════════════════
            ART. 6 — OBBLIGHI DELL'APPALTATORE
        ═══════════════════════════════════════════ */}
        <div data-pdf-block="art-6-obblighi-app" className="px-12 md:px-16 py-10 border-b border-gray-100">
          <h3 className="text-[11px] font-black text-[#86868b] uppercase tracking-[0.2em] mb-5">
            Art. 6 — Obblighi dell'Appaltatore
          </h3>
          <div className="text-[13px] text-[#1d1d1f] leading-[1.9]">
            <p>L'Appaltatore si impegna a:</p>
            <ul className="list-none mt-3 space-y-2">
              <li className="flex gap-2"><span className="text-[#a1a1a6] shrink-0">a)</span> Eseguire i lavori a regola d'arte, conformemente alle normative vigenti e agli standard tecnici applicabili;</li>
              <li className="flex gap-2"><span className="text-[#a1a1a6] shrink-0">b)</span> Utilizzare materiali di qualità conforme a quanto indicato nel preventivo;</li>
              <li className="flex gap-2"><span className="text-[#a1a1a6] shrink-0">c)</span> Rispettare le norme di sicurezza sul lavoro (D.Lgs. 81/2008);</li>
              <li className="flex gap-2"><span className="text-[#a1a1a6] shrink-0">d)</span> Mantenere in ordine e pulite le aree di lavoro durante e al termine dell'intervento;</li>
              <li className="flex gap-2"><span className="text-[#a1a1a6] shrink-0">e)</span> Comunicare tempestivamente eventuali problematiche o ritardi nell'esecuzione.</li>
            </ul>
          </div>
        </div>


        {/* ═══════════════════════════════════════════
            ART. 7 — VARIAZIONI IN CORSO D'OPERA
        ═══════════════════════════════════════════ */}
        <div data-pdf-block="art-7-variazioni" className="px-12 md:px-16 py-10 border-b border-gray-100">
          <h3 className="text-[11px] font-black text-[#86868b] uppercase tracking-[0.2em] mb-5">
            Art. 7 — Variazioni in corso d'opera
          </h3>
          <div className="text-[13px] text-[#1d1d1f] leading-[1.9]">
            <p>
              Eventuali variazioni, integrazioni o lavorazioni aggiuntive rispetto a quanto descritto nel presente 
              contratto e nel preventivo di riferimento dovranno essere concordate per iscritto tra le parti prima 
              della loro esecuzione.
            </p>
            <p className="mt-3">
              Le variazioni comporteranno un adeguamento proporzionale dei costi e dei tempi di consegna, che sarà 
              formalizzato mediante addendum al presente contratto.
            </p>
          </div>
        </div>


        {/* ═══════════════════════════════════════════
            ART. 8 — GARANZIA
        ═══════════════════════════════════════════ */}
        <div data-pdf-block="art-8-garanzia" className="px-12 md:px-16 py-10 border-b border-gray-100">
          <h3 className="text-[11px] font-black text-[#86868b] uppercase tracking-[0.2em] mb-5">
            Art. 8 — Garanzia
          </h3>
          <div className="text-[13px] text-[#1d1d1f] leading-[1.9]">
            <p>
              L'Appaltatore garantisce la corretta esecuzione delle opere a regola d'arte, conformemente alle normative vigenti. 
              La garanzia sui lavori eseguiti ha durata di <strong>24 (ventiquattro) mesi</strong> dalla data di fine lavori, salvo diverso accordo scritto.
            </p>
            <p className="mt-3">
              La garanzia non copre difetti derivanti da uso improprio, mancata manutenzione ordinaria, 
              interventi di terzi non autorizzati, o eventi di forza maggiore.
            </p>
          </div>
        </div>


        {/* ═══════════════════════════════════════════
            ART. 9 — RESPONSABILITÀ E ASSICURAZIONE
        ═══════════════════════════════════════════ */}
        <div data-pdf-block="art-9-resp" className="px-12 md:px-16 py-10 border-b border-gray-100">
          <h3 className="text-[11px] font-black text-[#86868b] uppercase tracking-[0.2em] mb-5">
            Art. 9 — Responsabilità e assicurazione
          </h3>
          <div className="text-[13px] text-[#1d1d1f] leading-[1.9]">
            <p>
              L'Appaltatore è coperto da polizza assicurativa di responsabilità civile per danni a terzi derivanti 
              dall'esecuzione dei lavori. Resta esclusa ogni responsabilità per danni preesistenti o non direttamente 
              riconducibili alle opere oggetto del presente contratto.
            </p>
          </div>
        </div>


        {/* ═══════════════════════════════════════════
            ART. 10 — SMALTIMENTO MATERIALI
        ═══════════════════════════════════════════ */}
        <div data-pdf-block="art-10-smaltimento" className="px-12 md:px-16 py-10 border-b border-gray-100">
          <h3 className="text-[11px] font-black text-[#86868b] uppercase tracking-[0.2em] mb-5">
            Art. 10 — Smaltimento materiali
          </h3>
          <div className="text-[13px] text-[#1d1d1f] leading-[1.9]">
            <p>
              Lo smaltimento dei materiali di risulta è incluso nel corrispettivo solo se espressamente indicato nelle 
              singole voci del preventivo. In caso contrario, lo smaltimento sarà a carico del Committente.
            </p>
          </div>
        </div>


        {/* ═══════════════════════════════════════════
            ART. 11 — RISOLUZIONE E RECESSO
        ═══════════════════════════════════════════ */}
        <div data-pdf-block="art-11-recesso" className="px-12 md:px-16 py-10 border-b border-gray-100">
          <h3 className="text-[11px] font-black text-[#86868b] uppercase tracking-[0.2em] mb-5">
            Art. 11 — Risoluzione e recesso
          </h3>
          <div className="text-[13px] text-[#1d1d1f] leading-[1.9]">
            <p>
              Ciascuna parte potrà recedere dal presente contratto con comunicazione scritta inviata all'altra parte 
              con un preavviso di almeno 15 (quindici) giorni.
            </p>
            <p className="mt-3">
              In caso di recesso unilaterale da parte del Committente dopo l'accettazione, l'Appaltatore avrà diritto 
              al pagamento dei lavori già eseguiti, dei materiali già acquistati e di un indennizzo pari al <strong>20%</strong> dell'importo 
              residuo non eseguito.
            </p>
            <p className="mt-3">
              L'Appaltatore potrà risolvere il contratto in caso di morosità del Committente superiore a 30 giorni dalla 
              scadenza di qualsivoglia rata, previa diffida scritta.
            </p>
          </div>
        </div>


        {/* ═══════════════════════════════════════════
            ART. 12 — PRIVACY
        ═══════════════════════════════════════════ */}
        <div data-pdf-block="art-12-privacy" className="px-12 md:px-16 py-10 border-b border-gray-100">
          <h3 className="text-[11px] font-black text-[#86868b] uppercase tracking-[0.2em] mb-5">
            Art. 12 — Trattamento dei dati personali
          </h3>
          <div className="text-[13px] text-[#1d1d1f] leading-[1.9]">
            <p>
              Le parti si impegnano reciprocamente al trattamento dei dati personali in conformità al Regolamento UE 2016/679 (GDPR). 
              I dati raccolti saranno utilizzati esclusivamente per le finalità connesse all'esecuzione del presente contratto e 
              degli obblighi di legge.
            </p>
          </div>
        </div>


        {/* ═══════════════════════════════════════════
            ART. 13 — DISPOSIZIONI FINALI
        ═══════════════════════════════════════════ */}
        <div data-pdf-block="art-13-finali" className="px-12 md:px-16 py-10 border-b border-gray-100">
          <h3 className="text-[11px] font-black text-[#86868b] uppercase tracking-[0.2em] mb-5">
            Art. 13 — Disposizioni finali
          </h3>
          <div className="text-[13px] text-[#1d1d1f] leading-[1.9]">
            <p>
              Il presente contratto, unitamente al Preventivo n. #{contractNumber} allegato, costituisce l'accordo completo 
              tra le parti in relazione all'oggetto dello stesso e sostituisce ogni precedente accordo o intesa, orale o scritta.
            </p>
            <p className="mt-3">
              Eventuali modifiche o integrazioni al presente contratto dovranno essere stipulate per iscritto e sottoscritte da entrambe le parti.
            </p>
            <p className="mt-3">
              Per quanto non espressamente previsto dal presente contratto, si applicano le disposizioni del Codice Civile 
              in materia di appalto (artt. 1655 e ss. c.c.) e le normative vigenti in materia.
            </p>
          </div>
        </div>


        {/* ═══════════════════════════════════════════
            FIRME
        ═══════════════════════════════════════════ */}
        <div data-pdf-block="firme" className="px-12 md:px-16 py-14">
          
          <h3 className="text-[11px] font-black text-[#86868b] uppercase tracking-[0.2em] mb-5">
            Sottoscrizione del contratto
          </h3>

          <p className="text-[13px] text-[#1d1d1f] leading-[1.9] mb-10">
            Le parti dichiarano di aver letto, compreso e accettato integralmente tutte le clausole del presente contratto. 
            In fede, si sottoscrive in triplice copia originale.
          </p>

          {/* Data e Luogo */}
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

          {/* Tre colonne firma */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            
            {/* Firma Committente */}
            <div>
              <p className="text-[9px] font-black text-[#a1a1a6] uppercase tracking-[0.15em] mb-3">Il Committente</p>
              <div className="border border-gray-100 rounded-xl bg-[#fafafa] min-h-[100px] mb-3 p-4">
                <p className="text-[11px] text-[#a1a1a6] italic">Firma per accettazione</p>
              </div>
              <div className="border-b border-[#1d1d1f]/20 pb-1 mb-1.5"></div>
              <p className="text-[10px] text-[#a1a1a6]">{quote.clientName || 'Nome e Cognome'}</p>
            </div>

            {/* Firma Geometra / Direttore Lavori */}
            <div>
              <p className="text-[9px] font-black text-[#a1a1a6] uppercase tracking-[0.15em] mb-3">Il Direttore Lavori</p>
              <div className="border border-gray-100 rounded-xl bg-[#fafafa] min-h-[100px] mb-3 p-4">
                <p className="text-[11px] text-[#a1a1a6] italic">Firma per accettazione</p>
              </div>
              <div className="border-b border-[#1d1d1f]/20 pb-1 mb-1.5"></div>
              <p className="text-[10px] text-[#a1a1a6]">Geom. / D.L.</p>
            </div>

            {/* Firma Eco Solution */}
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


        {/* ═══════════════════════════════════════════
            FOOTER AZIENDALE CON COORDINATE BANCARIE
        ═══════════════════════════════════════════ */}
        <div data-pdf-block="contract-footer" className="px-12 md:px-16 py-12 border-t border-gray-100 bg-[#fafafa]">
          
          <div className="flex items-center gap-3 mb-8">
            <img
              src={ecoLogo}
              alt="Eco Solution Logo"
              className="w-10 h-10 object-contain rounded-lg opacity-80"
            />
            <div>
              <p className="text-[12px] font-bold text-[#1d1d1f] uppercase tracking-tight">
                ECO SOLUTION S.a.s.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[10px] text-[#86868b] leading-[1.7]">
            {/* Sedi */}
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

            {/* Dati Fiscali */}
            <div>
              <p className="text-[8px] font-black text-[#a1a1a6] uppercase tracking-[0.15em] mb-2">Dati Fiscali</p>
              <p>Partita IVA: <span className="text-[#1d1d1f] font-medium">04640600161</span></p>
              <p>Codice Fiscale: <span className="text-[#1d1d1f] font-medium">04640600161</span></p>
              <p>Codice SDI: <span className="text-[#1d1d1f] font-medium">T9K4ZHO</span></p>
            </div>

            {/* Coordinate Bancarie */}
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

          <div className="mt-8 pt-4 border-t border-gray-200/50 text-center">
            <p className="text-[9px] text-[#a1a1a6] tracking-wider uppercase font-medium opacity-60">
              Contratto generato dal sistema di gestione ECO SOLUTION S.a.s.
            </p>
          </div>
        </div>

      </main>

      {/* --- PULSANTI AZIONE (hidden on print) --- */}
      <div className="max-w-[800px] mx-auto mt-8 px-6 text-center space-y-4 print:hidden">
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-[#1d1d1f] text-white text-[15px] font-semibold rounded-xl hover:bg-[#333] transition-all shadow-lg shadow-black/10"
        >
          <Download size={18} />
          Scarica Contratto
        </button>
        <p className="text-[12px] text-gray-400 font-medium tracking-tight">
          Documento creato con il sistema di gestione interno di Eco Solution S.a.s.
        </p>
      </div>
    </div>
  );
}
