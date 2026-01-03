
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Banque, Agence, Contrat, Equipement, Region, BankContact, 
  Utilisateur, FormTemplate, FormField, MarqueModele, UserRole, AuditLog, AgencyContact,
  GeoRegion, SousRegion, Gouvernorat, VilleGeo, Municipalite, Marque, MachineType, MachineModel, Frequence
} from '../types';
import * as XLSX from 'xlsx';

interface BackOfficeProps {
  data: {
    banques: Banque[];
    agences: Agence[];
    contrats: Contrat[];
    equipements: Equipement[];
    utilisateurs: Utilisateur[];
    formTemplates: FormTemplate[];
    marquesModeles: MarqueModele[];
    logs?: AuditLog[];
    geoRegions: GeoRegion[];
    sousRegions: SousRegion[];
    gouvernorats: Gouvernorat[];
    villesGeo: VilleGeo[];
    municipalites: Municipalite[];
    marques: Marque[];
    machineTypes: MachineType[];
    machineModels: MachineModel[];
  };
  setters: {
    setBanques: React.Dispatch<React.SetStateAction<Banque[]>>;
    setAgences: React.Dispatch<React.SetStateAction<Agence[]>>;
    setContrats: React.Dispatch<React.SetStateAction<Contrat[]>>;
    setEquipements: React.Dispatch<React.SetStateAction<Equipement[]>>;
    setUtilisateurs: React.Dispatch<React.SetStateAction<Utilisateur[]>>;
    setFormTemplates: React.Dispatch<React.SetStateAction<FormTemplate[]>>;
    marquesModeles: any;
    setMarquesModeles: React.Dispatch<React.SetStateAction<MarqueModele[]>>;
    setGeoRegions: React.Dispatch<React.SetStateAction<GeoRegion[]>>;
    setSousRegions: React.Dispatch<React.SetStateAction<SousRegion[]>>;
    setGouvernorats: React.Dispatch<React.SetStateAction<Gouvernorat[]>>;
    setVillesGeo: React.Dispatch<React.SetStateAction<VilleGeo[]>>;
    setMunicipalites: React.Dispatch<React.SetStateAction<Municipalite[]>>;
    setMarques: React.Dispatch<React.SetStateAction<Marque[]>>;
    setMachineTypes: React.Dispatch<React.SetStateAction<MachineType[]>>;
    setMachineModels: React.Dispatch<React.SetStateAction<MachineModel[]>>;
  };
}

type AdminTab = 'clients' | 'agences' | 'contrats' | 'equipements' | 'utilisateurs' | 'adresses' | 'logs' | 'templates';
type AddressLevel = 'region' | 'gouvernorat' | 'ville';

