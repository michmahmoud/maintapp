
import React, { useState, useMemo, useEffect } from 'react';
import { Mission, Tournee, Agence, Contrat, Utilisateur, Banque, Equipement } from '../types';
import { generateManagerInsights } from '../geminiService';

interface DashboardProps {
  data: {
    agences: Agence[];
    contrats: Contrat[];
    utilisateurs: Utilisateur[];
    tournees: Tournee[];
    equipements: Equipement[];
    banques: Banque[];
    missions?: Mission[];
  };
}

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const [aiInsights, setAiInsights] = useState<string>("Analyse en cours...");
  const [activeTab, setActiveTab] = useState<'tournees' | 'archives' | 'stats'>('tournees');
  const missions = data.missions || [];

  useEffect(() => {
    generateManagerInsights(missions as any, data.agences).then(setAiInsights);
  }, [missions, data.agences]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Coordinateur</h2>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-1">Planification & Reporting</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-100">
           {['tournees', 'archives', 'stats'].map(t => (
             <button key={t} onClick={() => setActiveTab(t as any)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === t ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>
               {t === 'tournees' ? 'Tournées Actives' : t === 'archives' ? 'Archives' : 'Analyses AI'}
             </button>
           ))}
        </div>
      </div>

      {activeTab === 'tournees' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <button className="bg-white p-8 rounded-[2.5rem] border-2 border-dashed border-slate-200 text-slate-400 hover:border-blue-300 hover:text-blue-500 transition-all flex flex-col items-center justify-center gap-4 group">
            <div className="w-16 h-16 bg-slate-50 group-hover:bg-blue-50 rounded-2xl flex items-center justify-center text-2xl transition-all"><i className="fas fa-plus"></i></div>
            <span className="font-black text-xs uppercase tracking-widest">Créer une Tournée</span>
          </button>
          {data.tournees.map(t => (
            <div key={t.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl transition-all">
              <div className="flex justify-between items-start mb-6">
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest px-3 py-1 bg-blue-50 rounded-full">{t.code_tournee}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Q1 2024</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">{t.nom}</h3>
              <p className="text-xs text-slate-400 mb-8 line-clamp-2">{t.description}</p>
              <div className="flex justify-between items-center border-t border-slate-50 pt-6">
                 <div className="text-[10px] font-bold text-slate-500 uppercase"><i className="fas fa-calendar-day mr-2"></i> {t.date_limite}</div>
                 <button className="w-10 h-10 bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600 transition-all"><i className="fas fa-eye"></i></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-slate-900 p-10 rounded-[3rem] text-white relative overflow-hidden">
             <h3 className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-6"><i className="fas fa-brain mr-2"></i> Executive AI Summary</h3>
             <p className="text-lg leading-relaxed text-slate-200 italic font-medium relative z-10">"{aiInsights}"</p>
             <i className="fas fa-robot absolute -bottom-10 -right-10 text-white/5 text-[220px]"></i>
          </div>
          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-between">
             <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Performance Tournée</div>
             <div className="text-6xl font-black text-slate-900 tracking-tighter">84%</div>
             <div className="space-y-2 mt-8">
               <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                 <div className="h-full bg-blue-500" style={{width: '84%'}}></div>
               </div>
               <p className="text-[10px] font-bold text-slate-400 uppercase">12 Agences restantes / 78 complétées</p>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'archives' && (
        <div className="bg-white p-20 rounded-[3rem] border-2 border-dashed border-slate-100 text-center">
           <i className="fas fa-box-archive text-5xl text-slate-100 mb-6"></i>
           <p className="font-black text-slate-300 uppercase text-xs tracking-widest">Aucune tournée archivée pour le moment</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
