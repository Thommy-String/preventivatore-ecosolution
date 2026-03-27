import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate, } from 'react-router-dom';
import { doc, getDoc, setDoc } from "firebase/firestore"; // <--- NUOVI IMPORT FIREBASE
import { db } from "../firebase"; // <--- IL TUO FILE DI COLLEGAMENTO
import {
  LinkIcon, Save, Trash2, Plus, Copy, ArrowUp, ArrowDown, X, Image as ImageIcon, Calculator
} from 'lucide-react';

import { DEFAULT_TEAM } from '../config/defaultTeam';

import TimelineEditor from '../components/TimelineEditor';
import PaymentPlan from '../components/PaymentPlan';
import TeamEditor from '../components/TeamEditor';
import MaterialsEditor from '../components/MaterialsEditor';
import SectionMaterialsEditor from '../components/SectionMaterialsEditor';

// --- Componenti UI Helpers ---
const Label = ({ children }) => (
  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
    {children}
  </label>
);

const StyledInput = (props) => (
  <input
    {...props}
    className="block w-full px-4 py-2.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm placeholder:text-gray-400"
  />
);

const StyledTextArea = (props) => (
  <textarea
    {...props}
    className="block w-full px-4 py-2.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm placeholder:text-gray-400 min-h-[80px]"
  />
);

const IconButton = ({ onClick, icon: Icon, color = "text-gray-400 hover:text-gray-600", title }) => (
  <button onClick={onClick} className={`p-2 rounded-md hover:bg-gray-100 transition-colors ${color}`} title={title}>
    <Icon size={18} />
  </button>
);

