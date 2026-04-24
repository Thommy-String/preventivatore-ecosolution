import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { doc, setDoc, getDoc, collection, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import {
  Loader2, Plus, Search, X, Copy, ExternalLink, Trash2, FileText, ArrowRight, Link as LinkIcon
} from 'lucide-react';
import ecoLogo from '../assets/images/eco-solutions-logo-.jpeg';
import { resolveCompanyData } from '../config/companyPresets';

const formatCurrency = (v) =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

const STATUS_MAP = {
  blue:   { label: 'Nuovo',          bg: 'bg-blue-50',    text: 'text-blue-600',    dot: 'bg-blue-500' },
  yellow: { label: 'In lavorazione', bg: 'bg-amber-50',   text: 'text-amber-600',   dot: 'bg-amber-500' },
  green:  { label: 'Completato',     bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  red:    { label: 'Annullato',      bg: 'bg-red-50',     text: 'text-red-500',     dot: 'bg-red-500' },
};

const MESI = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];

// Parsa sia ISO ("2026-04-24T...") che formato italiano "24/04/2026"
function parseQuoteDate(quote) {
  if (quote.createdAt) {
    const d = new Date(quote.createdAt);
    if (!isNaN(d)) return d;
  }
  if (quote.date && typeof quote.date === 'string') {
    const m = quote.date.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (m) return new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]));
    const d = new Date(quote.date);
    if (!isNaN(d)) return d;
  }
  return null;
}

function formatItDate(date) {
  if (!date) return '—';
  return `${date.getDate()} ${MESI[date.getMonth()]} ${date.getFullYear()}`;
}

function timeAgo(date) {
  if (!date) return '';
  const diff = Date.now() - date.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'ora';
  if (min < 60) return `${min} min fa`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} or${h === 1 ? 'a' : 'e'} fa`;
  const g = Math.floor(h / 24);
  if (g < 30) return `${g} giorn${g === 1 ? 'o' : 'i'} fa`;
  const me = Math.floor(g / 30);
  if (me < 12) return `${me} mes${me === 1 ? 'e' : 'i'} fa`;
  const a = Math.floor(g / 365);
  return `${a} ann${a === 1 ? 'o' : 'i'} fa`;
}

// Mini logo azienda (solo icona, niente nome nella riga)
function CompanyMini({ company }) {
  if (company.logo) {
    return (
      <img
        src={company.logo}
        alt={company.shortName || company.name}
        title={company.name}
        className="w-5 h-5 rounded object-cover border border-[#e8e8ed] shrink-0"
      />
    );
  }
  const initials = (company.shortName || company.name || '?')
    .split(/\s+/).slice(0, 2).map(s => s[0]).join('').toUpperCase();
  return (
    <div
      title={company.name}
      className="w-5 h-5 rounded bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-700 flex items-center justify-center text-[8px] font-bold shrink-0"
    >
      {initials}
    </div>
  );
}

// Bottone icona generico
function IconBtn({ title, onClick, children, danger, accent }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); e.preventDefault(); onClick?.(e); }}
      title={title}
      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all
        ${danger
          ? 'text-[#86868b] hover:text-red-600 hover:bg-red-50'
          : accent
            ? 'text-[#86868b] hover:text-[#0071e3] hover:bg-blue-50'
            : 'text-[#86868b] hover:text-[#1d1d1f] hover:bg-[#f0f0f3]'
        }`}
    >
      {children}
    </button>
  );
}

