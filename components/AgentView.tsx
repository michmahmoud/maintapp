
import React, { useState, useMemo, useEffect } from 'react';
import { Tournee, Mission, SousMission, Agence, Equipement, FormTemplate, FormField, FormResponse, Region, Banque } from '../types';

interface AgentViewProps {
  userId: string;
  data: {
    tournees: Tournee[];
    missions: Mission[];
    subMissions: SousMission[];
    agences: Agence[];
    equipements: Equipement[];
    formTemplates: FormTemplate[];
    formFields: FormField[];
    banques: Banque[];
  };
  onUpdateSubMission: (sm: SousMission, responses: Partial<FormResponse>[]) => void;
  onUpdateMissionStatus: (mId: string, status: Mission['statut']) => void;
}

type ViewState = 
  | { mode: 'level1' }
  | { mode: 'level2', agenceId: string, missionId: string }
  | { mode: 'level3', subMissionId: string };

const AgentView: React.FC<AgentViewProps> = ({ userId, data, onUpdateSubMission, onUpdateMissionStatus }) => {
  const [viewState, setViewState] = useState<ViewState>({ mode: 'level1' });
  const [activeTab, setActiveTab] = useState<'remaining' | 'finished'>('remaining');
  const [searchQuery, setSearchQuery] = useState("");
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  
  // Form state for Level 3
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [isFunctional, setIsFunctional] = useState(true);

  // Géolocalisation pour l'itinéraire si besoin (optionnel selon le design existant)
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.log("Géo non autorisée", err)
      );
    }
  }, []);

  // Calcul du délai restant
  const getDeadlineInfo = (tourneeId: string) => {
    const tournee = data.tournees.find(t => t.id === tourneeId);
    if (!tournee) return { date: 'N/A', days: 0, isLate: false };
    
    const limit = new Date(tournee.date_limite);
    const today = new Date();
    const diff = limit.getTime() - today.getTime();
    const days = Math.ceil(diff / (1000 * 3600 * 24));
    
    return {
      date: tournee.date_limite,
      days: days,
      isLate: days < 0
    };
  };

  const filteredMissions = useMemo(() => {
    return data.missions
      .filter(m => m.technicien_id === userId)
      .filter(m => {
        const ag = data.agences.find(a => a.agenceid === m.agenceid);
        const matchStatus = activeTab === 'remaining' ? m.statut !== 'terminee' : m.statut === 'terminee';
        const matchSearch = ag?.nom_agence.toLowerCase().includes(searchQuery.toLowerCase()) || ag?.code_agence.includes(searchQuery);
        return matchStatus && matchSearch;
      })
      .sort((a, b) => a.ordre_passage - b.ordre_passage);
  }, [data.missions, activeTab, searchQuery, userId, data.agences]);

  // Validation d'une intervention (Level 3)
  const handleValidateIntervention = (sm: SousMission) => {
    // 1. Mettre à jour la sous-mission
    const updatedSm: SousMission = { 
      ...sm, 
      statut: 'valide', 
      fonctionnalite: isFunctional ? 'fonctionnel' : 'non_fonctionnel' 
    };
    onUpdateSubMission(updatedSm, []);

    // 2. Vérifier si c'est la dernière intervention de l'agence
    const siblings = data.subMissions.filter(s => s.mission_id === sm.mission_id);
    const otherValides = siblings.filter(s => s.sub_mission_id !== sm.sub_mission_id && s.statut === 'valide').length;
    
    if (otherValides + 1 === siblings.length) {
      // Toutes les interventions sont terminées -> Clôturer l'agence (la mission)
      onUpdateMissionStatus(sm.mission_id, 'terminee');
      setViewState({ mode: 'level1' });
    } else {
      // Retour au niveau 2
      const eq = data.equipements.find(e => e.equipementid === sm.equipementid);
      setViewState({ mode: 'level2', agenceId: eq!.agence_id, missionId: sm.mission_id });
    }
  };

  // --- NIVEAU 1 : LISTE DES AGENCES ---
  if (viewState.mode === 'level1') {
    return (
      <div className="bg-slate-50 min-h-screen pb-32 animate-fade-in">
        <div className="bg-white p-6 shadow-sm sticky top-16 z-40">
          <div className="flex gap-2 bg-slate-100 p-1 rounded-xl mb-4">
            <button onClick={() => setActiveTab('remaining')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'remaining' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Agences à faire</button>
            <button onClick={() => setActiveTab('finished')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'finished' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>Agences terminées</button>
          </div>
          <div className="relative">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
            <input type="text" placeholder="Rechercher une agence..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="p-4 space-y-4">
          {filteredMissions.map(m => {
            const ag = data.agences.find(a => a.agenceid === m.agenceid);
            const banque = data.banques.find(b => b.id === ag?.banque_id);
            const deadline = getDeadlineInfo(m.tournee_id);
            const count = data.subMissions.filter(sm => sm.mission_id === m.mission_id).length;
            
            return (
              <div key={m.mission_id} onClick={() => setViewState({mode: 'level2', agenceId: ag!.id, missionId: m.mission_id})} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm active:scale-95 transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-xs shadow-lg">{m.ordre_passage}</div>
                    <div>
                      <h3 className="font-black text-slate-900 text-sm leading-tight">{ag?.nom_agence}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{ag?.code_agence} • {banque?.nom}</p>
                    </div>
                  </div>
                  <span className={`text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest ${m.statut === 'terminee' ? 'bg-emerald-50 text-emerald-600' : m.statut === 'en_cours' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                    {m.statut.replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                   <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-1">Échéance</p>
                      <p className={`text-[10px] font-black ${deadline.isLate ? 'text-rose-600' : 'text-slate-700'}`}>{deadline.date}</p>
                   </div>
                   <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-1">Temps restant</p>
                      <p className={`text-[10px] font-black ${deadline.isLate ? 'text-rose-600' : 'text-emerald-600'}`}>{deadline.days} jours</p>
                   </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                  <span className="text-[9px] font-black text-slate-400 uppercase"><i className="fas fa-microchip mr-1.5"></i>{count} Équipements</span>
                  <div className="flex gap-2">
                    <a href={`tel:${ag?.tel_responsable}`} onClick={e => e.stopPropagation()} className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xs"><i className="fas fa-phone"></i></a>
                    <button className="w-8 h-8 bg-slate-900 text-white rounded-xl flex items-center justify-center text-xs group-hover:bg-blue-600 transition-colors"><i className="fas fa-arrow-right"></i></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // --- NIVEAU 2 : DÉTAILS AGENCE & LISTE INTERVENTIONS ---
  if (viewState.mode === 'level2') {
    const ag = data.agences.find(a => a.id === viewState.agenceId);
    const banque = data.banques.find(b => b.id === ag?.banque_id);
    const agSubMissions = data.subMissions.filter(sm => sm.mission_id === viewState.missionId);

    return (
      <div className="bg-slate-50 min-h-screen animate-fade-in pb-32">
        <div className="bg-white p-6 sticky top-16 z-40 border-b flex items-center gap-4">
          <button onClick={() => setViewState({mode:'level1'})} className="w-10 h-10 bg-slate-50 rounded-xl text-slate-400 flex items-center justify-center shadow-inner"><i className="fas fa-arrow-left"></i></button>
          <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">Fiche Agence</h2>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Section 1 : Informations Globales */}
          <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
            <h3 className="text-2xl font-black mb-1 uppercase tracking-tighter">{ag?.nom_agence}</h3>
            <p className="text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-6">{banque?.nom} • Code: {ag?.code_agence}</p>
            
            <div className="space-y-4 relative z-10">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-xs text-white/60"><i className="fas fa-user-tie"></i></div>
                 <div>
                    <p className="text-[9px] font-black text-white/40 uppercase">Responsable</p>
                    <p className="text-xs font-bold">{ag?.nom_responsable || 'M. Responsable'} • {ag?.tel_responsable || 'N/A'}</p>
                 </div>
              </div>
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-xs text-white/60"><i className="fas fa-envelope"></i></div>
                 <div>
                    <p className="text-[9px] font-black text-white/40 uppercase">Email</p>
                    <p className="text-xs font-bold lowercase">{ag?.mail_responsable || 'contact@agence.tn'}</p>
                 </div>
              </div>
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-xs text-white/60"><i className="fas fa-map-marker-alt"></i></div>
                 <div>
                    <p className="text-[9px] font-black text-white/40 uppercase">Adresse Complète</p>
                    <p className="text-xs font-bold leading-tight">{ag?.adresse}, {ag?.ville}<br/>{ag?.municipalite} ({ag?.region})</p>
                 </div>
              </div>
            </div>

            <a href={ag?.maps_url} target="_blank" className="mt-8 block w-full py-4 bg-blue-600 rounded-2xl text-center text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/30">
              <i className="fas fa-route mr-2"></i> Itinéraire Google Maps
            </a>
            
            <i className="fas fa-building absolute -bottom-10 -right-10 text-white/5 text-[200px]"></i>
          </div>

          {/* Section 2 : Liste des Interventions */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Équipements liés (Interventions)</h4>
            {agSubMissions.map(sm => {
              const eq = data.equipements.find(e => e.equipementid === sm.equipementid);
              const isTerminee = sm.statut === 'valide';
              
              return (
                <div 
                  key={sm.sub_mission_id} 
                  onClick={() => setViewState({mode:'level3', subMissionId: sm.sub_mission_id})}
                  className={`p-5 rounded-[2rem] border transition-all ${isTerminee ? 'bg-slate-100 border-slate-200 grayscale opacity-60' : 'bg-white border-slate-100 shadow-sm active:scale-95'}`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg ${isTerminee ? 'bg-slate-200 text-slate-400' : 'bg-blue-50 text-blue-600'}`}>
                        <i className={`fas ${sm.type_id.includes('ATM') ? 'fa-atm' : 'fa-microchip'}`}></i>
                      </div>
                      <div>
                        <h5 className="font-black text-slate-900 text-sm">{eq?.marque_modele}</h5>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">SN: {eq?.numero_serie} • {eq?.type}</p>
                      </div>
                    </div>
                    {isTerminee ? <i className="fas fa-check-circle text-emerald-500 text-xl"></i> : <i className="fas fa-chevron-right text-slate-200"></i>}
                  </div>
                  
                  <div className="flex gap-2">
                    <span className={`text-[8px] font-black px-2.5 py-1 rounded-lg uppercase tracking-tighter border ${sm.fonctionnalite === 'fonctionnel' ? 'border-emerald-100 text-emerald-600 bg-emerald-50' : 'border-rose-100 text-rose-600 bg-rose-50'}`}>
                      {sm.fonctionnalite === 'fonctionnel' ? 'Opérationnel' : 'Hors Service'}
                    </span>
                    <span className={`text-[8px] font-black px-2.5 py-1 rounded-lg uppercase tracking-tighter border ${isTerminee ? 'border-slate-200 text-slate-500 bg-slate-50' : 'border-blue-100 text-blue-600 bg-blue-50'}`}>
                      {isTerminee ? 'Terminée' : 'À Faire'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // --- NIVEAU 3 : FORMULAIRE D'INTERVENTION ---
  if (viewState.mode === 'level3') {
    const sm = data.subMissions.find(s => s.sub_mission_id === viewState.subMissionId);
    const eq = data.equipements.find(e => e.equipementid === sm?.equipementid);
    const template = data.formTemplates.find(t => t.type_id === sm?.type_id);
    const fields = data.formFields.filter(f => f.template_id === template?.template_id).sort((a,b) => a.ordre - b.ordre);
    const isValide = sm?.statut === 'valide';

    return (
      <div className="bg-slate-50 min-h-screen animate-fade-in pb-40">
        <div className="bg-white p-6 sticky top-16 z-40 border-b flex items-center gap-4">
          <button onClick={() => setViewState({mode:'level2', agenceId: eq!.agence_id, missionId: sm!.mission_id})} className="w-10 h-10 bg-slate-50 rounded-xl text-slate-400 flex items-center justify-center"><i className="fas fa-arrow-left"></i></button>
          <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">Rapport Technique</h2>
        </div>

        <div className={`p-6 space-y-6 ${isValide ? 'pointer-events-none' : ''}`}>
          {/* Header Intervention */}
          <div className={`bg-white p-6 rounded-[2.5rem] border ${isValide ? 'bg-slate-100 border-slate-200' : 'border-slate-100 shadow-sm'}`}>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Statut de l'équipement</p>
            <div className="flex justify-between items-center">
              <span className={`text-sm font-black uppercase ${isFunctional ? 'text-emerald-600' : 'text-rose-600'}`}>
                {isFunctional ? 'En Service' : 'En Panne'}
              </span>
              <button onClick={() => setIsFunctional(!isFunctional)} className={`w-14 h-8 rounded-full relative transition-all duration-300 ${isFunctional ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-md ${isFunctional ? 'right-1' : 'left-1'}`}></div>
              </button>
            </div>
            {isValide && <p className="mt-4 text-[9px] font-black text-slate-400 uppercase italic"><i className="fas fa-lock mr-1.5"></i>Ce rapport a été validé et n'est plus modifiable.</p>}
          </div>

          {/* Champs Dynamiques */}
          <div className="space-y-4">
             {fields.map(f => (
               <div key={f.id} className={`bg-white p-6 rounded-[2.5rem] border ${isValide ? 'bg-slate-50 border-slate-100' : 'border-slate-100 shadow-sm'}`}>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">{f.label} {f.required && <span className="text-rose-500">*</span>}</label>
                  
                  {f.type === 'checkbox' ? (
                    <button 
                      onClick={() => setResponses({...responses, [f.id]: responses[f.id] === 'true' ? 'false' : 'true'})}
                      className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-[10px] uppercase transition-all ${responses[f.id] === 'true' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}
                    >
                      <i className={`fas ${responses[f.id] === 'true' ? 'fa-check-circle' : 'fa-circle'}`}></i> {responses[f.id] === 'true' ? 'Validé' : 'À vérifier'}
                    </button>
                  ) : f.type === 'photo' ? (
                    <div className="space-y-3">
                      <div className="w-full h-40 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                        <i className="fas fa-camera text-2xl mb-2"></i>
                        <span className="text-[10px] font-black uppercase">Prendre une photo</span>
                      </div>
                    </div>
                  ) : (
                    <textarea 
                      value={responses[f.id] || ''} 
                      onChange={e => setResponses({...responses, [f.id]: e.target.value})} 
                      className="w-full bg-slate-50 p-4 rounded-2xl border-none text-xs font-bold outline-none h-24 focus:ring-2 focus:ring-blue-500" 
                      placeholder="Saisir vos notes ici..." 
                    />
                  )}
               </div>
             ))}
          </div>
        </div>

        {!isValide && (
          <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-100 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
            <button 
              onClick={() => handleValidateIntervention(sm!)}
              className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-2xl shadow-slate-900/20 active:scale-95 transition-all"
            >
              <i className="fas fa-paper-plane mr-2"></i> Valider l'Intervention
            </button>
          </div>
        )}
      </div>
    );
  }

  return null;
};

const FilterSelect = ({ label, value, options, onChange }: any) => (
  <select 
    value={value} 
    onChange={e => onChange(e.target.value)} 
    className="bg-slate-50 border-none px-4 py-2 rounded-xl text-[9px] font-black uppercase text-slate-600 outline-none min-w-[100px]"
  >
    <option value="All">{label}</option>
    {options.map((o: any) => {
      const val = typeof o === 'string' ? o : o.val;
      const lab = typeof o === 'string' ? o : o.label;
      return <option key={val} value={val}>{lab}</option>;
    })}
  </select>
);

export default AgentView;
