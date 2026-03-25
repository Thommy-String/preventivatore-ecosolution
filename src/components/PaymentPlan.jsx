import React from 'react';
import { CreditCard, CircleDot, ArrowRight } from 'lucide-react';

export default function PaymentPlan({ payments, totalQuote }) {
  if (!payments || payments.length === 0) return null;

  const formatCurrency = (val) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(val);

  return (
    <div className="px-10 mt-8 md:px-24 py-16">
      <div className="max-w-3xl">
        <div data-pdf-block="payment-header" className="flex items-center gap-2 mb-10 opacity-40">
          <CreditCard size={14} className="text-[#1d1d1f]" />
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#1d1d1f]">
            Condizioni di Pagamento
          </span>
        </div>

        <div className="space-y-0">
          {payments.map((p, idx) => (
            <div key={idx} data-pdf-block={`payment-${idx}`} className="group relative flex gap-8 pb-10 last:pb-0">
              {/* Linea verticale Notion */}
              {idx !== payments.length - 1 && (
                <div className="absolute left-[11px] top-6 w-[1px] h-full bg-gray-100 group-hover:bg-gray-200 transition-colors" />
              )}
              
              {/* Indicatore */}
              <div className="relative z-10 mt-1.5">
                <div className="w-[23px] h-[23px] rounded-full bg-white border-2 border-gray-200 flex items-center justify-center group-hover:border-gray-900 transition-colors">
                  <div className={`w-2 h-2 rounded-full ${p.isPaid ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                </div>
              </div>

              {/* Contenuto */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-2 mb-2">
                  <h4 className="text-[16px] font-bold text-[#1d1d1f] uppercase tracking-tight">
                    {p.label}
                  </h4>
                  <span className="text-2xl font-light tracking-tighter text-[#1d1d1f]">
                    {formatCurrency(p.amount)}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-[13px] text-[#86868b] font-medium">
                  <span>{p.dueDate}</span>
                  {p.percentage && (
                    <>
                      <span className="text-gray-200">•</span>
                      <span className="bg-gray-50 px-2 py-0.5 rounded text-[10px] font-bold">{p.percentage}% del totale</span>
                    </>
                  )}
                </div>
                
                {p.description && (
                  <p className="mt-3 text-[14px] leading-relaxed text-[#86868b] max-w-xl">
                    {p.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}