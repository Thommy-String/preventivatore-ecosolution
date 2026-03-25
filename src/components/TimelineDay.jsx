import React, { useRef, useEffect } from 'react';
import { Truck, Hammer, DoorClosed } from "lucide-react";

// Sotto-componente per la singola riga del giorno
export default function TimelineDay({
    day,
    daySections,
    daySettings,
    hourWidth,
    pastelColors,
    formatDuration
}) {
    const scrollRef = useRef(null);

    // --- LOGICA DI CALCOLO (Spostata qui dentro) ---
    const firstJobTime = daySections[0].startTime;
    const manualArrival = daySettings[day]?.arrivalTime;

    let arrivalTimeStr;
    if (manualArrival) {
        arrivalTimeStr = manualArrival;
    } else {
        const [h, m] = firstJobTime.split(":").map(Number);
        const arrivalTotalMin = (h * 60 + m) - 15;
        arrivalTimeStr = `${Math.floor(arrivalTotalMin / 60).toString().padStart(2, '0')}:${(arrivalTotalMin % 60).toString().padStart(2, '0')}`;
    }

    const arrivalH = parseInt(arrivalTimeStr.split(":")[0]);
    const currentStartHour = Math.max(0, arrivalH - 1);

    const getX = (timeStr) => {
        if (!timeStr) return 0;
        const [h, m] = timeStr.split(":").map(Number);
        return ((h - currentStartHour) + (m / 60)) * hourWidth + 20;
    };

    const arrivalX = getX(arrivalTimeStr);
    const startX = getX(firstJobTime);

    // Calcolo fine giornata
    const lastSlotMin = daySections.reduce((latest, s) => {
        const [h, m] = s.startTime.split(":").map(Number);
        return Math.max(latest, h * 60 + m + (parseFloat(s.durationHours) * 60));
    }, 0);
    const lastActivityEndPos = getX(`${Math.floor(lastSlotMin / 60).toString().padStart(2, '0')}:${(lastSlotMin % 60).toString().padStart(2, '0')}`);
    const currentEndHour = Math.max(currentStartHour + 8, Math.ceil(lastSlotMin / 60) + 1);

    // --- AUTO SCROLL ALL'AVVIO ---
    useEffect(() => {
        if (scrollRef.current) {
            // Scrolliamo di 40px prima del camioncino per dare respiro
            scrollRef.current.scrollLeft = arrivalX - 40;
        }
    }, [arrivalX]);

    return (
        <div className="relative mb-40 md:mb-56 ml-4 md:ml-16 pl-1 md:pl-10 border-l-2 border-gray-100 last:mb-24">
            <div className="absolute left-[-10px] top-0 w-6 h-6 bg-white flex items-center justify-center text-[8px] font-black z-50 uppercase italic">
                Giorno:{day}
            </div>

            <div
                ref={scrollRef}
                className="overflow-x-auto scroll-smooth scrollbar-hide pt-28 md:pt-32 pb-4 px-2 md:px-10 relative"
            >
                <div className="relative pr-20" style={{ width: (currentEndHour - currentStartHour) * hourWidth + 40 }}>
                    <div className="relative h-16 md:h-20 flex items-center mb-10 md:mb-14">

                        {/* 1. PIN ARRIVO - Cambiato h-full con un valore che scende giù */}
                        <div className="absolute top-[-95px] md:top-[-105px] z-30 border-l-2 border-emerald-500/30"
                            style={{ left: arrivalX, bottom: '-44px' }}> {/* bottom negativo per toccare l'asse X */}
                            <div className="absolute top-0 left-0 -translate-x-1/2 flex flex-col items-center">
                                <div className="bg-green-500 text-white text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg mb-1 whitespace-nowrap flex items-center gap-1.5 uppercase">
                                    <Truck size={14} /> Arrivo {arrivalTimeStr}
                                </div>
                                <div className="w-2.5 h-2.5 bg-emerald-600 rounded-full border-2 border-white shadow-sm" />
                            </div>
                        </div>

                        {/* SETUP CHIP */}
                        <div className="absolute h-full bg-gray-50/80 border border-dashed border-gray-200 rounded-xl flex items-center justify-center z-10"
                            style={{ left: arrivalX, width: Math.max(0, startX - arrivalX) }}>
                            <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase italic">Setup</span>
                        </div>

                        {/* 2. PIN INIZIO - Stessa logica: bottom negativo */}
                        <div className="absolute top-[-55px] md:top-[-60px] z-30 border-l-2 border-blue-600/30"
                            style={{ left: startX, bottom: '-44px' }}>
                            <div className="absolute top-0 left-0 -translate-x-1/2 flex flex-col items-center">
                                <div className="bg-blue-500 text-white text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg mb-1 whitespace-nowrap flex items-center gap-1.5 uppercase">
                                    <Hammer size={14} /> Inizio {firstJobTime}
                                </div>
                                <div className="w-2.5 h-2.5 bg-blue-600 rounded-full border-2 border-white shadow-sm" />
                            </div>
                        </div>

                        {/* CHIPS LAVORAZIONI */}
                        {daySections.map((section) => {
                            const x = getX(section.startTime);
                            const width = parseFloat(section.durationHours) * hourWidth;
                            const color = pastelColors[section.colorIndex % pastelColors.length];
                            return (
                                <div key={section.id} className="absolute h-full flex items-center px-[2px] z-20" style={{ left: x, width: width }}>
                                    <div className={`h-full w-full ${color.bg} border ${color.border} rounded-xl flex flex-col justify-center px-4 shadow-sm overflow-hidden`}>
                                        <span className={`font-bold ${color.text} uppercase tracking-tight text-xs line-clamp-2`}>
                                            {section.title}
                                        </span>
                                        <span className={`text-[10px] font-bold ${color.text} opacity-50 mt-1 text-right`}>
                                            {formatDuration(section.durationHours)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}

                        {/* 3. PIN FINE - Stessa logica: bottom negativo */}
                        <div className="absolute top-[-95px] md:top-[-105px] z-30 border-l-2 border-rose-800/30"
                            style={{ left: lastActivityEndPos, bottom: '-44px' }}>
                            <div className="absolute top-0 left-0 -translate-x-1/2 flex flex-col items-center">
                                <div className="bg-rose-400 text-white text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg mb-1 whitespace-nowrap flex items-center gap-1.5 uppercase">
                                    <DoorClosed size={14} /> Fine
                                </div>
                                <div className="w-2.5 h-2.5 bg-rose-800 rounded-full border-2 border-white shadow-sm" />
                            </div>
                        </div>
                    </div>

                    {/* AREA ORE DINAMICA */}
                    <div className="relative h-12 border-t border-gray-200 mt-4">
                        {Array.from({ length: currentEndHour - currentStartHour + 1 }).map((_, i) => (
                            <div key={i} className="absolute top-0 w-0 h-full flex flex-col items-center" style={{ left: i * hourWidth + 20 }}>
                                <div className="w-[1px] h-3 bg-gray-300" />
                                <span className="text-xs font-bold text-gray-400 tabular-nums mt-2 whitespace-nowrap">
                                    {(currentStartHour + i).toString().padStart(2, "0")}:00
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};