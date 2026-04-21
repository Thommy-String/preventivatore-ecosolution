import React from 'react';
import { ExternalLink } from 'lucide-react';

const formatCurrency = (value) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);
};

function SectionMaterials({ materials }) {
    if (!materials || materials.length === 0) return null;

    const validMaterials = materials.filter(m => m.name);
    if (validMaterials.length === 0) return null;

    return (
        <div className="mt-5 pt-4">
            {/* Label — solo testo, minimal */}
            <p data-pdf-block="materials-label" className="text-[11px] font-semibold text-[#86868b] uppercase tracking-[0.08em] mb-4">
                Materiale utilizzato
            </p>

            <div className={`grid gap-4 ${validMaterials.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                {validMaterials.map((material, index) => {
                    const hasSpecs = material.specs && material.specs.filter(s => s.label).length > 0;
                    const filteredSpecs = hasSpecs ? material.specs.filter(s => s.label) : [];

                    return (
                        <div
                            key={material.id || index}
                            data-pdf-block={`material-card-${index}`}
                            className="bg-white rounded-2xl border border-black/[0.04] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
                        >
                            {/* Photo — vertical, compact 3:2 */}
                            {material.photoUrl && (
                                <div className="relative w-full aspect-[3/2] bg-[#f5f5f7] overflow-hidden print:hidden">
                                    <img
                                        src={material.photoUrl}
                                        alt={material.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}

                            {/* Content */}
                            <div className="px-5 py-4">
                                {/* Name + Product Link */}
                                <div className="flex items-baseline gap-2 flex-wrap">
                                    <h4 className="text-[15px] font-semibold text-[#1d1d1f] tracking-tight leading-snug">
                                        {material.name}
                                    </h4>
                                    {material.link && (
                                        <a
                                            href={material.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-[11px] text-blue-500 font-medium underline decoration-blue-400/50 decoration-1 underline-offset-2 hover:text-blue-600 hover:decoration-blue-500 transition-colors shrink-0 print:hidden"
                                        >
                                            Vedi prodotto
                                            <ExternalLink size={10} className="opacity-70" />
                                        </a>
                                    )}
                                </div>

                                {/* Description */}
                                {material.description && (
                                    <p className="text-[12px] text-[#86868b] mt-1 leading-relaxed">
                                        {material.description}
                                    </p>
                                )}

                                {/* Specs Table — two-column, right-aligned values */}
                                {filteredSpecs.length > 0 && (
                                    <div className="mt-3.5 border-t border-[#e8e8ed]/80">
                                        {filteredSpecs.map((spec, sIdx) => (
                                            <div
                                                key={sIdx}
                                                className="flex items-baseline justify-between py-2 border-b border-[#e8e8ed]/50 last:border-b-0 gap-3"
                                            >
                                                <span className="text-[11px] text-[#86868b] font-medium">
                                                    {spec.label}
                                                </span>
                                                <span className="text-[11px] text-[#1d1d1f] font-semibold text-right">
                                                    {spec.value}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function QuoteSections({ sections }) {
    if (!sections || sections.length === 0) return null;

    return (
        <div data-pdf-block="sections-wrapper" className="bg-gray-50 px-6 py-10 md:px-24 pb-20">
            {sections.map((section, index) => {
                const sectionTotal = section.items.reduce((a, b) => a + (b.price * b.quantity), 0);
                const totalQty = section.items.reduce((a, b) => a + parseFloat(b.quantity || 0), 0);
                const mainUnit = section.items.length > 0 ? section.items[0].unit : '';

                return (
                    <section key={section.id || index}>

                        {/* Separatore tra sezioni */}
                        {index > 0 && (
                            <div data-pdf-block={`separator-${index}`} className="py-10 md:py-14 flex items-center justify-center">
                                <div className="w-10 h-[1px] bg-[#d2d2d7]/60 rounded-full" />
                            </div>
                        )}

                        {/* Intestazione Sezione — titolo + descrizione */}
                        <div data-pdf-block={`heading-${index}`} className="flex flex-col md:flex-row gap-4 md:gap-6 items-baseline">
                            {/* Numero Sezione */}
                            <div className="md:w-[60px] shrink-0">
                                <span className="text-[13px] font-bold text-[#86868b] opacity-40 tabular-nums">0{index + 1}</span>
                            </div>

                            {/* Titolo + Descrizione only */}
                            <div className="w-full">
                                <h2 className="text-2xl md:text-3xl font-bold text-[#1d1d1f] tracking-tight leading-tight mb-1">
                                    {section.title}
                                </h2>
                                {section.description && (
                                    <div className="text-[15px] leading-relaxed text-[#86868b] max-w-2xl mt-2 [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:ml-5 [&_ol]:my-2 [&_li]:py-0.5 [&_p]:my-1 [&_b]:font-bold [&_strong]:font-bold" dangerouslySetInnerHTML={{ __html: section.description }} />
                                )}
                            </div>
                        </div>

                        {/* Foto — blocco separato per PDF */}
                        {section.photos && section.photos.length > 0 && (
                            <div data-pdf-block={`photos-${index}`} className="md:ml-[76px] print:hidden">
                                <div className={`grid gap-6 mt-8 mb-10 ${section.photos.length === 1 ? 'grid-cols-1 max-w-4xl' : 'grid-cols-1 md:grid-cols-2 max-w-5xl'}`}>
                                    {section.photos.map((photo, i) => (
                                        <div key={i} data-pdf-block={`photo-${index}-${i}`} className="relative aspect-[4/3] md:aspect-[4/3] rounded-[24px] overflow-hidden bg-[#f9f9f9] border border-black/5 shadow-sm">
                                            <img
                                                src={photo.url}
                                                alt={`Work detail ${i}`}
                                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                                            />
                                            {section.photos.length > 1 && photo.type && (
                                                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider text-[#1d1d1f] shadow-sm">
                                                    {photo.type === 'before' ? 'Attuale' : 'Previsto'}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Lista Voci — ogni riga è un blocco PDF separato */}
                        <div className="md:ml-[76px] mt-8 print:mt-4">
                            {section.items.map((item, idx) => (
                                <div
                                    key={idx}
                                    data-pdf-block={`item-${index}-${idx}`}
                                    className={`flex justify-between items-start gap-6 py-4 px-4 -mx-4 rounded-xl group print:break-inside-avoid print:py-2 print:px-0 print:-mx-0 ${
                                        idx % 2 === 1 ? 'bg-[#e8e8ed]/50 print:bg-transparent' : 'print:bg-transparent'
                                    }`}
                                >
                                    {/* Sinistra: Descrizione + dettaglio quantità */}
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[14px] leading-snug text-[#1d1d1f] font-medium" dangerouslySetInnerHTML={{ __html: item.description }} />
                                        <p className="text-[11px] text-[#a1a1a6] mt-1 tabular-nums">
                                            {item.quantity} {item.unit} × {formatCurrency(item.price)}
                                        </p>
                                    </div>

                                    {/* Destra: Totale voce */}
                                    <div className="shrink-0 text-right pt-0.5">
                                        {item.originalPrice && parseFloat(item.originalPrice) > 0 && (
                                            <span className="text-[12px] text-[#ff3b30] line-through tabular-nums mr-2 opacity-70">
                                                {formatCurrency(parseFloat(item.originalPrice) * item.quantity)}
                                            </span>
                                        )}
                                        <span className="text-[14px] font-semibold text-[#1d1d1f] tabular-nums">
                                            {formatCurrency(item.price * item.quantity)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Per-Section Materials — blocco separato */}
                        <div className="md:ml-[76px] print:break-inside-avoid">
                            <SectionMaterials materials={section.materials} />
                        </div>

                    </section>
                );
            })}
        </div>
    );
}