export default function AdminDashboard() {
  const [quotes, setQuotes] = useState([]);
  const [clientName, setClientName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const [dupModal, setDupModal] = useState(null);
  const [dupClient, setDupClient] = useState('');
  const [dupProject, setDupProject] = useState('');
  const [duplicating, setDuplicating] = useState(false);

  useEffect(() => { fetchQuotes(); }, []);

  const fetchQuotes = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "preventivi"));
      const quotesList = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setQuotes(quotesList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (error) { console.error("Errore:", error); }
    finally { setLoading(false); }
  };

  const handleDelete = async (quote) => {
    if (window.confirm(`Eliminare definitivamente il preventivo per "${quote.clientName}"?`)) {
      try {
        await deleteDoc(doc(db, "preventivi", quote.id));
        setQuotes(q => q.filter(x => x.id !== quote.id));
      } catch { alert("Errore durante l'eliminazione."); }
    }
  };

  const handleCopyLink = async (quote) => {
    const url = `${window.location.origin}/quote/${quote.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(quote.id);
      setTimeout(() => setCopiedId(c => c === quote.id ? null : c), 1800);
    } catch {
      window.prompt('Copia il link:', url);
    }
  };

  const openDuplicateModal = (quote) => {
    setDupClient(quote.clientName || '');
    setDupProject(`${quote.projectName || ''} (Copia)`);
    setDupModal({ quoteId: quote.id, originalClient: quote.clientName, originalProject: quote.projectName });
  };

  const handleDuplicate = async () => {
    if (!dupClient.trim() || !dupProject.trim() || !dupModal) return;
    setDuplicating(true);
    try {
      const docSnap = await getDoc(doc(db, "preventivi", dupModal.quoteId));
      if (!docSnap.exists()) { alert("Preventivo originale non trovato."); setDuplicating(false); return; }
      const originalData = docSnap.data();
      const newId = `prev-${Date.now()}`;
      const duplicatedQuote = {
        ...originalData,
        id: newId,
        clientName: dupClient.trim(),
        projectName: dupProject.trim(),
        date: new Date().toLocaleDateString('it-IT'),
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        statusText: 'Nuovo',
        statusColor: 'blue',
      };
      if (duplicatedQuote.paymentPlan) {
        duplicatedQuote.paymentPlan = duplicatedQuote.paymentPlan.map(p => ({ ...p, isPaid: false }));
      }
      await setDoc(doc(db, "preventivi", newId), duplicatedQuote);
      setQuotes(q => [{ ...duplicatedQuote }, ...q]);
      setDupModal(null); setDupClient(''); setDupProject('');
    } catch (error) {
      console.error("Errore duplicazione:", error);
      alert("Errore durante la duplicazione.");
    } finally { setDuplicating(false); }
  };

  const handleCreateQuote = async (e) => {
    e.preventDefault();
    if (!clientName.trim() || !projectName.trim()) return;
    setCreating(true);
    const newId = `prev-${Date.now()}`;
    const newQuote = {
      id: newId, clientName: clientName.trim(), projectName: projectName.trim(),
      date: new Date().toLocaleDateString('it-IT'),
      sections: [], summary: { subtotal: 0, total: 0 },
      statusText: 'Nuovo', statusColor: 'blue',
      createdAt: new Date().toISOString()
    };
    try {
      await setDoc(doc(db, "preventivi", newId), newQuote);
      setQuotes(q => [newQuote, ...q]);
      setClientName(''); setProjectName(''); setShowForm(false);
    } catch { alert("Errore nel salvataggio."); }
    finally { setCreating(false); }
  };

  const filteredQuotes = useMemo(() => {
    if (!searchTerm.trim()) return quotes;
    const s = searchTerm.toLowerCase();
    return quotes.filter(q =>
      q.clientName?.toLowerCase().includes(s) ||
      q.projectName?.toLowerCase().includes(s) ||
      resolveCompanyData(q.companyData).name?.toLowerCase().includes(s)
    );
  }, [searchTerm, quotes]);

  return (
    <div className="bg-white min-h-screen font-sans selection:bg-blue-100">

      {/* ═══ Modal Duplica ═══ */}
      {dupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !duplicating && setDupModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <button onClick={() => !duplicating && setDupModal(null)} className="absolute top-4 right-4 text-[#c7c7cc] hover:text-[#86868b] transition-colors">
              <X size={18} />
            </button>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Copy size={18} className="text-[#0071e3]" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-[#1d1d1f]">Duplica preventivo</h3>
                <p className="text-[12px] text-[#86868b]">da: {dupModal.originalClient} — {dupModal.originalProject}</p>
              </div>
            </div>
            <div className="space-y-3 mb-5">
              <div>
                <label className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider mb-1 block">Nuovo cliente</label>
                <input value={dupClient} onChange={e => setDupClient(e.target.value)} placeholder="Nome cliente" autoFocus
                  className="w-full bg-[#f5f5f7] border border-[#e8e8ed] rounded-xl px-4 py-2.5 text-[13px] text-[#1d1d1f] placeholder:text-[#a1a1a6] focus:ring-2 focus:ring-[#0071e3]/20 focus:border-[#0071e3] outline-none" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider mb-1 block">Nuovo progetto</label>
                <input value={dupProject} onChange={e => setDupProject(e.target.value)} placeholder="Nome progetto"
                  className="w-full bg-[#f5f5f7] border border-[#e8e8ed] rounded-xl px-4 py-2.5 text-[13px] text-[#1d1d1f] placeholder:text-[#a1a1a6] focus:ring-2 focus:ring-[#0071e3]/20 focus:border-[#0071e3] outline-none"
                  onKeyDown={e => { if (e.key === 'Enter' && dupClient.trim() && dupProject.trim()) handleDuplicate(); }} />
              </div>
            </div>
            <div className="flex gap-2.5">
              <button onClick={() => !duplicating && setDupModal(null)}
                className="flex-1 py-2.5 text-[13px] font-semibold text-[#86868b] bg-[#f5f5f7] rounded-xl hover:bg-[#e8e8ed] transition-all">
                Annulla
              </button>
              <button onClick={handleDuplicate} disabled={duplicating || !dupClient.trim() || !dupProject.trim()}
                className="flex-1 py-2.5 text-[13px] font-semibold text-white bg-[#0071e3] rounded-xl hover:bg-[#0077ED] active:scale-[0.97] transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                {duplicating ? <Loader2 className="animate-spin" size={14} /> : <Copy size={14} />}
                Duplica
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Header ═══ */}
      <header className="bg-white border-b border-[#f0f0f3] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[60px] sm:h-[72px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <img src={ecoLogo} alt="Eco Solution"
              className="w-8 sm:w-10 h-8 sm:h-10 rounded-lg object-cover border border-[#f0f0f3] shrink-0" />
            <div className="min-w-0">
              <h1 className="text-[17px] sm:text-[20px] font-semibold text-[#1d1d1f] tracking-tight leading-none">
                Preventivi
              </h1>
              <p className="text-[12px] sm:text-[13px] text-[#86868b] mt-1 leading-none">Gestione progetti</p>
            </div>
          </div>
          <button onClick={() => setShowForm(f => !f)}
            className="flex items-center gap-1.5 h-9 sm:h-10 px-3.5 sm:px-5 text-[13px] sm:text-[14px] font-semibold text-white bg-[#0071e3] hover:bg-[#0077ED] active:scale-[0.97] transition-all rounded-lg shrink-0">
            {showForm ? <X size={14} /> : <Plus size={14} />}
            <span className="hidden sm:inline">{showForm ? 'Chiudi' : 'Nuovo'}</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 sm:pt-10 pb-24">

        {/* ═══ Form creazione ═══ */}
        {showForm && (
          <form onSubmit={handleCreateQuote}
            className="bg-white rounded-xl p-6 sm:p-7 border border-[#f0f0f3] mb-7 sm:mb-8 animate-in slide-in-from-top shadow-sm">
            <p className="text-[15px] sm:text-[16px] font-semibold text-[#1d1d1f] mb-5">Crea nuovo preventivo</p>
            <div className="flex flex-col gap-3.5">
              <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Nome cliente"
                className="w-full bg-[#f9f9fb] border border-[#e8e8ed] rounded-lg px-4 py-3 text-[14px] sm:text-[15px] text-[#1d1d1f] placeholder:text-[#a1a1a6] focus:ring-2 focus:ring-[#0071e3]/20 focus:border-[#0071e3] outline-none transition-all" />
              <input value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="Nome progetto"
                className="w-full bg-[#f9f9fb] border border-[#e8e8ed] rounded-lg px-4 py-3 text-[14px] sm:text-[15px] text-[#1d1d1f] placeholder:text-[#a1a1a6] focus:ring-2 focus:ring-[#0071e3]/20 focus:border-[#0071e3] outline-none transition-all" />
              <button type="submit" disabled={creating || !clientName.trim() || !projectName.trim()}
                className="w-full h-10 px-5 text-[14px] sm:text-[15px] font-semibold text-white bg-[#0071e3] rounded-lg hover:bg-[#0077ED] active:scale-[0.98] transition-all disabled:opacity-40 flex items-center justify-center gap-2 mt-1">
                {creating ? <Loader2 className="animate-spin" size={14}/> : <Plus size={14} />}
                <span className="hidden sm:inline">Crea</span>
              </button>
            </div>
          </form>
        )}

        {/* ═══ Barra ricerca ═══ */}
        <div className="relative mb-3 sm:mb-4 max-w-md">
          <Search className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 text-[#a1a1a6] pointer-events-none" size={14} />
          <input type="text" placeholder="Cerca cliente, progetto..."
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 bg-white border border-[#e8e8ed] rounded-xl text-[12px] sm:text-[13px] text-[#1d1d1f] placeholder:text-[#c7c7cc] focus:ring-2 focus:ring-[#0071e3]/20 focus:border-[#0071e3]/40 outline-none transition-all" />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-[#c7c7cc] hover:text-[#86868b] transition-colors">
              <X size={13} />
            </button>
          )}
        </div>

        {/* ═══ Lista ═══ */}
        {loading ? (
          <div className="flex flex-col items-center py-24 text-[#a1a1a6] gap-3">
            <Loader2 className="animate-spin" size={24} />
            <p className="text-[13px]">Caricamento…</p>
          </div>
        ) : filteredQuotes.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-[15px] font-medium text-[#86868b]">
              {searchTerm ? 'Nessun risultato' : 'Nessun preventivo ancora'}
            </p>
            {!searchTerm && (
              <button onClick={() => setShowForm(true)} className="mt-3 text-[13px] font-semibold text-[#0071e3] hover:underline">
                Crea il primo →
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#e8e8ed] overflow-hidden shadow-sm">
            {/* Header colonne (solo desktop) */}
            <div className="hidden md:grid bg-[#fafafa] border-b border-[#e8e8ed] px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[#a1a1a6]"
              style={{ gridTemplateColumns: '1fr 120px 140px 280px' }}>
              <div>Cliente / Progetto</div>
              <div className="text-right">Importo</div>
              <div className="text-right pr-2">Data</div>
              <div className="text-right">Azioni</div>
            </div>

            <ul className="divide-y divide-[#f0f0f3]">
              {filteredQuotes.map(quote => {
                const status = STATUS_MAP[quote.statusColor] || STATUS_MAP.blue;
                const amount = quote.summary?.subtotal || 0;
                const company = resolveCompanyData(quote.companyData);
                const hasContract = !!quote.contractData;
                const date = parseQuoteDate(quote);

                return (
                  <li key={quote.id} className="group hover:bg-[#fbfbfd] transition-colors">
                    {/* ═══ DESKTOP LAYOUT (CSS Grid: allineamento perfetto) ═══ */}
                    <div
                      className="hidden md:grid items-center px-5 py-5"
                      style={{ gridTemplateColumns: '1fr 120px 140px 280px' }}
                    >
                      {/* ── COL 1: Cliente / Progetto / Indirizzo ── */}
                      <Link
                        to={`/admin/quote/${quote.id}/edit`}
                        className="min-w-0 flex-1"
                      >
                        {/* Riga 1: Logo + Cliente + Indirizzo fianco a fianco */}
                        <div className="flex items-center gap-2 mb-1">
                          <CompanyMini company={company} />
                          <p className="text-[14px] font-bold text-[#1d1d1f] group-hover:text-[#0071e3] transition-colors">
                            {quote.clientName || '—'}
                          </p>
                          {quote.address && (
                            <>
                              <span className="text-[#d2d2d7]">·</span>
                              <p className="text-[11px] text-[#86868b] truncate">
                                {quote.address}
                              </p>
                            </>
                          )}
                        </div>
                        {/* Riga 2: Progetto (singola riga, truncate) */}
                        <p className="text-[12px] text-[#86868b] truncate leading-tight font-medium">
                          {quote.projectName || 'Senza titolo'}
                        </p>
                      </Link>

                      {/* ── COL 2: Importo (larghezza fissa, allineato a destra) ── */}
                      <div className="text-right pr-4">
                        {amount > 0 ? (
                          <p className="text-[14px] font-bold text-[#1d1d1f] tabular-nums">
                            {formatCurrency(amount)}
                          </p>
                        ) : (
                          <p className="text-[12px] text-[#c7c7cc]">—</p>
                        )}
                      </div>

                      {/* ── COL 3: Data (larghezza fissa) ── */}
                      <div className="text-right pr-4">
                        <p className="text-[12px] text-[#1d1d1f] font-medium tabular-nums leading-tight">
                          {formatItDate(date)}
                        </p>
                        <p className="text-[10px] text-[#a1a1a6] mt-0.5">
                          {timeAgo(date)}
                        </p>
                      </div>

                      {/* ── COL 4: Azioni (larghezza fissa) ── */}
                      <div className="flex items-center justify-end gap-1">
                        {copiedId === quote.id && (
                          <span className="text-[10px] font-semibold text-emerald-600 mr-1 animate-in fade-in">✓ Copiato</span>
                        )}

                        <IconBtn title="Copia link cliente" accent onClick={() => handleCopyLink(quote)}>
                          <LinkIcon size={14} />
                        </IconBtn>

                        <a
                          href={`/quote/${quote.id}`}
                          target="_blank"
                          rel="noreferrer"
                          title="Apri pagina pubblica"
                          onClick={(e) => e.stopPropagation()}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#86868b] hover:text-[#1d1d1f] hover:bg-[#f0f0f3] transition-all"
                        >
                          <ExternalLink size={14} />
                        </a>

                        {hasContract && (
                          <Link
                            to={`/admin/contract/${quote.id}/preview`}
                            title="Vedi contratto"
                            onClick={(e) => e.stopPropagation()}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-purple-500 hover:text-purple-700 hover:bg-purple-50 transition-all"
                          >
                            <FileText size={14} />
                          </Link>
                        )}

                        <IconBtn title="Duplica" onClick={() => openDuplicateModal(quote)}>
                          <Copy size={14} />
                        </IconBtn>

                        <IconBtn title="Elimina" danger onClick={() => handleDelete(quote)}>
                          <Trash2 size={14} />
                        </IconBtn>

                        {/* Separatore + CTA principale */}
                        <span className="w-px h-5 bg-[#e8e8ed] mx-1" />

                        <Link
                          to={`/admin/quote/${quote.id}/edit`}
                          title="Apri preventivo"
                          className="inline-flex items-center gap-1 h-8 px-3 text-[12px] font-semibold text-white bg-[#1d1d1f] rounded-lg hover:bg-[#333] active:scale-[0.97] transition-all"
                        >
                          Apri <ArrowRight size={12} />
                        </Link>
                      </div>
                    </div>

                    {/* ═══ MOBILE LAYOUT ═══ */}
                    <div className="flex md:hidden flex-col gap-3 px-4 py-5">
                      {/* Row 1: Stato + Cliente + Importo */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {/* Stato eyebrow (compact) */}
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-bold ${status.bg}`}>
                              <span className={`w-0.5 h-0.5 rounded-full ${status.dot}`} />
                              {quote.statusText || status.label}
                            </span>
                            {hasContract && (
                              <span className="inline-flex items-center px-1 py-0.5 rounded text-[7px] font-bold uppercase bg-purple-50 text-purple-600">
                                C.
                              </span>
                            )}
                            <CompanyMini company={company} />
                          </div>

                          {/* Cliente (bold) */}
                          <Link
                            to={`/admin/quote/${quote.id}/edit`}
                            className="block text-[13px] sm:text-[14px] font-bold text-[#1d1d1f] leading-tight hover:text-[#0071e3] transition-colors"
                          >
                            {quote.clientName || '—'}
                          </Link>
                        </div>

                        {/* Importo (right-aligned) */}
                        <div className="text-right shrink-0">
                          {amount > 0 ? (
                            <p className="text-[12px] sm:text-[13px] font-bold text-[#1d1d1f] tabular-nums">
                              {formatCurrency(amount)}
                            </p>
                          ) : (
                            <p className="text-[11px] text-[#c7c7cc]">—</p>
                          )}
                        </div>
                      </div>

                      {/* Row 2: Data + Progetto */}
                      <div className="flex items-center justify-between gap-2 text-[10px] sm:text-[11px]">
                        <p className="text-[#86868b] flex-1 min-w-0 line-clamp-1">
                          {quote.projectName || 'Senza titolo'}
                        </p>
                        <span className="text-[#a1a1a6] shrink-0 tabular-nums">
                          {timeAgo(date)}
                        </span>
                      </div>

                      {/* Row 3: Toolbar (horizontal, compact icons) */}
                      <div className="flex items-center gap-1.5 pt-1">
                        {copiedId === quote.id && (
                          <span className="text-[9px] font-semibold text-emerald-600 mr-0.5">✓</span>
                        )}

                        <Link
                          to={`/admin/quote/${quote.id}/edit`}
                          title="Apri"
                          className="flex-1 flex items-center justify-center h-7 text-[11px] font-semibold text-white bg-[#1d1d1f] rounded hover:bg-[#333] active:scale-[0.97] transition-all"
                        >
                          Apri
                        </Link>

                        <IconBtn title="Copia link" accent onClick={() => handleCopyLink(quote)}>
                          <LinkIcon size={12} />
                        </IconBtn>

                        <a
                          href={`/quote/${quote.id}`}
                          target="_blank"
                          rel="noreferrer"
                          title="Pubblica"
                          onClick={(e) => e.stopPropagation()}
                          className="w-7 h-7 rounded flex items-center justify-center text-[#86868b] hover:text-[#1d1d1f] hover:bg-[#f0f0f3] transition-all"
                        >
                          <ExternalLink size={12} />
                        </a>

                        {hasContract && (
                          <Link
                            to={`/admin/contract/${quote.id}/preview`}
                            title="Contratto"
                            onClick={(e) => e.stopPropagation()}
                            className="w-7 h-7 rounded flex items-center justify-center text-purple-500 hover:text-purple-700 hover:bg-purple-50 transition-all"
                          >
                            <FileText size={12} />
                          </Link>
                        )}

                        <IconBtn title="Duplica" onClick={() => openDuplicateModal(quote)}>
                          <Copy size={12} />
                        </IconBtn>

                        <IconBtn title="Elimina" danger onClick={() => handleDelete(quote)}>
                          <Trash2 size={12} />
                        </IconBtn>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}        {/* ─── Counter ─── */}
        {!loading && filteredQuotes.length > 0 && (
          <p className="text-center text-[10px] sm:text-[11px] text-[#c7c7cc] pt-4 sm:pt-6 pb-2">
            {filteredQuotes.length} preventiv{filteredQuotes.length === 1 ? 'o' : 'i'}
            {searchTerm && ` per "${searchTerm}"`}
          </p>
        )}
      </main>
    </div>
  );
}
