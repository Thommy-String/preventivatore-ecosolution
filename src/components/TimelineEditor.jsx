import React, { useMemo } from 'react';
import { Clock, Timer, Plus, Trash2, Link as LinkIcon, Unlink, CalendarDays, Truck, AlertCircle } from "lucide-react";

export default function SmartTimelineEditor({ sections, setEditingQuote, daySettings = {} }) {
  
  const days = useMemo(() => {
    const dayMap = {};
    sections.forEach((section) => {
      (section.slots || []).forEach((slot) => {
        if (!dayMap[slot.day]) dayMap[slot.day] = [];
        dayMap[slot.day].push({ ...slot, sectionTitle: section.title, sectionId: section.id });
      });
    });
    Object.keys(dayMap).forEach(d => {
      dayMap[d].sort((a, b) => a.start.localeCompare(b.start));
    });
    return dayMap;
  }, [sections]);

const updateDayArrival = (day, time) => {
  setEditingQuote(prev => {
    // 1. Aggiorna le impostazioni del giorno
    const newDaySettings = {
      ...(prev.daySettings || {}),
      [day]: { ...(prev.daySettings?.[day] || {}), arrivalTime: time }
    };

    // 2. Ricalcola la catena degli orari usando il nuovo orario di arrivo
    const updatedSections = rechainDay(day, prev.sections, newDaySettings);

    return {
      ...prev,
      daySettings: newDaySettings,
      sections: updatedSections
    };
  });
};

// Modifica la firma della funzione per accettare daySettings
const rechainDay = (day, updatedSections, daySettings) => {
  let currentSections = [...updatedSections];
  let slotsInDay = [];
  
  currentSections.forEach((s, sIdx) => {
    (s.slots || []).forEach((sl, slIdx) => {
      if (parseInt(sl.day) === parseInt(day)) slotsInDay.push({ ...sl, sIdx, slIdx });
    });
  });

  slotsInDay.sort((a, b) => {
    const timeCompare = a.start.localeCompare(b.start);
    if (timeCompare !== 0) return timeCompare;
    return (a.createdAt || 0) - (b.createdAt || 0);
  });

  // --- NUOVA LOGICA DI PARTENZA ---
  // Se esiste un orario di arrivo, l'inizio lavori (primo slot) 
  // deve essere Arrivo + 15 minuti di setup.
  let baseStartTime = "08:00"; 
  const arrival = daySettings?.[day]?.arrivalTime;
  
  if (arrival) {
    const [h, m] = arrival.split(':').map(Number);
    let totalMin = h * 60 + m + 15; // Aggiungiamo 15 min di setup fisso
    baseStartTime = `${Math.floor(totalMin / 60).toString().padStart(2, '0')}:${(totalMin % 60).toString().padStart(2, '0')}`;
  }

  let nextStartTime = baseStartTime;

  slotsInDay.forEach((slot, index) => {
    const currentSlot = currentSections[slot.sIdx].slots[slot.slIdx];
    
    // Se è il primo slot del giorno ed è agganciato (non manuale), 
    // lo facciamo partire dopo il setup dell'arrivo.
    if (index === 0 && !currentSlot.isManual) {
      currentSlot.start = baseStartTime;
    } 
    // Se sono gli slot successivi, si attaccano alla fine del precedente
    else if (index > 0 && !currentSlot.isManual) {
      currentSlot.start = nextStartTime;
    }

    const [h, m] = currentSlot.start.split(':').map(Number);
    let totalMin = h * 60 + m + (parseFloat(currentSlot.duration) * 60);
    nextStartTime = `${Math.floor(totalMin / 60).toString().padStart(2, '0')}:${(totalMin % 60).toString().padStart(2, '0')}`;
  });

  return currentSections;
};

  const addSlotToDay = (day, sectionId) => {
    if (!sectionId) return;
    setEditingQuote(prev => {
      const newSections = JSON.parse(JSON.stringify(prev.sections));
      const sIdx = newSections.findIndex(s => s.id === sectionId);
      if (sIdx === -1) return prev;
      let latestEndMinutes = 8 * 60;
      newSections.forEach(s => {
        (s.slots || []).forEach(sl => {
          if (parseInt(sl.day) === parseInt(day)) {
            const [h, m] = sl.start.split(':').map(Number);
            const endMinutes = h * 60 + m + (parseFloat(sl.duration) * 60);
            if (endMinutes > latestEndMinutes) latestEndMinutes = endMinutes;
          }
        });
      });
      const newStart = `${Math.floor(latestEndMinutes / 60).toString().padStart(2, '0')}:${(latestEndMinutes % 60).toString().padStart(2, '0')}`;
      if (!newSections[sIdx].slots) newSections[sIdx].slots = [];
      newSections[sIdx].slots.push({
        id: `slot-${Date.now()}-${Math.random()}`,
        day: parseInt(day),
        start: newStart,
        duration: 1,
        isManual: false,
        createdAt: Date.now()
      });
      return { ...prev, sections: rechainDay(day, newSections) };
    });
  };

  const updateSlot = (sId, slotId, field, value) => {
    setEditingQuote(prev => {
      const newSections = JSON.parse(JSON.stringify(prev.sections));
      const sIdx = newSections.findIndex(s => s.id === sId);
      const slIdx = newSections[sIdx].slots.findIndex(sl => sl.id === slotId);
      newSections[sIdx].slots[slIdx][field] = value;
      if (field === 'start') newSections[sIdx].slots[slIdx].isManual = true;
      return { ...prev, sections: rechainDay(newSections[sIdx].slots[slIdx].day, newSections) };
    });
  };

  const dayNumbers = Object.keys(days).sort((a, b) => a - b);

  return (
    <div className="space-y-8 bg-gray-50/50 p-4 md:p-8 rounded-[48px] border border-gray-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Cronoprogramma</h2>
          <p className="text-gray-500 font-medium">Pianifica le fasi di lavoro</p>
        </div>
        <button 
          onClick={() => addSlotToDay(dayNumbers.length > 0 ? Math.max(...dayNumbers) + 1 : 1, sections[0]?.id)}
          className="bg-black text-white px-6 py-3 rounded-2xl font-bold text-sm hover:scale-105 transition-all shadow-lg"
        >
          + Aggiungi Giorno
        </button>
      </div>

      {dayNumbers.map(dayNum => (
        <div key={dayNum} className="bg-white rounded-[40px] p-6 md:p-8 shadow-sm border border-gray-100 relative">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-xl">
                {dayNum}
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 leading-none">Giorno {dayNum}</h3>
                {/* --- NUOVO INPUT ORA ARRIVO --- */}
                <div className="flex items-center gap-2 mt-2 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                  <Truck size={14} className="text-emerald-600" />
                  <span className="text-[10px] font-black text-emerald-700 uppercase">Arrivo:</span>
                  <input 
                    type="time" 
                    value={daySettings[dayNum]?.arrivalTime || ""}
                    placeholder="Auto (-15m)"
                    onChange={(e) => updateDayArrival(dayNum, e.target.value)}
                    className="bg-transparent text-xs font-bold text-emerald-800 outline-none w-16"
                  />
                </div>
              </div>
            </div>

            <select 
              className="bg-gray-50 border-none text-xs font-bold text-blue-600 px-4 py-2 rounded-xl outline-none"
              onChange={(e) => { if (e.target.value) addSlotToDay(dayNum, e.target.value); e.target.value = ""; }}
            >
              <option value="">+ Aggiungi fase...</option>
              {sections.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
          </div>

          <div className="space-y-4">
            {days[dayNum].map((slot) => (
              <div key={slot.id} className="relative group flex flex-col md:flex-row items-start md:items-center gap-4 p-5 rounded-3xl border-2 border-gray-50 bg-white hover:border-blue-100">
                <div className="flex flex-row md:flex-col items-center gap-2 min-w-[100px]">
                  <input 
                    type="time" 
                    value={slot.start}
                    onChange={(e) => updateSlot(slot.sectionId, slot.id, 'start', e.target.value)}
                    className={`text-lg font-black bg-transparent outline-none ${slot.isManual ? 'text-amber-500' : 'text-gray-900'}`}
                  />
                </div>
                <div className="flex-1">
                  <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">Attività</span>
                  <h4 className="font-bold text-gray-800">{slot.sectionTitle}</h4>
                </div>
                <div className="bg-gray-50 px-4 py-2 rounded-2xl flex items-center gap-3">
                  <span className="text-[10px] font-black text-gray-400 uppercase">Durata</span>
                  <input type="number" step="0.5" value={slot.duration} onChange={(e) => updateSlot(slot.sectionId, slot.id, 'duration', e.target.value)} className="w-8 bg-transparent font-black text-gray-900 outline-none" />
                  <span className="text-xs font-bold text-gray-400">h</span>
                </div>
                <button onClick={() => {
                  setEditingQuote(prev => {
                    let next = JSON.parse(JSON.stringify(prev.sections));
                    const sIdx = next.findIndex(s => s.id === slot.sectionId);
                    next[sIdx].slots = next[sIdx].slots.filter(sl => sl.id !== slot.id);
                    return { ...prev, sections: rechainDay(dayNum, next) };
                  });
                }} className="text-gray-300 hover:text-red-500 p-2"><Trash2 size={18} /></button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}