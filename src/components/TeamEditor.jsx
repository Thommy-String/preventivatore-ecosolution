import React from 'react';
import { Users, Plus, X, Image as ImageIcon, Smile, Zap } from 'lucide-react';

import { DEFAULT_TEAM } from '../config/defaultTeam';

const Label = ({ children }) => (
  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
    {children}
  </label>
);

export default function TeamEditor({ teamMembers = [], setEditingQuote }) {
  
  // Funzione per caricare i membri predefiniti
  const loadDefaults = () => {
    setEditingQuote(prev => ({
      ...prev,
      teamMembers: [...DEFAULT_TEAM]
    }));
  };

  const addMember = () => {
    const newMember = {
      id: `mem-${Date.now()}`,
      name: '',
      role: '',
      photoUrl: '',
      phone: '', // Aggiunto campo telefono
      quirk: ''
    };
    setEditingQuote(prev => ({
      ...prev,
      teamMembers: [...(prev.teamMembers || []), newMember]
    }));
  };

  const updateMember = (index, field, value) => {
    setEditingQuote(prev => {
      const newList = [...(prev.teamMembers || [])];
      newList[index] = { ...newList[index], [field]: value };
      return { ...prev, teamMembers: newList };
    });
  };

  const removeMember = (index) => {
    setEditingQuote(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.filter((_, i) => i !== index)
    }));
  };

  const handlePhoto = (index, file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 300; 
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Compressione JPEG 0.6 per non appesantire Firebase
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
        updateMember(index, 'photoUrl', compressedDataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm mb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
            <Users size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Squadra Operativa</h2>
            <p className="text-xs text-gray-400 font-medium">Chi vedrà il cliente in cantiere</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {/* Tasto Magico: Carica Team Fisso */}
          <button 
            onClick={loadDefaults}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-purple-100 text-purple-600 hover:bg-purple-50 rounded-xl text-xs font-bold transition-all"
            title="Carica Marco e Giulia"
          >
            <Zap size={14} fill="currentColor" /> TEAM FISSO
          </button>

          <button 
            onClick={addMember}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-100"
          >
            <Plus size={14} strokeWidth={3} /> AGGIUNGI
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {teamMembers.map((member, idx) => (
          <div key={member.id || idx} className="group relative p-6 rounded-3xl border border-gray-100 bg-gray-50/30 hover:bg-white hover:shadow-xl hover:shadow-gray-200/40 transition-all duration-300">
            
            <button 
              onClick={() => removeMember(idx)}
              className="absolute -top-2 -right-2 w-8 h-8 bg-white shadow-md border border-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all z-10"
            >
              <X size={14} strokeWidth={3} />
            </button>

            <div className="flex gap-5">
              {/* Foto Upload con Compressione */}
              <div className="relative w-24 h-24 shrink-0 rounded-2xl bg-gray-200 overflow-hidden border-2 border-white shadow-inner group/photo">
                {member.photoUrl ? (
                  <img src={member.photoUrl} className="w-full h-full object-cover" alt="Preview" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <ImageIcon size={20} />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center">
                   <p className="text-[10px] text-white font-bold uppercase">Cambia</p>
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => handlePhoto(idx, e.target.files[0])}
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                />
              </div>

              {/* Dati Testuali */}
              <div className="flex-1 space-y-3">
                <div>
                  <Label>Nome</Label>
                  <input 
                    type="text"
                    value={member.name}
                    onChange={(e) => updateMember(idx, 'name', e.target.value)}
                    placeholder="Mario Rossi"
                    className="w-full bg-transparent border-b border-gray-200 focus:border-purple-500 outline-none text-sm font-bold text-gray-900 pb-1 transition-colors"
                  />
                </div>
                <div>
                  <Label>Ruolo</Label>
                  <input 
                    type="text"
                    value={member.role}
                    onChange={(e) => updateMember(idx, 'role', e.target.value)}
                    placeholder="Capo Posa"
                    className="w-full bg-transparent border-b border-gray-200 focus:border-purple-500 outline-none text-xs font-medium text-gray-500 pb-1 transition-colors"
                  />
                </div>
                <div>
                  <Label>WhatsApp (opzionale)</Label>
                  <input 
                    type="text"
                    value={member.phone || ''}
                    onChange={(e) => updateMember(idx, 'phone', e.target.value)}
                    placeholder="es. 0039334..."
                    className="w-full px-4 py-2 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                  />
                  <p className="text-[10px] text-gray-400 mt-1 ml-1 leading-tight">Inserisci il numero col prefisso internazionale (es. 0039...)</p>
                </div>
              </div>
            </div>

            {/* Curiosità (Notion Style) */}
            <div className="mt-5">
              <div className="flex items-center gap-2 mb-1.5 opacity-60">
                <Smile size={12} className="text-purple-500" />
                <Label>Curiosità Comica</Label>
              </div>
              <textarea 
                value={member.quirk}
                onChange={(e) => updateMember(idx, 'quirk', e.target.value)}
                placeholder="Qualcosa di simpatico..."
                className="w-full bg-white border border-gray-100 rounded-xl p-3 text-xs text-gray-600 outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-500 transition-all resize-none h-16"
              />
            </div>
          </div>
        ))}
      </div>

      {teamMembers.length === 0 && (
        <div className="py-12 text-center border-2 border-dashed border-gray-100 rounded-[32px] bg-gray-50/50">
          <Users className="mx-auto text-gray-200 mb-3" size={32} />
          <p className="text-sm text-gray-400 font-medium italic mb-4">Nessun membro della squadra aggiunto.</p>
          <button onClick={loadDefaults} className="text-xs font-bold text-purple-600 underline">Carica team predefinito</button>
        </div>
      )}
    </div>
  );
}