import TimelineDay from './TimelineDay';

export default function WorkTimeline({ sections, daySettings = {} }) {
  if (!sections || !Array.isArray(sections)) return null;

  const hourWidth = typeof window !== 'undefined' && window.innerWidth < 768 ? 260 : 220;

  const formatDuration = (hours) => {
    const h = parseFloat(hours);
    if (h === 0.25) return "15m";
    if (h === 0.5) return "30m";
    return Number.isInteger(h) ? `${h}h` : `${h.toString().replace(".", ",")}h`;
  };

  const pastelColors = [
    { bg: 'bg-[#F0F4FF]', border: 'border-[#D9E2FF]', text: 'text-[#55679C]' },
    { bg: 'bg-[#FDF2F8]', border: 'border-[#FBCFE8]', text: 'text-[#9D174D]' },
    { bg: 'bg-[#FDF5E6]', border: 'border-[#F9EBD0]', text: 'text-[#8B7355]' },
    { bg: 'bg-[#F5F3FF]', border: 'border-[#EDE9FE]', text: 'text-[#6D6392]' },
  ];

  const daysMap = sections.reduce((acc, section, sectionIndex) => {
    (section.slots || []).forEach(slot => {
      const day = slot.day || 1;
      if (!acc[day]) acc[day] = [];
      acc[day].push({
        id: slot.id,
        title: section.title,
        startTime: slot.start,
        durationHours: slot.duration,
        colorIndex: sectionIndex 
      });
    });
    return acc;
  }, {});

  const sortedDays = Object.keys(daysMap).sort((a, b) => Number(a) - Number(b));

  return (
    <div className="py-8 ml-2 md:py-16 max-w-[1200px] mx-auto overflow-visible bg-white font-sans select-none">
      {sortedDays.map((day) => (
        <TimelineDay 
          key={day}
          day={day}
          daySections={[...daysMap[day]].sort((a, b) => a.startTime.localeCompare(b.startTime))}
          daySettings={daySettings}
          hourWidth={hourWidth}
          pastelColors={pastelColors}
          formatDuration={formatDuration}
        />
      ))}
    </div>
  );
}