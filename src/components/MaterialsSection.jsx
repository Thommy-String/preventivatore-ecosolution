import React from 'react';

export default function MaterialsSection({ materials }) {
  if (!materials || materials.length === 0) return null;

  return (
    <div className="px-6 md:px-24 py-16 md:py-24 bg-white">

      {/* Section Header */}
      <div data-pdf-block="global-materials-header" className="text-center mb-16 md:mb-20">
        <p className="text-[11px] font-black text-[#86868b] uppercase tracking-[0.25em] mb-3">
          Materiali
        </p>
        <h2 className="text-3xl md:text-[42px] font-bold text-[#1d1d1f] tracking-tight leading-tight">
          Cosa utilizziamo.
        </h2>
        <p className="text-[15px] md:text-[17px] text-[#86868b] mt-3 max-w-lg mx-auto leading-relaxed">
          Una selezione di materiali di alta qualità, scelti per garantire prestazioni e durata nel tempo.
        </p>
      </div>

      {/* Materials Grid */}
      <div className="space-y-20 md:space-y-28">
        {materials.map((material, index) => (
          <div key={material.id || index} data-pdf-block={`global-material-${index}`} className="max-w-4xl mx-auto">

            {/* Material Number */}
            <div className="mb-6">
              <span className="text-[12px] font-bold text-[#86868b] opacity-30 tabular-nums tracking-wide">
                0{index + 1}
              </span>
            </div>

            {/* Photo + Info Layout */}
            <div className="flex flex-col gap-10">

              {/* Photo */}
              {material.photoUrl && (
                <div className="relative w-full aspect-[16/9] md:aspect-[2/1] rounded-[20px] md:rounded-[28px] overflow-hidden bg-[#f5f5f7] border border-black/[0.04]">
                  <img
                    src={material.photoUrl}
                    alt={material.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Name + Description */}
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-[#1d1d1f] tracking-tight leading-tight">
                  {material.name}
                </h3>
                {material.description && (
                  <p className="text-[15px] text-[#86868b] mt-2 leading-relaxed max-w-2xl">
                    {material.description}
                  </p>
                )}
              </div>

              {/* Specs Table — Apple Style */}
              {material.specs && material.specs.length > 0 && (
                <div className="w-full">
                  <p className="text-[10px] font-bold text-[#86868b] uppercase tracking-[0.2em] mb-4">
                    Specifiche Tecniche
                  </p>
                  <div className="border-t border-[#e8e8ed]">
                    {material.specs.map((spec, sIdx) => (
                      <div
                        key={sIdx}
                        className="flex items-baseline justify-between py-3 border-b border-[#e8e8ed]/70 gap-4"
                      >
                        <span className="text-[13px] text-[#86868b] font-medium shrink-0">
                          {spec.label}
                        </span>
                        <span className="text-[13px] text-[#1d1d1f] font-semibold text-right">
                          {spec.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
