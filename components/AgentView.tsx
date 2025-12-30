
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
  
  // Filtres
  const [filterRegion, setFilterRegion] = useState<string>("All");
  const [filterClient, setFilterClient] = useState<string>("All");
  const [filterVille, setFilterVille] = useState<string>("All");
  const [sortBy, setSortBy] = useState<'order' | 'deadline' | 'distance'>('order');

  const [responses, setResponses] = useState<Record<string, string>>({});
  const [isFunctional, setIsFunctional] = useState(true);

  // Géolocalisation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.log("Géo non autorisée", err)
      );
    }
  }, []);

  const calculateDistance = (lat2: number, lon2: number) => {
    if (!userLocation) return 999999;
    const R = 6371; 
    const dLat = (lat2 - userLocation.lat) * (Math.PI / 180);
    const dLon = (lon2 - userLocation.lng) * (Math.PI / 180);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(userLocation.lat * (Math.PI/180)) * Math.cos(lat2 * (Math.PI/180)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Liste des villes dépendantes de la région
  const availableVilles = useMemo(() => {
    const v = data.agences
      .filter(a => filterRegion === "All" || a.region === filterRegion)
      .map(a => a.ville)
      .filter(Boolean);
    return Array.from(new Set(v));
  }, [data.agences, filterRegion]);

  // Liste des clients dépendant de région/ville
  const availableClients = useMemo(() => {
    const ags = data.agences.filter(a => {
      const matchRegion = filterRegion === "All" || a.region === filterRegion;
      const matchVille = filterVille === "All" || a.ville === filterVille;
      return matchRegion && matchVille;
    });
    const bIds = Array.from(new Set(ags.map(a => a.banque_id)));
    return data.banques.filter(b => bIds.includes(b.id));
  }, [data.agences, filterRegion, filterVille, data.banques]);

  const filteredMissions = useMemo(() => {
    let result = data.missions
      .filter(m => m.technicien_id === userId)
      .filter(m => {
        const ag = data.agences.find(a => a.agenceid === m.agenceid);
        const matchStatus = activeTab === 'remaining' ? m.statut !== 'terminee' : m.statut === 'terminee';
        const matchSearch = ag?.nom_agence.toLowerCase().includes(searchQuery.toLowerCase()) || ag?.code_agence.includes(searchQuery);
        const matchRegion = filterRegion === "All" || ag?.region === filterRegion;
        const matchVille = filterVille === "All" || ag?.ville === filterVille;
        const matchClient = filterClient === "All" || ag?.banque_id === filterClient;
        return matchStatus && matchSearch && matchRegion && matchVille && matchClient;
      });

    // Tri
    if (sortBy === 'distance' && userLocation) {
      result.sort((a, b) => {
        const agA = data.agences.find(x => x.agenceid === a.agenceid);
        const agB = data.agences.find(x => x.agenceid === b.agenceid);
        return calculateDistance(agA?.latitude || 0, agA?.longitude || 0) - calculateDistance(agB?.latitude || 0, agB?.longitude || 0);
      });
    } else if (sortBy === 'order') {
      result.sort((a, b) => a.ordre_passage - b.ordre_passage);
    }
    
    return result;
  }, [data.missions, activeTab, searchQuery, filterRegion, filterVille, filterClient, sortBy, userLocation, data.agences]);

  // --- NIVEAU 1 : LISTE ---
  if (viewState.mode === 'level1') {
    return (
      <div className="bg-slate-50 min-h-screen pb-32 animate-fade-in">
        <div className="bg-white p-6 shadow-sm sticky top-16 z-40">
          <div className="flex justify-between items-center mb-4">
             <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
               <button onClick={() => setActiveTab('remaining')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${activeTab === 'remaining' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Restantes</button>
               <button onClick={() => setActiveTab('finished')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${activeTab === 'finished' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>Terminées</button>
             </div>
             <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="bg-slate-50 border-none text-[9px] font-black uppercase px-3 py-2 rounded-xl text-slate-500">
               <option value="order">Ordre</option>
               <option value="distance">Distance</option>
               <option value="deadline">Deadline</option>
             </select>
          </div>

          <div className="relative mb-4">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
            <input type="text" placeholder="Agence, Code..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            <FilterSelect label="Région" value={filterRegion} options={Object.values(Region)} onChange={v => {setFilterRegion(v); setFilterVille("All"); setFilterClient("All");}} />
            <FilterSelect label="Ville" value={filterVille} options={availableVilles as string[]} onChange={v => {setFilterVille(v); setFilterClient("All");}} />
            <FilterSelect label="Client" value={filterClient} options={availableClients.map(c => ({val: c.id, label: c.nom}))} onChange={setFilterClient} />
          </div>
        </div>

        <div className="p-4 space-y-4">
          {filteredMissions.map(m => {
            const ag = data.agences.find(a => a.agenceid === m.agenceid);
            const banque = data.banques.find(b => b.id === ag?.banque_id);
            const count = data.equipements.filter(e => e.agence_id === ag?.id).length;
            return (
              <div key={m.mission_id} onClick={() => setViewState({mode: 'level2', agenceId: ag!.id, missionId: m.mission_id})} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm active:scale-95 transition-all">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex gap-3 items-center">
                    <div className="w-9 h-9 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-[10px]">{m.ordre_passage}</div>
                    <div>
                      <h3 className="font-black text-slate-900 leading-tight">{ag?.nom_agence}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{ag?.code_agence} • {ag?.ville || ag?.region}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-full uppercase">{banque?.nom}</span>
                  </div>
                </div>
                <div className="flex justify-between items-end border-t border-slate-50 pt-3">
                  <div className="text-[9px] font-black text-slate-400 uppercase">
                    <i className="fas fa-microchip mr-1"></i> {count} Équipements
                  </div>
                  <div className="flex gap-2">
                    <a href={`tel:${ag?.tel_responsable}`} onClick={e => e.stopPropagation()} className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center text-xs shadow-sm"><i className="fas fa-phone"></i></a>
                    <a href={ag?.maps_url} target="_blank" onClick={e => e.stopPropagation()} className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center text-xs shadow-sm"><i className="fas fa-location-arrow"></i></a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // --- NIVEAU 2 : DÉTAILS AGENCE ---
  if (viewState.mode === 'level2') {
    const ag = data.agences.find(a => a.id === viewState.agenceId);
    const agMissions = data.subMissions.filter(sm => sm.mission_id === viewState.missionId);
    return (
      <div className="bg-slate-50 min-h-screen animate-fade-in pb-32">
        <div className="bg-white p-6 sticky top-16 z-40 border-b flex items-center gap-4">
          <button onClick={() => setViewState({mode:'level1'})} className="w-10 h-10 bg-slate-50 rounded-xl text-slate-400 flex items-center justify-center"><i className="fas fa-arrow-left"></i></button>
          <h2 className="text-sm font-black text-slate-900 uppercase">Détails Agence</h2>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
            <h3 className="text-2xl font-black mb-1">{ag?.nom_agence}</h3>
            <p className="text-blue-400 text-[10px] font-bold uppercase tracking-widest">{ag?.code_agence} • {ag?.ville}</p>
            <div className="mt-8 flex justify-between items-center">
              <div>
                <span className="text-[9px] font-black text-white/40 uppercase block mb-1">Échéance</span>
                <span className="text-xs font-bold bg-white/10 px-3 py-1.5 rounded-full">3 jours restants</span>
              </div>
              <a href={ag?.maps_url} target="_blank" className="bg-blue-600 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><i className="fas fa-map"></i> Maps</a>
            </div>
            <i className="fas fa-building absolute -bottom-10 -right-10 text-white/5 text-[180px]"></i>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-100">
            <h4 className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Contact Responsable</h4>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-black text-slate-900">{ag?.nom_responsable || 'M. Responsable'}</p>
                <p className="text-xs text-slate-400 font-medium">Chef d'agence</p>
              </div>
              <a href={`tel:${ag?.tel_responsable}`} className="text-blue-600 font-black text-sm">{ag?.tel_responsable || '71 000 000'}</a>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Équipements à entretenir</h4>
            {agMissions.map(sm => {
              const eq = data.equipements.find(e => e.equipementid === sm.equipementid);
              const isValide = sm.statut === 'valide';
              return (
                <div 
                  key={sm.sub_mission_id} 
                  onClick={() => !isValide && setViewState({mode:'level3', subMissionId: sm.sub_mission_id})}
                  className={`p-5 rounded-[2rem] border transition-all ${isValide ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-100 hover:border-blue-200'}`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex gap-4 items-center">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${isValide ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                        <i className={`fas ${isValide ? 'fa-check' : 'fa-microchip'}`}></i>
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900">{eq?.marque_modele}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{eq?.type} • S/N: {eq?.numero_serie}</p>
                      </div>
                    </div>
                    {!isValide && <i className="fas fa-chevron-right text-slate-200"></i>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // --- NIVEAU 3 : INTERVENTION ---
  if (viewState.mode === 'level3') {
    const sm = data.subMissions.find(s => s.sub_mission_id === viewState.subMissionId);
    const eq = data.equipements.find(e => e.equipementid === sm?.equipementid);
    const template = data.formTemplates.find(t => t.type_id === sm?.type_id);
    const fields = data.formFields.filter(f => f.template_id === template?.template_id).sort((a,b) => a.ordre - b.ordre);

    return (
      <div className="bg-slate-50 min-h-screen animate-fade-in pb-40">
        <div className="bg-white p-6 sticky top-16 z-40 border-b flex items-center gap-4">
          <button onClick={() => setViewState({mode:'level2', agenceId: eq!.agence_id, missionId: sm!.mission_id})} className="w-10 h-10 bg-slate-50 rounded-xl text-slate-400 flex items-center justify-center"><i className="fas fa-arrow-left"></i></button>
          <h2 className="text-sm font-black text-slate-900 uppercase">Fiche Intervention</h2>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 flex justify-between items-center">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase mb-1">État Machine</p>
              <p className={`text-xs font-black uppercase ${isFunctional ? 'text-emerald-600' : 'text-rose-600'}`}>{isFunctional ? 'Fonctionnelle' : 'En Panne'}</p>
            </div>
            <button onClick={() => setIsFunctional(!isFunctional)} className={`w-12 h-7 rounded-full transition-all relative ${isFunctional ? 'bg-emerald-500' : 'bg-slate-200'}`}>
              <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${isFunctional ? 'right-1' : 'left-1'}`}></div>
            </button>
          </div>

          <div className="space-y-4">
             {fields.map(f => (
               <div key={f.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100">
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">{f.label}</label>
                  {f.type === 'checkbox' ? (
                    <button 
                      onClick={() => setResponses({...responses, [f.id]: responses[f.id] === 'true' ? 'false' : 'true'})}
                      className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-[10px] uppercase transition-all ${responses[f.id] === 'true' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}
                    >
                      <i className={`fas ${responses[f.id] === 'true' ? 'fa-check-circle' : 'fa-circle'}`}></i> {responses[f.id] === 'true' ? 'Vérifié' : 'À faire'}
                    </button>
                  ) : (
                    <textarea value={responses[f.id] || ''} onChange={e => setResponses({...responses, [f.id]: e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl border-none text-xs font-bold outline-none h-24" placeholder="Saisir notes..." />
                  )}
               </div>
             ))}
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t">
          <button 
            onClick={() => {
              onUpdateSubMission({...sm!, statut:'valide'}, []);
              setViewState({mode:'level2', agenceId: eq!.agence_id, missionId: sm!.mission_id});
            }}
            className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl shadow-slate-900/20"
          >
            Valider l'Intervention
          </button>
        </div>
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
