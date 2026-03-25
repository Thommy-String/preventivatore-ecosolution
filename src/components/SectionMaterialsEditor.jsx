import React, { useState } from 'react';
import { Plus, Trash2, X, Image as ImageIcon, ChevronDown, ChevronUp, Package } from 'lucide-react';

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

const generateId = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export default function SectionMaterialsEditor({ materials = [], sectionIndex, setEditingQuote }) {
  const [collapsed, setCollapsed] = useState({});

  const updateMaterials = (newMaterials) => {
    setEditingQuote(prev => {
      const newSections = [...prev.sections];
      newSections[sectionIndex] = { ...newSections[sectionIndex], materials: newMaterials };
      return { ...prev, sections: newSections };
    });
  };

  const addMaterial = () => {
    const newMaterial = {
      id: generateId('smat'),
      name: '',
      description: '',
      link: '',
      photoUrl: '',
      specs: [{ label: '', value: '' }],
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

  const toggleCollapse = (id) => {
    setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="border-t border-gray-100 pt-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Package size={15} className="text-amber-500" />
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Materiali Sezione
          </span>
          {materials.length > 0 && (
            <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
              {materials.length}
            </span>
          )}
        </div>
        <button
          onClick={addMaterial}
          className="text-xs font-medium text-amber-600 hover:text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg transition-colors"
        >
          + Materiale
        </button>
      </div>

      {materials.length === 0 ? (
        <div className="text-center py-6 border-2 border-dashed border-gray-200/60 rounded-xl">
          <p className="text-xs text-gray-400 mb-2">Nessun materiale per questa sezione.</p>
          <button
            onClick={addMaterial}
            className="text-xs font-medium text-amber-600 hover:bg-amber-50 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5"
          >
            <Plus size={13} /> Aggiungi materiale
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {materials.map((material, mIndex) => {
            const isCollapsed = collapsed[material.id];
            return (
              <div
                key={material.id}
                className="border border-gray-200/60 rounded-xl overflow-hidden bg-white"
              >
                {/* Material Header — clickable to collapse */}
                <div
                  className="bg-amber-50/40 px-3 py-2.5 border-b border-gray-100 flex items-center justify-between cursor-pointer hover:bg-amber-50/70 transition-colors"
                  onClick={() => toggleCollapse(material.id)}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                      {mIndex + 1}
                    </div>
                    <span className="text-xs font-semibold text-gray-600 truncate">
                      {material.name || 'Nuovo Materiale'}
                    </span>
                    {material.photoUrl && (
                      <div className="w-5 h-5 rounded overflow-hidden border border-gray-200 shrink-0">
                        <img src={material.photoUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); removeMaterial(mIndex); }}
                      className="p-1.5 rounded-md hover:bg-red-50 text-red-300 hover:text-red-500 transition-colors"
                      title="Elimina"
                    >
                      <Trash2 size={13} />
                    </button>
                    {isCollapsed ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronUp size={14} className="text-gray-400" />}
                  </div>
                </div>

                {/* Material Body — collapsible */}
                {!isCollapsed && (
                  <div className="p-4 space-y-4">
                    {/* Name + Description */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label>Nome</Label>
                        <StyledInput
                          value={material.name}
                          onChange={(e) => handleMaterialChange(mIndex, 'name', e.target.value)}
                          placeholder="Es. Pannello Fotovoltaico 400W"
                        />
                      </div>
                      <div>
                        <Label>Descrizione</Label>
                        <StyledInput
                          value={material.description}
                          onChange={(e) => handleMaterialChange(mIndex, 'description', e.target.value)}
                          placeholder="Es. Celle monocristalline ad alta efficienza"
                        />
                      </div>
                    </div>

                    {/* Link Prodotto */}
                    <div>
                      <Label>Link Prodotto (opzionale)</Label>
                      <StyledInput
                        value={material.link || ''}
                        onChange={(e) => handleMaterialChange(mIndex, 'link', e.target.value)}
                        placeholder="Es. https://www.amazon.it/prodotto..."
                        type="url"
                      />
                    </div>

                    {/* Photo Upload */}
                    <div>
                      <Label>Foto Prodotto</Label>
                      <div className="mt-1">
                        {material.photoUrl ? (
                          <div className="relative w-full max-w-xs aspect-[16/10] rounded-xl overflow-hidden border border-gray-200 bg-gray-100 group">
                            <img
                              src={material.photoUrl}
                              alt={material.name}
                              className="w-full h-full object-cover"
                            />
                            <button
                              onClick={() => removePhoto(mIndex)}
                              className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <div className="relative w-full max-w-xs aspect-[16/10] border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                            <ImageIcon className="text-gray-400 mb-1" size={22} />
                            <span className="text-[10px] text-gray-500 font-medium">Carica foto</span>
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

                    {/* Specs */}
                    <div>
                      <Label>Specifiche Tecniche</Label>
                      <div className="space-y-2 mt-1">
                        {(material.specs || []).map((spec, sIdx) => (
                          <div key={sIdx} className="flex gap-2 items-center">
                            <StyledInput
                              value={spec.label}
                              onChange={(e) => handleSpecChange(mIndex, sIdx, 'label', e.target.value)}
                              placeholder="Es. Potenza"
                            />
                            <StyledInput
                              value={spec.value}
                              onChange={(e) => handleSpecChange(mIndex, sIdx, 'value', e.target.value)}
                              placeholder="Es. 400W"
                            />
                            <button
                              onClick={() => removeSpec(mIndex, sIdx)}
                              className="p-1.5 text-gray-300 hover:text-red-500 transition-colors shrink-0"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => addSpec(mIndex)}
                        className="mt-2 flex items-center gap-1 text-[11px] font-medium text-amber-600 hover:bg-amber-50 px-2.5 py-1.5 rounded-lg transition-colors"
                      >
                        <Plus size={12} /> Aggiungi specifica
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Add another */}
          <button
            onClick={addMaterial}
            className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 font-medium hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50 transition-all flex items-center justify-center gap-1.5 text-xs"
          >
            <Plus size={14} /> Aggiungi materiale
          </button>
        </div>
      )}
    </div>
  );
}
