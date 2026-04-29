import React from 'react';
import { CreditCard, CircleDot, ArrowRight, Package, Truck } from 'lucide-react';

export default function PaymentPlan({ payments, totalQuote }) {
  if (!payments || payments.length === 0) return null;

  const formatCurrency = (val) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(val);

  return (
    <div className="px-4 sm:px-10 mt-8 md:px-24 py-16">
      <div className="max-w-3xl">
        <div data-pdf-block="payment-header" className="flex items-center gap-2 mb-10 opacity-40">
          <CreditCard size={14} className="text-[#1d1d1f]" />
          <span className="text-[14px] font-black uppercase tracking-[0.2em] text-[#1d1d1f]">
            Condizioni di Pagamento
          </span>
        </div>

        <div className="space-y-0">
          {payments.map((p, idx) => {
            const isMaterial = p.isMaterialPayment;

            return (
              <div key={idx} data-pdf-block={`payment-${idx}`} className="group relative flex gap-3 sm:gap-5 md:gap-8 pb-10 last:pb-0">
                {/* Linea verticale */}
                {idx !== payments.length - 1 && (
                  <div className="absolute left-[11px] top-6 w-[1px] h-full transition-colors bg-gray-100 group-hover:bg-gray-200" />
                )}
                
                {/* Indicatore */}
                <div className="relative z-10 mt-1.5">
                  {isMaterial ? (
                    <div className="w-[23px] h-[23px] rounded-full bg-white border-2 border-gray-200 flex items-center justify-center group-hover:border-gray-900 transition-colors">
                      <Package size={9} className="text-[#86868b]" />
                    </div>
                  ) : (
                    <div className="w-[23px] h-[23px] rounded-full bg-white border-2 border-gray-200 flex items-center justify-center group-hover:border-gray-900 transition-colors">
                      <div className={`w-2 h-2 rounded-full ${p.isPaid ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                    </div>
                  )}
                </div>

                {/* Contenuto */}
                <div className="flex-1">
                  {/* Card speciale materiale */}
                  {isMaterial ? (
                    <>
                      <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <h4 className="text-[19px] font-bold text-[#1d1d1f] uppercase tracking-tight">
                            {p.label}
                          </h4>
                          <span className="bg-[#fef3c7] text-[#92400e] text-[11px] font-black uppercase tracking-[0.1em] px-1.5 py-[2px] rounded">
                            Fornitura
                          </span>
                        </div>
                        <span className="text-2xl font-light tracking-tighter text-[#1d1d1f]">
                          {formatCurrency(p.amount)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-[16px] text-[#86868b] font-medium">
                        <span>{p.dueDate}</span>
                        {p.percentage && (
                          <>
                            <span className="text-gray-200">•</span>
                            <span className="bg-gray-50 px-2 py-0.5 rounded text-[13px] font-bold">{p.percentage}% del totale</span>
                          </>
                        )}
                      </div>
                      
                      {/* Dettaglio voci materiale */}
                      {p.materialItems && p.materialItems.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-gray-100 space-y-1.5">
                          <p className="text-[12px] font-black uppercase tracking-[0.15em] text-[#a1a1a6] mb-2">
                            Dettaglio fornitura
                          </p>
                          {p.materialItems.map((mi, miIdx) => (
                            <div key={miIdx} className="flex items-center justify-between text-[15px]">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <span className="text-[#c7c7cc] text-[13px]">•</span>
                                <span className="text-[#636366] font-medium truncate">{mi.description}</span>
                                {mi.quantity && mi.unit && (
                                  <span className="text-[#a1a1a6] text-[13px] shrink-0">
                                    ({mi.quantity} {mi.unit})
                                  </span>
                                )}
                              </div>
                              <span className="text-[#1d1d1f] font-bold tabular-nums shrink-0 ml-3">{formatCurrency(mi.amount)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {p.description && (
                        <p className="mt-3 text-[16px] leading-relaxed text-[#86868b] max-w-xl italic">
                          {p.description}
                        </p>
                      )}
                    </>
                  ) : (
                    /* Card standard lavorazione */
                    <>
                      <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-2 mb-2">
                        <h4 className="text-[19px] font-bold text-[#1d1d1f] uppercase tracking-tight">
                          {p.label}
                        </h4>
                        <span className="text-2xl font-light tracking-tighter text-[#1d1d1f]">
                          {formatCurrency(p.amount)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-[16px] text-[#86868b] font-medium">
                        <span>{p.dueDate}</span>
                        {p.percentage && (
                          <>
                            <span className="text-gray-200">•</span>
                            <span className="bg-gray-50 px-2 py-0.5 rounded text-[13px] font-bold">{p.percentage}% del totale</span>
                          </>
                        )}
                      </div>
                      
                      {p.description && (
                        <p className="mt-3 text-[17px] leading-relaxed text-[#86868b] max-w-xl">
                          {p.description}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}