// Funzione per generare ID univoci davvero (Timestamp + Numero Casuale)
const generateUniqueId = (prefix) => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// --- CONFIGURAZIONE COLORI STATO ---
const STATUS_OPTIONS = [
  { id: 'blue', bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-500', border: 'border-blue-200' },
  { id: 'green', bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500', border: 'border-emerald-200' },
  { id: 'yellow', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', border: 'border-amber-200' },
  { id: 'gray', bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400', border: 'border-gray-200' },
  { id: 'purple', bg: 'bg-purple-50', text: 'text-purple-600', dot: 'bg-purple-500', border: 'border-purple-200' },
  { id: 'red', bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500', border: 'border-red-200' },
];

export default function EditQuotePage() { // Non servono più props qui
  const { quoteId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Stato iniziale vuoto (lo riempiremo da Firebase)
  const [editingQuote, setEditingQuote] = useState({
    projectName: '',
    clientName: '',
    date: new Date().toISOString().split('T')[0],
    statusText: 'In corso',
    statusColor: 'blue',
    notes: '',
    publicNotes: '',
    termsAndConditions: '',
    sections: [],
    teamMembers: DEFAULT_TEAM,
    materials: [],
    daySettings: {},
  });

  // --- 1. CARICAMENTO DATI DA FIREBASE ---
  useEffect(() => {
    const loadQuote = async () => {
      if (!quoteId || quoteId === 'new') {
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, "preventivi", quoteId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          // Backward compat: migrate THREE_WAY → CUSTOM
          if (data.paymentType === 'THREE_WAY') {
            data.paymentType = 'CUSTOM';
            if (!data.customTranches) {
              data.customTranches = [
                { label: "Acconto Iniziale", percentage: 30, dueDate: "All'accettazione del preventivo", description: "Necessario per l'approvvigionamento materiali e pianificazione cantiere." },
                { label: "A Metà Lavori", percentage: 30, dueDate: "Al raggiungimento del 50% dei lavori", description: "Stato avanzamento lavori intermedio." },
                { label: "Saldo Finale", percentage: 40, dueDate: "A fine lavori", description: "Da versare a seguito del collaudo finale." }
              ];
            }
          }
          setEditingQuote(data);
        } else {
          console.log("Nessun preventivo trovato, ne creiamo uno nuovo.");
        }
      } catch (error) {
        console.error("Errore caricamento:", error);
        alert("Errore di connessione al database.");
      } finally {
        setLoading(false);
      }
    };

    loadQuote();
  }, [quoteId]);


  // --- Logica Calcoli Live ---
  const liveSummary = useMemo(() => {
    if (!editingQuote) return { subtotal: 0, total: 0 };
    let subtotal = 0;
    editingQuote.sections.forEach(section => {
      section.items.forEach(item => {
        subtotal += (parseFloat(item.price) || 0) * (parseFloat(item.quantity) || 0);
      });
    });
    // Il totale ora coincide con l'imponibile
    return { subtotal, total: subtotal };
  }, [editingQuote]);

  // Ricalcola importi pagamenti quando il totale cambia
  useEffect(() => {
    if (!editingQuote.paymentType || !editingQuote.paymentPlan?.length) return;
    const total = liveSummary.total;
    const type = editingQuote.paymentType;

    if (type === 'CUSTOM' && editingQuote.customTranches?.length) {
      const updatedPlan = editingQuote.customTranches.map(t => ({
        label: t.label,
        amount: (total * (parseFloat(t.percentage) || 0)) / 100,
        percentage: parseFloat(t.percentage) || 0,
        dueDate: t.dueDate,
        description: t.description || "",
        isPaid: false
      }));
      setEditingQuote(prev => ({ ...prev, paymentPlan: updatedPlan }));
    } else if (type === 'PERCENTAGE') {
      const perc = parseFloat(editingQuote.paymentValue) || 0;
      const deposit = (total * perc) / 100;
      setEditingQuote(prev => ({
        ...prev,
        paymentPlan: [
          { ...prev.paymentPlan[0], amount: deposit, percentage: perc },
          { ...prev.paymentPlan[1], amount: total - deposit, percentage: 100 - perc }
        ]
      }));
    } else if (type === 'FIXED') {
      const fixed = parseFloat(editingQuote.paymentValue) || 0;
      setEditingQuote(prev => ({
        ...prev,
        paymentPlan: [
          { ...prev.paymentPlan[0], amount: fixed },
          { ...prev.paymentPlan[1], amount: total - fixed }
        ]
      }));
    } else if (type === 'FIRST_DAY') {
      const fixed = parseFloat(editingQuote.paymentValue) || 0;
      setEditingQuote(prev => ({
        ...prev,
        paymentPlan: [
          { ...prev.paymentPlan[0], amount: fixed },
          { ...prev.paymentPlan[1], amount: total - fixed }
        ]
      }));
    } else if (type === 'SINGLE') {
      setEditingQuote(prev => ({
        ...prev,
        paymentPlan: [{ ...prev.paymentPlan[0], amount: total }]
      }));
    } else if (type === 'MILESTONES') {
      // Re-trigger full recalc with stored config
      setPaymentStrategy('MILESTONES', editingQuote.milestoneConfig || { depositPercentage: 0, tappe: [] });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveSummary.total]);

  // --- Handlers (Uguali a prima) ---
  const handleDetailsChange = (e) => {
    const { name, value } = e.target;
    setEditingQuote(prev => ({ ...prev, [name]: value }));
  };

  const handleSectionChange = (index, e) => {
    const { name, value } = e.target;
    setEditingQuote(prev => {
      const newSections = [...prev.sections];
      newSections[index] = { ...newSections[index], [name]: value };
      return { ...prev, sections: newSections };
    });
  };

  const addSection = () => {
    const newSection = {
      id: generateUniqueId('sect'), // Usa il nuovo generatore
      title: 'Nuova Sezione',
      description: '',
      photos: [],
      items: [],
      materials: [],
    };
    setEditingQuote(prev => ({ ...prev, sections: [...prev.sections, newSection] }));
  };

  const duplicateSection = (index) => {
    const sectionToCopy = editingQuote.sections[index];

    // Creiamo una COPIA profonda e rigeneriamo gli ID di ogni singola voce
    const newSection = {
      ...sectionToCopy,
      id: generateUniqueId('sect'), // Nuovo ID per la sezione
      title: `${sectionToCopy.title} (Copia)`,
      items: sectionToCopy.items.map(item => ({
        ...item,
        id: generateUniqueId('item') // CRUCIALE: Nuovo ID per ogni voce duplicata
      })),
      materials: (sectionToCopy.materials || []).map(mat => ({
        ...mat,
        id: generateUniqueId('smat'),
        specs: [...(mat.specs || [])],
      })),
      // Rigeneriamo anche gli ID delle foto se necessario, o le lasciamo così (ma le foto non hanno ID nel nostro codice, solo url)
      photos: [...(sectionToCopy.photos || [])]
    };

    setEditingQuote(prev => {
      const newSections = [...prev.sections];
      newSections.splice(index + 1, 0, newSection);
      return { ...prev, sections: newSections };
    });
  };

  const moveSection = (index, direction) => {
    setEditingQuote(prev => {
      const newSections = [...prev.sections];
      if (direction === 'up' && index > 0) {
        [newSections[index], newSections[index - 1]] = [newSections[index - 1], newSections[index]];
      } else if (direction === 'down' && index < newSections.length - 1) {
        [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
      }
      return { ...prev, sections: newSections };
    });
  };

  const deleteSection = (index) => {
    if (confirm('Eliminare questa sezione?')) {
      setEditingQuote(prev => ({
        ...prev,
        sections: prev.sections.filter((_, i) => i !== index)
      }));
    }
  };

  const handleItemChange = (sectionIndex, itemIndex, e) => {
    const { name, value } = e.target;
    setEditingQuote(prev => {
      const newSections = [...prev.sections];
      const newItems = [...newSections[sectionIndex].items];
      newItems[itemIndex] = { ...newItems[itemIndex], [name]: value };
      newSections[sectionIndex] = { ...newSections[sectionIndex], items: newItems };
      return { ...prev, sections: newSections };
    });
  };

  const addItem = (sectionIndex) => {
    const newItem = {
      id: generateUniqueId('item'), // Usa il nuovo generatore
      description: '',
      quantity: 1,
      unit: 'pz',
      price: 0
    };
    setEditingQuote(prev => {
      const newSections = [...prev.sections];
      // Assicuriamoci che l'array items esista
      if (!newSections[sectionIndex].items) {
        newSections[sectionIndex].items = [];
      }
      newSections[sectionIndex].items.push(newItem);
      return { ...prev, sections: newSections };
    });
  };

  const deleteItem = (sectionIndex, itemIndex) => {
    setEditingQuote(prev => {
      const newSections = [...prev.sections];
      newSections[sectionIndex].items.splice(itemIndex, 1);
      return { ...prev, sections: newSections };
    });
  };

  const handlePhotoChange = (sectionIndex, photoIndex, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // 1. Configurazione Canvas per ridimensionamento
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800; // Qualità superiore rispetto al team, ma comunque leggera
        const scaleSize = MAX_WIDTH / img.width;

        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // 2. Esportazione compressa (JPEG qualità 0.7)
        // Questo riduce una foto da 5MB a circa 150KB
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);

        // 3. Salvataggio nello stato
        setEditingQuote(prev => {
          const newSections = [...prev.sections];
          const newPhotos = [...(newSections[sectionIndex].photos || [])];
          newPhotos[photoIndex] = {
            type: photoIndex === 0 ? 'before' : 'after',
            url: compressedDataUrl
          };
          newSections[sectionIndex].photos = newPhotos;
          return { ...prev, sections: newSections };
        });
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = (sectionIndex, photoIndex) => {
    setEditingQuote(prev => {
      const newSections = [...prev.sections];
      const newPhotos = [...(newSections[sectionIndex].photos || [])];
      newPhotos[photoIndex] = null;
      newSections[sectionIndex].photos = newPhotos.filter(Boolean);
      return { ...prev, sections: newSections };
    });
  };



  const setPaymentStrategy = (type, value = 0) => {
    const total = liveSummary.total;
    let plan = [];

    // Assicuriamoci che il valore sia numerico per i calcoli
    const numericValue = parseFloat(value) || 0;

    if (type === 'PERCENTAGE') {
      const deposit = (total * numericValue) / 100;
      plan = [
        { label: "Acconto Iniziale", amount: deposit, percentage: numericValue, dueDate: "All'accettazione del preventivo", description: "Necessario per l'approvvigionamento materiali e pianificazione cantiere.", isPaid: false },
        { label: "Saldo Finale", amount: total - deposit, percentage: 100 - numericValue, dueDate: "A fine lavori", description: "Da versare a seguito del collaudo finale.", isPaid: false }
      ];
    } else if (type === 'FIXED') {
      plan = [
        { label: "Acconto Iniziale", amount: numericValue, dueDate: "All'accettazione", description: "Quota fissa di prenotazione.", isPaid: false },
        { label: "Saldo Finale", amount: total - numericValue, dueDate: "A fine lavori", isPaid: false }
      ];
    } else if (type === 'FIRST_DAY') {
      // --- NUOVA LOGICA AGGIUNTA ---
      plan = [
        {
          label: "1° SAL (Stato Avanzamento)",
          amount: numericValue,
          dueDate: "Al termine della 1ª giornata",
          description: "Quota da versare alla fine del primo giorno di posa/lavoro.",
          isPaid: false
        },
        {
          label: "Saldo Finale",
          amount: total - numericValue,
          dueDate: "A fine lavori",
          description: "A conclusione delle opere.",
          isPaid: false
        }
      ];
    } else if (type === 'CUSTOM') {
      // value è un array di tranches: [{ label, percentage, dueDate, description }]
      const tranches = Array.isArray(value) ? value : [
        { label: "Acconto Iniziale", percentage: 30, dueDate: "All'accettazione del preventivo", description: "Necessario per l'approvvigionamento materiali e pianificazione cantiere." },
        { label: "A Metà Lavori", percentage: 30, dueDate: "Al raggiungimento del 50% dei lavori", description: "Stato avanzamento lavori intermedio." },
        { label: "Saldo Finale", percentage: 40, dueDate: "A fine lavori", description: "Da versare a seguito del collaudo finale." }
      ];
      plan = tranches.map(t => ({
        label: t.label,
        amount: (total * (parseFloat(t.percentage) || 0)) / 100,
        percentage: parseFloat(t.percentage) || 0,
        dueDate: t.dueDate,
        description: t.description || "",
        isPaid: false
      }));
    } else if (type === 'MILESTONES') {
      // value = { depositPercentage?: number, tappe: [{ id, titleItemKey, itemKeys: [] }] }
      const config = typeof value === 'object' && value !== null ? value : { depositPercentage: 0, tappe: [] };
      const { depositPercentage = 0, tappe = [] } = config;
      const sections = editingQuote.sections || [];

      // Helper: resolve itemKey "sectionId::itemId" → { item, section }
      const resolveKey = (key) => {
        const [secId, itemId] = key.split('::');
        const sec = sections.find(s => s.id === secId);
        const item = sec?.items?.find(i => i.id === itemId);
        return { section: sec, item };
      };
      const itemAmount = (key) => {
        const { item } = resolveKey(key);
        return item ? (parseFloat(item.price) || 0) * (parseFloat(item.quantity) || 0) : 0;
      };

      // Optional initial deposit
      const depositAmount = depositPercentage > 0 ? (total * depositPercentage) / 100 : 0;
      if (depositPercentage > 0) {
        plan.push({
          label: "Acconto Iniziale",
          amount: depositAmount,
          percentage: depositPercentage,
          dueDate: "All'accettazione del preventivo",
          description: "Anticipo per approvvigionamento materiali e avvio cantiere.",
          isPaid: false,
          isMilestoneDeposit: true
        });
      }

      // Collect all assigned itemKeys
      const allAssignedKeys = new Set(tappe.flatMap(t => t.itemKeys || []));

      // Build milestone payment rows
      tappe.forEach((tappa, idx) => {
        const tappaTotal = (tappa.itemKeys || []).reduce((acc, key) => acc + itemAmount(key), 0);
        const adjustedAmount = depositPercentage > 0 ? tappaTotal * (1 - depositPercentage / 100) : tappaTotal;
        // Get title from the titleItemKey
        const titleResolved = tappa.titleItemKey ? resolveKey(tappa.titleItemKey) : null;
        const titleLabel = titleResolved?.item?.description || tappa.customLabel || `Tappa ${idx + 1}`;
        const itemCount = (tappa.itemKeys || []).length;

        plan.push({
          label: titleLabel,
          amount: adjustedAmount,
          dueDate: `Al completamento di: ${titleLabel}`,
          description: `Pagamento per ${itemCount} ${itemCount === 1 ? 'voce' : 'voci'} al termine della lavorazione.`,
          isPaid: false,
          isMilestone: true,
          tappaId: tappa.id
        });
      });

      // Saldo finale: all items NOT assigned to any tappa
      const allItemKeys = sections.flatMap(s => (s.items || []).map(i => `${s.id}::${i.id}`));
      const unassignedKeys = allItemKeys.filter(k => !allAssignedKeys.has(k));
      const unassignedTotal = unassignedKeys.reduce((acc, key) => acc + itemAmount(key), 0);
      const adjustedUnassigned = depositPercentage > 0 ? unassignedTotal * (1 - depositPercentage / 100) : unassignedTotal;

      if (adjustedUnassigned > 0.01) {
        plan.push({
          label: "Saldo Finale",
          amount: adjustedUnassigned,
          dueDate: "A completamento di tutti i lavori",
          description: "Saldo per le lavorazioni rimanenti.",
          isPaid: false
        });
      }
    } else {
      plan = [
        { label: "Soluzione Unica", amount: total, dueDate: "A fine lavori", description: "Nessun acconto richiesto. Pagamento integrale al termine della posa.", isPaid: false }
      ];
    }

    const extra = type === 'CUSTOM' ? { customTranches: Array.isArray(value) ? value : [
      { label: "Acconto Iniziale", percentage: 30, dueDate: "All'accettazione del preventivo", description: "Necessario per l'approvvigionamento materiali e pianificazione cantiere." },
      { label: "A Metà Lavori", percentage: 30, dueDate: "Al raggiungimento del 50% dei lavori", description: "Stato avanzamento lavori intermedio." },
      { label: "Saldo Finale", percentage: 40, dueDate: "A fine lavori", description: "Da versare a seguito del collaudo finale." }
    ]} : type === 'MILESTONES' ? { milestoneConfig: typeof value === 'object' && value !== null ? value : { depositPercentage: 0, tappe: [] } } : {};
    setEditingQuote(prev => ({ ...prev, paymentPlan: plan, paymentType: type, paymentValue: value, ...extra }));
  };

  // --- 2. SALVATAGGIO SU FIREBASE (Versione Debug) ---
  const handleSave = async () => {
    if (!db) {
      alert("ERRORE GRAVE: Il database non è collegato.");
      return;
    }

    try {
      // Salviamo solo l'imponibile come totale
      const finalSummary = {
        subtotal: liveSummary.subtotal,
        total: liveSummary.subtotal,
        vatPercentage: 0 // Impostiamo a 0 o rimuoviamo
      };

      const quoteToSave = {
        ...editingQuote,
        summary: finalSummary,
        lastUpdated: new Date().toISOString()
      };

      const docId = (quoteId && quoteId !== 'new') ? quoteId : `prev-${Date.now()}`;
      quoteToSave.id = docId;

      await setDoc(doc(db, "preventivi", docId), quoteToSave);
      alert("✅ Preventivo salvato correttamente!");

      if (!quoteId || quoteId === 'new') navigate(`/edit/${docId}`, { replace: true });
      else navigate('/admin');

    } catch (error) {
      alert("ERRORE FIREBASE:\n" + error.message);
    }
  };


  const shareQuote = () => {
    // window.location.origin restituisce "https://preventivo-pro-casa-parquet.vercel.app"
    // quando sei sul sito principale.
    const shareUrl = `${window.location.origin}/quote/${quoteId}`;

    navigator.clipboard.writeText(shareUrl)
      .then(() => alert("Link copiato! Ora puoi inviarlo al cliente."));
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Caricamento dal Cloud...</div>;

  return (
    <div className="bg-[#F5F5F7] min-h-screen font-sans pb-32">
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-200">
        <div className="flex items-center gap-3">
          {/* Tasto Condividi: appare solo se il preventivo è già stato salvato (ha un ID) */}
          {quoteId && quoteId !== 'new' && (
            <button
              onClick={shareQuote}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-bold hover:bg-blue-100 transition-all border border-blue-100"
            >
              <LinkIcon size={16} />
              <span className="hidden sm:inline">Copia Link Cliente</span>
            </button>
          )}

          <button
            onClick={handleSave}
            className="bg-black hover:bg-gray-800 text-white px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-sm"
          >
            <Save size={16} /> Salva Online
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Colonna Sinistra */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/60">
            <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
              <span className="w-1 h-6 bg-blue-500 rounded-full"></span> Dettagli Progetto
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* Nome Progetto */}
              <div className="md:col-span-2">
                <Label>Nome Progetto</Label>
                <StyledInput
                  name="projectName"
                  value={editingQuote.projectName}
                  onChange={handleDetailsChange}
                  placeholder="Es. Ristrutturazione Bagno"
                />
              </div>

              {/* Cliente */}
              <div>
                <Label>Cliente</Label>
                <StyledInput
                  name="clientName"
                  value={editingQuote.clientName}
                  onChange={handleDetailsChange}
                  placeholder="Nome Cliente"
                />
              </div>

              {/* --- CONTROLLO STATO (Testo + Colore) --- */}
              <div className="md:col-span-2 border-t border-gray-100 pt-4 mt-2">
                <Label>Stato del Preventivo</Label>
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                  
                  {/* Input Testo */}
                  <div className="w-full md:w-1/3">
                    <StyledInput
                      name="statusText"
                      value={editingQuote.statusText || ''}
                      onChange={handleDetailsChange}
                      placeholder="Es. In Corso"
                    />
                  </div>

                  {/* Selezione Colore */}
                  <div className="flex items-center gap-2">
                    {STATUS_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setEditingQuote(prev => ({ ...prev, statusColor: option.id }))}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                          editingQuote.statusColor === option.id 
                            ? 'ring-2 ring-offset-2 ring-black scale-110' 
                            : 'hover:scale-110 opacity-70 hover:opacity-100'
                        }`}
                        title={option.id}
                      >
                        <div className={`w-6 h-6 rounded-full ${option.bg} border ${option.border}`}></div>
                      </button>
                    ))}
                  </div>

                  {/* Anteprima Live */}
                  <div className="ml-auto hidden md:block">
                    <span className="text-[10px] uppercase font-bold text-gray-400 mr-2">Anteprima:</span>
                    {(() => {
                      const currentStyle = STATUS_OPTIONS.find(o => o.id === (editingQuote.statusColor || 'blue')) || STATUS_OPTIONS[0];
                      return (
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[13px] font-medium border ${currentStyle.bg} ${currentStyle.text} ${currentStyle.border}`}>
                          <div className={`w-2 h-2 rounded-full animate-pulse ${currentStyle.dot}`} />
                          {editingQuote.statusText || 'In elaborazione'}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
              {/* --- FINE CONTROLLO STATO --- */}

              {/* Data Emissione */}
              <div>
                <Label>Data Emissione</Label>
                <StyledInput
                  name="date"
                  type="date"
                  value={editingQuote.date}
                  onChange={handleDetailsChange}
                />
              </div>

              {/* --- NUOVI CAMPI AGGIUNTI --- */}

              {/* Luogo */}
              <div className="md:col-span-2">
                <Label>Luogo intervento</Label>
                <StyledInput
                  name="address"
                  value={editingQuote.address || ''}
                  onChange={handleDetailsChange}
                  placeholder="Es. Via Montenapoleone 12, Milano"
                />
              </div>

              {/* Inizio Lavori (Manuale) */}
              <div>
                <Label>Inizio Lavori Previsto</Label>
                <StyledInput
                  name="estimatedStart"
                  value={editingQuote.estimatedStart || ''}
                  onChange={handleDetailsChange}
                  placeholder="Es. Metà Settembre / 15/09/2024"
                />
              </div>

              {/* Durata (Manuale - Sovrascrive il calcolo automatico) */}
              <div>
                <Label>Durata Lavori (Testo Libero)</Label>
                <StyledInput
                  name="duration"
                  value={editingQuote.duration || ''}
                  onChange={handleDetailsChange}
                  placeholder="Es. 3 Giorni / 1 Settimana"
                />
                <p className="text-[10px] text-gray-400 mt-1 ml-1">
                  Se lasciato vuoto, verrà calcolata in automatico dalle ore.
                </p>
              </div>
              {/* --- FINE NUOVI CAMPI --- */}

              {/* Note Interne */}
              <div className="md:col-span-2">
                <Label>Note Interne</Label>
                <StyledTextArea
                  name="notes"
                  value={editingQuote.notes}
                  onChange={handleDetailsChange}
                  placeholder="Note visibili solo a te..."
                />
              </div>

              {/* Note Pubbliche (visibili al cliente) */}
              <div className="md:col-span-2">
                <Label>Note per il Cliente</Label>
                <StyledTextArea
                  name="publicNotes"
                  value={editingQuote.publicNotes || ''}
                  onChange={handleDetailsChange}
                  placeholder="Note visibili al cliente nel preventivo..."
                />
                <p className="text-[10px] text-gray-400 mt-1 ml-1">
                  Queste note saranno visibili nel preventivo finale.
                </p>
              </div>

              {/* Termini e Condizioni */}
              <div className="md:col-span-2">
                <Label>Termini e Condizioni</Label>
                <StyledTextArea
                  name="termsAndConditions"
                  value={editingQuote.termsAndConditions || ''}
                  onChange={handleDetailsChange}
                  placeholder="Es: Il pagamento dovrà avvenire entro 30 giorni dalla data di fatturazione..."
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Sezioni ({editingQuote.sections.length})</h2>
              <button onClick={addSection} className="text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-lg transition-colors">
                + Nuova Sezione
              </button>
            </div>

            {editingQuote.sections.map((section, sIndex) => (
              <div key={section.id} className="bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden group">
                <div className="bg-gray-50/50 p-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-xs font-bold">
                      {sIndex + 1}
                    </div>
                    <input
                      name="title"
                      value={section.title}
                      onChange={(e) => handleSectionChange(sIndex, e)}
                      className="bg-transparent font-bold text-gray-900 focus:bg-white focus:ring-2 ring-blue-500/20 rounded px-2 py-1 outline-none w-full max-w-md transition-all"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <IconButton onClick={() => moveSection(sIndex, 'up')} icon={ArrowUp} title="Sposta su" />
                    <IconButton onClick={() => moveSection(sIndex, 'down')} icon={ArrowDown} title="Sposta giù" />
                    <IconButton onClick={() => duplicateSection(sIndex)} icon={Copy} title="Duplica" />
                    <IconButton onClick={() => deleteSection(sIndex)} icon={Trash2} color="text-red-400 hover:text-red-600 hover:bg-red-50" title="Elimina" />
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <div>
                    <Label>Descrizione</Label>
                    <StyledTextArea name="description" value={section.description} onChange={(e) => handleSectionChange(sIndex, e)} placeholder="Descrivi i lavori..." />
                  </div>

                  <div>
                    <Label>Foto</Label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      {[0, 1].map(photoIdx => {
                        const photo = section.photos?.[photoIdx];
                        return (
                          <div key={photoIdx} className="relative group/photo border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center min-h-[120px] bg-gray-50 hover:bg-gray-100 transition-colors text-center cursor-pointer">
                            {photo?.url ? (
                              <>
                                <img src={photo.url} alt="Preview" className="absolute inset-0 w-full h-full object-cover rounded-xl" />
                                <button onClick={(e) => { e.stopPropagation(); removePhoto(sIndex, photoIdx); }} className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full hover:bg-red-600 transition-colors"><X size={14} /></button>
                                <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded uppercase font-bold">{photoIdx === 0 ? 'Prima' : 'Dopo'}</div>
                              </>
                            ) : (
                              <>
                                <ImageIcon className="text-gray-400 mb-2" />
                                <span className="text-xs text-gray-500 font-medium">{photoIdx === 0 ? 'Foto Prima' : 'Foto Dopo'}</span>
                                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handlePhotoChange(sIndex, photoIdx, e)} />
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <Label>Voci di Spesa</Label>
                      <div className="text-xs text-gray-400 font-mono">
                        Totale Sezione: {new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(section.items.reduce((a, b) => a + (b.price * b.quantity), 0))}
                      </div>
                    </div>
                    <div className="space-y-3">
                      {section.items.map((item, iIndex) => (
                        <div key={item.id} className="flex gap-3 items-start">
                          <div className="flex-1"><StyledInput name="description" value={item.description} onChange={(e) => handleItemChange(sIndex, iIndex, e)} placeholder="Descrizione voce" /></div>
                          <div className="w-20"><StyledInput name="quantity" type="number" value={item.quantity} onChange={(e) => handleItemChange(sIndex, iIndex, e)} placeholder="Qtà" /></div>
                          <div className="w-20"><StyledInput name="unit" value={item.unit} onChange={(e) => handleItemChange(sIndex, iIndex, e)} placeholder="UdM" /></div>
                          <div className="w-28"><StyledInput name="price" type="number" value={item.price} onChange={(e) => handleItemChange(sIndex, iIndex, e)} placeholder="€" /></div>
                          <button onClick={() => deleteItem(sIndex, iIndex)} className="mt-2 text-gray-300 hover:text-red-500 transition-colors"><X size={20} /></button>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => addItem(sIndex)} className="mt-3 flex items-center gap-2 text-sm font-medium text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors"><Plus size={16} /> Aggiungi Voce</button>
                  </div>

                  {/* Per-Section Materials Editor */}
                  <SectionMaterialsEditor
                    materials={section.materials || []}
                    sectionIndex={sIndex}
                    setEditingQuote={setEditingQuote}
                  />
                </div>
              </div>
            ))}
            <button onClick={addSection} className="w-full py-4 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 font-medium hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"><Plus size={20} /> Aggiungi sezione</button>
          </div>

          {/* Renderizza l'editor solo se i dati sono stati caricati e le sezioni esistono */}
          {editingQuote && editingQuote.sections && (
            <TimelineEditor
              sections={editingQuote.sections}
              onSectionChange={handleSectionChange}
              setEditingQuote={setEditingQuote}
              daySettings={editingQuote.daySettings || {}}
            />
          )}

          {/* ANTEPRIMA REALE (Quello che vedrà il cliente) */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden mb-8">
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-100">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center block">Anteprima per il cliente</span>
            </div>
            <div className="scale-95 origin-top -mt-10"> {/* Leggera riduzione per farlo stare bene nell'editor */}
              <PaymentPlan payments={editingQuote.paymentPlan} />
            </div>


          </div>



          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/60 mb-8">
            <Label>Strategia Pagamenti</Label>

            {/* Modifica grid-cols-3 in grid-cols-2 o grid-cols-4 per farci stare il nuovo bottone */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-6">
              {[
                { id: 'SINGLE', label: 'Saldo Unico' },
                { id: 'PERCENTAGE', label: 'Acconto %' },
                { id: 'FIXED', label: 'Acconto Fisso' },
                { id: 'FIRST_DAY', label: 'Fine 1° Giorno' },
                { id: 'MILESTONES', label: '🔨 Per Lavorazione' },
                { id: 'CUSTOM', label: 'Rate Personalizzate' }
              ].map(type => (
                <button
                  key={type.id}
                  onClick={() => {
                    if (type.id === 'CUSTOM') {
                      const existingTranches = editingQuote.customTranches;
                      setPaymentStrategy(type.id, existingTranches || null);
                    } else if (type.id === 'MILESTONES') {
                      const existingConfig = editingQuote.milestoneConfig;
                      setPaymentStrategy(type.id, existingConfig || { depositPercentage: 0, tappe: [] });
                    } else {
                      setPaymentStrategy(type.id, type.id === 'PERCENTAGE' ? 30 : 1000);
                    }
                  }}
                  className={`py-2 text-xs font-bold rounded-lg border transition-all ${editingQuote.paymentType === type.id
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                    }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            {/* Input per PERCENTUALE (già esistente) */}
            {editingQuote.paymentType === 'PERCENTAGE' && (
              <div className="mb-4">
                <Label>Percentuale Acconto (%)</Label>
                <StyledInput
                  type="number"
                  value={editingQuote.paymentValue}
                  onChange={(e) => setPaymentStrategy('PERCENTAGE', e.target.value)}
                />
              </div>
            )}

            {/* Input per FISSO (già esistente) */}
            {editingQuote.paymentType === 'FIXED' && (
              <div className="mb-4">
                <Label>Importo Acconto (€)</Label>
                <StyledInput
                  type="number"
                  value={editingQuote.paymentValue}
                  onChange={(e) => setPaymentStrategy('FIXED', e.target.value)}
                />
              </div>
            )}

            {/* --- NUOVO INPUT PER 1° GIORNO --- */}
            {editingQuote.paymentType === 'FIRST_DAY' && (
              <div className="mb-4">
                <Label>Importo da versare il 1° Giorno (€)</Label>
                <StyledInput
                  type="number"
                  value={editingQuote.paymentValue}
                  onChange={(e) => setPaymentStrategy('FIRST_DAY', e.target.value)}
                  placeholder="Es. 1500"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Il saldo rimanente verrà calcolato automaticamente per la fine lavori.
                </p>
              </div>
            )}

            {/* --- EDITOR PAGAMENTO PER LAVORAZIONE (MILESTONES) --- */}
            {editingQuote.paymentType === 'MILESTONES' && (() => {
              const config = editingQuote.milestoneConfig || { depositPercentage: 0, tappe: [] };
              const tappe = config.tappe || [];
              const sections = editingQuote.sections || [];
              const fmtCur = (v) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(v);

              // Flatten all items with keys
              const allItems = sections.flatMap(s =>
                (s.items || []).map(i => ({
                  key: `${s.id}::${i.id}`,
                  sectionId: s.id,
                  sectionTitle: s.title,
                  itemId: i.id,
                  description: i.description,
                  amount: (parseFloat(i.price) || 0) * (parseFloat(i.quantity) || 0),
                  quantity: i.quantity,
                  unit: i.unit,
                  price: i.price
                }))
              );

              // Which items are already assigned to any tappa
              const assignedKeys = new Set(tappe.flatMap(t => t.itemKeys || []));
              const unassignedItems = allItems.filter(i => !assignedKeys.has(i.key));
              const unassignedTotal = unassignedItems.reduce((a, i) => a + i.amount, 0);

              const updateConfig = (newConfig) => setPaymentStrategy('MILESTONES', newConfig);

              return (
                <div className="mb-4 space-y-4">
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Crea le <strong>tappe di pagamento</strong>: per ogni tappa scegli le voci che il cliente pagherà al termine della lavorazione principale. Le voci non assegnate finiranno nel Saldo Finale.
                  </p>

                  {/* ── Acconto iniziale (opzionale) ── */}
                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <label className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1 block">
                          Acconto iniziale (opzionale)
                        </label>
                        <div className="flex items-center gap-2">
                          <StyledInput
                            type="number"
                            min="0"
                            max="50"
                            value={config.depositPercentage || 0}
                            onChange={(e) => updateConfig({ ...config, depositPercentage: parseFloat(e.target.value) || 0 })}
                            placeholder="0"
                            className="!w-24"
                          />
                          <span className="text-sm text-amber-600 font-medium">% del totale</span>
                        </div>
                      </div>
                      {(config.depositPercentage || 0) > 0 && (
                        <div className="text-right">
                          <p className="text-[10px] text-amber-600 font-medium">Acconto</p>
                          <p className="text-sm font-bold text-amber-800">
                            {fmtCur(liveSummary.total * ((config.depositPercentage || 0) / 100))}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Tappe esistenti ── */}
                  {tappe.map((tappa, tIdx) => {
                    const tappaItems = (tappa.itemKeys || []).map(k => allItems.find(i => i.key === k)).filter(Boolean);
                    const tappaTotal = tappaItems.reduce((a, i) => a + i.amount, 0);
                    const depPct = config.depositPercentage || 0;
                    const adjustedTotal = depPct > 0 ? tappaTotal * (1 - depPct / 100) : tappaTotal;
                    const titleItem = tappa.titleItemKey ? allItems.find(i => i.key === tappa.titleItemKey) : null;

                    // Items available to add to THIS tappa = unassigned + items already in this tappa (for display)
                    const tappaKeySet = new Set(tappa.itemKeys || []);
                    const availableForThisTappa = allItems.filter(i => !assignedKeys.has(i.key) || tappaKeySet.has(i.key));

                    return (
                      <div key={tappa.id} className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden shadow-sm">
                        {/* Tappa header */}
                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-black text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                              {tIdx + 1}
                            </span>
                            <div>
                              <p className="text-sm font-bold text-gray-900">
                                {titleItem?.description || `Tappa ${tIdx + 1}`}
                              </p>
                              <p className="text-[10px] text-gray-400">
                                {tappaItems.length} {tappaItems.length === 1 ? 'voce' : 'voci'} • {fmtCur(adjustedTotal)}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              const newTappe = tappe.filter((_, i) => i !== tIdx);
                              updateConfig({ ...config, tappe: newTappe });
                            }}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                            title="Elimina tappa"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <div className="p-4 space-y-3">
                          {/* Items in this tappa */}
                          {tappaItems.length > 0 && (
                            <div className="space-y-1">
                              {tappaItems.map(item => {
                                const isTitleItem = tappa.titleItemKey === item.key;
                                return (
                                  <div
                                    key={item.key}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                                      isTitleItem ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-transparent'
                                    }`}
                                  >
                                    {/* Set as title button */}
                                    <button
                                      onClick={() => {
                                        const newTappe = [...tappe];
                                        newTappe[tIdx] = { ...newTappe[tIdx], titleItemKey: item.key };
                                        updateConfig({ ...config, tappe: newTappe });
                                      }}
                                      className={`w-4 h-4 rounded-full border-2 shrink-0 transition-all flex items-center justify-center ${
                                        isTitleItem ? 'border-blue-500 bg-blue-500' : 'border-gray-300 hover:border-blue-400'
                                      }`}
                                      title="Imposta come lavorazione principale (titolo)"
                                    >
                                      {isTitleItem && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                    </button>

                                    <div className="flex-1 min-w-0">
                                      <p className={`text-xs truncate ${isTitleItem ? 'font-bold text-blue-900' : 'text-gray-700'}`}>
                                        {item.description}
                                      </p>
                                      <p className="text-[10px] text-gray-400">{item.sectionTitle}</p>
                                    </div>
                                    <span className="text-xs font-bold text-gray-900 tabular-nums shrink-0">{fmtCur(item.amount)}</span>

                                    {/* Remove from tappa */}
                                    <button
                                      onClick={() => {
                                        const newKeys = (tappa.itemKeys || []).filter(k => k !== item.key);
                                        const newTitleKey = tappa.titleItemKey === item.key ? (newKeys[0] || '') : tappa.titleItemKey;
                                        const newTappe = [...tappe];
                                        newTappe[tIdx] = { ...newTappe[tIdx], itemKeys: newKeys, titleItemKey: newTitleKey };
                                        updateConfig({ ...config, tappe: newTappe });
                                      }}
                                      className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors shrink-0"
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Add items dropdown */}
                          {unassignedItems.length > 0 && (
                            <div>
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">
                                + Aggiungi voci a questa tappa
                              </label>
                              <div className="max-h-[200px] overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-50">
                                {/* Group unassigned by section */}
                                {sections.map(section => {
                                  const sectionUnassigned = unassignedItems.filter(i => i.sectionId === section.id && !tappaKeySet.has(i.key));
                                  if (sectionUnassigned.length === 0) return null;
                                  return (
                                    <div key={section.id}>
                                      <div className="px-3 py-1.5 bg-gray-50/50">
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">{section.title}</span>
                                      </div>
                                      {sectionUnassigned.map(item => (
                                        <button
                                          key={item.key}
                                          onClick={() => {
                                            const newKeys = [...(tappa.itemKeys || []), item.key];
                                            const newTitleKey = tappa.titleItemKey || item.key; // first item becomes title by default
                                            const newTappe = [...tappe];
                                            newTappe[tIdx] = { ...newTappe[tIdx], itemKeys: newKeys, titleItemKey: newTitleKey };
                                            updateConfig({ ...config, tappe: newTappe });
                                          }}
                                          className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-blue-50 transition-colors"
                                        >
                                          <Plus size={12} className="text-gray-300 shrink-0" />
                                          <span className="text-xs text-gray-700 flex-1 truncate">{item.description}</span>
                                          <span className="text-[10px] text-gray-400 tabular-nums shrink-0">{fmtCur(item.amount)}</span>
                                        </button>
                                      ))}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {tappaItems.length > 0 && (
                            <p className="text-[10px] text-blue-500 italic">
                              ● = lavorazione principale (titolo della tappa). Al suo completamento il cliente paga tutte le voci di questa tappa.
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* ── Add new tappa ── */}
                  <button
                    onClick={() => {
                      const newTappa = {
                        id: `tappa-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                        titleItemKey: '',
                        itemKeys: []
                      };
                      updateConfig({ ...config, tappe: [...tappe, newTappa] });
                    }}
                    className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 font-bold text-xs hover:border-black hover:text-black hover:bg-gray-50 transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
                  >
                    <Plus size={14} /> Aggiungi Tappa di Pagamento
                  </button>

                  {/* ── Summary: unassigned items → saldo finale ── */}
                  {unassignedItems.length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                          Saldo Finale (voci non assegnate)
                        </span>
                        <span className="text-sm font-bold text-gray-900 tabular-nums">
                          {fmtCur((() => {
                            const dep = config.depositPercentage || 0;
                            return dep > 0 ? unassignedTotal * (1 - dep / 100) : unassignedTotal;
                          })())}
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        {unassignedItems.slice(0, 5).map(item => (
                          <p key={item.key} className="text-[10px] text-gray-400 truncate">
                            • {item.description} — {fmtCur(item.amount)}
                          </p>
                        ))}
                        {unassignedItems.length > 5 && (
                          <p className="text-[10px] text-gray-400 italic">...e altre {unassignedItems.length - 5} voci</p>
                        )}
                      </div>
                    </div>
                  )}

                  {unassignedItems.length === 0 && tappe.length > 0 && (
                    <div className="flex items-center gap-2 bg-emerald-50 rounded-xl px-4 py-3 border border-emerald-100">
                      <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-xs font-medium text-emerald-700">Tutte le voci sono assegnate a una tappa — nessun saldo finale.</span>
                    </div>
                  )}

                  <p className="text-[10px] text-gray-400 italic">
                    Il piano di pagamento viene aggiornato automaticamente in base alle voci assegnate.
                  </p>
                </div>
              );
            })()}

            {/* --- EDITOR RATE PERSONALIZZATE --- */}
            {editingQuote.paymentType === 'CUSTOM' && (
              <div className="mb-4 space-y-3">
                {(editingQuote.customTranches || []).map((tranche, idx) => {
                  return (
                    <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-100 relative group">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-6 h-6 rounded-full bg-black text-white text-[10px] font-bold flex items-center justify-center shrink-0">{idx + 1}</span>
                        <StyledInput
                          value={tranche.label}
                          onChange={(e) => {
                            const updated = [...editingQuote.customTranches];
                            updated[idx] = { ...updated[idx], label: e.target.value };
                            setPaymentStrategy('CUSTOM', updated);
                          }}
                          placeholder="Nome rata (es. Acconto Iniziale)"
                          className="!text-sm !font-bold !bg-white"
                        />
                        {editingQuote.customTranches.length > 1 && (
                          <button
                            onClick={() => {
                              const updated = editingQuote.customTranches.filter((_, i) => i !== idx);
                              setPaymentStrategy('CUSTOM', updated);
                            }}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                            title="Rimuovi rata"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Percentuale %</label>
                          <div className="relative">
                            <StyledInput
                              type="number"
                              min="0"
                              max="100"
                              value={tranche.percentage}
                              onChange={(e) => {
                                const updated = [...editingQuote.customTranches];
                                updated[idx] = { ...updated[idx], percentage: e.target.value };
                                setPaymentStrategy('CUSTOM', updated);
                              }}
                              placeholder="30"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 text-sm font-medium">%</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Scadenza</label>
                          <StyledInput
                            value={tranche.dueDate}
                            onChange={(e) => {
                              const updated = [...editingQuote.customTranches];
                              updated[idx] = { ...updated[idx], dueDate: e.target.value };
                              setPaymentStrategy('CUSTOM', updated);
                            }}
                            placeholder="Es. All'accettazione"
                          />
                        </div>
                      </div>
                      <div className="mt-2">
                        <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Descrizione (opzionale)</label>
                        <StyledInput
                          value={tranche.description || ''}
                          onChange={(e) => {
                            const updated = [...editingQuote.customTranches];
                            updated[idx] = { ...updated[idx], description: e.target.value };
                            setPaymentStrategy('CUSTOM', updated);
                          }}
                          placeholder="Nota per il cliente..."
                        />
                      </div>
                    </div>
                  );
                })}

                {/* Barra totale percentuali + Aggiungi rata */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const totalPerc = (editingQuote.customTranches || []).reduce((s, t) => s + (parseFloat(t.percentage) || 0), 0);
                      const isValid = Math.abs(totalPerc - 100) < 0.01;
                      return (
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${isValid ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                          Totale: {totalPerc.toFixed(0)}%{isValid ? ' ✓' : ' — deve essere 100%'}
                        </span>
                      );
                    })()}
                  </div>
                  <button
                    onClick={() => {
                      const currentTranches = editingQuote.customTranches || [];
                      const usedPerc = currentTranches.reduce((s, t) => s + (parseFloat(t.percentage) || 0), 0);
                      const remaining = Math.max(0, 100 - usedPerc);
                      const updated = [...currentTranches, {
                        label: `Rata ${currentTranches.length + 1}`,
                        percentage: remaining,
                        dueDate: "",
                        description: ""
                      }];
                      setPaymentStrategy('CUSTOM', updated);
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-black bg-white border border-gray-200 hover:border-gray-400 px-3 py-1.5 rounded-lg transition-all"
                  >
                    <Plus size={12} />
                    Aggiungi rata
                  </button>
                </div>
              </div>
            )}

            <p className="text-[10px] text-gray-400 italic">
              Il calcolo viene aggiornato automaticamente in base al totale del preventivo.
            </p>
          </div>

          <TeamEditor
            teamMembers={editingQuote.teamMembers}
            setEditingQuote={setEditingQuote}
          />

          <MaterialsEditor
            materials={editingQuote.materials || []}
            setEditingQuote={setEditingQuote}
          />
        </div>






        {/* Colonna Destra Sticky */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            <div className="bg-black text-white rounded-2xl p-6 shadow-xl ring-1 ring-white/10">
              <div className="flex items-center gap-2 mb-6 text-gray-400 uppercase text-xs font-bold tracking-widest">
                <Calculator size={14} /> Totale Lavori
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm text-gray-400 font-medium italic">
                  <span>* Prezzi al netto di IVA</span>
                </div>
              </div>

              <div className="flex justify-between items-end border-t border-gray-800 pt-6">
                <span className="text-sm font-bold text-gray-400">IMPONIBILE</span>
                <span className="text-3xl font-bold tracking-tight">
                  {new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(liveSummary.subtotal)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}