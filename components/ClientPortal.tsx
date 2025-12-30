
import React, { useState } from 'react';
import { Banque, Agence, Equipement, Intervention, Utilisateur } from '../types';

interface ClientPortalProps {
  bankId: string;
  data: {
    banques: Banque[];
    agences: Agence[];
    equipements: Equipement[];
    interventions: Intervention[];
    utilisateurs: Utilisateur[];
  };
}

const ClientPortal: React.FC<ClientPortalProps> = ({ bankId, data }) => {
  const [selectedEquipement, setSelectedEquipement] = useState<Equipement | null>(null);
  const banque = data.banques.find(b => b.id === bankId);
  const mesAgences = data.agences.filter(a => a.banque_id === bankId);
  
  const getInterventionsForEquipement = (id: string) => {
    return data.interventions.filter(i => i.equipement_id === id);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6">
        <img src={banque?.infos.logo || 'https://via.placeholder.com/100'} className="w-20 h-20 rounded-2xl object-cover shadow-md" />
        <div>
          <h2 className="text-2xl font-black text-slate-900">Banque : {banque?.nom}</h2>
          <p className="text-slate-500 text-sm">{banque?.infos.adresseSiege}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-bold text-slate-800 px-2 tracking-widest uppercase text-[10px]">Agences & Parc</h3>
          {mesAgences.map(ag => {
            const machines = data.equipements.filter(e => e.agence_id === ag.id);
            return (
              <div key={ag.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                  <span className="text-xs font-black text-slate-500 uppercase">{ag.nom_agence}</span>
                  <span className="text-[10px] font-bold text-blue-500">{ag.region}</span>
                </div>
                <div className="p-2 space-y-1">
                  {machines.map(m => (
                    <button 
                      key={m.id}
                      onClick={() => setSelectedEquipement(m)}
                      className={`w-full text-left p-3 rounded-xl transition-all flex justify-between items-center group ${selectedEquipement?.id === m.id ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-50 text-slate-700'}`}
                    >
                      <div className="flex items-center gap-3">
                        <i className="fas fa-microchip opacity-50 text-xs"></i>
                        <div>
                          <div className="text-sm font-bold">{m.marque_modele}</div>
                          <div className={`text-[10px] ${selectedEquipement?.id === m.id ? 'text-blue-200' : 'text-slate-400'}`}>S/N: {m.numero_serie}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="lg:col-span-2">
           {selectedEquipement ? (
             <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm animate-in fade-in duration-300">
               <div className="flex justify-between items-start mb-10">
                 <div>
                   <h3 className="text-2xl font-black text-slate-900">{selectedEquipement.marque_modele}</h3>
                   <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Type: {selectedEquipement.type}</span>
                 </div>
                 <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold">Actif sous contrat</div>
               </div>

               <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                 <i className="fas fa-history text-blue-500"></i> Historique
               </h4>

               <div className="space-y-4">
                 {getInterventionsForEquipement(selectedEquipement.id).length > 0 ? getInterventionsForEquipement(selectedEquipement.id).map(i => {
                   const tech = data.utilisateurs.find(u => u.id === i.technicien_id);
                   return (
                     <div key={i.id} className="p-5 border border-slate-100 rounded-2xl hover:border-blue-100">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-sm font-bold text-slate-800">{i.date_reelle || i.date_prevue}</span>
                          <span className="text-[10px] px-2 py-1 bg-slate-100 text-slate-500 rounded-full font-bold uppercase">{i.statut}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div><span className="text-slate-400 block mb-1">Intervenant</span><span className="font-bold text-slate-700">{tech?.prenom} {tech?.nom}</span></div>
                          <div><span className="text-slate-400 block mb-1">Type</span><span className="font-bold text-slate-700">{i.type}</span></div>
                        </div>
                     </div>
                   );
                 }) : <p className="text-slate-400 italic text-sm">Aucune intervention enregistrée pour cet équipement.</p>}
               </div>
             </div>
           ) : (
             <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100 text-slate-300">
               <i className="fas fa-search-plus text-5xl mb-4"></i>
               <p className="font-bold">Sélectionnez un équipement pour voir les détails</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default ClientPortal;
