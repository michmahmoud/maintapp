
import React, { useState, useMemo, useEffect } from 'react';
import { Mission, Tournee, Agence, Contrat, Utilisateur, Banque, Equipement, Region, UserRole, SousMission } from '../types';
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
    subMissions?: SousMission[];
  };
  setters: {
    setTournees: React.Dispatch<React.SetStateAction<Tournee[]>>;
    setMissions: React.Dispatch<React.SetStateAction<Mission[]>>;
    setSubMissions: React.Dispatch<React.SetStateAction<SousMission[]>>;
  };
}

type Step = 'info' | 'contracts' | 'assignment' | 'finalize';

const Dashboard: React.FC<DashboardProps> = ({ data, setters }) => {
  const [aiInsights, setAiInsights] = useState<string>("Analyse en cours...");
  const [activeTab, setActiveTab] = useState<'tournees' | 'archives' | 'stats'>('tournees');
  const [isCreating, setIsCreating] = useState(false);
  const [editingTourId, setEditingTourId] = useState<string | null>(null);
  const [reportingTourId, setReportingTourId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<Step>('info');
  const [showNiveau3, setShowNiveau3] = useState(false);
  
  // Create/Edit Form State
  const [newTournee, setNewTournee] = useState<Partial<Tournee>>({
    code_tournee: '',
    nom: '',
    description: '',
    statut: 'planifiee',
    date_debut: '',
    date_limite: ''
  });
  const [selectedContracts, setSelectedContracts] = useState<string[]>([]);
  const [contractFilterBank, setContractFilterBank] = useState('All');
  
  // Assignment State: Record<agenceId, { techId: string, order: number }>
  const [assignments, setAssignments] = useState<Record<string, { techId: string, order: number }>>({});
  const [expandedRegions, setExpandedRegions] = useState<string[]>([]);
  const [draggedAgId, setDraggedAgId] = useState<string | null>(null);

  // Reporting Filters
  const [reportBank, setReportBank] = useState('All');
  const [reportContract, setReportContract] = useState('All');

  const missions = data.missions || [];
  const technicians = data.utilisateurs.filter(u => u.roles.includes(UserRole.Technicien));

  useEffect(() => {
    generateManagerInsights(missions as any, data.agences).then(setAiInsights);
  }, [missions, data.agences]);

  // Logic: Automatic status transition to 'terminee' if all missions done
  useEffect(() => {
    data.tournees.forEach(t => {
        if (t.statut === 'declenchee' || t.statut === 'en_pause') {
            const tMissions = data.missions?.filter(m => m.tournee_id === t.id) || [];
            if (tMissions.length > 0 && tMissions.every(m => m.statut === 'terminee')) {
                setters.setTournees(prev => prev.map(tour => tour.id === t.id ? { ...tour, statut: 'terminee' } : tour));
            }
        }
    });
  }, [data.missions, data.tournees]);

  // Logic: Get agencies for selected contracts
  // RÈGLE MÉTIER : Uniquement les agences ayant au moins un équipement sous les contrats sélectionnés
  const agenciesToAssign = useMemo<Agence[]>(() => {
    if (selectedContracts.length === 0) return [];
    const bIds = data.contrats.filter(c => selectedContracts.includes(c.id)).map(c => c.banque_id);
    const ags = data.agences.filter(a => {
        const hasEquip = data.equipements.some(e => e.agence_id === a.id && selectedContracts.includes(e.contrat_id));
        return bIds.includes(a.banque_id) && hasEquip;
    });
    
    // Tri selon l'ordre défini (unique)
    return ags.sort((a, b) => (assignments[a.id]?.order || 999) - (assignments[b.id]?.order || 999));
  }, [selectedContracts, data.agences, data.equipements, data.contrats, assignments]);

  const groupedAgencies = useMemo<Record<string, Agence[]>>(() => {
    const groups: Record<string, Agence[]> = {};
    agenciesToAssign.forEach(a => {
        if (!groups[a.region]) groups[a.region] = [];
        groups[a.region].push(a);
    });
    return groups;
  }, [agenciesToAssign]);

  // Trier les noms des régions pour l'affichage constant (alphabétique)
  const sortedRegionKeys = useMemo(() => {
    return Object.keys(groupedAgencies).sort((a, b) => a.localeCompare(b));
  }, [groupedAgencies]);

  const toggleRegion = (reg: string) => {
    setExpandedRegions(prev => prev.includes(reg) ? prev.filter(r => r !== reg) : [...prev, reg]);
  };

  const assignRegion = (reg: string, techId: string) => {
    const newAss = { ...assignments };
    groupedAgencies[reg].forEach(ag => {
        newAss[ag.id] = { ...newAss[ag.id], techId };
    });
    setAssignments(newAss);
  };

  // Logique de décalage automatique pour garantir l'unicité de l'ordre
  const handleOrderChange = (agId: string, newOrder: number) => {
    if (newOrder < 1) return;
    const newAssignments = { ...assignments };
    
    // Liste des IDs gérés triés par leur ordre actuel
    const managedAgIds = agenciesToAssign.map(a => a.id);
    const sortedAgIds = managedAgIds.sort((a, b) => (newAssignments[a]?.order || 999) - (newAssignments[b]?.order || 999));
    
    const filteredIds = sortedAgIds.filter(id => id !== agId);
    const targetIdx = Math.min(newOrder - 1, filteredIds.length);
    filteredIds.splice(targetIdx, 0, agId);
    
    filteredIds.forEach((id, idx) => {
        newAssignments[id] = { ...(newAssignments[id] || { techId: '' }), order: idx + 1 };
    });
    
    setAssignments(newAssignments);
  };

  // Drag and Drop handlers
  const onDragStart = (e: React.DragEvent, id: string) => {
    setDraggedAgId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const onDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    if (!draggedId || draggedId === targetId) return;
    const targetOrder = assignments[targetId]?.order || 1;
    handleOrderChange(draggedId, targetOrder);
    setDraggedAgId(null);
  };

  // Initialisation de l'ordre par défaut : Région puis Ville
  const goToAssignment = () => {
    const bIds = data.contrats.filter(c => selectedContracts.includes(c.id)).map(c => c.banque_id);
    const ags = data.agences.filter(a => {
        const hasEquip = data.equipements.some(e => e.agence_id === a.id && selectedContracts.includes(e.contrat_id));
        return bIds.includes(a.banque_id) && hasEquip;
    });

    // Tri alphabétique initial
    ags.sort((a, b) => {
      if (a.region !== b.region) return a.region.localeCompare(b.region);
      return (a.ville || "").localeCompare(b.ville || "");
    });

    const newAss = { ...assignments };
    ags.forEach((ag, index) => {
      if (!newAss[ag.id] || !newAss[ag.id].order) {
        newAss[ag.id] = { techId: newAss[ag.id]?.techId || '', order: index + 1 };
      }
    });

    setAssignments(newAss);
    setCurrentStep('assignment');
  };

  const resetForm = () => {
    setNewTournee({
        code_tournee: '',
        nom: '',
        description: '',
        statut: 'planifiee',
        date_debut: '',
        date_limite: ''
    });
    setSelectedContracts([]);
    setAssignments({});
    setEditingTourId(null);
    setCurrentStep('info');
    setContractFilterBank('All');
  };

  const startEditing = (t: Tournee) => {
    if (t.statut !== 'planifiee' && t.statut !== 'en_pause') return;
    setEditingTourId(t.id);
    setNewTournee(t);
    
    const tMissions = data.missions?.filter(m => m.tournee_id === t.id) || [];
    const tAgences = data.agences.filter(a => tMissions.some(m => m.agenceid === a.agenceid));
    const tEquips = data.equipements.filter(e => tAgences.some(a => a.id === e.agence_id));
    const tContrats = Array.from(new Set(tEquips.map(e => e.contrat_id)));
    setSelectedContracts(tContrats);

    const currentAss: Record<string, { techId: string, order: number }> = {};
    tMissions.forEach(m => {
        const ag = data.agences.find(a => a.agenceid === m.agenceid);
        if (ag) currentAss[ag.id] = { techId: m.technicien_id, order: m.ordre_passage };
    });
    setAssignments(currentAss);
    setCurrentStep('info');
    setIsCreating(true);
  };

  const handleFinishCreation = () => {
    if (!newTournee.code_tournee || !newTournee.nom || !newTournee.date_debut || !newTournee.date_limite) return alert("Veuillez remplir les dates et informations.");
    
    const tourId = editingTourId || `tour-${Date.now()}`;
    const tourneeObj: Tournee = {
        ...newTournee as Tournee,
        id: tourId,
        tournee_id: tourId,
        created_at: newTournee.created_at || new Date().toISOString(),
        created_by: 'u1'
    };

    // RÈGLE MÉTIER : Vérification finale pour s'assurer que chaque agence a bien des équipements
    const validatedAgencies = agenciesToAssign.filter(ag => {
        return data.equipements.some(e => e.agence_id === ag.id && selectedContracts.includes(e.contrat_id));
    });

    if (validatedAgencies.length === 0) {
        alert("Impossible de créer la tournée : aucune agence valide (avec équipement sous contrat) n'a été trouvée.");
        return;
    }

    const newMissions: Mission[] = validatedAgencies.map(ag => ({
        mission_id: `m-${tourId}-${ag.id}`,
        tournee_id: tourId,
        agenceid: ag.agenceid,
        technicien_id: assignments[ag.id].techId,
        ordre_passage: assignments[ag.id].order,
        statut: 'a_faire'
    }));

    const newSubMissions: SousMission[] = [];
    validatedAgencies.forEach(ag => {
        const agEquips = data.equipements.filter(e => e.agence_id === ag.id && selectedContracts.includes(e.contrat_id));
        agEquips.forEach(e => {
            newSubMissions.push({
                sub_mission_id: `sm-${tourId}-${e.id}`,
                mission_id: `m-${tourId}-${ag.id}`,
                equipementid: e.id,
                type_id: e.type_id,
                statut: 'a_faire',
                fonctionnalite: 'fonctionnel'
            });
        });
    });

    if (editingTourId) {
        setters.setTournees(prev => prev.map(t => t.id === tourId ? tourneeObj : t));
        setters.setMissions(prev => [...prev.filter(m => m.tournee_id !== tourId), ...newMissions]);
        setters.setSubMissions(prev => [...prev.filter(sm => !sm.mission_id.startsWith(`m-${tourId}`)), ...newSubMissions]);
    } else {
        setters.setTournees(prev => [...prev, tourneeObj]);
        setters.setMissions(prev => [...prev, ...newMissions]);
        setters.setSubMissions(prev => [...prev, ...newSubMissions]);
    }

    setIsCreating(false);
    resetForm();
  };

  const updateStatus = (tourId: string, newStatus: string) => {
    setters.setTournees(prev => prev.map(t => t.id === tourId ? { ...t, statut: newStatus } : t));
  };

  const getCardSummary = (tourId: string) => {
    const tMissions = data.missions?.filter(m => m.tournee_id === tourId) || [];
    const doneMissions = tMissions.filter(m => m.statut === 'terminee').length;
    const mIds = tMissions.map(m => m.mission_id);
    const tSubs = data.subMissions?.filter(s => mIds.includes(s.mission_id)) || [];
    const doneSubs = tSubs.filter(s => s.statut === 'valide').length;
    return {
        agRestantes: tMissions.length - doneMissions,
        agTotal: tMissions.length,
        eqRestants: tSubs.length - doneSubs,
        eqTotal: tSubs.length,
        progress: tMissions.length > 0 ? Math.round((doneMissions / tMissions.length) * 100) : 0
    };
  };

  // Reporting Logic
  const reportingStats = useMemo(() => {
    let filteredMissions = data.missions || [];
    let filteredSubs = data.subMissions || [];

    if (reportingTourId) {
        filteredMissions = filteredMissions.filter(m => m.tournee_id === reportingTourId);
    }

    if (reportBank !== 'All') {
        const bAgences = data.agences.filter(a => a.banque_id === reportBank).map(a => a.agenceid);
        filteredMissions = filteredMissions.filter(m => bAgences.includes(m.agenceid));
    }

    if (reportContract !== 'All') {
        const cEquips = data.equipements.filter(e => e.contrat_id === reportContract).map(e => e.id);
        filteredSubs = filteredSubs.filter(s => cEquips.includes(s.equipementid));
        const validMIds = Array.from(new Set(filteredSubs.map(s => s.mission_id)));
        filteredMissions = filteredMissions.filter(m => validMIds.includes(m.mission_id));
    }

    const mIds = filteredMissions.map(m => m.mission_id);
    filteredSubs = data.subMissions?.filter(s => mIds.includes(s.mission_id)) || [];

    const totalAgences = filteredMissions.length;
    const agencesTerminees = filteredMissions.filter(m => m.statut === 'terminee').length;
    const totalEquips = filteredSubs.length;
    const equipsTermines = filteredSubs.filter(s => s.statut === 'valide').length;

    const progress = totalAgences > 0 ? Math.round((agencesTerminees / totalAgences) * 100) : 0;

    const regionStats: Record<string, { total: number, done: number }> = {};
    filteredMissions.forEach(m => {
        const ag = data.agences.find(a => a.agenceid === m.agenceid);
        if (ag) {
            if (!regionStats[ag.region]) regionStats[ag.region] = { total: 0, done: 0 };
            regionStats[ag.region].total++;
            if (m.statut === 'terminee') regionStats[ag.region].done++;
        }
    });

    const techStats: Record<string, { total: number, done: number }> = {};
    filteredMissions.forEach(m => {
        const tech = data.utilisateurs.find(u => u.id === m.technicien_id);
        const name = tech ? `${tech.prenom} ${tech.nom}` : 'Inconnu';
        if (!techStats[name]) techStats[name] = { total: 0, done: 0 };
        techStats[name].total++;
        if (m.statut === 'terminee') techStats[name].done++;
    });

    return { progress, totalAgences, agencesTerminees, totalEquips, equipsTermines, regionStats, techStats, filteredMissions };
  }, [data, reportBank, reportContract, reportingTourId]) as {
    progress: number;
    totalAgences: number;
    agencesTerminees: number;
    totalEquips: number;
    equipsTermines: number;
    regionStats: Record<string, { total: number; done: number }>;
    techStats: Record<string, { total: number; done: number }>;
    filteredMissions: Mission[];
  };

  if (isCreating) {
    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <div className="flex justify-between items-center">
                <button onClick={() => { setIsCreating(false); resetForm(); }} className="px-5 py-3 bg-slate-200 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest"><i className="fas fa-arrow-left mr-2"></i> Annuler</button>
                <div className="flex gap-2">
                    {['info', 'contracts', 'assignment', 'finalize'].map((s, idx) => (
                        <div key={s} className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black ${currentStep === s ? 'bg-blue-600 text-white shadow-lg' : idx < ['info', 'contracts', 'assignment', 'finalize'].indexOf(currentStep) ? 'bg-emerald-50 text-white' : 'bg-slate-200 text-slate-400'}`}>{idx + 1}</div>
                    ))}
                </div>
            </div>

            {currentStep === 'info' && (
                <div className="max-w-3xl mx-auto bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 space-y-6">
                    <h3 className="text-xl font-black text-slate-900 uppercase">{editingTourId ? 'Modifier' : '1.'} Informations Générales</h3>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Référence Tournée</label>
                            <input value={newTournee.code_tournee} onChange={e => setNewTournee({...newTournee, code_tournee: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: T2024-Q2-NORD" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Nom de la Tournée</label>
                            <input value={newTournee.nom} onChange={e => setNewTournee({...newTournee, nom: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: Maintenance Préventive Trimestrielle" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Description / Notes</label>
                            <textarea value={newTournee.description} onChange={e => setNewTournee({...newTournee, description: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500 h-32" placeholder="Instructions pour les techniciens..." />
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => { if(newTournee.code_tournee && newTournee.nom) setCurrentStep('contracts'); }} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Suivant : Sélection des Contrats</button>
                    </div>
                </div>
            )}

            {currentStep === 'contracts' && (
                <div className="max-w-5xl mx-auto space-y-6">
                    <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 uppercase">2. Contrats à inclure</h3>
                            <p className="text-xs text-slate-400 mt-1">{selectedContracts.length} contrat(s) sélectionné(s)</p>
                        </div>
                        <select value={contractFilterBank} onChange={e => setContractFilterBank(e.target.value)} className="bg-slate-50 border-none px-6 py-3 rounded-xl text-[10px] font-black uppercase outline-none shadow-sm">
                            <option value="All">Tous les Clients</option>
                            {data.banques.map(b => <option key={b.id} value={b.id}>{b.nom}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {data.contrats.filter(c => contractFilterBank === 'All' || c.banque_id === contractFilterBank).map(c => {
                            const isSelected = selectedContracts.includes(c.id);
                            const bank = data.banques.find(b => b.id === c.banque_id);
                            const agCount = data.agences.filter(a => a.banque_id === c.banque_id).length;
                            const eqCount = data.equipements.filter(e => e.contrat_id === c.id).length;
                            return (
                                <div key={c.id} onClick={() => setSelectedContracts(prev => isSelected ? prev.filter(id => id !== c.id) : [...prev, c.id])} className={`p-6 rounded-[2rem] border-2 transition-all cursor-pointer ${isSelected ? 'bg-blue-50 border-blue-500 shadow-lg' : 'bg-white border-slate-100'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{bank?.nom}</p>
                                            <h4 className="text-lg font-black text-slate-900">{c.numero_contrat}</h4>
                                        </div>
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200'}`}><i className="fas fa-check text-[10px]"></i></div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="text-[10px] font-bold text-slate-500 uppercase bg-slate-100 px-3 py-1 rounded-full"><i className="fas fa-building mr-2"></i>{agCount} Agences</div>
                                        <div className="text-[10px] font-bold text-slate-500 uppercase bg-slate-100 px-3 py-1 rounded-full"><i className="fas fa-microchip mr-2"></i>{eqCount} Machines</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => setCurrentStep('info')} className="w-1/3 py-5 bg-slate-200 text-slate-600 rounded-2xl font-black uppercase text-xs tracking-widest">Précédent</button>
                        <button disabled={selectedContracts.length === 0} onClick={goToAssignment} className={`w-2/3 py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all ${selectedContracts.length > 0 ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>Suivant : Affectation Techniciens</button>
                    </div>
                </div>
            )}

            {currentStep === 'assignment' && (
                <div className="max-w-5xl mx-auto space-y-8">
                    <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
                        <h3 className="text-xl font-black text-slate-900 uppercase mb-2">3. Affectation par Région & Agence</h3>
                        <p className="text-xs text-slate-400 font-medium">Assignez les techniciens. Glissez-déposez les agences pour ajuster manuellement l'ordre.</p>
                    </div>

                    <div className="space-y-4">
                        {sortedRegionKeys.map((region) => {
                            const regionAgencies = groupedAgencies[region];
                            return (
                                <div key={region} className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
                                    <div className="p-6 bg-slate-50 flex justify-between items-center cursor-pointer" onClick={() => toggleRegion(region)}>
                                        <div className="flex items-center gap-4">
                                            <i className={`fas fa-chevron-${expandedRegions.includes(region) ? 'down' : 'right'} text-slate-400 text-xs`}></i>
                                            <span className="font-black text-slate-900 uppercase tracking-tighter text-lg">{region}</span>
                                            <span className="bg-white px-3 py-1 rounded-full border border-slate-200 text-[10px] font-black text-slate-400 uppercase">{regionAgencies.length} Agences</span>
                                        </div>
                                        <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                                            <span className="text-[10px] font-black text-slate-400 uppercase">Assigner toute la région :</span>
                                            <select onChange={e => assignRegion(region, e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-black uppercase outline-none shadow-sm min-w-[150px]">
                                                <option value="">Sélectionner...</option>
                                                {technicians.map(t => <option key={t.id} value={t.id}>{t.prenom} {t.nom}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    {expandedRegions.includes(region) && (
                                        <div className="p-6 divide-y divide-slate-50">
                                            {/* Tri visuel des agences par ordre unique actuel */}
                                            {regionAgencies.sort((a,b) => (assignments[a.id]?.order || 999) - (assignments[b.id]?.order || 999)).map((ag) => {
                                                const ass = assignments[ag.id] || { techId: '', order: 1 };
                                                return (
                                                    <div 
                                                        key={ag.id} 
                                                        draggable 
                                                        onDragStart={(e) => onDragStart(e, ag.id)}
                                                        onDragOver={onDragOver}
                                                        onDrop={(e) => onDrop(e, ag.id)}
                                                        className={`py-4 flex flex-col md:flex-row justify-between items-center gap-4 transition-colors cursor-grab active:cursor-grabbing hover:bg-slate-50 rounded-xl px-4 -mx-4 ${draggedAgId === ag.id ? 'opacity-40 bg-blue-50' : ''}`}
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex flex-col items-center">
                                                                <i className="fas fa-grip-vertical text-slate-200 text-xs mb-1"></i>
                                                                <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-[10px] font-black text-white border border-slate-700 shadow-sm">
                                                                    {ass.order}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-black text-slate-900">{ag.nom_agence}</p>
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase">{ag.code_agence} • {ag.ville}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[9px] font-black text-slate-400 uppercase">Position :</span>
                                                                <input 
                                                                    type="number" 
                                                                    min="1" 
                                                                    max={agenciesToAssign.length}
                                                                    value={ass.order} 
                                                                    onChange={e => handleOrderChange(ag.id, parseInt(e.target.value) || 1)} 
                                                                    className="w-16 bg-white rounded-xl px-3 py-2 text-xs font-black outline-none border border-slate-200 focus:ring-1 focus:ring-blue-500" 
                                                                />
                                                            </div>
                                                            <select value={ass.techId} onChange={e => setAssignments({...assignments, [ag.id]: { ...ass, techId: e.target.value }})} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-black uppercase outline-none min-w-[150px]">
                                                                <option value="">Technicien...</option>
                                                                {technicians.map(t => <option key={t.id} value={t.id}>{t.prenom} {t.nom}</option>)}
                                                            </select>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex gap-4">
                        <button onClick={() => setCurrentStep('contracts')} className="w-1/3 py-5 bg-slate-200 text-slate-600 rounded-2xl font-black uppercase text-xs tracking-widest">Précédent</button>
                        <button disabled={Object.keys(assignments).filter(id => assignments[id].techId).length < agenciesToAssign.length} onClick={() => setCurrentStep('finalize')} className={`w-2/3 py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all ${Object.keys(assignments).filter(id => assignments[id].techId).length >= agenciesToAssign.length ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>Suivant : Dates & Statut</button>
                    </div>
                </div>
            )}

            {currentStep === 'finalize' && (
                <div className="max-w-3xl mx-auto bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 space-y-8">
                    <h3 className="text-xl font-black text-slate-900 uppercase">4. Planification Temporelle</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Date de Début</label>
                            <input type="date" value={newTournee.date_debut} onChange={e => setNewTournee({...newTournee, date_debut: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Date Limite (Fin)</label>
                            <input type="date" value={newTournee.date_limite} onChange={e => setNewTournee({...newTournee, date_limite: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold outline-none" />
                        </div>
                    </div>
                    {!editingTourId && (
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Statut Initial</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => setNewTournee({...newTournee, statut: 'planifiee'})} className={`py-4 rounded-2xl font-black text-[10px] uppercase transition-all ${newTournee.statut === 'planifiee' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}>Planifiée (Invisible)</button>
                                <button onClick={() => setNewTournee({...newTournee, statut: 'declenchee'})} className={`py-4 rounded-2xl font-black text-[10px] uppercase transition-all ${newTournee.statut === 'declenchee' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}>Déclenchée (Visible)</button>
                            </div>
                        </div>
                    )}
                    <div className="pt-6 border-t border-slate-50 flex gap-4">
                        <button onClick={() => setCurrentStep('assignment')} className="w-1/3 py-5 bg-slate-200 text-slate-600 rounded-2xl font-black uppercase text-xs tracking-widest">Précédent</button>
                        <button onClick={handleFinishCreation} className="w-2/3 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl">Confirmer et {editingTourId ? 'Modifier' : 'Créer'} la Tournée</button>
                    </div>
                </div>
            )}
        </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-4">
            {(reportingTourId || (activeTab === 'stats' && (reportBank !== 'All' || reportContract !== 'All'))) && <button onClick={() => {setReportingTourId(null); setReportBank('All'); setReportContract('All'); setShowNiveau3(false);}} className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-all"><i className="fas fa-arrow-left text-xs"></i></button>}
            {reportingTourId ? 'Rapport d\'avancement' : activeTab === 'stats' ? 'Analyses & Reporting' : 'Espace Coordinateur'}
          </h2>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-1">
            {reportingTourId ? data.tournees.find(t => t.id === reportingTourId)?.nom : 'Planification des Interventions Terrain'}
          </p>
        </div>
        {!reportingTourId && (
            <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-100 overflow-x-auto no-scrollbar">
            {['tournees', 'archives', 'stats'].map(t => (
                <button key={t} onClick={() => { setActiveTab(t as any); if(t !== 'stats') {setReportBank('All'); setReportContract('All');} }} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeTab === t ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'}`}>
                {t === 'tournees' ? 'Tournées Actives' : t === 'archives' ? 'Archives' : 'Analyses & Reporting'}
                </button>
            ))}
            </div>
        )}
      </div>

      {activeTab === 'tournees' && !reportingTourId && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <button onClick={() => { resetForm(); setIsCreating(true); }} className="bg-white p-8 rounded-[3rem] border-2 border-dashed border-slate-200 text-slate-400 hover:border-blue-300 hover:text-blue-500 transition-all flex flex-col items-center justify-center gap-4 group h-80">
            <div className="w-16 h-16 bg-slate-50 group-hover:bg-blue-50 rounded-2xl flex items-center justify-center text-2xl transition-all"><i className="fas fa-plus"></i></div>
            <span className="font-black text-xs uppercase tracking-widest">Créer une Tournée</span>
          </button>
          {data.tournees.filter(t => t.statut !== 'cloturee').map(t => {
            const sum = getCardSummary(t.id);
            const canEdit = t.statut === 'planifiee' || t.statut === 'en_pause';
            return (
                <div key={t.id} onClick={() => startEditing(t)} className={`bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 transition-all group relative ${canEdit ? 'cursor-pointer hover:shadow-xl' : ''}`}>
                    <div className="flex justify-between items-start mb-6">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${t.statut === 'declenchee' ? 'bg-emerald-50 text-emerald-600' : t.statut === 'en_pause' ? 'bg-amber-50 text-amber-600' : t.statut === 'terminee' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>{t.statut}</span>
                        <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
                           {t.statut === 'declenchee' && <button onClick={() => updateStatus(t.id, 'en_pause')} title="Mettre en pause" className="w-9 h-9 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center hover:bg-amber-100 transition-all"><i className="fas fa-pause text-[10px]"></i></button>}
                           {t.statut === 'en_pause' && <button onClick={() => updateStatus(t.id, 'declenchee')} title="Reprendre" className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition-all"><i className="fas fa-play text-[10px]"></i></button>}
                           {t.statut === 'terminee' && <button onClick={() => updateStatus(t.id, 'cloturee')} title="Clôturer" className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:bg-blue-600 transition-all"><i className="fas fa-lock text-[10px]"></i></button>}
                           <button onClick={() => {setReportingTourId(t.id); setShowNiveau3(false);}} title="Rapport" className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-all"><i className="fas fa-chart-pie text-[10px]"></i></button>
                        </div>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-1">{t.nom}</h3>
                    <p className="text-[10px] font-black text-blue-500 uppercase mb-4">{t.code_tournee}</p>
                    <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase">
                            <span className="text-slate-400">Agences</span>
                            <span className="text-slate-900">{sum.agRestantes} / {sum.agTotal} restants</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-black uppercase">
                            <span className="text-slate-400">Équipements</span>
                            <span className="text-slate-900">{sum.eqRestants} / {sum.eqTotal} restants</span>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <div className="text-[10px] font-bold text-slate-400 uppercase">Avancement</div>
                            <div className="text-xs font-black text-slate-900">{sum.progress}%</div>
                        </div>
                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full transition-all duration-700 ${sum.progress === 100 ? 'bg-emerald-500' : 'bg-blue-600'}`} style={{width: `${sum.progress}%`}}></div>
                        </div>
                        <div className="flex justify-between pt-2">
                            <span className="text-[9px] font-black text-slate-400 uppercase"><i className="fas fa-calendar-day mr-1.5"></i> {t.date_limite}</span>
                            {canEdit && <span className="text-[9px] font-black text-blue-600 uppercase animate-pulse">Modifier <i className="fas fa-edit ml-1"></i></span>}
                        </div>
                    </div>
                </div>
            );
          })}
        </div>
      )}

      {(activeTab === 'stats' || reportingTourId) && (
        <div className="space-y-8 animate-fade-in pb-20">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 flex flex-wrap items-center gap-6 shadow-sm">
             <div className="flex items-center gap-3">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Filtrer Client :</span>
                <select value={reportBank} onChange={e => {setReportBank(e.target.value); setReportContract('All');}} className="bg-slate-50 border-none px-4 py-2.5 rounded-xl text-[10px] font-black uppercase outline-none shadow-sm min-w-[150px]">
                    <option value="All">Tout Client</option>
                    {data.banques.map(b => <option key={b.id} value={b.id}>{b.nom}</option>)}
                </select>
             </div>
             <div className="flex items-center gap-3">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Contrat :</span>
                <select value={reportContract} onChange={e => setReportContract(e.target.value)} className="bg-slate-50 border-none px-4 py-2.5 rounded-xl text-[10px] font-black uppercase outline-none shadow-sm min-w-[200px]">
                    <option value="All">Tout Contrat</option>
                    {data.contrats.filter(c => reportBank === 'All' || c.banque_id === reportBank).map(c => <option key={c.id} value={c.id}>{c.numero_contrat}</option>)}
                </select>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
             <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-slate-100 flex flex-col md:flex-row gap-8 items-center shadow-sm">
                <div className="relative w-32 h-32 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                        <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={364} strokeDashoffset={364 - (364 * reportingStats.progress / 100)} className="text-blue-600 transition-all duration-1000" />
                    </svg>
                    <span className="absolute text-2xl font-black text-slate-900">{reportingStats.progress}%</span>
                </div>
                <div className="space-y-4">
                    <h3 className="text-lg font-black text-slate-900 uppercase">Avancement Global</h3>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                        <div><p className="text-[9px] font-black text-slate-400 uppercase">Agences Restantes</p><p className="text-lg font-black text-slate-900">{reportingStats.totalAgences - reportingStats.agencesTerminees} / {reportingStats.totalAgences}</p></div>
                        <div><p className="text-[9px] font-black text-slate-400 uppercase">Machines Restantes</p><p className="text-lg font-black text-slate-900">{reportingStats.totalEquips - reportingStats.equipsTermines} / {reportingStats.totalEquips}</p></div>
                    </div>
                </div>
             </div>
             <div className="bg-slate-900 p-8 rounded-[3rem] text-white lg:col-span-2 relative overflow-hidden shadow-xl">
                <h3 className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-4"><i className="fas fa-brain mr-2"></i> Analyse Contextuelle IA</h3>
                <p className="text-sm italic text-slate-300 relative z-10 leading-relaxed">"{aiInsights}"</p>
                <i className="fas fa-robot absolute -bottom-8 -right-8 text-white/5 text-[150px]"></i>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                <h4 className="text-xs font-black text-slate-900 uppercase mb-6 tracking-widest">Degré d'avancement par Région</h4>
                <div className="space-y-5">
                   {(Object.entries(reportingStats.regionStats) as [string, { total: number; done: number }][]).map(([reg, stats]) => {
                       const p = Math.round((stats.done / stats.total) * 100);
                       return (
                           <div key={reg} className="space-y-2">
                               <div className="flex justify-between text-[10px] font-black uppercase">
                                   <span className="text-slate-900">{reg}</span>
                                   <span className="text-slate-400">{stats.done}/{stats.total}</span>
                               </div>
                               <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                   <div className={`h-full ${p > 50 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{width: `${p}%`}}></div>
                               </div>
                           </div>
                       );
                   })}
                </div>
             </div>
             <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                <h4 className="text-xs font-black text-slate-900 uppercase mb-6 tracking-widest">Degré d'avancement par Technicien</h4>
                <div className="space-y-5">
                   {(Object.entries(reportingStats.techStats) as [string, { total: number; done: number }][]).map(([tech, stats]) => {
                       const p = Math.round((stats.done / stats.total) * 100);
                       return (
                           <div key={tech} className="space-y-2">
                               <div className="flex justify-between text-[10px] font-black uppercase">
                                   <span className="text-slate-900">{tech}</span>
                                   <span className="text-slate-400">{stats.done}/{stats.total}</span>
                               </div>
                               <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                   <div className={`h-full ${p > 50 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{width: `${p}%`}}></div>
                               </div>
                           </div>
                       );
                   })}
                </div>
             </div>
          </div>

          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
             <button onClick={() => setShowNiveau3(!showNiveau3)} className="w-full p-8 border-b border-slate-50 flex justify-between items-center hover:bg-slate-50 transition-all group">
                <div className="text-left">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Niveau 3 : Détail des Agences & Missions</h4>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">{reportingStats.filteredMissions.length} agences dans cette sélection</p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${showNiveau3 ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
                    <i className={`fas fa-chevron-${showNiveau3 ? 'up' : 'down'}`}></i>
                </div>
             </button>
             {showNiveau3 && (
                <div className="overflow-x-auto animate-fade-in">
                    <table className="w-full text-left min-w-[800px]">
                        <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase border-b border-slate-100">
                            <tr>
                                <th className="px-8 py-5">Agence / Client</th>
                                <th className="px-8 py-5">Affectation</th>
                                <th className="px-8 py-5 text-center">Parc lié</th>
                                <th className="px-8 py-5 text-center">Ordre</th>
                                <th className="px-8 py-5 text-right">Statut</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {reportingStats.filteredMissions.sort((a,b) => a.ordre_passage - b.ordre_passage).map(m => {
                                const ag = data.agences.find(a => a.agenceid === m.agenceid);
                                const bank = data.banques.find(b => b.id === ag?.banque_id);
                                const tech = data.utilisateurs.find(u => u.id === m.technicien_id);
                                const mSubs = data.subMissions?.filter(s => s.mission_id === m.mission_id) || [];
                                const subsDone = mSubs.filter(s => s.statut === 'valide').length;
                                return (
                                    <tr key={m.mission_id} className="hover:bg-slate-50/50 transition-all">
                                        <td className="px-8 py-5">
                                            <div className="text-xs font-black text-slate-900">{ag?.nom_agence}</div>
                                            <div className="text-[9px] text-blue-500 font-black uppercase">{bank?.nom} • {ag?.ville}</div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400"><i className="fas fa-user-gear text-[10px]"></i></div>
                                                <div className="text-xs font-bold text-slate-700">{tech?.prenom} {tech?.nom}</div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <div className="inline-flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full text-[10px] font-black text-slate-500 uppercase">
                                                {subsDone} / {mSubs.length} <i className="fas fa-microchip text-[8px]"></i>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className="text-xs font-black text-slate-900">#{m.ordre_passage}</span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <span className={`text-[8px] font-black uppercase px-2.5 py-1 rounded-full ${m.statut === 'terminee' ? 'bg-emerald-50 text-emerald-600' : m.statut === 'en_cours' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                                                {m.statut === 'terminee' ? 'Terminée' : m.statut === 'en_cours' ? 'En Cours' : 'À Faire'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
             )}
          </div>
        </div>
      )}

      {activeTab === 'archives' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.tournees.filter(t => t.statut === 'cloturee').map(t => {
                const sum = getCardSummary(t.id);
                return (
                    <div key={t.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 grayscale opacity-60">
                        <div className="flex justify-between items-start mb-6">
                            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-slate-900 text-white">Clôturée</span>
                            <i className="fas fa-box-archive text-slate-300"></i>
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-1">{t.nom}</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-4">{t.code_tournee}</p>
                        <div className="flex justify-between items-end text-[9px] font-black text-slate-400 uppercase border-t pt-4">
                            <span>{sum.agTotal} Agences</span>
                            <span>{t.date_limite}</span>
                        </div>
                    </div>
                );
            })}
            {data.tournees.filter(t => t.statut === 'cloturee').length === 0 && (
                <div className="col-span-full bg-white p-20 rounded-[3rem] border-2 border-dashed border-slate-100 text-center">
                    <i className="fas fa-box-archive text-5xl text-slate-100 mb-6"></i>
                    <p className="font-black text-slate-300 uppercase text-xs tracking-widest">Aucune tournée archivée</p>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
