import React from 'react';
import { Users, Quote } from 'lucide-react';
import { DEFAULT_TEAM } from '../config/defaultTeam';

export default function TeamSection({ teamMembers }) {
  if (!teamMembers || teamMembers.length === 0) return null;

  return (
    <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-[100vw] bg-[#0A0A0B] py-20 my-16 print:hidden">
      <div className="max-w-[960px] mx-auto px-6 md:px-24 print:px-0 print:max-w-none">
        
        {/* Header Apple Style */}
        <div className="mb-16 text-center print:mb-8">
          <div className="flex justify-center items-center gap-4 text-white/40 mb-8 print:hidden">
           
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight print:text-2xl print:text-gray-900">
            <span className="text-white/30 font-medium print:text-gray-500">I professionisti che</span> <br className="print:hidden"/>
            <span className="text-white print:text-black">seguiranno il vostro progetto.</span>
          </h2>
        </div>

        {/* Grid Layout: Optimized for Mobile First (Single Column) */}
        <div className="flex flex-col gap-12 md:grid md:grid-cols-2 md:gap-x-16 md:gap-y-20 print:grid print:grid-cols-3 print:gap-x-8 print:gap-y-12">
          {teamMembers.map((member, idx) => {
            // Find phone number from DEFAULT_TEAM if it's missing in the quote data
            const defaultMember = DEFAULT_TEAM.find(m => m.name === member.name);
            const phoneNumber = member.phone || defaultMember?.phone;

            return (
              <div 
                key={idx} 
                className="group flex flex-col items-center text-center print:break-inside-avoid"
              >
                <div className="relative mb-6 print:mb-3">
                  {/* Photo: Always Color, optimized ring for clean mobile look */}
                  <div className="w-24 h-24 md:w-28 md:h-28 print:w-20 print:h-20 rounded-full overflow-hidden ring-[1px] ring-white/10 p-1 bg-white/[0.02] shadow-2xl print:shadow-none print:ring-gray-200 print:bg-white">
                    <div className="w-full h-full rounded-full overflow-hidden print:border print:border-gray-100">
                      <img 
                        src={member.photoUrl || "https://via.placeholder.com/150"} 
                        alt={member.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 print:scale-100"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 px-4 print:px-0">
                  <div className="text-[10px] font-bold text-blue-500/80 uppercase tracking-[0.2em] print:text-blue-600">
                    {member.role}
                  </div>
                  <h3 className="text-[20px] md:text-2xl font-bold text-white tracking-tight print:text-lg print:text-black">
                    {member.name}
                  </h3>

                  {phoneNumber && (
                    <a 
                      href={`https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 text-[13px] text-white/40 hover:text-white underline decoration-white/20 underline-offset-4 transition-all print:hidden"
                    >
                    Apri chat Whatsapp
                    </a>
                  )}

                  {/* Print-only phone number text */}
                  {phoneNumber && (
                    <div className="hidden print:block text-[11px] text-gray-500 mt-1">
                      {phoneNumber}
                    </div>
                  )}
                  
                  {member.quirk && (
                    <p className="mt-3 max-w-xs text-[14px] leading-relaxed text-white/40 font-medium md:text-white/50 print:text-gray-600 print:text-[12px] print:mt-1">
                      {member.quirk}
                    </p>
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