const BackOffice: React.FC<BackOfficeProps> = ({ data, setters }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('clients');
  const [addressLevel, setAddressLevel] = useState<AddressLevel>('region');
  
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [selectedGouvernoratId, setSelectedGouvernoratId] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [level3Id, setLevel3Id] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [importType, setImportType] = useState<'geo' | 'data'>('geo');

  const [filterBank, setFilterBank] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [filterModel, setFilterModel] = useState("All");

  // Réinitialisation stricte de la navigation géo
  const resetGeoState = () => {
    setAddressLevel('region');
    setSelectedRegionId(null);
    setSelectedGouvernoratId(null);
  };

  // Réinitialisation de tout état de vue (formulaires, sélections, imports)
  const resetViewState = () => {
    setShowForm(false);
    setIsEditing(false);
    setSelectedId(null);
    setLevel3Id(null);
    setShowImport(false);
    setSearchQuery("");
  };

  // SECURITE : Dès qu'on change d'onglet, on nettoie TOUT pour éviter la rémanence géo
  useEffect(() => {
    resetGeoState();
    resetViewState();
  }, [activeTab]);

  const handleCloseForm = () => resetViewState();

  const handleGeoBack = () => {
    if (addressLevel === 'ville') {
      setAddressLevel('gouvernorat');
      setSelectedGouvernoratId(null);
    } else if (addressLevel === 'gouvernorat') {
      setAddressLevel('region');
      setSelectedRegionId(null);
    }
  };

  const handleMainBack = () => {
    if (showForm || isEditing || showImport) {
        handleCloseForm();
    } else if (level3Id) {
        setLevel3Id(null);
    } else if (selectedId) {
        setSelectedId(null);
    } else if (activeTab === 'adresses' && addressLevel !== 'region') {
        handleGeoBack();
    }
  };

  const sidebarItems: { id: AdminTab; label: string; icon: string }[] = [
    { id: 'clients', label: 'Clients', icon: 'fa-building-columns' },
    { id: 'agences', label: 'Agences', icon: 'fa-map-location-dot' },
    { id: 'contrats', label: 'Contrats', icon: 'fa-file-signature' },
    { id: 'equipements', label: 'Équipements', icon: 'fa-microchip' },
    { id: 'templates', label: 'Modèles', icon: 'fa-list-check' },
    { id: 'utilisateurs', label: 'Utilisateurs', icon: 'fa-users-gear' },
    { id: 'adresses', label: 'REFERENTIEL GEO', icon: 'fa-map-signs' },
    { id: 'logs', label: 'Logs', icon: 'fa-clock-rotate-left' },
  ];

  const currentGeoPath = useMemo(() => {
    if (activeTab !== 'adresses') return null;
    const reg = data.geoRegions.find(r => r.region_id === selectedRegionId);
    const gouv = data.gouvernorats.find(g => g.gouvernorat_id === selectedGouvernoratId);
    return { reg, gouv };
  }, [activeTab, selectedRegionId, selectedGouvernoratId, data]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase();
    switch(activeTab) {
      case 'clients': 
        return data.banques.filter(b => b.nom?.toLowerCase().includes(q) || b.id.toLowerCase().includes(q));
      case 'agences': 
        return data.agences.filter(a => {
          const matchSearch = a.nom_agence?.toLowerCase().includes(q) || a.code_agence?.toLowerCase().includes(q);
          const matchBank = filterBank === "All" || a.banque_id === filterBank;
          return matchSearch && matchBank;
        });
      case 'contrats':
        return data.contrats.filter(c => {
          const matchSearch = c.numero_contrat?.toLowerCase().includes(q);
          const matchBank = filterBank === "All" || c.banque_id === filterBank;
          return matchSearch && matchBank;
        });
      case 'equipements':
        return data.equipements.filter(e => {
          const matchSearch = e.numero_serie.toLowerCase().includes(q) || e.marque_modele.toLowerCase().includes(q);
          const matchBank = filterBank === "All" || e.banque_id === filterBank;
          const matchType = filterType === "All" || e.type === filterType;
          const matchModel = filterModel === "All" || e.modele_id === filterModel;
          return matchSearch && matchBank && matchType && matchModel;
        });
      case 'utilisateurs':
        return data.utilisateurs.filter(u => 
          u.nom.toLowerCase().includes(q) || 
          u.prenom.toLowerCase().includes(q) || 
          u.email.toLowerCase().includes(q) || 
          u.id.includes(q)
        );
      case 'templates':
        return data.formTemplates.filter(t => t.nom_template.toLowerCase().includes(q) || t.typeEquipement.toLowerCase().includes(q));
      case 'adresses':
        if (addressLevel === 'region') return data.geoRegions.filter(r => r.nom?.toLowerCase().includes(q));
        if (addressLevel === 'gouvernorat') return data.gouvernorats.filter(g => {
            const sub = data.sousRegions.find(s => s.sous_region_id === g.sous_region_id);
            return sub?.region_id === selectedRegionId && g.nom?.toLowerCase().includes(q);
        });
        if (addressLevel === 'ville') return data.villesGeo.filter(v => v.gouvernorat_id === selectedGouvernoratId && v.nom?.toLowerCase().includes(q));
        return [];
      default: return [];
    }
  }, [activeTab, addressLevel, data, searchQuery, filterBank, filterType, filterModel, selectedRegionId, selectedGouvernoratId]);

  const selectedItem = useMemo(() => {
    if (!selectedId) return null;
    const all = [...data.banques, ...data.agences, ...data.contrats, ...data.equipements, ...data.utilisateurs, ...data.formTemplates, ...data.machineModels];
    return all.find(item => (item as any).id === selectedId || (item as any).template_id === selectedId || (item as any).numero_serie === selectedId);
  }, [selectedId, data]);

  return (
    <div className="flex flex-col lg:flex-row h-full lg:min-h-[90vh] bg-white rounded-none lg:rounded-[3rem] shadow-none lg:shadow-2xl overflow-hidden border-none lg:border lg:border-slate-100">
      <div className="w-full lg:w-72 bg-slate-900 flex flex-col shrink-0">
        <div className="p-8 border-b border-white/5">
          <h2 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">BankMaint Admin</h2>
          <p className="text-white font-black text-xl tracking-tighter">Référentiel</p>
        </div>
        <nav className="p-4 gap-1 flex lg:flex-col overflow-x-auto no-scrollbar">
          {sidebarItems.map(item => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-500 hover:bg-white/5'}`}
            >
              <i className={`fas ${item.icon} w-5 text-center text-sm`}></i>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 bg-slate-50 flex flex-col min-w-0">
        <div className="px-6 py-5 lg:px-10 lg:py-8 border-b border-slate-100 flex flex-col lg:flex-row gap-4 lg:justify-between lg:items-center bg-white">
          <div className="flex items-center gap-3">
            <h1 className="text-lg lg:text-2xl font-black text-slate-900 uppercase tracking-tighter flex flex-wrap items-center gap-2">
              <span>{sidebarItems.find(i => i.id === activeTab)?.label}</span>
              {activeTab === 'adresses' && currentGeoPath?.reg && <><i className="fas fa-chevron-right text-[10px] text-slate-300"></i> <span className="text-blue-600 text-sm">{currentGeoPath.reg.nom}</span></>}
              {activeTab === 'adresses' && currentGeoPath?.gouv && <><i className="fas fa-chevron-right text-[10px] text-slate-300"></i> <span className="text-blue-600 text-sm">{currentGeoPath.gouv.nom}</span></>}
              {selectedId && activeTab !== 'adresses' && !isEditing && <><i className="fas fa-chevron-right text-[10px] text-slate-300"></i> <span className="text-blue-600 text-sm">Détails</span></>}
              {level3Id && activeTab !== 'adresses' && <><i className="fas fa-chevron-right text-[10px] text-slate-300"></i> <span className="text-emerald-600 text-sm">Parc Contrat</span></>}
            </h1>
          </div>
          <div className="flex gap-2">
            {!showForm && !selectedId && !isEditing && !level3Id && (activeTab !== 'adresses' || addressLevel === 'region') && activeTab !== 'logs' && (
              <>
                {(activeTab === 'clients' || activeTab === 'agences' || activeTab === 'contrats' || activeTab === 'equipements') && (
                    <button onClick={() => { setImportType('data'); setShowImport(true); }} className="px-5 py-3 bg-white border border-slate-200 text-blue-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 transition-all shadow-sm">
                        <i className="fas fa-file-excel mr-2"></i> Import Data
                    </button>
                )}
                {activeTab === 'adresses' && (
                    <button onClick={() => { setImportType('geo'); setShowImport(true); }} className="px-5 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
                        <i className="fas fa-file-import mr-2"></i> Import Géo
                    </button>
                )}
                <button onClick={() => setShowForm(true)} className="px-5 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-slate-900/10">
                    <i className="fas fa-plus mr-2"></i> Ajouter
                </button>
              </>
            )}
            {(showForm || (selectedId && activeTab !== 'adresses') || isEditing || level3Id || showImport || (activeTab === 'adresses' && addressLevel !== 'region')) && (
              <button onClick={handleMainBack} className="px-5 py-3 bg-slate-200 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-300 transition-all">
                <i className="fas fa-arrow-left mr-2"></i> Retour
              </button>
            )}
          </div>
        </div>

        <div className="p-4 lg:p-10 flex-1 overflow-y-auto custom-scrollbar">
          {showImport ? (
            <div className="max-w-7xl mx-auto animate-fade-in">
              {importType === 'geo' ? (
                  <GeoImport data={data} setters={setters} onFinish={handleCloseForm} />
              ) : (
                  <DataImport data={data} setters={setters} onFinish={handleCloseForm} />
              )}
            </div>
          ) : (showForm || isEditing) ? (
            <div className="max-w-5xl mx-auto animate-fade-in">
                {activeTab === 'clients' && <ClientForm initialData={isEditing ? selectedItem as Banque : undefined} onSubmit={(b: any) => { setters.setBanques(prev => isEditing ? prev.map(old => old.id === b.id ? b : old) : [...prev, b]); handleCloseForm(); }} />}
                {activeTab === 'agences' && <AgenceForm data={data} initialData={isEditing ? selectedItem as Agence : undefined} onSubmit={(a: any) => { setters.setAgences(prev => isEditing ? prev.map(old => old.id === a.id ? a : old) : [...prev, a]); handleCloseForm(); }} />}
                {activeTab === 'contrats' && <ContratForm data={data} initialData={isEditing ? selectedItem as Contrat : undefined} onSubmit={(c: any) => { setters.setContrats(prev => isEditing ? prev.map(old => old.id === c.id ? c : old) : [...prev, c]); handleCloseForm(); }} />}
                {activeTab === 'equipements' && <EquipementForm data={data} setters={setters} initialData={isEditing ? selectedItem as Equipement : undefined} onSubmit={(e: any) => { setters.setEquipements(prev => isEditing ? prev.map(old => old.id === e.id ? e : old) : [...prev, e]); handleCloseForm(); }} />}
                {activeTab === 'utilisateurs' && <UtilisateurForm data={data} initialData={isEditing ? selectedItem as Utilisateur : undefined} onSubmit={(u: any) => { setters.setUtilisateurs(prev => isEditing ? prev.map(old => old.id === u.id ? u : old) : [...prev, u]); handleCloseForm(); }} />}
                {activeTab === 'templates' && <TemplateForm data={data} initialData={isEditing ? selectedItem as FormTemplate : undefined} onSubmit={(t: any) => { setters.setFormTemplates(prev => isEditing ? prev.map(old => old.id === t.id ? t : old) : [...prev, t]); handleCloseForm(); }} />}
                {activeTab === 'adresses' && <AddressHierarchyForm level={addressLevel} data={data} setters={setters} parentIds={{reg: selectedRegionId, gouv: selectedGouvernoratId}} onFinish={handleCloseForm} />}
            </div>
          ) : level3Id ? (
            <ContratLevel3 id={level3Id} data={data} />
          ) : (selectedId && activeTab !== 'adresses') ? (
            <div className="max-w-7xl mx-auto animate-fade-in">
              {activeTab === 'clients' && selectedItem && <ClientDetails b={selectedItem as Banque} data={data} onEdit={() => setIsEditing(true)} onDelete={() => { setters.setBanques(prev => prev.filter(b => b.id !== selectedId)); handleCloseForm(); }} onLevel3={(id) => setLevel3Id(id)} />}
              {activeTab === 'agences' && selectedItem && <AgenceDetails a={selectedItem as Agence} data={data} onEdit={() => setIsEditing(true)} onDelete={() => { setters.setAgences(prev => prev.filter(a => a.id !== selectedId)); handleCloseForm(); }} />}
              {activeTab === 'contrats' && selectedItem && <ContratDetails c={selectedItem as Contrat} data={data} onEdit={() => setIsEditing(true)} onDelete={() => { setters.setContrats(prev => prev.filter(c => c.id !== selectedId)); handleCloseForm(); }} />}
              {activeTab === 'equipements' && selectedItem && <EquipementInventaireDetails e={selectedItem as Equipement} data={data} onEdit={() => setIsEditing(true)} onDelete={() => { setters.setEquipements(prev => prev.filter(e => e.id !== selectedId)); handleCloseForm(); }} onGoToContract={(id) => { setActiveTab('contrats'); setSelectedId(id); }} />}
              {activeTab === 'utilisateurs' && selectedItem && <UtilisateurDetails u={selectedItem as Utilisateur} onEdit={() => setIsEditing(true)} onDelete={() => { setters.setUtilisateurs(prev => prev.filter(u => u.id !== selectedId)); handleCloseForm(); }} />}
              {activeTab === 'templates' && selectedItem && <TemplateDetails t={selectedItem as FormTemplate} onEdit={() => setIsEditing(true)} onDelete={() => { setters.setFormTemplates(prev => prev.filter(t => t.id !== selectedId)); handleCloseForm(); }} />}
            </div>
          ) : (
            <div className="space-y-6">
              {activeTab === 'adresses' && (
                <div className="flex flex-col gap-4 mb-4">
                  <div className="flex gap-4 p-2 bg-white rounded-3xl border border-slate-100 shadow-sm w-fit">
                    <button onClick={() => { setAddressLevel('region'); setSelectedRegionId(null); setSelectedGouvernoratId(null); }} className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase transition-all ${addressLevel === 'region' ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'text-slate-400 hover:text-slate-600'}`}>Grandes Régions</button>
                    <button disabled={!selectedRegionId} onClick={() => { setAddressLevel('gouvernorat'); setSelectedGouvernoratId(null); }} className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase transition-all ${!selectedRegionId ? 'opacity-30 cursor-not-allowed' : addressLevel === 'gouvernorat' ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'text-slate-400 hover:text-slate-600'}`}>Gouvernorats</button>
                    <button disabled={!selectedGouvernoratId} onClick={() => setAddressLevel('ville')} className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase transition-all ${!selectedGouvernoratId ? 'opacity-30 cursor-not-allowed' : addressLevel === 'ville' ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'text-slate-400 hover:text-slate-600'}`}>Villes / Délégations</button>
                  </div>
                </div>
              )}
              
              <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                <div className="relative flex-1">
                  <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
                  <input type="text" placeholder={`Chercher...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-3xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {(activeTab === 'agences' || activeTab === 'contrats' || activeTab === 'equipements') && (
                    <select value={filterBank} onChange={e => setFilterBank(e.target.value)} className="bg-white border border-slate-200 px-4 py-3 rounded-2xl text-[9px] font-black uppercase outline-none shadow-sm">
                      <option value="All">Tout Client</option>
                      {data.banques.map(b => <option key={b.id} value={b.id}>{b.nom}</option>)}
                    </select>
                  )}
                  {activeTab === 'equipements' && (
                    <>
                      <select value={filterType} onChange={e => setFilterType(e.target.value)} className="bg-white border border-slate-200 px-4 py-3 rounded-2xl text-[9px] font-black uppercase outline-none shadow-sm">
                        <option value="All">Tout Type</option>
                        {data.machineTypes.map(t => <option key={t.id} value={t.nom}>{t.nom}</option>)}
                      </select>
                    </>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden overflow-x-auto custom-scrollbar">
                <table className="w-full text-left min-w-[700px]">
                  <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <tr>
                      {activeTab === 'adresses' ? (
                        <><th className="px-8 py-5">Désignation {addressLevel === 'region' ? 'Régionale' : addressLevel === 'gouvernorat' ? 'du Gouvernorat' : 'de la Ville'}</th><th className="px-8 py-5 text-center">Contenu</th></>
                      ) : activeTab === 'templates' ? (
                        <><th className="px-8 py-5">Nature d'Équipement</th><th className="px-8 py-5">Nom du Modèle</th><th className="px-8 py-5 text-center">Champs</th><th className="px-8 py-5 text-center">Statut</th></>
                      ) : activeTab === 'utilisateurs' ? (
                        <><th className="px-8 py-5">Nom Complet / CIN</th><th className="px-8 py-5 text-center">Rôles</th><th className="px-8 py-5 text-center">Téléphone</th><th className="px-8 py-5 text-center">Statut</th></>
                      ) : activeTab === 'clients' ? (
                        <><th className="px-8 py-5">Code / Nom Client</th><th className="px-8 py-5 text-center">Indicateurs</th><th className="px-8 py-5">Adresse Siège</th></>
                      ) : activeTab === 'agences' ? (
                        <><th className="px-8 py-5">Client / Agence</th><th className="px-8 py-5 text-center">Région / Ville</th><th className="px-8 py-5 text-center">Parc</th></>
                      ) : activeTab === 'contrats' ? (
                        <><th className="px-8 py-5">N° Contrat / Client</th><th className="px-8 py-5 text-center">Parc</th><th className="px-8 py-5 text-center">Début / Fin / Fréq</th><th className="px-8 py-5 text-center">Statut</th></>
                      ) : activeTab === 'equipements' ? (
                        <><th className="px-8 py-5">SN / Modèle / Marque</th><th className="px-8 py-5">Localisation / Contrat</th><th className="px-8 py-5 text-center">Statut</th></>
                      ) : (
                        <th className="px-8 py-5">Désignation</th>
                      )}
                      <th className="px-8 py-5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredItems.map(item => {
                      const id = (item as any).id || (item as any).template_id || (item as any).numero_serie || (item as any).region_id || (item as any).gouvernorat_id || (item as any).ville_id;
                      const handleClick = () => {
                        if (activeTab === 'adresses') {
                            if (addressLevel === 'region') { setSelectedRegionId(id); setAddressLevel('gouvernorat'); }
                            else if (addressLevel === 'gouvernorat') { setSelectedGouvernoratId(id); setAddressLevel('ville'); }
                        } else {
                            setSelectedId(id);
                        }
                      };
                      return (
                        <tr key={id} onClick={handleClick} className="hover:bg-slate-50/80 transition-all cursor-pointer group">
                          {activeTab === 'adresses' ? (
                            <>
                                <td className="px-8 py-6">
                                  <div className="flex items-center gap-4">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${addressLevel === 'region' ? 'bg-slate-900 text-white' : addressLevel === 'gouvernorat' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'}`}>
                                      <i className={`fas ${addressLevel === 'region' ? 'fa-map' : addressLevel === 'gouvernorat' ? 'fa-landmark' : 'fa-city'}`}></i>
                                    </div>
                                    <div className="font-black text-slate-900 text-sm">{(item as any).nom}</div>
                                  </div>
                                </td>
                                <td className="px-8 py-6 text-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                                        {addressLevel === 'region' ? `${data.sousRegions.filter(s => s.region_id === id).length} Zones` : addressLevel === 'gouvernorat' ? `${data.villesGeo.filter(v => v.gouvernorat_id === id).length} Villes` : `${data.agences.filter(a => a.ville === (item as any).nom).length} Agences`}
                                    </span>
                                </td>
                            </>
                          ) : activeTab === 'templates' ? (
                            <>
                              <td className="px-8 py-6"><span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase">{(item as FormTemplate).typeEquipement}</span></td>
                              <td className="px-8 py-6"><div className="font-black text-slate-900 text-sm">{(item as FormTemplate).nom_template}</div><div className="text-[10px] text-slate-400">Version {(item as FormTemplate).version}</div></td>
                              <td className="px-8 py-6 text-center"><span className="text-xs font-black text-slate-600">{(item as FormTemplate).fields?.length || 0}</span></td>
                              <td className="px-8 py-6 text-center"><span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${(item as FormTemplate).actif ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>{(item as FormTemplate).actif ? 'Actif' : 'Inactif'}</span></td>
                            </>
                          ) : activeTab === 'utilisateurs' ? (
                            <>
                              <td className="px-8 py-6"><div className="text-[10px] font-mono text-slate-400 mb-0.5">ID: {id}</div><div className="font-black text-slate-900 text-sm">{(item as Utilisateur).prenom} {(item as Utilisateur).nom}</div><div className="text-[9px] text-slate-400 font-bold uppercase">{(item as Utilisateur).email}</div></td>
                              <td className="px-8 py-6 text-center"><div className="flex flex-wrap justify-center gap-1">{(item as Utilisateur).roles.map(r => (<span key={r} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase">{r}</span>))}</div></td>
                              <td className="px-8 py-6 text-center text-xs font-black text-slate-900">{(item as Utilisateur).telephone}</td>
                              <td className="px-8 py-6 text-center"><span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase ${(item as Utilisateur).actif ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{(item as Utilisateur).actif ? 'Actif' : 'Inactif'}</span></td>
                            </>
                          ) : activeTab === 'clients' ? (
                            <>
                              <td className="px-8 py-6"><div className="text-[10px] font-mono text-slate-400 mb-0.5">{id}</div><div className="font-black text-slate-900 text-sm">{(item as Banque).nom}</div></td>
                              <td className="px-8 py-6 text-center"><div className="flex justify-center gap-2"><span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg text-[8px] font-black uppercase">{data.contrats.filter(c => c.banque_id === (item as Banque).id).length} Contrats</span><span className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-lg text-[8px] font-black uppercase">{data.agences.filter(a => a.banque_id === (item as Banque).id).length} Agences</span></div></td>
                              <td className="px-8 py-6 text-[11px] font-medium text-slate-500">{(item as Banque).adresseSiege}</td>
                            </>
                          ) : activeTab === 'agences' ? (
                            <>
                              <td className="px-8 py-6"><div className="text-[9px] font-black text-blue-500 uppercase mb-1">{data.banques.find(b => b.id === (item as Agence).banque_id)?.nom}</div><div className="text-xs font-black text-slate-900">{(item as Agence).nom_agence}</div></td>
                              <td className="px-8 py-6 text-center"><div className="text-[10px] font-black text-slate-900 uppercase">{(item as Agence).region}</div><div className="text-[9px] font-bold text-slate-400 uppercase">{(item as Agence).ville}</div></td>
                              <td className="px-8 py-6 text-center"><span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-lg text-[8px] font-black uppercase">{data.equipements.filter(e => e.agence_id === (item as Agence).id).length} Machines</span></td>
                            </>
                          ) : activeTab === 'contrats' ? (
                            <>
                              <td className="px-8 py-6"><div className="text-xs font-black text-slate-900">{(item as Contrat).numero_contrat}</div><div className="text-[9px] font-black text-blue-500 uppercase">{data.banques.find(b => b.id === (item as Contrat).banque_id)?.nom}</div></td>
                              <td className="px-8 py-6 text-center"><div className="flex justify-center gap-1.5"><span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg text-[8px] font-black uppercase">{data.agences.filter(a => a.banque_id === (item as Contrat).banque_id).length} Agences</span><span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-lg text-[8px] font-black uppercase">{data.equipements.filter(e => e.contrat_id === (item as Contrat).id).length} Machines</span></div></td>
                              <td className="px-8 py-6 text-center"><div className="text-[10px] font-black text-slate-900">{(item as Contrat).date_debut} → {(item as Contrat).date_fin}</div><div className="text-[9px] font-bold text-slate-400 uppercase">{(item as Contrat).frequence}</div></td>
                              <td className="px-8 py-6 text-center"><span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${(item as Contrat).statut === 'Actif' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{(item as Contrat).statut}</span></td>
                            </>
                          ) : activeTab === 'equipements' ? (
                            <>
                              <td className="px-8 py-6"><div className="text-[10px] font-mono font-black text-blue-600 mb-0.5">SN: {(item as Equipement).numero_serie}</div><div className="font-black text-slate-900 text-sm">{(item as Equipement).marque_modele}</div></td>
                              <td className="px-8 py-6"><div className="text-[10px] font-black text-slate-900 uppercase leading-none mb-1">{data.agences.find(a => a.id === (item as Equipement).agence_id)?.nom_agence}</div><div className="text-[8px] font-mono text-slate-300 uppercase">{data.contrats.find(c => c.id === (item as Equipement).contrat_id)?.numero_contrat}</div></td>
                              <td className="px-8 py-6 text-center"><span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${(item as Equipement).statut === 'Actif' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{(item as Equipement).statut}</span></td>
                            </>
                          ) : (
                            <td className="px-8 py-6"><div className="font-black text-slate-900 text-sm">{(item as any).nom || (item as any).prenom}</div></td>
                          )}
                          <td className="px-8 py-6 text-right">
                              <div className="flex gap-2 justify-end">
                                 {activeTab === 'adresses' && (
                                     <button onClick={(e) => { e.stopPropagation(); deleteGeoItem(addressLevel, id, data, setters); }} className="w-8 h-8 rounded-xl bg-rose-50 text-rose-400 flex items-center justify-center hover:bg-rose-100 hover:text-rose-600 transition-all"><i className="fas fa-trash-alt text-[10px]"></i></button>
                                 )}
                                 <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-300 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all ml-auto"><i className="fas fa-arrow-right text-xs"></i></div>
                              </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* --- LOGIQUE CRUD GÉO & IMPORT --- */

const deleteGeoItem = (level: AddressLevel, id: string, data: any, setters: any) => {
    if (level === 'region') {
        const hasChildren = data.sousRegions.some((s:any) => s.region_id === id);
        if (hasChildren) return alert("Impossible de supprimer : cette région contient des gouvernorats.");
        setters.setGeoRegions(data.geoRegions.filter((r:any) => r.region_id !== id));
    } else if (level === 'gouvernorat') {
        const hasChildren = data.villesGeo.some((v:any) => v.gouvernorat_id === id);
        if (hasChildren) return alert("Impossible de supprimer : ce gouvernorat contient des villes.");
        setters.setGouvernorats(data.gouvernorats.filter((g:any) => g.gouvernorat_id !== id));
    } else if (level === 'ville') {
        const hasAgencies = data.agences.some((a:any) => a.ville === data.villesGeo.find((v:any)=>v.ville_id===id)?.nom);
        if (hasAgencies) return alert("Impossible de supprimer : cette ville est liée à des agences.");
        setters.setVillesGeo(data.villesGeo.filter((v:any) => v.ville_id !== id));
    }
};

const GeoImport = ({ data, setters, onFinish }: any) => {
    const [preview, setPreview] = useState<any[]>([]);
    const [errors, setErrors] = useState<string[]>([]);
    
    const normalize = (s: string) => s ? s.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const json = XLSX.utils.sheet_to_json(ws);
            setPreview(json);
        };
        reader.readAsBinaryString(file);
    };

    const validateAndImport = () => {
        const newRegions = [...data.geoRegions];
        const newSousRegions = [...data.sousRegions];
        const newGouvernorats = [...data.gouvernorats];
        const newVilles = [...data.villesGeo];
        const logs: string[] = [];

        preview.forEach((row: any, index) => {
            const regName = row.Region || row.region || row.REGION;
            const gouvName = row.Gouvernorat || row.gouvernorat || row.GOUVERNORAT;
            const villeName = row.Ville || row.ville || row.VILLE;

            if (!regName || !gouvName || !villeName) {
                logs.push(`Ligne ${index + 1}: Manque région, gouvernorat ou ville.`);
                return;
            }

            // 1. Gérer Région
            let region = newRegions.find(r => normalize(r.nom) === normalize(regName));
            if (!region) {
                region = { region_id: `reg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, nom: regName.trim() };
                newRegions.push(region);
            }

            // 2. Gérer Sous-Région (invisible mais requise par schéma)
            let sousRegion = newSousRegions.find(s => s.region_id === region!.region_id);
            if (!sousRegion) {
                sousRegion = { sous_region_id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, region_id: region.region_id, nom: `SR-${region.nom}` };
                newSousRegions.push(sousRegion);
            }

            // 3. Gérer Gouvernorat
            let gouv = newGouvernorats.find(g => normalize(g.nom) === normalize(gouvName) && g.sous_region_id === sousRegion!.sous_region_id);
            if (!gouv) {
                gouv = { gouvernorat_id: `gouv-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, sous_region_id: sousRegion.sous_region_id, nom: gouvName.trim() };
                newGouvernorats.push(gouv);
            }

            // 4. Gérer Ville
            let ville = newVilles.find(v => normalize(v.nom) === normalize(villeName) && v.gouvernorat_id === gouv!.gouvernorat_id);
            if (!ville) {
                ville = { ville_id: `vil-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, gouvernorat_id: gouv.gouvernorat_id, nom: villeName.trim() };
                newVilles.push(ville);
            }
        });

        if (logs.length > 0) {
            setErrors(logs);
        } else {
            setters.setGeoRegions(newRegions);
            setters.setSousRegions(newSousRegions);
            setters.setGouvernorats(newGouvernorats);
            setters.setVillesGeo(newVilles);
            alert("Importation réussie !");
            onFinish();
        }
    };

    return (
        <div className="space-y-8 pb-10">
            <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 space-y-6">
                <h3 className="text-lg font-black text-slate-900 uppercase">Import Référentiel Géo</h3>
                <p className="text-xs text-slate-500 leading-relaxed">Téléversez un fichier Excel/CSV avec les colonnes : <b>Region, Gouvernorat, Ville</b>.</p>
                <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFile} className="block w-full text-xs text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-2xl file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 cursor-pointer" />
            </div>

            {preview.length > 0 && (
                <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 space-y-6">
                    <div className="flex justify-between items-center">
                        <h4 className="font-black text-slate-900 uppercase text-sm">Aperçu ({preview.length} lignes)</h4>
                        <button onClick={validateAndImport} className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-blue-600/20">Valider l'import</button>
                    </div>
                    {errors.length > 0 && (
                        <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100 space-y-2">
                            {errors.slice(0, 5).map((err, i) => <p key={i} className="text-[10px] font-bold text-rose-600"><i className="fas fa-exclamation-circle mr-2"></i> {err}</p>)}
                            {errors.length > 5 && <p className="text-[10px] font-bold text-rose-400 italic">...et {errors.length - 5} autres erreurs.</p>}
                        </div>
                    )}
                    <div className="overflow-hidden rounded-2xl border border-slate-100">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 border-b border-slate-100">
                                <tr><th className="px-6 py-4">Region</th><th className="px-6 py-4">Gouvernorat</th><th className="px-6 py-4">Ville</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {preview.slice(0, 10).map((row, i) => (
                                    <tr key={i} className="text-[11px] font-bold text-slate-600">
                                        <td className="px-6 py-3">{row.Region || row.region || row.REGION}</td>
                                        <td className="px-6 py-3">{row.Gouvernorat || row.gouvernorat || row.GOUVERNORAT}</td>
                                        <td className="px-6 py-3">{row.Ville || row.ville || row.VILLE}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

const DataImport = ({ data, setters, onFinish }: any) => {
    const [step, setStep] = useState(1);
    const [preview, setPreview] = useState<any[]>([]);
    const [validationResults, setValidationResults] = useState<{row: any, status: 'new' | 'update' | 'error', message?: string}[]>([]);
    
    const steps = [
        { id: 1, label: "Clients", icon: "fa-building-columns", columns: ["id", "nom", "adresseSiege", "email_responsable", "tel_responsable"] },
        { id: 2, label: "Agences", icon: "fa-map-location-dot", columns: ["code_agence", "banque_id", "nom_agence", "ville", "adresse", "nom_responsable", "tel_responsable"] },
        { id: 3, label: "Contrats", icon: "fa-file-signature", columns: ["numero_contrat", "banque_id", "date_debut", "date_fin", "frequence", "penalite_jour"] },
        { id: 4, label: "Équipements", icon: "fa-microchip", columns: ["numero_serie", "type_nom", "modele_nom", "marque_nom", "agence_code", "contrat_numero"] }
    ];

    const normalize = (s: any) => s ? String(s).trim() : "";

    const validateData = (json: any[]) => {
        const results = json.map(row => {
            let status: 'new' | 'update' | 'error' = 'new';
            let message = "";

            if (step === 1) { // Banques
                const id = normalize(row.id);
                if (!id) return { row, status: 'error', message: "ID manquant" };
                const exists = data.banques.find(b => b.id === id);
                if (exists) status = 'update';
            } else if (step === 2) { // Agences
                const code = normalize(row.code_agence);
                const bankId = normalize(row.banque_id);
                if (!code || !bankId) return { row, status: 'error', message: "Code ou Banque ID manquant" };
                if (!data.banques.find(b => b.id === bankId)) return { row, status: 'error', message: "Client inexistant" };
                const exists = data.agences.find(a => a.code_agence === code);
                if (exists) status = 'update';
            } else if (step === 3) { // Contrats
                const num = normalize(row.numero_contrat);
                const bankId = normalize(row.banque_id);
                if (!num || !bankId) return { row, status: 'error', message: "N° ou Banque ID manquant" };
                if (!data.banques.find(b => b.id === bankId)) return { row, status: 'error', message: "Client inexistant" };
                const exists = data.contrats.find(c => c.numero_contrat === num);
                if (exists) status = 'update';
            } else if (step === 4) { // Equipements
                const sn = normalize(row.numero_serie);
                const agCode = normalize(row.agence_code);
                const contNum = normalize(row.contrat_numero);
                if (!sn || !agCode || !contNum) return { row, status: 'error', message: "SN, Code Agence ou N° Contrat manquant" };
                if (!data.agences.find(a => a.code_agence === agCode)) return { row, status: 'error', message: "Agence inexistante" };
                if (!data.contrats.find(c => c.numero_contrat === contNum)) return { row, status: 'error', message: "Contrat inexistant" };
                const exists = data.equipements.find(e => e.numero_serie === sn);
                if (exists) status = 'update';
            }

            return { row, status, message };
        });
        setValidationResults(results as any);
    };

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const json = XLSX.utils.sheet_to_json(ws);
            setPreview(json);
            validateData(json);
        };
        reader.readAsBinaryString(file);
    };

    const commitImport = () => {
        const validResults = validationResults.filter(r => r.status !== 'error');
        if (validResults.length === 0) return alert("Aucune donnée valide à importer.");

        if (step === 1) {
            const news: Banque[] = [];
            let updated = [...data.banques];
            validResults.forEach(({row, status}) => {
                const b: Banque = { 
                    id: normalize(row.id), nom: normalize(row.nom), adresseSiege: normalize(row.adresseSiege),
                    email_responsable: normalize(row.email_responsable), tel_responsable: normalize(row.tel_responsable),
                    logo: "",
                    infos: { adresseSiege: normalize(row.adresseSiege), logo: "", contacts: [] }
                };
                if (status === 'update') updated = updated.map(old => old.id === b.id ? b : old);
                else news.push(b);
            });
            setters.setBanques([...updated, ...news]);
        } else if (step === 2) {
            const news: Agence[] = [];
            let updated = [...data.agences];
            validResults.forEach(({row, status}) => {
                const id = `ag-${normalize(row.code_agence)}`;
                const a: Agence = { 
                    id, agenceid: id, code_agence: normalize(row.code_agence), banque_id: normalize(row.banque_id),
                    nom_agence: normalize(row.nom_agence), ville: normalize(row.ville), adresse: normalize(row.adresse),
                    region: Region.GrandTunis, contacts: [], nom_responsable: normalize(row.nom_responsable),
                    tel_responsable: normalize(row.tel_responsable)
                };
                if (status === 'update') updated = updated.map(old => old.code_agence === a.code_agence ? {...old, ...a} : old);
                else news.push(a);
            });
            setters.setAgences([...updated, ...news]);
        } else if (step === 3) {
            const news: Contrat[] = [];
            let updated = [...data.contrats];
            validResults.forEach(({row, status}) => {
                const c: Contrat = {
                    id: `cont-${normalize(row.numero_contrat)}`,
                    numero_contrat: normalize(row.numero_contrat),
                    banque_id: normalize(row.banque_id),
                    date_debut: normalize(row.date_debut),
                    date_fin: normalize(row.date_fin),
                    frequence: normalize(row.frequence) || 'Trimestrielle',
                    statut: 'Actif',
                    penalite_retard_jour: Number(row.penalite_jour) || 0,
                    sla_conditions: ""
                };
                if (status === 'update') updated = updated.map(old => old.numero_contrat === c.numero_contrat ? c : old);
                else news.push(c);
            });
            setters.setContrats([...updated, ...news]);
        } else if (step === 4) {
            const news: Equipement[] = [];
            let updated = [...data.equipements];
            validResults.forEach(({row, status}) => {
                const ag = data.agences.find(a => a.code_agence === normalize(row.agence_code));
                const cont = data.contrats.find(c => c.numero_contrat === normalize(row.contrat_numero));
                const sn = normalize(row.numero_serie);
                const e: Equipement = {
                    id: sn, equipementid: sn, numero_serie: sn,
                    type: normalize(row.type_nom), type_id: normalize(row.type_nom),
                    marque_modele: `${normalize(row.marque_nom)} ${normalize(row.modele_nom)}`,
                    marque_id: "", modele_id: "", 
                    agence_id: ag!.id, agenceid: ag!.id,
                    banque_id: ag!.banque_id,
                    contrat_id: cont!.id, contratid: cont!.id,
                    date_installation: new Date().toISOString().split('T')[0],
                    statut: 'Actif'
                };
                if (status === 'update') updated = updated.map(old => old.numero_serie === e.numero_serie ? e : old);
                else news.push(e);
            });
            setters.setEquipements([...updated, ...news]);
        }

        alert("Importation terminée !");
        setPreview([]);
        setValidationResults([]);
        if (step < 4) setStep(step + 1);
        else onFinish();
    };

    const currentStep = steps.find(s => s.id === step);

    return (
        <div className="space-y-8 pb-10">
            <div className="flex gap-4 p-2 bg-white rounded-[2rem] border border-slate-100 shadow-sm w-full overflow-x-auto no-scrollbar">
                {steps.map(s => (
                    <button 
                        key={s.id} 
                        onClick={() => { setStep(s.id); setPreview([]); setValidationResults([]); }}
                        className={`flex-1 min-w-[150px] py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest transition-all ${step === s.id ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}
                    >
                        <i className={`fas ${s.icon}`}></i>
                        <span>{s.label}</span>
                    </button>
                ))}
            </div>

            <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                    <div className="flex-1">
                        <h3 className="text-xl font-black text-slate-900 uppercase">Étape {step} : Import {currentStep?.label}</h3>
                        <p className="text-xs text-slate-500 mt-1">Gérez le référentiel via Excel/CSV. Les doublons seront mis à jour.</p>
                        
                        <div className="mt-6 p-6 bg-blue-50 rounded-2xl border border-blue-100">
                           <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3"><i className="fas fa-list-check mr-2"></i> Structure de colonnes requise :</h4>
                           <div className="flex flex-wrap gap-2">
                              {currentStep?.columns.map(col => (
                                <span key={col} className="px-3 py-1.5 bg-white text-blue-800 rounded-lg text-[10px] font-mono font-bold border border-blue-200">{col}</span>
                              ))}
                           </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                        <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFile} className="hidden" id="fileImport" />
                        <label htmlFor="fileImport" className="px-8 py-4 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest cursor-pointer hover:bg-blue-600 transition-all text-center shadow-lg shadow-slate-900/10"><i className="fas fa-file-excel mr-2"></i> Choisir Fichier</label>
                        <p className="text-[9px] text-slate-400 font-bold uppercase text-center tracking-widest">XLSX, XLS ou CSV</p>
                    </div>
                </div>

                {preview.length > 0 && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <div className="flex gap-6">
                                <div className="text-[10px] font-black uppercase text-slate-400">Total: <span className="text-slate-900 ml-1">{validationResults.length}</span></div>
                                <div className="text-[10px] font-black uppercase text-emerald-500">Nouveaux: <span className="ml-1">{validationResults.filter(v=>v.status==='new').length}</span></div>
                                <div className="text-[10px] font-black uppercase text-amber-500">Mises à jour: <span className="ml-1">{validationResults.filter(v=>v.status==='update').length}</span></div>
                                <div className="text-[10px] font-black uppercase text-rose-500">Erreurs: <span className="ml-1">{validationResults.filter(v=>v.status==='error').length}</span></div>
                            </div>
                            <button onClick={commitImport} disabled={validationResults.some(v=>v.status==='error')} className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase shadow-lg transition-all ${validationResults.some(v=>v.status==='error') ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white shadow-slate-900/20 hover:bg-blue-600'}`}>Lancer l'Importation</button>
                        </div>

                        <div className="overflow-hidden rounded-2xl border border-slate-100">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4">Statut</th>
                                        {Object.keys(preview[0] || {}).map(k => <th key={k} className="px-6 py-4">{k}</th>)}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {validationResults.slice(0, 15).map((res, i) => (
                                        <tr key={i} className={`text-[11px] font-bold ${res.status === 'error' ? 'bg-rose-50/30' : ''}`}>
                                            <td className="px-6 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${res.status === 'new' ? 'bg-emerald-50 text-emerald-600' : res.status === 'update' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                                                    {res.status === 'new' ? 'Nouveau' : res.status === 'update' ? 'Update' : res.message}
                                                </span>
                                            </td>
                                            {Object.values(res.row).map((v: any, idx) => <td key={idx} className="px-6 py-3 text-slate-600 truncate max-w-[150px]">{normalize(v)}</td>)}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {validationResults.length > 15 && <p className="text-center text-[10px] font-bold text-slate-400 italic">Affichage des 15 premières lignes sur {validationResults.length}</p>}
                    </div>
                )}
            </div>
        </div>
    );
};

/* --- SHARED --- */

const FormInput = ({ label, value, onChange, placeholder, type = "text", required, disabled = false }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black uppercase text-slate-400 ml-5 tracking-widest">{label} {required && <span className="text-rose-500">*</span>}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} className={`w-full px-7 py-4 bg-slate-50 border border-transparent rounded-[1.5rem] text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all ${disabled ? 'opacity-50' : ''}`} />
  </div>
);

const DetailRow = ({ label, val, clickable = false, onClick }: any) => (
  <div className={`flex justify-between items-center py-3 border-b border-slate-50 last:border-0 last:pb-0 ${clickable ? 'cursor-pointer hover:bg-slate-50 rounded-lg px-2 -mx-2' : ''}`} onClick={clickable ? onClick : undefined}>
     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
     <span className={`text-xs lg:text-sm font-black text-right ml-4 ${clickable ? 'text-blue-600 border-b border-blue-200' : 'text-slate-900'}`}>{val || 'N/A'}</span>
  </div>
);

const StatTile = ({ label, val, icon, color = "text-blue-500" }: any) => (
  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-5">
    <div className={`w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center ${color} text-xl shadow-inner`}><i className={`fas ${icon}`}></i></div>
    <div><div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</div><div className="text-lg font-black text-slate-900">{val}</div></div>
  </div>
);

/* --- TAB COMPONENTS --- */

const ClientDetails = ({ b, data, onEdit, onDelete, onLevel3 }: { b: Banque, data: any, onEdit: () => void, onDelete: () => void, onLevel3: (id: string) => void }) => {
  const contracts = data.contrats.filter((c: any) => c.banque_id === b.id);
  return (
    <div className="space-y-10 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-8">
          <div className="w-24 h-24 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white text-3xl font-black shadow-xl">{b.logo ? <img src={b.logo} className="w-full h-full object-cover rounded-[2rem]" /> : b.nom.charAt(0)}</div>
          <div><h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">{b.nom}</h2><p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{b.adresseSiege}</p></div>
        </div>
        <div className="flex gap-2">
          <button onClick={onEdit} className="px-8 py-4 bg-white border border-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-widest text-blue-600 shadow-sm">Modifier</button>
          <button onClick={onDelete} className="px-8 py-4 bg-rose-50 text-rose-600 rounded-2xl font-black text-[10px] uppercase tracking-widest">Supprimer</button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
         <StatTile label="Contrats" val={contracts.length} icon="fa-file-signature" color="text-blue-500" />
         <StatTile label="Agences" val={data.agences.filter((a: any) => a.banque_id === b.id).length} icon="fa-building" color="text-emerald-500" />
         <StatTile label="Machines" val={data.equipements.filter((e: any) => e.banque_id === b.id).length} icon="fa-microchip" color="text-amber-500" />
      </div>
      <div className="space-y-6">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Contrats Actifs</h3>
        <div className="grid grid-cols-1 gap-4">
          {contracts.map((c: Contrat) => (
            <div key={c.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
               <div><h4 className="text-xl font-black text-slate-900">{c.numero_contrat}</h4><p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Échéance : {c.date_fin} • {c.frequence}</p></div>
               <button onClick={() => onLevel3(c.id)} className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">Gérer le parc lié</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const AgenceDetails = ({ a, data, onEdit, onDelete }: { a: Agence, data: any, onEdit: () => void, onDelete: () => void }) => {
  const eqs = data.equipements.filter((e: any) => e.agence_id === a.id);
  return (
    <div className="space-y-10 animate-fade-in pb-10">
       <div className="bg-slate-900 p-10 rounded-[3rem] text-white flex justify-between items-center shadow-2xl relative overflow-hidden">
          <div className="z-10"><h2 className="text-3xl font-black uppercase tracking-tighter mb-2">{a.nom_agence}</h2><p className="text-blue-400 text-xs font-bold uppercase tracking-widest">{a.code_agence} • {a.ville} • {a.region}</p></div>
          <div className="flex gap-2 z-10">
            <button onClick={onEdit} className="bg-white/10 px-6 py-3 rounded-xl text-[9px] font-black uppercase border border-white/10">Modifier</button>
            <button onClick={onDelete} className="bg-rose-600/20 px-6 py-3 rounded-xl text-[9px] font-black uppercase text-rose-400 border border-rose-600/20">Supprimer</button>
          </div>
          <i className="fas fa-building absolute -bottom-10 -right-10 text-white/5 text-[200px]"></i>
       </div>
       <div className="space-y-6">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Parc Machines ({eqs.length})</h3>
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden overflow-x-auto custom-scrollbar">
            <table className="w-full text-left min-w-[600px]">
              <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <tr><th className="px-8 py-4">Machine / SN</th><th className="px-8 py-4">Type</th><th className="px-8 py-4 text-center">Statut</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {eqs.map((e: Equipement) => (
                  <tr key={e.id} className="hover:bg-slate-50/50 transition-all">
                    <td className="px-8 py-5"><div className="font-black text-slate-900 text-sm">{e.marque_modele}</div><div className="text-[9px] font-mono font-bold text-blue-600">{e.numero_serie}</div></td>
                    <td className="px-8 py-5 text-[11px] font-bold text-slate-400">{e.type}</td>
                    <td className="px-8 py-5 text-center"><span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${e.statut === 'Actif' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{e.statut}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
       </div>
    </div>
  );
};

const ContratDetails = ({ c, data, onEdit, onDelete }: { c: Contrat, data: any, onEdit: () => void, onDelete: () => void }) => {
  const bank = data.banques.find((b: any) => b.id === c.banque_id);
  const eqs = data.equipements.filter((e: any) => e.contrat_id === c.id);
  return (
    <div className="space-y-10 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-8">
           <div className="w-24 h-24 bg-emerald-600 rounded-[2rem] flex items-center justify-center text-white text-3xl font-black shadow-xl"><i className="fas fa-file-contract"></i></div>
           <div><h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">{c.numero_contrat}</h2><p className="text-emerald-600 text-xs font-bold uppercase tracking-widest">Client: {bank?.nom}</p></div>
        </div>
        <div className="flex gap-2">
          <button onClick={onEdit} className="px-8 py-4 bg-white border border-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-widest text-blue-600 shadow-sm">Modifier / Renouveler</button>
          <button onClick={onDelete} className="px-8 py-4 bg-rose-50 text-rose-600 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm">Supprimer</button>
        </div>
      </div>
      <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <DetailRow label="N° Contrat" val={c.numero_contrat} />
          <DetailRow label="Client" val={bank?.nom} />
          <DetailRow label="Date Début" val={c.date_debut} />
          <DetailRow label="Date Fin" val={c.date_fin} />
          <DetailRow label="Fréquence" val={c.frequence} />
          <DetailRow label="Pénalité/jour" val={`${c.penalite_retard_jour} TND`} />
      </div>
      <div className="space-y-6">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Parc géré ({eqs.length} unités)</h3>
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
              <tr><th className="px-8 py-4">Agence</th><th className="px-8 py-4">Équipement (SN)</th><th className="px-8 py-4">Installation / Dern. Int</th><th className="px-8 py-4 text-center">Statut</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {eqs.map((e: Equipement) => {
                const ag = data.agences.find((a: any) => a.id === e.agence_id);
                return (
                  <tr key={e.id} className="hover:bg-slate-50 transition-all">
                    <td className="px-8 py-5"><div className="text-xs font-black text-slate-900">{ag?.nom_agence}</div><div className="text-[9px] font-bold text-slate-400 uppercase">{ag?.region} • {ag?.ville}</div></td>
                    <td className="px-8 py-5"><div className="text-xs font-black text-slate-900">{e.marque_modele}</div><div className="text-[10px] font-mono font-bold text-blue-600">SN: {e.numero_serie}</div></td>
                    <td className="px-8 py-5"><div className="text-[10px] font-black text-slate-900">M.E.S: {e.date_installation}</div><div className="text-[9px] font-black text-slate-400 uppercase mt-1">Dern. Int: {e.date_derniere_intervention || 'Jamais'}</div></td>
                    <td className="px-8 py-5 text-center"><span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${e.statut === 'Actif' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{e.statut}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const EquipementInventaireDetails = ({ e, data, onEdit, onDelete, onGoToContract }: { e: Equipement, data: any, onEdit: () => void, onDelete: () => void, onGoToContract: (id: string) => void }) => {
  const bank = data.banques.find((b: any) => b.id === e.banque_id);
  const ag = data.agences.find((a: any) => a.id === e.agence_id);
  const cont = data.contrats.find((c: any) => c.id === e.contrat_id);
  const model = data.machineModels.find((m: any) => m.id === e.modele_id);

  return (
    <div className="space-y-12 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start gap-8">
        <div className="flex items-center gap-10">
          <div className="w-32 h-32 bg-white border border-slate-100 rounded-[2.5rem] flex items-center justify-center p-4 shadow-xl"><img src={model?.photo || 'https://via.placeholder.com/150'} className="w-full h-full object-contain" /></div>
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">{e.marque_modele}</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">SN: {e.numero_serie}</span>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${e.statut === 'Actif' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{e.statut}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onEdit} className="px-8 py-4 bg-white border border-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-widest text-blue-600 shadow-sm">Modifier</button>
          <button onClick={onDelete} className="px-8 py-4 bg-rose-50 text-rose-600 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm">Supprimer</button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
         <div className="space-y-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Spécifications & Maintenance</h3>
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
               <DetailRow label="Type (Nature)" val={e.type} />
               <DetailRow label="Marque" val={data.marques.find((m:any)=>m.id === e.marque_id)?.nom} />
               <DetailRow label="Contrat" val={cont?.numero_contrat} clickable onClick={() => onGoToContract(cont?.id)} />
               <DetailRow label="Installation" val={e.date_installation} />
               <DetailRow label="Dernière Int." val={e.date_derniere_intervention || 'Jamais'} />
            </div>
         </div>
         <div className="space-y-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Parents & Localisation</h3>
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
               <DetailRow label="Client" val={bank?.nom} />
               <DetailRow label="Agence" val={ag?.nom_agence} />
               <DetailRow label="Ville / Région" val={`${ag?.ville} / ${ag?.region}`} />
               <DetailRow label="Adresse" val={ag?.adresse} />
            </div>
         </div>
      </div>
    </div>
  );
};

const UtilisateurDetails = ({ u, onEdit, onDelete }: { u: Utilisateur, onEdit: () => void, onDelete: () => void }) => {
  return (
    <div className="space-y-10 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-8">
          <div className="w-24 h-24 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white text-3xl font-black shadow-xl uppercase">
             {u.prenom.charAt(0)}{u.nom.charAt(0)}
          </div>
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">{u.prenom} {u.nom}</h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">CIN: {u.id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onEdit} className="px-8 py-4 bg-white border border-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-widest text-blue-600 shadow-sm hover:shadow-md transition-all"><i className="fas fa-user-edit mr-2"></i> Modifier</button>
          <button onClick={onDelete} className="px-8 py-4 bg-rose-50 text-rose-600 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-rose-100 transition-all"><i className="fas fa-user-slash mr-2"></i> Supprimer</button>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-4">
             <DetailRow label="Adresse Mail" val={u.email} />
             <DetailRow label="Téléphone" val={u.telephone} />
             <DetailRow label="Identifiant (Login)" val={u.login} />
             <DetailRow label="Statut de Compte" val={u.actif ? 'ACTIF' : 'INACTIF'} />
          </div>
          <div className="space-y-6">
             <div className="space-y-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rôles Assignés</span>
                <div className="flex flex-wrap gap-2">
                   {u.roles.map(r => <span key={r} className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase">{r}</span>)}
                </div>
             </div>
             <div className="space-y-2 pt-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Régions de Compétence</span>
                <div className="flex flex-wrap gap-2">
                   {u.regions_assignees && u.regions_assignees.length > 0 ? u.regions_assignees.map(reg => (
                     <span key={reg} className="bg-slate-50 text-slate-500 border border-slate-100 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase">{reg}</span>
                   )) : <span className="text-slate-300 italic text-[10px]">Toutes régions</span>}
                </div>
             </div>
          </div>
      </div>
    </div>
  );
};

const TemplateDetails = ({ t, onEdit, onDelete }: { t: FormTemplate, onEdit: () => void, onDelete: () => void }) => {
  return (
    <div className="space-y-10 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-8">
          <div className="w-24 h-24 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white text-3xl font-black shadow-xl uppercase">
             <i className="fas fa-list-check"></i>
          </div>
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">{t.nom_template}</h2>
            <p className="text-blue-600 text-xs font-bold uppercase tracking-widest">{t.typeEquipement} • Version {t.version}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onEdit} className="px-8 py-4 bg-white border border-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-widest text-blue-600 shadow-sm hover:shadow-md transition-all">Modifier</button>
          <button onClick={onDelete} className="px-8 py-4 bg-rose-50 text-rose-600 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-rose-100 transition-all">Supprimer</button>
        </div>
      </div>
      <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Structure du Formulaire</h3>
        <div className="space-y-4">
          {t.fields?.map((f, i) => (
            <div key={f.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
               <div className="flex items-center gap-4">
                  <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[10px] font-black text-slate-400 border border-slate-100 shadow-sm">{i+1}</span>
                  <div>
                    <p className="text-sm font-black text-slate-900">{f.label}</p>
                    <p className="text-[9px] font-bold text-blue-500 uppercase">{f.type === 'checkbox' ? 'Case à cocher' : f.type === 'photo' ? 'Image' : 'Texte'}</p>
                  </div>
               </div>
               {f.required && <span className="text-[8px] font-black bg-rose-100 text-rose-600 px-2 py-1 rounded uppercase tracking-widest">Obligatoire</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* --- FORMS --- */

const ClientForm = ({ onSubmit, initialData }: { onSubmit: (b: Banque) => void, initialData?: Banque }) => {
  const [formData, setFormData] = useState<Banque>(initialData || { id: '', nom: '', adresseSiege: '', email_responsable: '', tel_responsable: '', logo: '', infos: { adresseSiege: '', logo: '', contacts: [] } });
  const handleSubmit = () => { if (!formData.id || !formData.nom) return alert("Code/Nom requis"); onSubmit(formData); };
  return (
    <div className="space-y-10 animate-fade-in pb-10">
      <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 space-y-8">
        <h3 className="text-lg font-black text-blue-600 uppercase px-4">Fiche Client</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <FormInput label="Code Client *" value={formData.id} onChange={(v:string) => setFormData({...formData, id: v})} required />
          <FormInput label="Nom Institution *" value={formData.nom} onChange={(v:string) => setFormData({...formData, nom: v})} required />
          <FormInput label="Adresse Siège" value={formData.adresseSiege} onChange={(v:string) => setFormData({...formData, adresseSiege: v, infos: {...formData.infos, adresseSiege: v}})} />
          <FormInput label="Logo (URL)" value={formData.logo} onChange={(v:string) => setFormData({...formData, logo: v, infos: {...formData.infos, logo: v}})} />
        </div>
      </div>
      <button onClick={handleSubmit} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl transition-all">Enregistrer Institutions</button>
    </div>
  );
};

const AgenceForm = ({ data, onSubmit, initialData }: { data: any, onSubmit: (a: Agence) => void, initialData?: Agence }) => {
  const [formData, setFormData] = useState<Agence>(initialData || { id: '', agenceid: '', banque_id: '', nom_agence: '', adresse: '', maps_url: '', region: Region.GrandTunis, ville: '', municipalite: '', code_agence: '', contacts: [] });
  const handleVilleChange = (vName: string) => {
    const v = data.villesGeo.find((x:any) => x.nom === vName);
    if (!v) { setFormData({...formData, ville: vName}); return; }
    const g = data.gouvernorats.find((x:any) => x.gouvernorat_id === v.gouvernorat_id);
    const s = data.sousRegions.find((x:any) => x.sous_region_id === g?.sous_region_id);
    const r = data.geoRegions.find((x:any) => x.region_id === s?.region_id);
    setFormData({...formData, ville: vName, municipalite: g?.nom || '', region: (r?.nom as Region) || formData.region});
  };
  const handleSubmit = () => { if (!formData.code_agence || !formData.nom_agence || !formData.banque_id) return alert("Champs obligatoires"); onSubmit({...formData, id: formData.id || `ag-${Date.now()}`, agenceid: formData.code_agence}); };
  return (
    <div className="space-y-10 animate-fade-in pb-10">
      <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 space-y-8">
        <h3 className="text-lg font-black text-blue-600 uppercase px-4">Informations Agence</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <FormInput label="Code Agence *" value={formData.code_agence} onChange={(v:string) => setFormData({...formData, code_agence: v})} />
          <FormInput label="Nom Agence *" value={formData.nom_agence} onChange={(v:string) => setFormData({...formData, nom_agence: v})} />
          <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-5 tracking-widest">Client *</label><select value={formData.banque_id} onChange={e => setFormData({...formData, banque_id: e.target.value})} className="w-full px-7 py-4 bg-slate-50 rounded-[1.5rem] text-sm font-bold outline-none shadow-inner">{data.banques.map((b:any) => <option key={b.id} value={b.id}>{b.nom}</option>)}</select></div>
          <FormInput label="Adresse *" value={formData.adresse} onChange={(v:string) => setFormData({...formData, adresse: v})} />
          <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-5 tracking-widest">Ville *</label><select value={formData.ville} onChange={e => handleVilleChange(e.target.value)} className="w-full px-7 py-4 bg-slate-50 rounded-[1.5rem] text-sm font-bold outline-none shadow-inner"><option value="">Sélectionner...</option>{data.villesGeo.map((v:any) => <option key={v.ville_id} value={v.nom}>{v.nom}</option>)}</select></div>
          <div className="grid grid-cols-2 gap-4"><FormInput label="Gouvernorat" value={formData.municipalite} disabled /><FormInput label="Région" value={formData.region} disabled /></div>
          <div className="md:col-span-2"><FormInput label="URL Maps" value={formData.maps_url} onChange={(v:string) => setFormData({...formData, maps_url: v})} /></div>
        </div>
      </div>
      <button onClick={handleSubmit} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl transition-all">Enregistrer</button>
    </div>
  );
};

const ContratForm = ({ data, onSubmit, initialData }: { data: any, onSubmit: (c: Contrat) => void, initialData?: Contrat }) => {
  const [formData, setFormData] = useState<Contrat>(initialData || { id: '', banque_id: '', numero_contrat: '', date_debut: '', date_fin: '', frequence: 'Trimestrielle', statut: 'Actif', penalite_retard_jour: 0, sla_conditions: '' });
  const handleSubmit = () => { if (!formData.numero_contrat || !formData.banque_id || !formData.date_debut || !formData.date_fin) return alert("Champs requis"); onSubmit({...formData, id: formData.id || `cont-${Date.now()}`}); };
  return (
    <div className="space-y-10 animate-fade-in pb-10">
      <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 space-y-8">
        <h3 className="text-lg font-black text-blue-600 uppercase px-4">Fiche Contrat</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <FormInput label="Numéro Contrat (ID) *" value={formData.numero_contrat} onChange={(v:string) => setFormData({...formData, numero_contrat: v})} required />
          <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-5 tracking-widest">Client Parent *</label><select value={formData.banque_id} onChange={e => setFormData({...formData, banque_id: e.target.value})} className="w-full px-7 py-4 bg-slate-50 rounded-[1.5rem] text-sm font-bold outline-none shadow-inner"><option value="">Sélectionner...</option>{data.banques.map((b:any) => <option key={b.id} value={b.id}>{b.nom}</option>)}</select></div>
          <FormInput label="Date Début *" type="date" value={formData.date_debut} onChange={(v:string) => setFormData({...formData, date_debut: v})} required />
          <FormInput label="Date Fin *" type="date" value={formData.date_fin} onChange={(v:string) => setFormData({...formData, date_fin: v})} required />
          <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-5 tracking-widest">Fréquence</label><select value={formData.frequence} onChange={e => setFormData({...formData, frequence: e.target.value})} className="w-full px-7 py-4 bg-slate-50 rounded-[1.5rem] text-sm font-bold outline-none shadow-inner"><option value="Mensuelle">Mensuelle</option><option value="Bimensuelle">Bimensuelle</option><option value="Trimestrielle">Trimestrielle</option><option value="Semestrielle">Semestrielle</option><option value="Annuelle">Annuelle</option></select></div>
          <FormInput label="Pénalité par jour (TND)" type="number" value={formData.penalite_retard_jour} onChange={(v:string) => setFormData({...formData, penalite_retard_jour: Number(v)})} />
        </div>
      </div>
      <button onClick={handleSubmit} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl transition-all">{initialData ? "Mettre à jour / Renouveler" : "Créer le Contrat Institué"}</button>
    </div>
  );
};

const EquipementForm = ({ data, setters, onSubmit, initialData }: { data: any, setters: any, onSubmit: (e: Equipement) => void, initialData?: Equipement }) => {
  const [creationMode, setCreationMode] = useState<'unit' | 'type'>(initialData ? 'unit' : 'unit');
  const [unitData, setUnitData] = useState<Equipement>(initialData || { id: '', numero_serie: '', type: '', marque_modele: '', marque_id: '', modele_id: '', agence_id: '', banque_id: '', contrat_id: '', date_installation: new Date().toISOString().split('T')[0], statut: 'Actif', equipementid: '', type_id: '', agenceid: '', contratid: '' });
  const [catalogData, setCatalogData] = useState<MachineModel>({ id: `mod-${Date.now()}`, nom: '', photo: '', type_id: '', marque_id: '' });
  const selectedModel = useMemo(() => data.machineModels.find((m: any) => m.id === unitData.modele_id), [unitData.modele_id, data.machineModels]);
  useEffect(() => { if (selectedModel) { const nature = data.machineTypes.find((t: any) => t.id === selectedModel.type_id)?.nom || ''; const marque = data.marques.find((mq: any) => mq.id === selectedModel.marque_id)?.nom || ''; setUnitData(prev => ({ ...prev, type: nature, type_id: selectedModel.type_id, marque_id: selectedModel.marque_id, marque_modele: `${marque} ${selectedModel.nom}` })); } }, [selectedModel, data.machineTypes, data.marques]);
  const handleSaveUnit = () => { if (!unitData.numero_serie || !unitData.modele_id || !unitData.banque_id || !unitData.agence_id) return alert("Champs requis"); onSubmit({ ...unitData, id: unitData.numero_serie, equipementid: unitData.numero_serie }); };
  const handleSaveCatalog = () => { if (!catalogData.nom || !catalogData.marque_id || !catalogData.type_id) return alert("Champs requis"); setters.setMachineModels([...data.machineModels, catalogData]); setCreationMode('unit'); setUnitData({...unitData, modele_id: catalogData.id}); };
  return (
    <div className="space-y-10 animate-fade-in pb-10">
      <div className="flex justify-center"><div className="bg-slate-100 p-1.5 rounded-2xl flex"><button onClick={() => setCreationMode('unit')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${creationMode === 'unit' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Unité</button><button onClick={() => setCreationMode('type')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${creationMode === 'type' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>Catalogue</button></div></div>
      {creationMode === 'type' ? (
        <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-5 tracking-widest">Marque</label><select value={catalogData.marque_id} onChange={e => setCatalogData({...catalogData, marque_id: e.target.value})} className="w-full px-7 py-4 bg-slate-50 rounded-[1.5rem] font-bold outline-none shadow-inner"><option value="">Sélectionner...</option>{data.marques.map((m:any) => <option key={m.id} value={m.id}>{m.nom}</option>)}</select></div>
              <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-5 tracking-widest">Nature</label><select value={catalogData.type_id} onChange={e => setCatalogData({...catalogData, type_id: e.target.value})} className="w-full px-7 py-4 bg-slate-50 rounded-[1.5rem] font-bold outline-none shadow-inner"><option value="">Sélectionner...</option>{data.machineTypes.map((t:any) => <option key={t.id} value={t.id}>{t.nom}</option>)}</select></div>
              <FormInput label="Modèle *" value={catalogData.nom} onChange={(v:string) => setCatalogData({...catalogData, nom: v})} />
              <FormInput label="Image (URL)" value={catalogData.photo} onChange={(v:string) => setCatalogData({...catalogData, photo: v})} />
           </div>
           <button onClick={handleSaveCatalog} className="w-full py-6 bg-emerald-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl">Ajouter au Référentiel</button>
        </div>
      ) : (
        <div className="space-y-10">
          <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormInput label="N° de Série (SN) *" value={unitData.numero_serie} onChange={(v:string) => setUnitData({...unitData, numero_serie: v})} required />
              <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-5 tracking-widest">Choisir Modèle *</label><select value={unitData.modele_id} onChange={e => setUnitData({...unitData, modele_id: e.target.value})} className="w-full px-7 py-4 bg-slate-50 rounded-[1.5rem] font-bold outline-none shadow-inner"><option value="">Sélectionner...</option>{data.machineModels.map((m:any) => <option key={m.id} value={m.id}>{data.marques.find((mq:any)=>mq.id===m.marque_id)?.nom} - {m.nom}</option>)}</select></div>
              <div className="md:col-span-2 grid grid-cols-3 gap-6 bg-slate-50/50 p-6 rounded-[2rem] border border-dashed border-slate-200">
                 <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Marque Instituée</p><p className="text-sm font-black text-slate-900">{data.marques.find((mq:any)=>mq.id === unitData.marque_id)?.nom || 'N/A'}</p></div>
                 <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Nature</p><p className="text-sm font-black text-slate-900">{unitData.type || 'N/A'}</p></div>
                 <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Modèle</p><p className="text-sm font-black text-slate-900">{selectedModel?.nom || 'N/A'}</p></div>
              </div>
              <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-5 tracking-widest">Client *</label><select value={unitData.banque_id} onChange={e => setUnitData({...unitData, banque_id: e.target.value})} className="w-full px-7 py-4 bg-slate-50 rounded-[1.5rem] font-bold outline-none shadow-inner"><option value="">Sélectionner...</option>{data.banques.map((b:any) => <option key={b.id} value={b.id}>{b.nom}</option>)}</select></div>
              <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-5 tracking-widest">Agence *</label><select value={unitData.agence_id} onChange={e => setUnitData({...unitData, agence_id: e.target.value, agenceid: e.target.value})} className="w-full px-7 py-4 bg-slate-50 rounded-[1.5rem] font-bold outline-none shadow-inner"><option value="">Sélectionner...</option>{data.agences.filter((a:any)=>a.banque_id === unitData.banque_id).map((a:any) => <option key={a.id} value={a.id}>{a.nom_agence}</option>)}</select></div>
              <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-5 tracking-widest">Contrat *</label><select value={unitData.contrat_id} onChange={e => setUnitData({...unitData, contrat_id: e.target.value, contratid: e.target.value})} className="w-full px-7 py-4 bg-slate-50 rounded-[1.5rem] font-bold outline-none shadow-inner"><option value="">Sélectionner...</option>{data.contrats.filter((c:any)=>c.banque_id === unitData.banque_id).map((c:any) => <option key={c.id} value={c.id}>{c.numero_contrat}</option>)}</select></div>
              <FormInput label="Date Installation" type="date" value={unitData.date_installation} onChange={(v:string) => setUnitData({...unitData, date_installation: v})} />
            </div>
          </div>
          <button onClick={handleSaveUnit} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl transition-all">Enregistrer Unité</button>
        </div>
      )}
    </div>
  );
};

const UtilisateurForm = ({ data, onSubmit, initialData }: { data: any, onSubmit: (u: Utilisateur) => void, initialData?: Utilisateur }) => {
  const [formData, setFormData] = useState<Utilisateur>(initialData || { id: '', nom: '', prenom: '', roles: [UserRole.Technicien], email: '', telephone: '', login: '', regions_assignees: [], actif: true });
  const handleSubmit = () => { if (!formData.id || !formData.nom || !formData.prenom) return alert("Champs requis"); onSubmit(formData); };
  return (
    <div className="space-y-10 animate-fade-in pb-10">
      <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 space-y-8">
        <h3 className="text-lg font-black text-blue-600 uppercase px-4">Fiche Utilisateur</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <FormInput label="Identifiant / CIN *" value={formData.id} onChange={(v:string) => setFormData({...formData, id: v})} required />
          <FormInput label="Prénom *" value={formData.prenom} onChange={(v:string) => setFormData({...formData, prenom: v})} required />
          <FormInput label="Nom *" value={formData.nom} onChange={(v:string) => setFormData({...formData, nom: v})} required />
          <FormInput label="Email" value={formData.email} onChange={(v:string) => setFormData({...formData, email: v})} />
          <FormInput label="Téléphone" value={formData.telephone} onChange={(v:string) => setFormData({...formData, telephone: v})} />
          <FormInput label="Login Système" value={formData.login} onChange={(v:string) => setFormData({...formData, login: v})} />
        </div>
      </div>
      <button onClick={handleSubmit} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl transition-all">Enregistrer</button>
    </div>
  );
};

const TemplateForm = ({ data, onSubmit, initialData }: { data: any, onSubmit: (t: FormTemplate) => void, initialData?: FormTemplate }) => {
  const [formData, setFormData] = useState<FormTemplate>(initialData || { id: `t-${Date.now()}`, template_id: `t-${Date.now()}`, type_id: '', typeEquipement: '', nom_template: '', version: '1.0', actif: true, fields: [] });
  const handleSubmit = () => { if (!formData.nom_template || !formData.type_id) return alert("Champs requis"); onSubmit(formData); };
  return (
    <div className="space-y-10 animate-fade-in pb-10">
      <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 space-y-8">
        <h3 className="text-lg font-black text-blue-600 uppercase px-4">Modèle de Formulaire</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <FormInput label="Nom du Modèle *" value={formData.nom_template} onChange={(v:string) => setFormData({...formData, nom_template: v})} />
          <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-5 tracking-widest">Type d'Équipement *</label><select value={formData.type_id} onChange={e => setFormData({...formData, type_id: e.target.value, typeEquipement: e.target.value})} className="w-full px-7 py-4 bg-slate-50 rounded-[1.5rem] font-bold outline-none shadow-inner"><option value="">Sélectionner...</option>{data.machineTypes.map((t:any) => <option key={t.id} value={t.nom}>{t.nom}</option>)}</select></div>
        </div>
      </div>
      <button onClick={handleSubmit} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl transition-all">Enregistrer Modèle</button>
    </div>
  );
};

const AddressHierarchyForm = ({ level, data, setters, parentIds, onFinish }: any) => {
  const [name, setName] = useState("");
  const handleSave = () => {
    if (!name) return alert("Nom requis");
    const id = `${level}-${Date.now()}`;
    if (level === 'region') {
      setters.setGeoRegions([...data.geoRegions, { region_id: id, nom: name }]);
    } else if (level === 'gouvernorat') {
      const srId = data.sousRegions.find((s:any) => s.region_id === parentIds.reg)?.sous_region_id;
      setters.setGouvernorats([...data.gouvernorats, { gouvernorat_id: id, sous_region_id: srId, nom: name }]);
    } else if (level === 'ville') {
      setters.setVillesGeo([...data.villesGeo, { ville_id: id, gouvernorat_id: parentIds.gouv, nom: name }]);
    }
    onFinish();
  };
  return (
    <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 space-y-8">
      <h3 className="text-lg font-black text-blue-600 uppercase px-4">Nouveau {level}</h3>
      <FormInput label="Nom *" value={name} onChange={setName} required />
      <button onClick={handleSave} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl transition-all">Enregistrer</button>
    </div>
  );
};

const ContratLevel3 = ({ id, data }: { id: string, data: any }) => {
  const cont = data.contrats.find((c: any) => c.id === id);
  const eqs = data.equipements.filter((e: any) => e.contrat_id === id);
  return (
    <div className="space-y-10 animate-fade-in pb-10">
      <div className="bg-slate-900 p-10 rounded-[3rem] text-white">
        <h2 className="text-2xl font-black uppercase">Parc lié au contrat : {cont?.numero_contrat}</h2>
        <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mt-1">{eqs.length} Équipements sous maintenance</p>
      </div>
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden overflow-x-auto custom-scrollbar">
        <table className="w-full text-left min-w-[600px]">
          <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
            <tr><th className="px-8 py-4">S/N</th><th className="px-8 py-4">Modèle</th><th className="px-8 py-4">Agence</th><th className="px-8 py-4 text-center">Statut</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {eqs.map((e: Equipement) => (
              <tr key={e.id}>
                <td className="px-8 py-5 text-sm font-black text-blue-600">{e.numero_serie}</td>
                <td className="px-8 py-5 text-sm font-bold">{e.marque_modele}</td>
                <td className="px-8 py-5 text-xs text-slate-500">{data.agences.find((a:any)=>a.id === e.agence_id)?.nom_agence}</td>
                <td className="px-8 py-5 text-center"><span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${e.statut === 'Actif' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{e.statut}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BackOffice;
