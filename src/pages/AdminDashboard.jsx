import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { doc, setDoc, collection, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import { 
  Loader2, Plus, FileText, Edit, Eye, Trash2, 
  Search, TrendingUp, Users, ChevronRight 
} from 'lucide-react';

// --- SOTTO-COMPONENTI UI ---
const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm flex items-center gap-5">
    <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center text-white`}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{title}</p>
      <p className="text-2xl font-black text-gray-900">{value}</p>
    </div>
  </div>
);

export default function AdminDashboard() {
  const [quotes, setQuotes] = useState([]);
  const [clientName, setClientName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "preventivi"));
      const quotesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Ordiniamo per data di creazione decrescente
      setQuotes(quotesList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (error) {
      console.error("Errore:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- LOGICA CANCELLAZIONE ---
  const handleDelete = async (id, name) => {
    if (window.confirm(`Sei sicuro di voler eliminare il preventivo per "${name}"? L'azione è irreversibile.`)) {
      try {
        await deleteDoc(doc(db, "preventivi", id));
        setQuotes(quotes.filter(q => q.id !== id));
      } catch (error) {
        alert("Errore durante l'eliminazione.");
      }
    }
  };

  const handleCreateQuote = async (e) => {
    e.preventDefault();
    if (!clientName || !projectName) return;
    setCreating(true);

    const newId = `prev-${Date.now()}`;
    const newQuote = {
      id: newId,
      clientName,
      projectName,
      date: new Date().toLocaleDateString('it-IT'),
      sections: [],
      summary: { subtotal: 0, total: 0 },
      statusText: 'Nuovo',
      statusColor: 'blue',
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, "preventivi", newId), newQuote);
      setQuotes([newQuote, ...quotes]);
      setClientName('');
      setProjectName('');
    } catch (error) {
      alert("Errore nel salvataggio.");
    } finally {
      setCreating(false);
    }
  };

  // --- FILTRO LIVE ---
  const filteredQuotes = useMemo(() => {
    return quotes.filter(q => 
      q.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.projectName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, quotes]);

  // --- CALCOLO STATISTICHE ---
  const stats = useMemo(() => {
    const totalVolume = quotes.reduce((acc, q) => acc + (q.summary?.subtotal || 0), 0);
    return {
      count: quotes.length,
      volume: new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(totalVolume),
      active: quotes.filter(q => q.statusColor === 'blue' || q.statusColor === 'yellow').length
    };
  }, [quotes]);

  return (
    <div className="bg-[#F8F9FA] min-h-screen font-sans pb-20">
      
      {/* Header Soft Blur */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white">
                <TrendingUp size={20} />
              </div>
              <h1 className="text-xl font-black tracking-tight text-gray-900">PreventivoPro <span className="text-blue-600">Admin</span></h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:block text-right">
                <p className="text-xs font-bold text-gray-400 uppercase">Benvenuto</p>
                <p className="text-sm font-bold text-gray-900">Pro Casa Parquet</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white shadow-sm overflow-hidden">
                <img src="https://ui-avatars.com/api/?name=Pro+Casa&background=0D8ABC&color=fff" alt="avatar" />
              </div>
            </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-8">
        
        {/* STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Preventivi Totali" value={stats.count} icon={FileText} color="bg-blue-500" />
          <StatCard title="Volume d'affari" value={stats.volume} icon={TrendingUp} color="bg-emerald-500" />
          <StatCard title="In Lavorazione" value={stats.active} icon={Users} color="bg-amber-500" />
        </div>

        {/* CREAZIONE RAPIDA */}
        <section className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
          <h2 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
            <Plus className="text-blue-500" /> Nuovo Preventivo Rapido
          </h2>
          <form onSubmit={handleCreateQuote} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-2 mb-2 block">Cliente</label>
              <input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Nome e Cognome"
                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
            <div className="flex-1 w-full">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-2 mb-2 block">Progetto</label>
              <input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Es. Posa Rovere Spina"
                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
            <button 
              type="submit" 
              disabled={creating} 
              className="bg-black text-white px-8 py-3.5 rounded-2xl font-bold text-sm hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {creating ? <Loader2 className="animate-spin" size={18}/> : <Plus size={18} />}
              Crea Progetto
            </button>
          </form>
        </section>

        {/* LISTA E RICERCA */}
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-2xl font-black text-gray-900">Archivio Digitale</h2>
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text"
                placeholder="Cerca cliente o progetto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-6 py-3 bg-white border border-gray-200 rounded-2xl text-sm w-full md:w-80 shadow-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
              />
            </div>
          </div>

          {loading ? (
             <div className="flex flex-col items-center py-20 text-gray-400 gap-4">
                <Loader2 className="animate-spin" size={40} />
                <p className="font-bold">Sincronizzazione Cloud...</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredQuotes.map(quote => (
                <div key={quote.id} className="group bg-white p-2 pl-6 rounded-[28px] border border-gray-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all flex flex-col md:flex-row justify-between items-center gap-4">
                  
                  {/* Info */}
                  <div className="py-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-black text-gray-900">{quote.projectName}</h3>
                      {/* Badge Stato (Dinamico) */}
                      <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-tighter ${
                        quote.statusColor === 'green' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {quote.statusText || 'Inviato'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-1 font-bold uppercase tracking-wider">
                        <span>{quote.clientName}</span>
                        <span className="text-gray-200">•</span>
                        <span>{quote.date}</span>
                    </div>
                  </div>

                  {/* Azioni */}
                  <div className="flex items-center gap-2 p-2 bg-gray-50 md:bg-transparent rounded-[24px] w-full md:w-auto">
                    <Link to={`/admin/quote/${quote.id}/edit`} className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                      <Edit size={20} />
                    </Link>
                    <Link to={`/quote/${quote.id}`} className="p-3 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all">
                      <Eye size={20} />
                    </Link>
                    <button 
                      onClick={() => handleDelete(quote.id, quote.clientName)}
                      className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 size={20} />
                    </button>
                    <div className="h-8 w-[1px] bg-gray-200 mx-2 hidden md:block"></div>
                    <Link to={`/admin/quote/${quote.id}/edit`} className="hidden md:flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-200 text-xs font-black text-gray-900 hover:bg-black hover:text-white transition-all">
                      Gestisci <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}