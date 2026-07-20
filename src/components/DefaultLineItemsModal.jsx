import { useMemo, useState, useEffect } from 'react';
import { Plus, Trash2, X, Search, PencilLine } from 'lucide-react';
import { useDefaultLineItems } from '../hooks/useDefaultLineItems';

const formatCurrency = (value) => {
  if (value == null) return '€ 0,00';
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);
};

export default function DefaultLineItemsModal({ open, onClose, sections = [], onInsert, initialSectionId = null }) {
  const {
    items,
    addDefaultLineItem,
    updateDefaultLineItem,
    removeDefaultLineItem,
    duplicateDefaultLineItem,
    resetDefaultLineItems
  } = useDefaultLineItems();
  const [searchTerm, setSearchTerm] = useState('');
  const [targetSectionId, setTargetSectionId] = useState(initialSectionId || sections[0]?.id || 'new');
  const [editingItemId, setEditingItemId] = useState(null);

  useEffect(() => {
    if (open) {
      setTargetSectionId((prev) => {
        if (initialSectionId) return initialSectionId;
        if (prev && sections.some((sec) => sec.id === prev)) return prev;
        return sections[0]?.id || 'new';
      });
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open, initialSectionId, sections]);

  const visibleItems = useMemo(() => {
    if (!searchTerm) return items;
    const lower = searchTerm.toLowerCase();
    return items.filter(item => `${item.title} ${item.description}`.toLowerCase().includes(lower));
  }, [items, searchTerm]);

  const sectionOptions = [...sections];

  const handleInsert = (item) => {
    if (!onInsert) return;
    onInsert(item, targetSectionId);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-10 text-[#0c0c0e]">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <div className="relative z-10 max-w-5xl w-full rounded-[32px] border border-white/20 bg-white shadow-[0_40px_120px_rgba(0,0,0,0.35)] overflow-hidden flex flex-col h-[calc(100vh-4rem)]">
        <div className="relative p-6 md:p-7 border-b border-gray-100 bg-white text-[#0a0a0c]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.4em] text-gray-400 mb-2">Libreria smart</p>
              <h3 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">Voci predefinite</h3>
              <p className="text-sm text-gray-500 mt-1">Inserisci componenti pronti in qualsiasi sezione del preventivo.</p>
            </div>
            <div className="flex flex-col gap-3 md:w-72">
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-[#0a0a0c]">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-1">Destinazione</p>
                <select
                  value={targetSectionId}
                  onChange={(e) => setTargetSectionId(e.target.value)}
                  className="w-full rounded-xl bg-white border border-gray-200 text-sm font-semibold px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black/10"
                >
                  {sectionOptions.length === 0 && <option value="new">Crea nuova sezione</option>}
                  {sectionOptions.map(sec => (
                    <option key={sec.id} value={sec.id}>{sec.title || 'Sezione senza titolo'}</option>
                  ))}
                  <option value="new">+ Nuova sezione dinamica</option>
                </select>
                <p className="mt-2 text-[11px] text-gray-500">La sezione segue il pulsante usato nell’editor.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={addDefaultLineItem}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-black text-white font-bold text-xs uppercase tracking-[0.3em] px-4 py-3"
                >
                  <Plus size={14} /> Nuova voce
                </button>
                <button
                  onClick={resetDefaultLineItems}
                  className="rounded-2xl border border-gray-200 text-gray-600 text-xs font-semibold px-4 py-3 hover:bg-gray-100 transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 md:top-6 md:right-8 h-12 w-12 rounded-2xl border border-gray-200 bg-white text-gray-500 hover:text-black hover:bg-gray-100 flex items-center justify-center"
            title="Chiudi"
          >
            <X size={20} />
          </button>
        </div>

        <div className="border-b border-black/5 bg-white px-6 md:px-8 py-4 flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300">
              <Search size={16} />
            </span>
            <input
              type="search"
              placeholder="Cerca titoli, descrizioni, unità..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full rounded-2xl bg-gray-50 border border-gray-200 text-sm pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black/60"
            />
          </div>
          <div className="flex gap-2 text-[11px] font-semibold text-gray-400 uppercase tracking-[0.3em]">
            <span className="bg-gray-100 rounded-xl px-3 py-1">{items.length} item</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 md:px-8 py-6 bg-[#f5f5f7]">
          <div className="grid gap-4 md:grid-cols-2">
            {visibleItems.map(item => (
              <div key={item.id} className="rounded-3xl border border-black/[0.04] bg-white/90 backdrop-blur-sm shadow-[0_12px_30px_rgba(15,15,20,0.08)] p-4 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black tracking-tight text-[#0a0a0c] truncate">{item.title || 'Nuova voce predefinita'}</p>
                    <p className="text-xs text-gray-400 mt-1 font-mono">{formatCurrency(item.price)} — {item.quantity} {item.unit}</p>
                    <p className="text-[11px] text-gray-500 mt-2 line-clamp-2">{item.description || 'Nessuna descrizione salvata.'}</p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => setEditingItemId(editingItemId === item.id ? null : item.id)}
                      className={`rounded-2xl border px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] flex items-center gap-1 transition-all ${editingItemId === item.id ? 'bg-[#0a0a0c] text-white border-[#0a0a0c]' : 'border-gray-200 text-gray-400 hover:border-black/40 hover:text-black'}`}
                    >
                      <PencilLine size={14} /> {editingItemId === item.id ? 'Chiudi' : 'Modifica'}
                    </button>
                    <button
                      onClick={() => handleInsert(item)}
                      className="rounded-2xl bg-[#0a0a0c] text-white text-[10px] font-black uppercase tracking-[0.4em] px-3 py-2 hover:bg-black"
                    >
                      Inserisci
                    </button>
                  </div>
                </div>

                {editingItemId === item.id && (
                  <div className="border-t border-gray-100 pt-4 space-y-3 text-xs">
                    <div className="grid md:grid-cols-2 gap-3">
                      <Field label="Titolo">
                        <input
                          value={item.title}
                          onChange={(event) => updateDefaultLineItem(item.id, { title: event.target.value })}
                          className="w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                        />
                      </Field>
                      <Field label="Prezzo">
                        <input
                          type="number"
                          value={item.price}
                          onChange={(event) => updateDefaultLineItem(item.id, { price: parseFloat(event.target.value) || 0 })}
                          className="w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                        />
                      </Field>
                      <Field label="Descrizione" full>
                        <textarea
                          value={item.description}
                          onChange={(event) => updateDefaultLineItem(item.id, { description: event.target.value })}
                          className="w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                          rows={2}
                        />
                      </Field>
                      <div className="flex gap-3">
                        <Field label="Quantità">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(event) => updateDefaultLineItem(item.id, { quantity: parseFloat(event.target.value) || 0 })}
                            className="w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                          />
                        </Field>
                        <Field label="Unità">
                          <input
                            value={item.unit}
                            onChange={(event) => updateDefaultLineItem(item.id, { unit: event.target.value })}
                            className="w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                          />
                        </Field>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => duplicateDefaultLineItem(item.id)}
                        className="flex-1 rounded-2xl border border-gray-200 text-gray-500 text-[11px] font-semibold uppercase tracking-[0.3em] px-3 py-2 hover:border-black/30 hover:text-black"
                      >
                        Duplica voce
                      </button>
                      <button
                        onClick={() => removeDefaultLineItem(item.id)}
                        className="rounded-2xl border border-red-100 text-red-500 text-[11px] font-semibold uppercase tracking-[0.3em] px-3 py-2 hover:bg-red-50"
                      >
                        <Trash2 size={14} /> Elimina
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {visibleItems.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-center text-gray-400">
                <Search size={24} className="mb-3" />
                <p className="font-semibold text-sm">Nessuna voce corrisponde alla ricerca.</p>
                <p className="text-xs mt-1">Prova con un nome diverso oppure crea una nuova voce personalizzata.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, full }) {
  return (
    <label className={`flex flex-col gap-1 text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 ${full ? 'md:col-span-2' : ''}`}>
      {label}
      {children}
    </label>
  );
}