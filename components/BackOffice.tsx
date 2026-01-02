
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Banque, Agence, Contrat, Equipement, Region, BankContact, 
  Utilisateur, FormTemplate, FormField, MarqueModele, UserRole, AuditLog, AgencyContact,
  GeoRegion, SousRegion, Gouvernorat, VilleGeo, Municipalite, Marque, MachineType, MachineModel
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

type AdminTab = 'clients' | 'agences' | 'contrats' | 'equipements' | 'templates' | 'utilisateurs' | 'adresses' | 'logs';
type AddressLevel = 'region' | 'sous-region' | 'gouvernorat' | 'ville' | 'municipalite';

const BackOffice: React.FC<BackOfficeProps> = ({ data, setters }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('clients');
  const [addressLevel, setAddressLevel] = useState<AddressLevel>('region');
  const [equipementSubTab, setEquipementSubTab] = useState<'inventaire' | 'catalogue'>('inventaire');
  
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [selectedSousRegionId, setSelectedSousRegionId] = useState<string | null>(null);
  const [selectedGouvernoratId, setSelectedGouvernoratId] = useState<string | null>(null);
  const [selectedVilleId, setSelectedVilleId] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [level3Id, setLevel3Id] = useState<string | null>(null);

  const [filterBank, setFilterBank] = useState("All");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCloseForm = () => {
    setShowForm(false);
    setIsEditing(false);
    setSelectedId(null);
    setLevel3Id(null);
  };

  const handleDeleteClient = (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce client ?")) {
      setters.setBanques(prev => prev.filter(b => b.id !== id));
      handleCloseForm();
    }
  };

  const handleDeleteAgence = (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette agence ?")) {
      setters.setAgences(prev => prev.filter(a => a.id !== id));
      handleCloseForm();
    }
  };

  const sidebarItems: { id: AdminTab; label: string; icon: string }[] = [
    { id: 'clients', label: 'Clients', icon: 'fa-building-columns' },
    { id: 'agences', label: 'Agences', icon: 'fa-map-location-dot' },
    { id: 'contrats', label: 'Contrats', icon: 'fa-file-signature' },
    { id: 'equipements', label: 'Équipements', icon: 'fa-microchip' },
    { id: 'templates', label: 'Modèles', icon: 'fa-list-check' },
    { id: 'utilisateurs', label: 'Utilisateurs', icon: 'fa-users-gear' },
    { id: 'adresses', label: 'Adresses', icon: 'fa-map-signs' },
    { id: 'logs', label: 'Logs', icon: 'fa-clock-rotate-left' },
  ];

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
      case 'adresses':
        if (addressLevel === 'region') return data.geoRegions.filter(r => r.nom?.toLowerCase().includes(q));
        if (addressLevel === 'sous-region') return data.sousRegions.filter(s => s.region_id === selectedRegionId && s.nom?.toLowerCase().includes(q));
        if (addressLevel === 'gouvernorat') return data.gouvernorats.filter(g => g.sous_region_id === selectedSousRegionId && g.nom?.toLowerCase().includes(q));
        if (addressLevel === 'ville') return data.villesGeo.filter(v => v.gouvernorat_id === selectedGouvernoratId && v.nom?.toLowerCase().includes(q));
        if (addressLevel === 'municipalite') return data.municipalites.filter(m => m.ville_id === selectedVilleId && m.nom?.toLowerCase().includes(q));
        return [];
      default: return [];
    }
  }, [activeTab, addressLevel, data, searchQuery, filterBank, selectedRegionId, selectedSousRegionId, selectedGouvernoratId, selectedVilleId]);

  const selectedItem = useMemo(() => {
    if (!selectedId) return null;
    const all = [
      ...data.banques, ...data.agences, ...data.contrats, 
      ...data.equipements, ...data.utilisateurs, ...data.formTemplates, ...data.machineModels
    ];
    return all.find(item => (item as any).id === selectedId || (item as any).template_id === selectedId || (item as any).equipementid === selectedId || (item as any).numero_serie === selectedId);
  }, [selectedId, data]);

  const resetAddressNav = () => {
    setAddressLevel('region');
    setSelectedRegionId(null);
    setSelectedSousRegionId(null);
    setSelectedGouvernoratId(null);
    setSelectedVilleId(null);
    handleCloseForm();
  };

  return (
    <div className="flex flex-col lg:flex-row h-full lg:min-h-[90vh] bg-white rounded-none lg:rounded-[3rem] shadow-none lg:shadow-2xl shadow-slate-200/50 overflow-hidden border-none lg:border lg:border-slate-100">
      
      <div className="w-full lg:w-72 bg-slate-900 flex flex-col shrink-0">
        <div className="p-6 lg:p-8 border-b border-white/5 flex lg:block justify-between items-center">
          <div>
            <h2 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">BankMaint Admin</h2>
            <p className="text-white font-black text-xl tracking-tighter">Référentiel</p>
          </div>
        </div>
        <nav className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible no-scrollbar p-2 lg:p-4 gap-1 lg:space-y-1">
          {sidebarItems.map(item => (
            <button 
              key={item.id}
              onClick={() => { setActiveTab(item.id); if(item.id === 'adresses') resetAddressNav(); else handleCloseForm(); }}
              className={`flex items-center gap-3 lg:gap-4 px-5 py-3 lg:px-6 lg:py-4 rounded-xl lg:rounded-2xl font-black text-[9px] lg:text-[10px] uppercase tracking-widest transition-all whitespace-nowrap lg:whitespace-normal ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}
            >
              <i className={`fas ${item.icon} w-4 lg:w-5 text-center text-sm`}></i>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 bg-slate-50 flex flex-col min-w-0">
        <div className="px-6 py-5 lg:px-10 lg:py-8 border-b border-slate-100 flex flex-col lg:flex-row gap-4 lg:justify-between lg:items-center bg-white">
          <div className="flex items-center gap-3">
            <h1 className="text-lg lg:text-2xl font-black text-slate-900 uppercase tracking-tighter flex items-center flex-wrap gap-2">
              <span className="truncate max-w-[150px] lg:max-w-none">{sidebarItems.find(i => i.id === activeTab)?.label}</span>
              {selectedId && !isEditing && <><i className="fas fa-chevron-right text-[10px] text-slate-300"></i> <span className="text-blue-600 text-sm lg:text-lg">Détails</span></>}
              {level3Id && <><i className="fas fa-chevron-right text-[10px] text-slate-300"></i> <span className="text-emerald-600 text-sm lg:text-lg">Parc Contrat</span></>}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!showForm && !selectedId && !isEditing && !level3Id && activeTab !== 'logs' && (
              <button onClick={() => setShowForm(true)} className="ml-auto lg:ml-0 flex-1 lg:flex-none px-5 py-3 bg-slate-900 text-white rounded-xl lg:rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-slate-900/10">
                <i className="fas fa-plus mr-2"></i> Ajouter
              </button>
            )}
            {(showForm || selectedId || isEditing || level3Id) && (
              <button onClick={handleCloseForm} className="ml-auto lg:ml-0 flex-1 lg:flex-none px-5 py-3 bg-slate-200 text-slate-600 rounded-xl lg:rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-300 transition-all">
                <i className="fas fa-arrow-left lg:mr-2"></i> <span className="hidden lg:inline">Retour</span>
              </button>
            )}
          </div>
        </div>

        <div className="p-4 lg:p-10 flex-1 overflow-y-auto custom-scrollbar">
          {(showForm || isEditing) ? (
            <div className="max-w-4xl mx-auto animate-fade-in">
                {activeTab === 'clients' && <ClientForm initialData={isEditing ? selectedItem as Banque : undefined} onSubmit={(b: any) => { setters.setBanques(prev => isEditing ? prev.map(old => old.id === b.id ? b : old) : [...prev, b]); handleCloseForm(); }} />}
                {activeTab === 'agences' && <AgenceForm data={data} initialData={isEditing ? selectedItem as Agence : undefined} onSubmit={(a: any) => { setters.setAgences(prev => isEditing ? prev.map(old => old.id === a.id ? a : old) : [...prev, a]); handleCloseForm(); }} />}
                {activeTab === 'adresses' && <AddressHierarchyForm level={addressLevel} data={data} setters={setters} parentIds={{reg: selectedRegionId, sub: selectedSousRegionId, gouv: selectedGouvernoratId, vil: selectedVilleId}} onFinish={handleCloseForm} />}
            </div>
          ) : level3Id ? (
            <ContratLevel3 id={level3Id} data={data} />
          ) : selectedId ? (
            <div className="max-w-7xl mx-auto animate-fade-in">
              {activeTab === 'clients' && selectedItem && <ClientDetails b={selectedItem as Banque} data={data} onEdit={() => setIsEditing(true)} onDelete={() => handleDeleteClient(selectedId)} onLevel3={(id) => setLevel3Id(id)} />}
              {activeTab === 'agences' && selectedItem && <AgenceDetails a={selectedItem as Agence} data={data} onEdit={() => setIsEditing(true)} onDelete={() => handleDeleteAgence(selectedId)} />}
            </div>
          ) : (
            <div className="space-y-4 lg:space-y-6">
              <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                <div className="relative flex-1">
                  <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
                  <input type="text" placeholder={`Chercher...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3 lg:py-4 bg-white border border-slate-200 rounded-2xl lg:rounded-3xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm" />
                </div>
                <div className="flex gap-2">
                  {(activeTab === 'agences') && (
                    <select value={filterBank} onChange={e => setFilterBank(e.target.value)} className="flex-1 bg-white border border-slate-200 px-4 py-3 rounded-xl lg:rounded-2xl text-[9px] font-black uppercase outline-none shadow-sm">
                      <option value="All">Tout Client</option>
                      {data.banques.map(b => <option key={b.id} value={b.id}>{b.nom}</option>)}
                    </select>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl lg:rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden overflow-x-auto custom-scrollbar">
                <table className="w-full text-left min-w-[700px]">
                  <thead className="bg-slate-50/50 text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <tr>
                      {activeTab === 'clients' ? (
                        <>
                          <th className="px-6 py-4 lg:px-8 lg:py-5">Code / Nom Client</th>
                          <th className="px-6 py-4 lg:px-8 lg:py-5 text-center">Indicateurs</th>
                          <th className="px-6 py-4 lg:px-8 lg:py-5">Adresse Siège</th>
                        </>
                      ) : activeTab === 'agences' ? (
                        <>
                          <th className="px-6 py-4 lg:px-8 lg:py-5">Client / Code / Nom Agence</th>
                          <th className="px-6 py-4 lg:px-8 lg:py-5 text-center">Région / Gouv / Ville</th>
                          <th className="px-6 py-4 lg:px-8 lg:py-5 text-center">Indicateurs</th>
                        </>
                      ) : (
                        <th className="px-6 py-4 lg:px-8 lg:py-5">Désignation</th>
                      )}
                      <th className="px-6 py-4 lg:px-8 lg:py-5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredItems.map(item => {
                      const id = (item as any).id || (item as any).template_id || (item as any).numero_serie || (item as any).region_id;
                      return (
                        <tr key={id} onClick={() => setSelectedId(id)} className="hover:bg-slate-50/80 transition-all cursor-pointer group">
                          {activeTab === 'clients' ? (
                            <>
                              <td className="px-6 py-5 lg:px-8 lg:py-6">
                                <div className="text-[10px] font-mono text-slate-400 mb-0.5">{id}</div>
                                <div className="font-black text-slate-900 text-sm">{(item as Banque).nom}</div>
                              </td>
                              <td className="px-6 py-5 lg:px-8 lg:py-6">
                                <div className="flex justify-center gap-1.5 lg:gap-3">
                                  <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg text-[8px] font-black uppercase">{data.contrats.filter(c => c.banque_id === (item as Banque).id && c.statut === 'Actif').length} Contrats</span>
                                  <span className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-lg text-[8px] font-black uppercase">{data.agences.filter(a => a.banque_id === (item as Banque).id).length} Agences</span>
                                  <span className="bg-amber-50 text-amber-600 px-2.5 py-1 rounded-lg text-[8px] font-black uppercase">{data.equipements.filter(e => e.banque_id === (item as Banque).id).length} Équipements</span>
                                </div>
                              </td>
                              <td className="px-6 py-5 lg:px-8 lg:py-6 text-[11px] font-medium text-slate-500 max-w-[200px] truncate">{(item as Banque).adresseSiege}</td>
                            </>
                          ) : activeTab === 'agences' ? (
                            <>
                              <td className="px-6 py-5 lg:px-8 lg:py-6">
                                <div className="text-[9px] font-black text-blue-500 uppercase leading-none mb-1">{data.banques.find(b => b.id === (item as Agence).banque_id)?.nom}</div>
                                <div className="text-xs font-black text-slate-900">{(item as Agence).nom_agence}</div>
                                <div className="text-[9px] font-mono text-slate-400 uppercase">Code: {(item as Agence).code_agence}</div>
                              </td>
                              <td className="px-6 py-5 lg:px-8 lg:py-6 text-center">
                                <div className="text-[10px] font-black text-slate-900 uppercase">{(item as Agence).region}</div>
                                <div className="text-[9px] font-bold text-slate-400 uppercase">{(item as Agence).municipalite} • {(item as Agence).ville}</div>
                              </td>
                              <td className="px-6 py-5 lg:px-8 lg:py-6 text-center">
                                <div className="flex justify-center gap-2">
                                  <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-lg text-[8px] font-black uppercase">{data.contrats.filter(c => c.banque_id === (item as Agence).banque_id).length} Contrats</span>
                                  <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-lg text-[8px] font-black uppercase">{data.equipements.filter(e => e.agence_id === (item as Agence).id).length} Machines</span>
                                </div>
                              </td>
                            </>
                          ) : (
                            <td className="px-6 py-5 lg:px-8 lg:py-6"><div className="font-black text-slate-900 text-sm">{(item as any).nom}</div></td>
                          )}
                          <td className="px-6 py-5 lg:px-8 lg:py-6 text-right">
                             <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl lg:rounded-2xl bg-slate-100 text-slate-300 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all ml-auto"><i className="fas fa-arrow-right text-[10px] lg:text-xs"></i></div>
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

/* --- SHARED COMPONENTS --- */

const FormInput = ({ label, value, onChange, placeholder, type = "text", required, disabled = false }: any) => (
  <div className="space-y-1.5 lg:space-y-2">
    <label className="text-[9px] lg:text-[10px] font-black uppercase text-slate-400 ml-3 lg:ml-5 tracking-widest">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    <input 
      type={type} 
      value={value} 
      onChange={e => onChange(e.target.value)} 
      placeholder={placeholder} 
      disabled={disabled}
      className={`w-full px-5 py-3 lg:px-7 lg:py-4 bg-slate-50 border border-transparent rounded-xl lg:rounded-[1.5rem] text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white shadow-inner transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`} 
    />
  </div>
);

const DetailRow = ({ label, val }: any) => (
  <div className="flex justify-between items-center py-3 border-b border-slate-50 last:border-0 last:pb-0">
     <span className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
     <span className="text-xs lg:text-sm font-black text-slate-900 text-right ml-4">{val || 'N/A'}</span>
  </div>
);

const StatTile = ({ label, val, icon, color = "text-blue-500" }: any) => (
  <div className="bg-white p-5 lg:p-8 rounded-2xl lg:rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-4 lg:gap-5">
    <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-slate-50 flex items-center justify-center ${color} text-lg lg:text-xl shadow-inner`}><i className={`fas ${icon}`}></i></div>
    <div>
      <div className="text-[8px] lg:text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</div>
      <div className="text-base lg:text-lg font-black text-slate-900">{val}</div>
    </div>
  </div>
);

/* --- TAB COMPONENTS --- */

const ClientDetails = ({ b, data, onEdit, onDelete, onLevel3 }: { b: Banque, data: any, onEdit: () => void, onDelete: () => void, onLevel3: (id: string) => void }) => {
  const [q, setQ] = useState("");
  const contracts = data.contrats.filter((c: any) => c.banque_id === b.id);
  
  return (
    <div className="space-y-6 lg:space-y-10 animate-fade-in pb-10">
      {/* Header Profile */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5 lg:gap-8">
          <div className="w-16 h-16 lg:w-24 lg:h-24 bg-slate-900 rounded-2xl lg:rounded-[2rem] flex items-center justify-center text-white text-xl lg:text-3xl font-black shadow-xl">
             {b.logo ? <img src={b.logo} className="w-full h-full object-cover rounded-2xl lg:rounded-[2rem]" /> : b.nom.charAt(0)}
          </div>
          <div>
            <h2 className="text-2xl lg:text-4xl font-black text-slate-900 tracking-tighter uppercase">{b.nom}</h2>
            <p className="text-slate-400 text-[10px] lg:text-xs font-bold uppercase tracking-widest truncate max-w-[200px] lg:max-w-none">{b.adresseSiege}</p>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={onEdit} className="flex-1 md:flex-none px-6 py-3 lg:px-8 lg:py-4 bg-white border border-slate-100 rounded-xl lg:rounded-2xl font-black text-[9px] lg:text-[10px] uppercase tracking-widest text-blue-600 shadow-sm hover:shadow-md transition-all">
            <i className="fas fa-edit mr-2"></i> Modifier
          </button>
          <button onClick={onDelete} className="flex-1 md:flex-none px-6 py-3 lg:px-8 lg:py-4 bg-rose-50 text-rose-600 rounded-xl lg:rounded-2xl font-black text-[9px] lg:text-[10px] uppercase tracking-widest shadow-sm hover:bg-rose-100 transition-all">
            <i className="fas fa-trash-alt mr-2"></i> Supprimer
          </button>
        </div>
      </div>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-8">
         <StatTile label="Contrats Actifs" val={contracts.filter((c:any)=>c.statut === 'Actif').length} icon="fa-file-signature" color="text-blue-500" />
         <StatTile label="Agences" val={data.agences.filter((a: any) => a.banque_id === b.id).length} icon="fa-building" color="text-emerald-500" />
         <StatTile label="Unités Couvertes" val={data.equipements.filter((e: any) => e.banque_id === b.id).length} icon="fa-microchip" color="text-amber-500" />
      </div>

      {/* Contacts Section */}
      <div className="bg-white p-6 lg:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Informations de Contact</h3>
        {b.infos.contacts && b.infos.contacts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
            {b.infos.contacts.map((c, idx) => (
              <div key={idx} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm"><i className="fas fa-user-tie"></i></div>
                  <div>
                    <div className="text-sm font-black text-slate-900">{c.nom || 'Sans nom'}</div>
                    <div className="text-[9px] font-black text-blue-500 uppercase">{c.poste || 'Poste non spécifié'}</div>
                  </div>
                </div>
                <div className="pt-2 space-y-2">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500"><i className="fas fa-envelope text-slate-300 w-4"></i> {c.email}</div>
                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500"><i className="fas fa-phone text-slate-300 w-4"></i> {c.telephones?.[0]}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-300 text-[10px] font-black uppercase tracking-widest italic">Aucun contact enregistré.</div>
        )}
      </div>

      {/* Contracts Drill-down Section */}
      <div className="space-y-4 lg:space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 px-2">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contrats de Maintenance Actifs</h3>
          <div className="relative w-full md:w-64">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-xs"></i>
            <input type="text" placeholder="Chercher un contrat..." value={q} onChange={e => setQ(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-white border border-slate-100 rounded-xl text-[10px] font-bold outline-none shadow-sm" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:gap-6">
          {contracts.filter((c:any) => c.numero_contrat.toLowerCase().includes(q.toLowerCase())).map((c: Contrat) => (
            <div key={c.id} className="bg-white p-6 lg:p-8 rounded-2xl lg:rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <div>
                    <h4 className="text-lg lg:text-xl font-black text-slate-900">{c.numero_contrat}</h4>
                    <p className="text-[9px] lg:text-[10px] font-bold text-slate-400 uppercase mt-1">Échéance : {c.date_fin} • <span className={c.statut === 'Actif' ? 'text-emerald-500' : 'text-rose-500'}>{c.statut}</span></p>
                  </div>
                  <button onClick={() => onLevel3(c.id)} className="w-full md:w-auto px-5 py-2.5 lg:px-6 lg:py-3 bg-slate-900 text-white rounded-xl text-[9px] lg:text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg">Gérer le parc lié</button>
               </div>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6 border-t border-slate-50 pt-6">
                  <div>
                    <div className="text-[8px] font-black text-slate-400 uppercase mb-1">Fréquence</div>
                    <div className="text-[11px] font-black text-slate-900 uppercase">{c.frequence}</div>
                  </div>
                  <div>
                    <div className="text-[8px] font-black text-slate-400 uppercase mb-1">Pénalité/jour</div>
                    <div className="text-[11px] font-black text-rose-500 uppercase">{c.penalite_retard_jour} TND</div>
                  </div>
                  <div>
                    <div className="text-[8px] font-black text-slate-400 uppercase mb-1">Agences</div>
                    <div className="text-[11px] font-black text-slate-900">{data.agences.filter((a: any) => a.banque_id === b.id).length}</div>
                  </div>
                  <div>
                    <div className="text-[8px] font-black text-slate-400 uppercase mb-1">Unités</div>
                    <div className="text-[11px] font-black text-slate-900 uppercase">{data.equipements.filter((e: any) => e.contrat_id === c.id).length}</div>
                  </div>
               </div>
            </div>
          ))}
          {contracts.length === 0 && <div className="text-center py-10 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-300 uppercase text-[10px] font-black">Aucun contrat enregistré.</div>}
        </div>
      </div>
    </div>
  );
};

const AgenceDetails = ({ a, data, onEdit, onDelete }: { a: Agence, data: any, onEdit: () => void, onDelete: () => void }) => {
  const eqs = data.equipements.filter((e: any) => e.agence_id === a.id);
  return (
    <div className="space-y-6 lg:space-y-10 animate-fade-in pb-10">
       <div className="bg-slate-900 p-6 lg:p-10 rounded-2xl lg:rounded-[3rem] text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-xl lg:text-3xl font-black uppercase tracking-tighter mb-2">{a.nom_agence}</h2>
            <p className="text-blue-400 text-[10px] lg:text-xs font-bold uppercase tracking-widest">{a.code_agence} • {a.ville} • {a.region}</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto z-10">
            <button onClick={onEdit} className="flex-1 md:flex-none bg-white/10 px-6 py-3 rounded-xl text-[9px] font-black uppercase hover:bg-white/20 transition-all border border-white/10">Modifier</button>
            <button onClick={onDelete} className="flex-1 md:flex-none bg-rose-600/20 px-6 py-3 rounded-xl text-[9px] font-black uppercase hover:bg-rose-600/40 text-rose-400 transition-all border border-rose-600/20">Supprimer</button>
          </div>
          <i className="fas fa-building absolute -bottom-10 -right-10 text-white/5 text-[200px]"></i>
       </div>

       <div className="bg-white p-6 lg:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Contacts Agence</h3>
        {a.contacts && a.contacts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
            {a.contacts.map((c, idx) => (
              <div key={idx} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm"><i className="fas fa-id-badge"></i></div>
                  <div>
                    <div className="text-sm font-black text-slate-900">{c.nom}</div>
                    <div className="text-[9px] font-black text-emerald-500 uppercase">{c.poste}</div>
                  </div>
                </div>
                <div className="pt-2 space-y-1">
                  <div className="text-[11px] font-bold text-slate-500"><i className="fas fa-phone mr-2 text-slate-300"></i> {c.telephone}</div>
                  {c.email && <div className="text-[11px] font-bold text-slate-500"><i className="fas fa-envelope mr-2 text-slate-300"></i> {c.email}</div>}
                </div>
              </div>
            ))}
          </div>
        ) : <p className="text-center py-4 text-slate-300 italic text-[10px]">Aucun contact agence.</p>}
      </div>

       <div className="space-y-4 lg:space-y-6">
          <h3 className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Parc Équipements ({eqs.length})</h3>
          <div className="bg-white rounded-2xl lg:rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden overflow-x-auto custom-scrollbar">
            <table className="w-full text-left min-w-[600px]">
              <thead className="bg-slate-50/50 text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 lg:px-8 lg:py-4">Machine / SN</th>
                  <th className="px-6 py-3 lg:px-8 lg:py-4">Type</th>
                  <th className="px-6 py-3 lg:px-8 lg:py-4">Mise en Service</th>
                  <th className="px-6 py-3 lg:px-8 lg:py-4">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {eqs.map((e: Equipement) => (
                  <tr key={e.id} className="hover:bg-slate-50/50 transition-all">
                    <td className="px-6 py-4 lg:px-8 lg:py-5">
                      <div className="font-black text-slate-900 text-xs lg:text-sm">{e.marque_modele}</div>
                      <div className="text-[9px] font-mono font-bold text-blue-600">{e.numero_serie}</div>
                    </td>
                    <td className="px-6 py-4 lg:px-8 lg:py-5 text-[11px] font-bold text-slate-400">{e.type}</td>
                    <td className="px-6 py-4 lg:px-8 lg:py-5 text-[11px] font-black text-slate-900">{e.date_installation}</td>
                    <td className="px-6 py-4 lg:px-8 lg:py-5">
                       <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${e.statut === 'Actif' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{e.statut}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
       </div>
    </div>
  );
};

const ContratLevel3 = ({ id, data }: { id: string, data: any }) => {
  const [search, setSearch] = useState("");
  const [fStatut, setFStatut] = useState("All");
  
  const contrat = data.contrats.find((c:any) => c.id === id);
  const banque = data.banques.find((b:any) => b.id === contrat?.banque_id);

  const eqs = data.equipements.filter((e: any) => e.contrat_id === id).filter((e: any) => {
     const matchS = e.numero_serie.toLowerCase().includes(search.toLowerCase()) || e.marque_modele.toLowerCase().includes(search.toLowerCase());
     const matchStat = fStatut === "All" || e.statut === fStatut;
     return matchS && matchStat;
  });

  return (
    <div className="space-y-6 lg:space-y-10 animate-fade-in pb-10">
       {/* Info Summary for Contract */}
       <div className="bg-white p-6 lg:p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
             <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{contrat?.numero_contrat}</h2>
             <p className="text-blue-600 text-[10px] font-black uppercase tracking-widest mt-1">Client: {banque?.nom} • Statut: {contrat?.statut}</p>
          </div>
          <div className="flex gap-4">
            <div className="text-center">
               <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Équipements</div>
               <div className="text-xl font-black text-slate-900">{eqs.length}</div>
            </div>
            <div className="w-px h-10 bg-slate-100 hidden md:block"></div>
            <div className="text-center">
               <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fréquence</div>
               <div className="text-xl font-black text-slate-900 uppercase text-[12px]">{contrat?.frequence}</div>
            </div>
          </div>
       </div>

       {/* Filters */}
       <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          <div className="relative flex-1">
            <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
            <input type="text" placeholder="Chercher SN ou Modèle dans ce contrat..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-12 pr-4 py-3 lg:py-4 bg-white border border-slate-200 rounded-xl lg:rounded-3xl text-xs font-bold outline-none shadow-sm" />
          </div>
          <select value={fStatut} onChange={e => setFStatut(e.target.value)} className="bg-white border px-4 py-3 rounded-xl lg:rounded-2xl text-[9px] lg:text-[10px] font-black uppercase outline-none shadow-sm">
            <option value="All">Tout Statut</option>
            <option value="Actif">Actif</option>
            <option value="Hors-Service">Hors-Service</option>
          </select>
       </div>

       {/* Results Table */}
       <div className="bg-white rounded-2xl lg:rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-slate-50/50 text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
               <tr>
                 <th className="px-6 py-4 lg:px-8 lg:py-5">Agence & Localisation</th>
                 <th className="px-6 py-4 lg:px-8 lg:py-5">Équipement (Modèle / SN)</th>
                 <th className="px-6 py-4 lg:px-8 lg:py-5">Installation</th>
                 <th className="px-6 py-4 lg:px-8 lg:py-5">Statut Unité</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
               {eqs.map((e: Equipement) => {
                 const ag = data.agences.find((a:any)=>a.id === e.agence_id);
                 return (
                    <tr key={e.id} className="hover:bg-slate-50 transition-all">
                       <td className="px-6 py-5 lg:px-8 lg:py-6">
                          <div className="font-black text-slate-900 text-xs">{ag?.nom_agence}</div>
                          <div className="text-[8px] lg:text-[9px] text-slate-400 font-bold uppercase">{ag?.region} • {ag?.ville}</div>
                       </td>
                       <td className="px-6 py-5 lg:px-8 lg:py-6">
                          <div className="font-black text-slate-900 text-xs">{e.marque_modele}</div>
                          <div className="text-[11px] font-mono font-bold text-blue-600">SN: {e.numero_serie}</div>
                       </td>
                       <td className="px-6 py-5 lg:px-8 lg:py-6">
                          <div className="text-xs font-black text-slate-900">{e.date_installation}</div>
                          <div className="text-[8px] text-slate-400 font-black uppercase mt-1">Dern. Int: {e.date_derniere_intervention || 'Jamais'}</div>
                       </td>
                       <td className="px-6 py-5 lg:px-8 lg:py-6">
                          <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase ${e.statut === 'Actif' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{e.statut}</span>
                       </td>
                    </tr>
                 );
               })}
               {eqs.length === 0 && <tr><td colSpan={4} className="py-20 text-center uppercase text-[10px] font-black text-slate-300">Aucune unité trouvée pour ce contrat.</td></tr>}
            </tbody>
          </table>
       </div>
    </div>
  );
};

/* --- FORM COMPONENTS --- */

const AgenceForm = ({ data, onSubmit, initialData }: { data: any, onSubmit: (a: Agence) => void, initialData?: Agence }) => {
  const [formData, setFormData] = useState<Agence>(initialData || { 
    id: '', agenceid: '', banque_id: '', nom_agence: '', adresse: '', maps_url: '', region: Region.GrandTunis,
    ville: '', municipalite: '', code_agence: '', contacts: [], nom_responsable: '', tel_responsable: '', mail_responsable: ''
  });

  const handleVilleChange = (villeName: string) => {
    const ville = data.villesGeo.find((v:any) => v.nom === villeName);
    if (!ville) {
      setFormData(prev => ({ ...prev, ville: villeName }));
      return;
    }
    const gouv = data.gouvernorats.find((g:any) => g.gouvernorat_id === ville.gouvernorat_id);
    const sub = data.sousRegions.find((s:any) => s.sous_region_id === gouv?.sous_region_id);
    const regObj = data.geoRegions.find((r:any) => r.region_id === sub?.region_id);
    
    setFormData(prev => ({ 
      ...prev, 
      ville: villeName, 
      municipalite: gouv?.nom || '', 
      region: (regObj?.nom as Region) || prev.region 
    }));
  };

  const addContact = () => {
    setFormData(prev => ({ ...prev, contacts: [...prev.contacts, { nom: '', poste: '', telephone: '', email: '' }] }));
  };

  const updateContact = (idx: number, field: string, val: string) => {
    const newContacts = [...formData.contacts];
    (newContacts[idx] as any)[field] = val;
    setFormData(prev => ({ ...prev, contacts: newContacts }));
  };

  const removeContact = (idx: number) => {
    setFormData(prev => ({ ...prev, contacts: prev.contacts.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = () => {
    if (!formData.code_agence || !formData.nom_agence || !formData.banque_id || !formData.adresse || !formData.ville) {
      alert("Erreur : Les champs avec * sont obligatoires.");
      return;
    }
    onSubmit({ ...formData, id: formData.id || `ag-${Date.now()}`, agenceid: formData.code_agence });
  };

  return (
    <div className="space-y-6 lg:space-y-12 animate-fade-in pb-10">
      <div className="bg-white p-6 lg:p-10 rounded-2xl lg:rounded-[3rem] shadow-sm border border-slate-100 space-y-6">
        <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest px-4">Informations Agence</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          <FormInput label="Code Agence (ID)" placeholder="ex: AG001" value={formData.code_agence} onChange={(v:string) => setFormData({...formData, code_agence: v})} required />
          <FormInput label="Nom Agence" placeholder="ex: Agence Tunis El Manar" value={formData.nom_agence} onChange={(v:string) => setFormData({...formData, nom_agence: v})} required />
          
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-5 tracking-widest">Client Parent <span className="text-rose-500">*</span></label>
            <select value={formData.banque_id} onChange={e => setFormData({...formData, banque_id: e.target.value})} className="w-full px-5 py-3 lg:px-7 lg:py-4 bg-slate-50 border-none rounded-xl lg:rounded-[1.5rem] text-sm font-bold outline-none">
              <option value="">Sélectionner un client...</option>
              {data.banques.map((b:Banque) => <option key={b.id} value={b.id}>{b.nom}</option>)}
            </select>
          </div>

          <FormInput label="Adresse Exacte" placeholder="Numéro, rue..." value={formData.adresse} onChange={(v:string) => setFormData({...formData, adresse: v})} required />
          
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-5 tracking-widest">Ville <span className="text-rose-500">*</span></label>
            <select value={formData.ville} onChange={e => handleVilleChange(e.target.value)} className="w-full px-5 py-3 lg:px-7 lg:py-4 bg-slate-50 border-none rounded-xl lg:rounded-[1.5rem] text-sm font-bold outline-none">
              <option value="">Sélectionner...</option>
              {data.villesGeo.map((v:any) => <option key={v.ville_id} value={v.nom}>{v.nom}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <FormInput label="Gouvernorat" value={formData.municipalite} disabled />
             <FormInput label="Région" value={formData.region} disabled />
          </div>

          <div className="md:col-span-2">
             <FormInput label="URL Localisation Maps" placeholder="https://goo.gl/maps/..." value={formData.maps_url} onChange={(v:string) => setFormData({...formData, maps_url: v})} />
          </div>
        </div>
      </div>

      <div className="bg-slate-100/50 p-6 lg:p-10 rounded-2xl lg:rounded-[3rem] border border-slate-200/50 space-y-6">
        <div className="flex justify-between items-center px-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contacts de l'Agence</h3>
          <button type="button" onClick={addContact} className="px-5 py-2.5 bg-white border border-slate-200 text-blue-600 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-sm hover:bg-blue-50 transition-all flex items-center gap-2">
            <i className="fas fa-plus-circle"></i> Ajouter Contact
          </button>
        </div>

        {formData.contacts.map((c, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative group animate-fade-in">
            <button onClick={() => removeContact(idx)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-50 text-slate-300 hover:text-rose-500 flex items-center justify-center transition-all"><i className="fas fa-trash-alt text-[10px]"></i></button>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <FormInput label="Nom" value={c.nom} onChange={(v:string) => updateContact(idx, 'nom', v)} />
              <FormInput label="Poste" value={c.poste} onChange={(v:string) => updateContact(idx, 'poste', v)} />
              <FormInput label="Tel" value={c.telephone} onChange={(v:string) => updateContact(idx, 'telephone', v)} />
              <FormInput label="Mail" value={c.email} onChange={(v:string) => updateContact(idx, 'email', v)} />
            </div>
          </div>
        ))}
      </div>

      <button onClick={handleSubmit} className="w-full py-5 lg:py-6 bg-slate-900 text-white rounded-xl lg:rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl transition-all">Enregistrer l'Agence</button>
    </div>
  );
};

const ClientForm = ({ onSubmit, initialData }: { onSubmit: (b: Banque) => void, initialData?: Banque }) => {
  const [formData, setFormData] = useState<Banque>(initialData || { 
    id: '', nom: '', adresseSiege: '', email_responsable: '', tel_responsable: '', logo: '',
    infos: { adresseSiege: '', logo: '', contacts: [] } 
  });
  
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (!formData.id || !formData.nom || !formData.adresseSiege || !formData.logo) {
      alert("Erreur : Tous les champs du client (Code, Nom, Adresse, Logo) sont obligatoires.");
      return;
    }
    const firstContact = formData.infos.contacts[0] || { email: '', telephones: [''] };
    const finalData = { 
      ...formData, 
      email_responsable: firstContact.email || formData.email_responsable, 
      tel_responsable: firstContact.telephones[0] || formData.tel_responsable 
    };
    onSubmit(finalData);
  };

  const addContact = () => {
    const newContact: BankContact = { nom: '', poste: '', email: '', telephones: [''] };
    setFormData(prev => ({ ...prev, infos: { ...prev.infos, contacts: [...prev.infos.contacts, newContact] } }));
  };

  const updateContact = (index: number, field: string, value: string) => {
    const updatedContacts = [...formData.infos.contacts];
    if (field === 'telephone') updatedContacts[index].telephones = [value];
    else (updatedContacts[index] as any)[field] = value;
    setFormData(prev => ({ ...prev, infos: { ...prev.infos, contacts: updatedContacts } }));
  };

  const removeContact = (index: number) => {
    setFormData(prev => ({ ...prev, infos: { ...prev.infos, contacts: prev.infos.contacts.filter((_, i) => i !== index) } }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData(prev => ({ ...prev, logo: base64String, infos: { ...prev.infos, logo: base64String } }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6 lg:space-y-12 animate-fade-in pb-10">
      <div className="bg-white p-6 lg:p-10 rounded-2xl lg:rounded-[3rem] shadow-sm border border-slate-100 space-y-6 lg:space-y-8">
        <h3 className="text-[9px] lg:text-[10px] font-black text-blue-600 uppercase tracking-widest px-4">Fiche Client</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          <FormInput label="Code Client" placeholder="ex: BIAT01" value={formData.id} onChange={(v:string) => setFormData({...formData, id: v})} required />
          <FormInput label="Nom Institution" placeholder="ex: Banque Nationale" value={formData.nom} onChange={(v:string) => setFormData({...formData, nom: v})} required />
          <FormInput label="Adresse Siège" placeholder="Tunis" value={formData.adresseSiege} onChange={(v:string) => setFormData({...formData, adresseSiege: v, infos: {...formData.infos, adresseSiege: v}})} required />
          
          <div className="space-y-2">
            <label className="text-[9px] lg:text-[10px] font-black uppercase text-slate-400 ml-3 lg:ml-5 tracking-widest">Logo <span className="text-rose-500">*</span></label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={formData.logo} 
                onChange={e => setFormData({...formData, logo: e.target.value, infos: {...formData.infos, logo: e.target.value}})} 
                placeholder="URL du logo..." 
                className="flex-1 px-5 py-3 lg:px-7 lg:py-4 bg-slate-50 border border-transparent rounded-xl lg:rounded-[1.5rem] text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white shadow-inner transition-all" 
              />
              <button 
                type="button" 
                onClick={() => logoFileInputRef.current?.click()}
                className="px-4 bg-slate-100 text-slate-600 rounded-xl lg:rounded-[1.5rem] hover:bg-slate-200 transition-all border border-slate-200"
                title="Importer depuis mon appareil"
              >
                <i className="fas fa-image"></i>
              </button>
              <input type="file" ref={logoFileInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />
            </div>
            {formData.logo && (
              <div className="mt-2 ml-5">
                <img src={formData.logo} className="w-12 h-12 object-cover rounded-lg border border-slate-100" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-slate-100/50 p-6 lg:p-10 rounded-2xl lg:rounded-[3rem] border border-slate-200/50 space-y-6 lg:space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2">
          <div>
            <h3 className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">Contacts Clés</h3>
            <p className="text-[8px] lg:text-[9px] font-bold text-slate-300 mt-1 uppercase tracking-tighter">Optionnel</p>
          </div>
          <button type="button" onClick={addContact} className="w-full md:w-auto px-5 py-2.5 bg-white border border-slate-200 text-blue-600 rounded-xl font-black text-[9px] lg:text-[10px] uppercase tracking-widest shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2">
            <i className="fas fa-plus-circle"></i> Ajouter un contact
          </button>
        </div>

        {formData.infos.contacts.map((contact, index) => (
          <div key={index} className="bg-white p-6 lg:p-8 rounded-xl lg:rounded-[2rem] border border-slate-100 shadow-sm relative group">
            <button onClick={() => removeContact(index)} className="absolute top-4 right-4 lg:top-6 lg:right-6 w-8 h-8 rounded-full bg-slate-50 text-slate-300 hover:bg-rose-50 hover:text-rose-500 flex items-center justify-center transition-all">
              <i className="fas fa-trash-alt text-[10px]"></i>
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              <FormInput label="Nom" value={contact.nom} onChange={(v:string) => updateContact(index, 'nom', v)} />
              <FormInput label="Poste" value={contact.poste} onChange={(v:string) => updateContact(index, 'poste', v)} />
              <FormInput label="Mail" value={contact.email} onChange={(v:string) => updateContact(index, 'email', v)} />
              <FormInput label="Tel" value={contact.telephones[0]} onChange={(v:string) => updateContact(index, 'telephone', v)} />
            </div>
          </div>
        ))}
      </div>

      <button onClick={handleSubmit} className="w-full py-5 lg:py-6 bg-slate-900 text-white rounded-xl lg:rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl transition-all">
        Enregistrer le Client
      </button>
    </div>
  );
};

const AddressHierarchyForm = ({ level, data, setters, parentIds, onFinish }: any) => {
    const [name, setName] = useState("");
    const handleAdd = () => {
        if(!name) { alert(`Nom obligatoire.`); return; }
        const id = `${level}-${Date.now()}`;
        if(level === 'region') setters.setGeoRegions([...data.geoRegions, {region_id: id, nom: name}]);
        if(level === 'sous-region') setters.setSousRegions([...data.sousRegions, {sous_region_id: id, region_id: parentIds.reg, nom: name}]);
        if(level === 'gouvernorat') setters.setGouvernorats([...data.gouvernorats, {gouvernorat_id: id, sous_region_id: parentIds.sub, nom: name}]);
        if(level === 'ville') setters.setVillesGeo([...data.villesGeo, {ville_id: id, gouvernorat_id: parentIds.gouv, nom: name}]);
        if(level === 'municipalite') setters.setMunicipalites([...data.municipalites, {municipalite_id: id, ville_id: parentIds.vil, nom: name}]);
        setName("");
        onFinish();
    };
    return (
        <div className="bg-white p-6 lg:p-10 rounded-2xl lg:rounded-[3rem] shadow-sm border border-slate-100 space-y-6">
            <h3 className="text-[9px] lg:text-[10px] font-black text-blue-600 uppercase tracking-widest">Nouveau : {level}</h3>
            <FormInput label={`Nom`} value={name} onChange={setName} required />
            <button onClick={handleAdd} className="w-full py-4 lg:py-5 bg-blue-600 text-white rounded-xl lg:rounded-2xl font-black uppercase text-xs">Valider</button>
        </div>
    );
};

export default BackOffice;
