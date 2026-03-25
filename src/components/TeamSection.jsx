import React from 'react';
import { Users, Quote } from 'lucide-react';
import { DEFAULT_TEAM } from '../config/defaultTeam';

export default function TeamSection({ teamMembers }) {
  if (!teamMembers || teamMembers.length === 0) return null;

  return (
    <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-[100vw] bg-[#0A0A0B] py-20 my-16">
      <div className="max-w-[960px] mx-auto px-6 md:px-24">
        
        {/* Header Apple Style */}
        <div className="mb-16 text-center">
          <div className="flex justify-center items-center gap-4 text-white/40 mb-8">
           
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight">
            <span className="text-white/30 font-medium">I professionisti che</span> <br />
            <span className="text-white">seguiranno il vostro progetto.</span>
          </h2>
        </div>

        {/* Grid Layout: Optimized for Mobile First (Single Column) */}
        <div className="flex flex-col gap-12 md:grid md:grid-cols-2 md:gap-x-16 md:gap-y-20">
          {teamMembers.map((member, idx) => {
            // Find phone number from DEFAULT_TEAM if it's missing in the quote data
            const defaultMember = DEFAULT_TEAM.find(m => m.name === member.name);
            const phoneNumber = member.phone || defaultMember?.phone;

            return (
              <div 
                key={idx} 
                className="group flex flex-col items-center text-center"
              >
                <div className="relative mb-6">
                  {/* Photo: Always Color, optimized ring for clean mobile look */}
                  <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden ring-[1px] ring-white/10 p-1 bg-white/[0.02] shadow-2xl">
                    <div className="w-full h-full rounded-full overflow-hidden">
                      <img 
                        src={member.photoUrl || "https://via.placeholder.com/150"} 
                        alt={member.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 px-4">
                  <div className="text-[10px] font-bold text-blue-500/80 uppercase tracking-[0.2em]">
                    {member.role}
                  </div>
                  <h3 className="text-[20px] md:text-2xl font-bold text-white tracking-tight">
                    {member.name}
                  </h3>

                  {phoneNumber && (
                    <a 
                      href={`https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 text-[13px] text-white/40 hover:text-white underline decoration-white/20 underline-offset-4 transition-all"
                    >
                    Apri chat Whatsapp
                    </a>
                  )}
                  
                  {member.quirk && (
                    <p className="mt-3 max-w-xs text-[14px] leading-relaxed text-white/40 font-medium md:text-white/50">
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