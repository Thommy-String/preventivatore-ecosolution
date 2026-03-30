import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { doc, setDoc, collection, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Loader2, Plus, Search, X } from 'lucide-react';

const formatCurrency = (v) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

const STATUS_MAP = {
  blue:   { label: 'Nuovo',        bg: 'bg-blue-50',    text: 'text-blue-600',    dot: 'bg-blue-500' },
  yellow: { label: 'In lavorazione', bg: 'bg-amber-50',   text: 'text-amber-600',   dot: 'bg-amber-500' },
  green:  { label: 'Completato',    bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  red:    { label: 'Annullato',     bg: 'bg-red-50',     text: 'text-red-500',     dot: 'bg-red-500' },
};

export default function AdminDashboard() {
  const [quotes, setQuotes] = useState([]);
  const [clientName, setClientName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { fetchQuotes(); }, []);

  const fetchQuotes = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "preventivi"));
      const quotesList = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setQuotes(quotesList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (error) { console.error("Errore:", error); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Eliminare definitivamente il preventivo per "${name}"?`)) {
      try { await deleteDoc(doc(db, "preventivi", id)); setQuotes(q => q.filter(x => x.id !== id)); }
      catch { alert("Errore durante l'eliminazione."); }
    }
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
      q.projectName?.toLowerCase().includes(s)
    );
  }, [searchTerm, quotes]);

  return (
    <div className="bg-[#f5f5f7] min-h-screen font-sans selection:bg-blue-100">

      {/* ═══ Header ═══ */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-[#e8e8ed] sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-5 h-[52px] flex items-center justify-between">
          <h1 className="text-[15px] font-bold text-[#1d1d1f] tracking-tight">
            ECO SOLUTION <span className="text-[#86868b] font-normal">Preventivi</span>
          </h1>
          <button onClick={() => setShowForm(f => !f)}
            className="flex items-center gap-1.5 h-8 px-4 text-[13px] font-semibold text-white bg-[#0071e3] rounded-full hover:bg-[#0077ED] active:scale-[0.97] transition-all">
            {showForm ? <X size={14} /> : <Plus size={14} />}
            {showForm ? 'Chiudi' : 'Nuovo'}
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 pt-5 pb-20">

        {/* ═══ Form creazione (slide-down) ═══ */}
        {showForm && (
          <form onSubmit={handleCreateQuote}
            className="bg-white rounded-2xl p-5 border border-[#e8e8ed] mb-5 animate-in slide-in-from-top">
            <p className="text-[13px] font-semibold text-[#1d1d1f] mb-3">Crea nuovo preventivo</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Nome cliente"
                className="flex-1 bg-[#f5f5f7] border border-[#e8e8ed] rounded-xl px-4 py-2.5 text-[13px] text-[#1d1d1f] placeholder:text-[#a1a1a6] focus:ring-2 focus:ring-[#0071e3]/20 focus:border-[#0071e3] outline-none" />
              <input value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="Nome progetto"
                className="flex-1 bg-[#f5f5f7] border border-[#e8e8ed] rounded-xl px-4 py-2.5 text-[13px] text-[#1d1d1f] placeholder:text-[#a1a1a6] focus:ring-2 focus:ring-[#0071e3]/20 focus:border-[#0071e3] outline-none" />
              <button type="submit" disabled={creating || !clientName.trim() || !projectName.trim()}
                className="h-[42px] px-6 text-[13px] font-semibold text-white bg-[#1d1d1f] rounded-xl hover:bg-[#333] active:scale-[0.97] transition-all disabled:opacity-40 shrink-0 flex items-center justify-center gap-2">
                {creating ? <Loader2 className="animate-spin" size={14}/> : <Plus size={14} />} Crea
              </button>
            </div>
          </form>
        )}

        {/* ═══ Barra ricerca ═══ */}
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a1a1a6] pointer-events-none" size={15} />
          <input type="text" placeholder="Cerca cliente o progetto..."
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/80 backdrop-blur border border-[#e8e8ed] rounded-xl text-[13px] text-[#1d1d1f] placeholder:text-[#c7c7cc] focus:ring-2 focus:ring-[#0071e3]/20 focus:border-[#0071e3]/40 outline-none transition-all" />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c7c7cc] hover:text-[#86868b] transition-colors">
              <X size={14} />
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
          <div className="space-y-3">
            {filteredQuotes.map(quote => {
              const status = STATUS_MAP[quote.statusColor] || STATUS_MAP.blue;
              const amount = quote.summary?.subtotal || 0;

              return (
                <div key={quote.id} className="bg-white rounded-2xl border border-[#e8e8ed] hover:border-[#c7c7cc] hover:shadow-sm transition-all overflow-hidden">

                  {/* ── Top: info clickabile ── */}
                  <Link to={`/admin/quote/${quote.id}/edit`} className="block px-5 pt-4 pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[15px] font-semibold text-[#1d1d1f] leading-tight truncate">
                          {quote.projectName}
                        </h3>
                        <p className="text-[12px] text-[#86868b] mt-1 leading-snug">
                          {quote.clientName}
                          <span className="mx-1.5 text-[#e8e8ed]">·</span>
                          {quote.date}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        {amount > 0 && (
                          <p className="text-[15px] font-bold text-[#1d1d1f] tabular-nums tracking-tight">
                            {formatCurrency(amount)}
                          </p>
                        )}
                        <div className={`inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-md ${status.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                          <span className={`text-[10px] font-semibold ${status.text}`}>
                            {quote.statusText || status.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* ── Bottom: azioni con label testuali ── */}
                  <div className="flex items-center border-t border-[#f0f0f3] divide-x divide-[#f0f0f3]">
                    <Link to={`/admin/quote/${quote.id}/edit`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[12px] font-medium text-[#86868b] hover:text-[#0071e3] hover:bg-blue-50/50 transition-all">
                      Modifica
                    </Link>
                    <Link to={`/quote/${quote.id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[12px] font-medium text-[#86868b] hover:text-emerald-600 hover:bg-emerald-50/50 transition-all">
                      Preventivo
                    </Link>
                    <Link to={`/contract/${quote.id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[12px] font-medium text-[#86868b] hover:text-purple-600 hover:bg-purple-50/50 transition-all">
                      Contratto
                    </Link>
                    <button onClick={() => handleDelete(quote.id, quote.clientName)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[12px] font-medium text-[#c7c7cc] hover:text-red-500 hover:bg-red-50/50 transition-all">
                      Elimina
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ─── Counter ─── */}
        {!loading && filteredQuotes.length > 0 && (
          <p className="text-center text-[11px] text-[#c7c7cc] pt-6 pb-2">
            {filteredQuotes.length} preventiv{filteredQuotes.length === 1 ? 'o' : 'i'}
            {searchTerm && ` per "${searchTerm}"`}
          </p>
        )}
      </main>
    </div>
  );
}