import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Save, Plus, Trash2, ArrowUp, ArrowDown, Eye, ArrowLeft } from 'lucide-react';
import AdminToolbar from '../components/AdminToolbar';

const generateId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// ─── Default articles (used on first load if no contractData saved) ───
const DEFAULT_ARTICLES = [
  {
    id: 'art-tempi',
    title: 'Tempi di esecuzione',
    body: `I lavori avranno inizio entro la data concordata tra le parti e avranno una durata presunta indicata nel preventivo di riferimento, espressa in giorni lavorativi, salvo imprevisti o cause di forza maggiore.\n\nEventuali ritardi dovuti a cause di forza maggiore, condizioni meteorologiche avverse, ritardi nella fornitura di materiali da terzi, impedimenti nell'accesso ai locali o variazioni richieste dal Committente non potranno essere imputati all'Appaltatore e comporteranno una proroga automatica dei termini.`
  },
  {
    id: 'art-obblighi-comm',
    title: 'Obblighi del Committente',
    body: `Il Committente si impegna a:\na) Garantire il libero e sicuro accesso alle aree oggetto dell'intervento per tutta la durata dei lavori;\nb) Fornire l'allacciamento alla rete elettrica e idrica ove necessario per l'esecuzione dei lavori;\nc) Sgomberare preventivamente le aree di lavoro da arredi, oggetti personali e materiali fragili;\nd) Comunicare tempestivamente eventuali impedimenti o variazioni;\ne) Provvedere, ove necessario, all'ottenimento di permessi, autorizzazioni e comunicazioni a norma di legge;\nf) Qualora nel cantiere intervengano più imprese, il Committente è tenuto a nominare il Coordinatore per la Sicurezza in fase di Progettazione e di Esecuzione ai sensi del D.Lgs. 81/2008, sollevando l'Appaltatore da tale responsabilità.\n\nEventuali danni a beni non rimossi dal Committente non saranno imputabili all'Appaltatore.`
  },
  {
    id: 'art-obblighi-app',
    title: "Obblighi dell'Appaltatore",
    body: `L'Appaltatore si impegna a:\na) Eseguire i lavori a regola d'arte, conformemente alle normative vigenti e agli standard tecnici applicabili;\nb) Utilizzare materiali di qualità conforme a quanto indicato nel preventivo;\nc) Rispettare le norme di sicurezza sul lavoro (D.Lgs. 81/2008);\nd) Mantenere in ordine e pulite le aree di lavoro durante e al termine dell'intervento;\ne) Comunicare tempestivamente eventuali problematiche o ritardi nell'esecuzione.`
  },
  {
    id: 'art-variazioni',
    title: "Variazioni in corso d'opera",
    body: `Eventuali variazioni, integrazioni o lavorazioni aggiuntive rispetto a quanto descritto nel presente contratto e nel preventivo di riferimento dovranno essere concordate per iscritto tra le parti prima della loro esecuzione.\n\nLe variazioni comporteranno un adeguamento proporzionale dei costi e dei tempi di consegna, che sarà formalizzato mediante addendum al presente contratto.`
  },
  {
    id: 'art-garanzia',
    title: 'Garanzia',
    body: `L'Appaltatore garantisce la corretta esecuzione delle opere a regola d'arte, conformemente alle normative vigenti. La garanzia sui lavori eseguiti ha durata di 24 (ventiquattro) mesi dalla data di fine lavori, salvo diverso accordo scritto.\n\nLa garanzia non copre difetti derivanti da uso improprio, mancata manutenzione ordinaria, interventi di terzi non autorizzati, o eventi di forza maggiore.\n\nSono esclusi dalla garanzia i normali fenomeni di assestamento, ritiro e movimenti naturali dei materiali.`
  },
  {
    id: 'art-responsabilita',
    title: 'Responsabilità e assicurazione',
    body: `L'Appaltatore è coperto da polizza assicurativa di responsabilità civile per danni a terzi derivanti dall'esecuzione dei lavori. Resta esclusa ogni responsabilità per danni preesistenti o non direttamente riconducibili alle opere oggetto del presente contratto.`
  },
  {
    id: 'art-smaltimento',
    title: 'Smaltimento materiali',
    body: `Lo smaltimento dei materiali di risulta è incluso nel corrispettivo solo se espressamente indicato nelle singole voci del preventivo. In caso contrario, lo smaltimento sarà a carico del Committente.`
  },
  {
    id: 'art-accettazione',
    title: 'Accettazione lavori e obbligo di pagamento',
    body: `Al completamento di ciascuna fase di lavorazione ovvero dell'intero intervento, il Committente è tenuto a verificare i lavori eseguiti ed a procedere al pagamento delle somme dovute secondo il piano concordato all'Art. 3, entro i termini ivi stabiliti.\n\nIl pagamento non può essere sospeso, ritardato o rifiutato dal Committente per ragioni estetiche, di gradimento personale o per contestazioni su dettagli esecutivi che non configurino un vizio grave ai sensi dell'art. 1668 c.c.\n\nEventuali difformità, difetti o riserve dovranno essere comunicati per iscritto dall'Committente entro 8 (otto) giorni dalla conclusione dei lavori o della singola fase. L'Appaltatore si impegna a valutare e, ove fondato, a rimediare alle difformità segnalate in tempi ragionevoli.\n\nLa segnalazione di difformità non esonera in alcun caso il Committente dall'obbligo di pagamento nei termini previsti. Le eventuali rettifiche verranno eseguite dall'Appaltatore a propria cura e spese, ove riconducibili a propria responsabilità, senza che ciò comporti alcuna riduzione o dilazione del corrispettivo pattuito.\n\nIl mancato pagamento entro i termini, anche in presenza di contestazioni, costituirà inadempimento contrattuale e darà diritto all'Appaltatore di sospendere ogni ulteriore intervento, ivi comprese le eventuali opere di rettifica, sino al completo saldo delle somme dovute.`
  },
  {
    id: 'art-recesso',
    title: 'Risoluzione e recesso',
    body: `Ciascuna parte potrà recedere dal presente contratto con comunicazione scritta inviata all'altra parte con un preavviso di almeno 15 (quindici) giorni.\n\nIn caso di recesso unilaterale da parte del Committente dopo l'accettazione, l'Appaltatore avrà diritto al pagamento dei lavori già eseguiti, dei materiali già acquistati e di un indennizzo pari al 20% dell'importo residuo non eseguito.\n\nL'Appaltatore potrà risolvere il contratto in caso di morosità del Committente superiore a 30 giorni dalla scadenza di qualsivoglia rata, previa diffida scritta.`
  },
  {
    id: 'art-privacy',
    title: 'Trattamento dei dati personali',
    body: `Le parti si impegnano reciprocamente al trattamento dei dati personali in conformità al Regolamento UE 2016/679 (GDPR). I dati raccolti saranno utilizzati esclusivamente per le finalità connesse all'esecuzione del presente contratto e degli obblighi di legge.`
  },
  {
    id: 'art-foro',
    title: 'Foro competente',
    body: `Per qualsiasi controversia derivante dall'interpretazione o dall'esecuzione del presente contratto, sarà competente in via esclusiva il Foro del luogo di residenza o domicilio del Committente, ai sensi dell'art. 33, comma 2, lettera u) del D.Lgs. 206/2005 (Codice del Consumo).`
  },
  {
    id: 'art-finali',
    title: 'Disposizioni finali',
    body: `Il presente contratto, unitamente al Preventivo allegato, costituisce l'accordo completo tra le parti in relazione all'oggetto dello stesso e sostituisce ogni precedente accordo o intesa, orale o scritta.\n\nEventuali modifiche o integrazioni al presente contratto dovranno essere stipulate per iscritto e sottoscritte da entrambe le parti.\n\nPer quanto non espressamente previsto dal presente contratto, si applicano le disposizioni del Codice Civile in materia di appalto (artt. 1655 e ss. c.c.) e le normative vigenti in materia.`
  },
];

