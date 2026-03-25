import React from 'react';
import { Plus, Trash2, X, Image as ImageIcon, GripVertical } from 'lucide-react';

// Helper UI Components (matching EditQuotePage style)
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
    className="block w-full px-4 py-2.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm placeholder:text-gray-400 min-h-[60px]"
  />
);

const generateId = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export default function MaterialsEditor({ materials = [], setEditingQuote }) {

  const updateMaterials = (newMaterials) => {
    setEditingQuote(prev => ({ ...prev, materials: newMaterials }));
  };

  const addMaterial = () => {
    const newMaterial = {
      id: generateId('mat'),
      name: '',
      description: '',
      photoUrl: '',
      specs: [
        { label: '', value: '' },
      ],
    };
    updateMaterials([...materials, newMaterial]);
  };

  const removeMaterial = (index) => {
    if (confirm('Eliminare questo materiale?')) {
      updateMaterials(materials.filter((_, i) => i !== index));
    }
  };

  const handleMaterialChange = (index, field, value) => {
    const updated = [...materials];
    updated[index] = { ...updated[index], [field]: value };
    updateMaterials(updated);
  };

  // --- Photo handling (same compression as sections) ---
  const handlePhotoUpload = (materialIndex, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const scale = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL('image/jpeg', 0.7);

        handleMaterialChange(materialIndex, 'photoUrl', compressed);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = (materialIndex) => {
    handleMaterialChange(materialIndex, 'photoUrl', '');
  };

  // --- Specs handling ---
  const addSpec = (materialIndex) => {
    const updated = [...materials];
    updated[materialIndex] = {
      ...updated[materialIndex],
      specs: [...(updated[materialIndex].specs || []), { label: '', value: '' }],
    };
    updateMaterials(updated);
  };

  const removeSpec = (materialIndex, specIndex) => {
    const updated = [...materials];
    updated[materialIndex] = {
      ...updated[materialIndex],
      specs: updated[materialIndex].specs.filter((_, i) => i !== specIndex),
    };
    updateMaterials(updated);
  };

  const handleSpecChange = (materialIndex, specIndex, field, value) => {
    const updated = [...materials];
    const newSpecs = [...updated[materialIndex].specs];
    newSpecs[specIndex] = { ...newSpecs[specIndex], [field]: value };
    updated[materialIndex] = { ...updated[materialIndex], specs: newSpecs };
    updateMaterials(updated);
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/60">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <span className="w-1 h-6 bg-emerald-500 rounded-full"></span>
          Materiali Utilizzati
          {materials.length > 0 && (
            <span className="text-xs font-medium text-gray-400 ml-1">({materials.length})</span>
          )}
        </h2>
        <button
          onClick={addMaterial}
          className="text-sm font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-4 py-2 rounded-lg transition-colors"
        >
          + Aggiungi Materiale
        </button>
      </div>

      {materials.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-sm text-gray-400 mb-3">Nessun materiale aggiunto.</p>
          <button
            onClick={addMaterial}
            className="text-sm font-medium text-emerald-600 hover:bg-emerald-50 px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2"
          >
            <Plus size={16} /> Aggiungi il primo materiale
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {materials.map((material, mIndex) => (
            <div
              key={material.id}
              className="border border-gray-200/60 rounded-xl overflow-hidden bg-gray-50/30"
            >
              {/* Material Header */}
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">
                    {mIndex + 1}
                  </div>
                  <span className="text-sm font-semibold text-gray-700 truncate max-w-[200px]">
                    {material.name || 'Nuovo Materiale'}
                  </span>
                </div>
                <button
                  onClick={() => removeMaterial(mIndex)}
                  className="p-2 rounded-md hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                  title="Elimina materiale"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Material Body */}
              <div className="p-5 space-y-5">

                {/* Name + Description */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nome Materiale</Label>
                    <StyledInput
                      value={material.name}
                      onChange={(e) => handleMaterialChange(mIndex, 'name', e.target.value)}
                      placeholder="Es. Pannello Fotovoltaico 400W"
                    />
                  </div>
                  <div>
                    <Label>Descrizione (opzionale)</Label>
                    <StyledInput
                      value={material.description}
                      onChange={(e) => handleMaterialChange(mIndex, 'description', e.target.value)}
                      placeholder="Es. Alta efficienza, celle monocristalline"
                    />
                  </div>
                </div>

                {/* Photo Upload */}
                <div>
                  <Label>Foto Prodotto</Label>
                  <div className="mt-1.5">
                    {material.photoUrl ? (
                      <div className="relative w-full max-w-sm aspect-[16/10] rounded-xl overflow-hidden border border-gray-200 bg-gray-100 group">
                        <img
                          src={material.photoUrl}
                          alt={material.name}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => removePhoto(mIndex)}
                          className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="relative w-full max-w-sm aspect-[16/10] border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                        <ImageIcon className="text-gray-400 mb-2" size={28} />
                        <span className="text-xs text-gray-500 font-medium">Carica foto</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={(e) => handlePhotoUpload(mIndex, e)}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Specs Table Editor */}
                <div>
                  <Label>Specifiche Tecniche</Label>
                  <div className="space-y-2 mt-1.5">
                    {(material.specs || []).map((spec, sIdx) => (
                      <div key={sIdx} className="flex gap-2 items-center">
                        <StyledInput
                          value={spec.label}
                          onChange={(e) => handleSpecChange(mIndex, sIdx, 'label', e.target.value)}
                          placeholder="Es. Potenza"
                          className="flex-1"
                        />
                        <StyledInput
                          value={spec.value}
                          onChange={(e) => handleSpecChange(mIndex, sIdx, 'value', e.target.value)}
                          placeholder="Es. 400W"
                          className="flex-1"
                        />
                        <button
                          onClick={() => removeSpec(mIndex, sIdx)}
                          className="p-2 text-gray-300 hover:text-red-500 transition-colors shrink-0"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => addSpec(mIndex)}
                    className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Plus size={14} /> Aggiungi specifica
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Add Another */}
          <button
            onClick={addMaterial}
            className="w-full py-3.5 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-medium hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 text-sm"
          >
            <Plus size={18} /> Aggiungi materiale
          </button>
        </div>
      )}

      <p className="text-[10px] text-gray-400 italic mt-4">
        Opzionale — Verrà visualizzato come sezione dedicata nel preventivo.
      </p>
    </div>
  );
}