const IVA_OPTIONS = [
  { label: 'Esente IVA (0%)', value: 0 },
  { label: 'IVA ridotta 4%', value: 4 },
  { label: 'IVA ridotta 10%', value: 10 },
  { label: 'IVA ordinaria 22%', value: 22 },
];

// ─── UI Helpers ───
const Label = ({ children }) => (
  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.12em] mb-1.5 ml-0.5">
    {children}
  </label>
);

export default function EditContractPage() {
  const { quoteId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Core quote data (read-only here, comes from preventivo)
  const [quote, setQuote] = useState(null);

  // Editable contract data
  const [vatRate, setVatRate] = useState(10);
  const [premesseText, setPremesseText] = useState('');
  const [corrispettivoText, setCorrispettivoText] = useState('');
  const [pagamentiText, setPagamentiText] = useState('');
  const [articles, setArticles] = useState([]);

  // Client data for contract
  const [clientCF, setClientCF] = useState('');
  const [clientPIVA, setClientPIVA] = useState('');
  const [clientResidenza, setClientResidenza] = useState('');
  const [clientTel, setClientTel] = useState('');
  const [clientEmail, setClientEmail] = useState('');

  // ─── Load from Firebase ───
  useEffect(() => {
    const load = async () => {
      try {
        const docRef = doc(db, "preventivi", quoteId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) { setLoading(false); return; }

        const data = docSnap.data();
        setQuote(data);

        // Load saved contractData or use defaults
        const cd = data.contractData || {};
        setVatRate(cd.vatRate ?? 10);
        setArticles(cd.articles?.length ? cd.articles : DEFAULT_ARTICLES.map(a => ({ ...a, id: a.id || generateId('art') })));
        
        const contractNumber = data.quoteNumber || quoteId.slice(-4).toUpperCase();
        
        setPremesseText(cd.premesseText || 
          `Con il presente contratto, il Committente affida all'Appaltatore — e quest'ultimo accetta — l'esecuzione dei lavori descritti nel progetto denominato "${data.projectName}", da eseguirsi presso: ${data.address || 'indirizzo da definire'}.\n\nIl presente contratto è redatto sulla base del Preventivo n. #${contractNumber} del ${data.date}, che le parti dichiarano di conoscere e accettare integralmente e che costituisce parte integrante del presente accordo.`
        );

        setCorrispettivoText(cd.corrispettivoText ||
          `Eventuali variazioni in corso d'opera, concordate per iscritto tra le parti, comporteranno un adeguamento proporzionale del corrispettivo e dei tempi di esecuzione.`
        );

        setPagamentiText(cd.pagamentiText ||
          `I pagamenti dovranno essere effettuati a mezzo bonifico bancario sulle coordinate indicate in calce al presente contratto. In caso di mancato o ritardato pagamento, l'Appaltatore si riserva il diritto di sospendere l'esecuzione dei lavori e di applicare gli interessi moratori previsti dal D.Lgs. 231/2002.`
        );

        // Load client data
        setClientCF(cd.clientCF || '');
        setClientPIVA(cd.clientPIVA || '');
        setClientResidenza(cd.clientResidenza || '');
        setClientTel(cd.clientTel || '');
        setClientEmail(cd.clientEmail || '');

      } catch (error) {
        console.error("Errore caricamento:", error);
        alert("Errore di connessione.");
      } finally {
        setLoading(false);
      }
    };
    if (quoteId) load();
  }, [quoteId]);

  // ─── Computed totals ───
  const totals = useMemo(() => {
    if (!quote?.sections) return { netto: 0, iva: 0, lordo: 0 };
    const netto = quote.summary?.subtotal || quote.sections.reduce((acc, s) => 
      acc + (s.items?.reduce((a, i) => a + (i.price * i.quantity), 0) || 0), 0);
    const iva = netto * (vatRate / 100);
    return { netto, iva, lordo: netto + iva };
  }, [quote, vatRate]);

  // ─── Article handlers ───
  const updateArticle = (id, field, value) => {
    setArticles(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
  };
  const addArticle = () => {
    setArticles(prev => [...prev, { id: generateId('art'), title: 'Nuovo articolo', body: '' }]);
  };
  const deleteArticle = (id) => {
    if (confirm('Eliminare questo articolo?')) {
      setArticles(prev => prev.filter(a => a.id !== id));
    }
  };
  const moveArticle = (idx, dir) => {
    setArticles(prev => {
      const arr = [...prev];
      const target = dir === 'up' ? idx - 1 : idx + 1;
      if (target < 0 || target >= arr.length) return arr;
      [arr[idx], arr[target]] = [arr[target], arr[idx]];
      return arr;
    });
  };

  // ─── Save ───
  const handleSave = async () => {
    setSaving(true);
    try {
      const contractData = {
        vatRate,
        premesseText,
        corrispettivoText,
        pagamentiText,
        articles,
        clientCF,
        clientPIVA,
        clientResidenza,
        clientTel,
        clientEmail,
        lastUpdated: new Date().toISOString()
      };

      // Merge contractData into existing doc
      const docRef = doc(db, "preventivi", quoteId);
      const docSnap = await getDoc(docRef);
      const existing = docSnap.exists() ? docSnap.data() : {};

      await setDoc(docRef, { ...existing, contractData });
      // Aggiorna lo stato locale così la toolbar mostra "Editor Contratto" come esistente
      setQuote(prev => ({ ...(prev || {}), contractData }));
      // ✓ Resta nell'editor. Il flash "Salvato" è gestito da AdminToolbar.
    } catch (error) {
      alert("Errore salvataggio: " + error.message);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (v) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(v);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">Caricamento...</div>;
  if (!quote) return <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">Preventivo non trovato.</div>;

  // Article numbering offset: Art.1 = Oggetto lavori, Art.2 = Corrispettivo, Art.3 = Pagamenti → custom articles start at 4
  const artOffset = 4;

  return (
    <div className="bg-[#F5F5F7] min-h-screen font-sans pb-32">

      <AdminToolbar
        quoteId={quoteId}
        clientName={quote.clientName}
        projectName={quote.projectName}
        active="edit-contract"
        hasContract={true}
        onSave={handleSave}
        saving={saving}
      />

      <main className="max-w-4xl mx-auto p-6 space-y-6">

        {/* ═══ SEZIONE IVA ═══ */}
        <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-sm font-black text-gray-900 mb-4">💶 IVA e Totali</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <Label>Aliquota IVA</Label>
              <select
                value={vatRate}
                onChange={(e) => setVatRate(parseFloat(e.target.value))}
                className="block w-full px-4 py-2.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              >
                {IVA_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1">Imponibile</p>
              <p className="text-lg font-bold text-gray-900 tabular-nums">{formatCurrency(totals.netto)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1">IVA ({vatRate}%)</p>
              <p className="text-lg font-bold text-gray-900 tabular-nums">{formatCurrency(totals.iva)}</p>
            </div>
            <div className="bg-[#1d1d1f] rounded-xl p-3">
              <p className="text-[9px] font-black text-[#86868b] uppercase tracking-wider mb-1">Totale con IVA</p>
              <p className="text-lg font-bold text-white tabular-nums">{formatCurrency(totals.lordo)}</p>
            </div>
          </div>
        </section>

        {/* ═══ DATI COMMITTENTE ═══ */}
        <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-sm font-black text-gray-900 mb-1">👤 Dati Committente</h2>
          <p className="text-xs text-gray-400 mb-4">Compila i dati fiscali del cliente. Appariranno nel contratto stampabile.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Codice Fiscale *</Label>
              <input
                type="text"
                value={clientCF}
                onChange={(e) => setClientCF(e.target.value.toUpperCase())}
                placeholder="Es. RSSMRA85M01H501Z"
                maxLength={16}
                className="block w-full px-4 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none uppercase tracking-wider font-mono"
              />
            </div>
            <div>
              <Label>Partita IVA (se applicabile)</Label>
              <input
                type="text"
                value={clientPIVA}
                onChange={(e) => setClientPIVA(e.target.value)}
                placeholder="Es. 01234567890"
                maxLength={11}
                className="block w-full px-4 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-mono tracking-wider"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Residenza / Domicilio</Label>
              <input
                type="text"
                value={clientResidenza}
                onChange={(e) => setClientResidenza(e.target.value)}
                placeholder="Es. Via Roma 1, 20100 Milano (MI)"
                className="block w-full px-4 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <Label>Telefono</Label>
              <input
                type="tel"
                value={clientTel}
                onChange={(e) => setClientTel(e.target.value)}
                placeholder="Es. +39 333 1234567"
                className="block w-full px-4 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <Label>Email</Label>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="Es. mario.rossi@email.com"
                className="block w-full px-4 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>
          </div>
        </section>

        {/* ═══ LAVORAZIONI (Read-only from preventivo, shown for reference) ═══ */}
        <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-sm font-black text-gray-900 mb-1">🔨 Lavorazioni (Art. 1)</h2>
          <p className="text-xs text-gray-400 mb-4">Le lavorazioni vengono dal preventivo. Per modificarle, usa l'editor preventivo.</p>
          
          {quote.sections?.map((section, sIdx) => {
            const sectionTotal = section.items?.reduce((a, i) => a + (i.price * i.quantity), 0) || 0;
            return (
              <div key={section.id || sIdx} className="mb-4 last:mb-0">
                <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5 mb-2">
                  <span className="text-xs font-bold text-gray-700">{String(sIdx + 1).padStart(2, '0')}. {section.title}</span>
                  <span className="text-xs font-bold text-gray-900 tabular-nums">{formatCurrency(sectionTotal)}</span>
                </div>
                {section.items?.map((item, iIdx) => (
                  <div key={item.id || iIdx} className="flex items-center justify-between px-4 py-1.5 text-[11px] text-gray-500">
                    <span className="flex-1">{item.description || '—'}</span>
                    <span className="tabular-nums text-gray-400 ml-4">{item.quantity} {item.unit} × {formatCurrency(item.price)}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </section>

        {/* ═══ PREMESSE ═══ */}
        <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-sm font-black text-gray-900 mb-3">📜 Premesse</h2>
          <textarea
            value={premesseText}
            onChange={(e) => setPremesseText(e.target.value)}
            rows={6}
            className="block w-full px-4 py-3 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-y leading-relaxed"
          />
        </section>

        {/* ═══ CORRISPETTIVO (Art. 2) ═══ */}
        <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-sm font-black text-gray-900 mb-1">Art. 2 — Corrispettivo</h2>
          <p className="text-xs text-gray-400 mb-3">L'importo viene calcolato automaticamente. Modifica il testo aggiuntivo qui sotto.</p>
          <textarea
            value={corrispettivoText}
            onChange={(e) => setCorrispettivoText(e.target.value)}
            rows={4}
            className="block w-full px-4 py-3 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-y leading-relaxed"
          />
        </section>

        {/* ═══ PAGAMENTI (Art. 3) ═══ */}
        <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-sm font-black text-gray-900 mb-1">Art. 3 — Modalità di pagamento</h2>
          <p className="text-xs text-gray-400 mb-3">Il piano rate viene dal preventivo. Modifica il testo di accompagnamento qui sotto.</p>
          
          {/* Payment plan preview */}
          {quote.paymentPlan?.length > 0 && (
            <div className="mb-4 bg-gray-50 rounded-xl p-4 space-y-2">
              {quote.paymentPlan.map((p, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="font-medium text-gray-700">{p.label}</span>
                  <span className="font-bold text-gray-900 tabular-nums">{formatCurrency(p.amount)}{p.percentage ? ` (${p.percentage}%)` : ''}</span>
                </div>
              ))}
            </div>
          )}
          
          <textarea
            value={pagamentiText}
            onChange={(e) => setPagamentiText(e.target.value)}
            rows={4}
            className="block w-full px-4 py-3 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-y leading-relaxed"
          />
        </section>

        {/* ═══ ARTICOLI PERSONALIZZABILI (Art. 4+) ═══ */}
        <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black text-gray-900">📝 Articoli del contratto (Art. {artOffset}+)</h2>
            <button
              onClick={addArticle}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all uppercase tracking-wider"
            >
              <Plus size={12} /> Aggiungi articolo
            </button>
          </div>

          {/* Banner: missing default articles */}
          {(() => {
            const currentIds = new Set(articles.map(a => a.id));
            const missing = DEFAULT_ARTICLES.filter(a => !currentIds.has(a.id));
            if (!missing.length) return null;
            return (
              <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-[11px] font-bold text-amber-700 mb-2">Articoli standard non presenti nel contratto:</p>
                <div className="space-y-1.5">
                  {missing.map(a => (
                    <div key={a.id} className="flex items-center justify-between gap-2">
                      <span className="text-[12px] text-amber-800 font-medium">{a.title}</span>
                      <button
                        onClick={() => {
                          const finaliIdx = articles.findIndex(x => x.id === 'art-finali');
                          if (finaliIdx >= 0) {
                            setArticles(prev => { const r = [...prev]; r.splice(finaliIdx, 0, { ...a }); return r; });
                          } else {
                            setArticles(prev => [...prev, { ...a }]);
                          }
                        }}
                        className="text-[10px] font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-md transition-all shrink-0"
                      >
                        + Aggiungi
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          <div className="space-y-4">
            {articles.map((art, idx) => (
              <div key={art.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50/50 group">
                {/* Article header row */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-black text-gray-400 bg-gray-100 px-2 py-0.5 rounded shrink-0">
                    Art. {artOffset + idx}
                  </span>
                  <input
                    type="text"
                    value={art.title}
                    onChange={(e) => updateArticle(art.id, 'title', e.target.value)}
                    className="flex-1 px-3 py-1.5 text-sm font-bold text-gray-900 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    placeholder="Titolo articolo"
                  />
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => moveArticle(idx, 'up')} disabled={idx === 0} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-md hover:bg-gray-100 disabled:opacity-20">
                      <ArrowUp size={14} />
                    </button>
                    <button onClick={() => moveArticle(idx, 'down')} disabled={idx === articles.length - 1} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-md hover:bg-gray-100 disabled:opacity-20">
                      <ArrowDown size={14} />
                    </button>
                    <button onClick={() => deleteArticle(art.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Article body */}
                <textarea
                  value={art.body}
                  onChange={(e) => updateArticle(art.id, 'body', e.target.value)}
                  rows={5}
                  className="block w-full px-4 py-3 text-sm text-gray-700 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-y leading-relaxed"
                  placeholder="Testo dell'articolo..."
                />
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* ─── STICKY BOTTOM BAR ─── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200 z-40 print:hidden">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="text-xs text-gray-400">
            <span className="font-bold text-gray-900">{formatCurrency(totals.lordo)}</span> IVA inclusa ({vatRate}%)
          </div>
          <div className="flex items-center gap-2">
            <Link 
              to={`/admin/contract/${quoteId}/preview`}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
            >
              <Eye size={14} /> Anteprima
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-black rounded-xl hover:bg-gray-800 transition-all disabled:opacity-50"
            >
              <Save size={14} /> {saving ? 'Salvataggio...' : 'Salva'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
