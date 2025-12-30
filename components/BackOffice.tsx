
import React, { useState, useMemo, useRef } from 'react';
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
type EquipementSubTab = 'inventaire' | 'catalogue';

const BackOffice: React.FC<BackOfficeProps> = ({ data, setters }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('clients');
  const [addressLevel, setAddressLevel] = useState<AddressLevel>('region');
  const [equipementSubTab, setEquipementSubTab] = useState<EquipementSubTab>('inventaire');
  
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [selectedSousRegionId, setSelectedSousRegionId] = useState<string | null>(null);
  const [selectedGouvernoratId, setSelectedGouvernoratId] = useState<string | null>(null);
  const [selectedVilleId, setSelectedVilleId] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [level3Id, setLevel3Id] = useState<string | null>(null);

  // Filtres
  const [filterBank, setFilterBank] = useState("All");
  const [filterVille, setFilterVille] = useState("All");
  const [filterRegion, setFilterRegion] = useState("All");
  const [filterContrat, setFilterContrat] = useState("All");
  const [filterStatut, setFilterStatut] = useState("All");
  const [filterModele, setFilterModele] = useState("All");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCloseForm = () => {
    setShowForm(false);
    setIsEditing(false);
    setSelectedId(null);
    setLevel3Id(null);
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
          const matchVille = filterVille === "All" || a.ville === filterVille;
          return matchSearch && matchBank && matchVille;
        });
      case 'adresses':
        if (addressLevel === 'region') return data.geoRegions.filter(r => r.nom?.toLowerCase().includes(q));
        if (addressLevel === 'sous-region') return data.sousRegions.filter(s => s.region_id === selectedRegionId && s.nom?.toLowerCase().includes(q));
        if (addressLevel === 'gouvernorat') return data.gouvernorats.filter(g => g.sous_region_id === selectedSousRegionId && g.nom?.toLowerCase().includes(q));
        if (addressLevel === 'ville') return data.villesGeo.filter(v => v.gouvernorat_id === selectedGouvernoratId && v.nom?.toLowerCase().includes(q));
        if (addressLevel === 'municipalite') return data.municipalites.filter(m => m.ville_id === selectedVilleId && m.nom?.toLowerCase().includes(q));
        return [];
      case 'contrats': 
        return data.contrats.filter(c => {
            const bankMatch = filterBank === "All" || c.banque_id === filterBank;
            const searchMatch = c.id.toLowerCase().includes(q) || c.numero_contrat?.toLowerCase().includes(q);
            return bankMatch && searchMatch;
        });
      case 'equipements': 
        if (equipementSubTab === 'catalogue') return data.machineModels.filter(m => m.nom.toLowerCase().includes(q));
        return data.equipements.filter(e => {
            const matchSearch = e.numero_serie?.toLowerCase().includes(q) || e.marque_modele?.toLowerCase().includes(q);
            const matchBank = filterBank === "All" || e.banque_id === filterBank;
            const matchRegion = filterRegion === "All" || data.agences.find(a => a.id === e.agence_id)?.region === filterRegion;
            const matchStatut = filterStatut === "All" || e.statut === filterStatut;
            const matchModele = filterModele === "All" || e.modele_id === filterModele;
            return matchSearch && matchBank && matchRegion && matchStatut && matchModele;
        });
      case 'templates': 
        return data.formTemplates.filter(t => t.nom_template?.toLowerCase().includes(q) || t.type_id.toLowerCase().includes(q));
      case 'utilisateurs': 
        return data.utilisateurs.filter(u => u.nom?.toLowerCase().includes(q) || u.prenom?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
      case 'logs': 
        return data.logs || [];
      default: return [];
    }
  }, [activeTab, addressLevel, equipementSubTab, data, searchQuery, filterBank, filterVille, filterRegion, filterStatut, filterModele, selectedRegionId, selectedSousRegionId, selectedGouvernoratId, selectedVilleId]);

  // --- EXCEL LOGIC ---
  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(filteredItems);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, activeTab);
    XLSX.writeFile(wb, `export_${activeTab}_bankmaint.xlsx`);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const dataImport: any[] = XLSX.utils.sheet_to_json(ws);
      
      // Merge logic : on ne remplace que si la valeur importée n'est pas vide
      if (activeTab === 'equipements') {
          setters.setEquipements(prev => prev.map(old => {
            const match = dataImport.find(i => i.numero_serie === old.numero_serie);
            if (!match) return old;
            const updated = { ...old };
            Object.keys(match).forEach(key => { if(match[key]) (updated as any)[key] = match[key]; });
            return updated;
          }));
      }
      alert(`Import terminé pour ${dataImport.length} lignes.`);
    };
    reader.readAsBinaryString(file);
  };

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
    <div className="flex flex-col lg:flex-row min-h-[90vh] bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-100">
      
      <div className="w-full lg:w-80 bg-slate-900 flex flex-col">
        <div className="p-8 border-b border-white/5">
          <h2 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Espace Admin</h2>
          <p className="text-white font-black text-xl tracking-tighter">Référentiel Central</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {sidebarItems.map(item => (
            <button 
              key={item.id}
              onClick={() => { setActiveTab(item.id); if(item.id === 'adresses') resetAddressNav(); else handleCloseForm(); }}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 translate-x-1' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}
            >
              <i className={`fas ${item.icon} w-5 text-center text-sm`}></i>
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 bg-slate-50 flex flex-col">
        <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-white">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
              <span>{sidebarItems.find(i => i.id === activeTab)?.label}</span>
              {selectedId && !isEditing && <><i className="fas fa-chevron-right text-[10px] text-slate-300"></i> <span className="text-blue-600">Détails</span></>}
              {level3Id && <><i className="fas fa-chevron-right text-[10px] text-slate-300"></i> <span className="text-emerald-600">Liste Agences/Équipements</span></>}
            </h1>
          </div>
          
          <div className="flex gap-3">
            <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".xlsx,.xls" />
            <button onClick={handleExport} className="px-5 py-3 bg-white border border-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 shadow-sm"><i className="fas fa-file-export mr-2"></i> Export</button>
            <button onClick={() => fileInputRef.current?.click()} className="px-5 py-3 bg-white border border-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 shadow-sm"><i className="fas fa-file-import mr-2"></i> Import</button>
            {!showForm && !selectedId && !isEditing && activeTab !== 'logs' && (
              <button onClick={() => setShowForm(true)} className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg"><i className="fas fa-plus mr-2"></i> Ajouter</button>
            )}
            {(showForm || selectedId || isEditing || level3Id) && (
              <button onClick={handleCloseForm} className="px-6 py-3 bg-slate-200 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-300 transition-all">Fermer</button>
            )}
          </div>
        </div>

        <div className="p-10 flex-1 overflow-y-auto custom-scrollbar">
          {(showForm || isEditing) ? (
            <div className="max-w-4xl mx-auto animate-fade-in">
                {activeTab === 'utilisateurs' && <UserForm initialData={isEditing ? selectedItem as Utilisateur : undefined} onSubmit={(u: any) => { setters.setUtilisateurs(prev => isEditing ? prev.map(old => old.id === u.id ? u : old) : [...prev, u]); handleCloseForm(); }} />}
                {activeTab === 'clients' && <ClientForm initialData={isEditing ? selectedItem as Banque : undefined} onSubmit={(b: any) => { setters.setBanques(prev => isEditing ? prev.map(old => old.id === b.id ? b : old) : [...prev, b]); handleCloseForm(); }} />}
            </div>
          ) : level3Id ? (
            <ContratLevel3 id={level3Id} data={data} />
          ) : selectedId ? (
            <div className="max-w-7xl mx-auto animate-fade-in">
              {activeTab === 'clients' && selectedItem && <ClientDetails b={selectedItem as Banque} data={data} onEdit={() => setIsEditing(true)} onLevel3={(id) => setLevel3Id(id)} />}
              {activeTab === 'agences' && selectedItem && <AgenceDetails a={selectedItem as Agence} data={data} onEdit={() => setIsEditing(true)} />}
              {activeTab === 'contrats' && selectedItem && <ContratDetails c={selectedItem as Contrat} data={data} onEdit={() => setIsEditing(true)} onLevel3={() => setLevel3Id(selectedId)} />}
              {activeTab === 'equipements' && selectedItem && <EquipementInventaireDetails e={selectedItem as Equipement} data={data} onEdit={() => setIsEditing(true)} onDelete={()=>{}} />}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 min-w-[300px]">
                  <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
                  <input type="text" placeholder="Rechercher..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-3xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm" />
                </div>
                {activeTab === 'equipements' && (
                  <button className="px-6 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 shadow-lg"><i className="fas fa-map-marked-alt mr-2"></i> Vue Maps Global</button>
                )}
                {(activeTab === 'equipements' || activeTab === 'contrats' || activeTab === 'agences') && (
                  <select value={filterBank} onChange={e => setFilterBank(e.target.value)} className="bg-white border border-slate-200 px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase outline-none shadow-sm">
                    <option value="All">Tout Client</option>
                    {data.banques.map(b => <option key={b.id} value={b.id}>{b.nom}</option>)}
                  </select>
                )}
              </div>

              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                  <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <tr>
                      {activeTab === 'equipements' ? (
                        <>
                          <th className="px-8 py-5">Modèle / Type / SN</th>
                          <th className="px-8 py-5">Affectation Géo</th>
                          <th className="px-8 py-5">Statut</th>
                        </>
                      ) : (
                        <>
                          <th className="px-8 py-5">Identifiant / Nom</th>
                          <th className="px-8 py-5">Détails</th>
                          <th className="px-8 py-5">Stats / Clés</th>
                        </>
                      )}
                      <th className="px-8 py-5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredItems.map(item => {
                      const id = (item as any).id || (item as any).template_id || (item as any).numero_serie || (item as any).region_id;
                      return (
                        <tr key={id} onClick={() => { if(activeTab === 'adresses') { /* Adresses logic */ } else { setSelectedId(id); } }} className="hover:bg-slate-50/80 transition-all cursor-pointer group">
                          {activeTab === 'equipements' ? (
                            <>
                              <td className="px-8 py-6">
                                <div className="font-black text-slate-900">{(item as Equipement).marque_modele}</div>
                                <div className="text-[10px] text-slate-400 font-bold">{(item as Equipement).type} • SN: {(item as Equipement).numero_serie}</div>
                              </td>
                              <td className="px-8 py-6">
                                <div className="text-xs font-bold text-slate-900">{data.banques.find(b => b.id === (item as Equipement).banque_id)?.nom}</div>
                                <div className="text-[9px] text-slate-400 font-black uppercase">{data.agences.find(a => a.id === (item as Equipement).agence_id)?.nom_agence} • {data.agences.find(a => a.id === (item as Equipement).agence_id)?.ville}</div>
                              </td>
                              <td className="px-8 py-6">
                                <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase ${(item as Equipement).statut === 'Actif' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{(item as Equipement).statut}</span>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-8 py-6">
                                <div className="font-black text-slate-900">{(item as any).nom || (item as any).nom_agence || (item as any).numero_contrat}</div>
                                <div className="text-[9px] font-mono font-bold text-slate-300 uppercase tracking-tighter">ID: {id}</div>
                              </td>
                              <td className="px-8 py-6">
                                {activeTab === 'clients' && <span className="text-xs font-medium text-slate-500">{(item as Banque).adresseSiege}</span>}
                                {activeTab === 'contrats' && <span className="text-[10px] font-black text-blue-600 uppercase">{data.banques.find(b => b.id === (item as Contrat).banque_id)?.nom}</span>}
                              </td>
                              <td className="px-8 py-6">
                                {activeTab === 'clients' && <span className="bg-slate-100 px-3 py-1 rounded-full text-[9px] font-black text-slate-500 uppercase">{data.contrats.filter(c => c.banque_id === (item as Banque).id).length} Contrats</span>}
                                {activeTab === 'contrats' && <span className="text-[10px] font-black text-emerald-600 uppercase">{data.agences.filter(a => a.banque_id === (item as Contrat).banque_id).length} Agences couvertes</span>}
                              </td>
                            </>
                          )}
                          <td className="px-8 py-6 text-right">
                             <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-300 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all ml-auto"><i className="fas fa-arrow-right text-xs"></i></div>
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

/* --- COMPOSANTS DE DÉTAILS MIS À JOUR --- */

const ClientDetails = ({ b, data, onEdit, onLevel3 }: { b: Banque, data: any, onEdit: () => void, onLevel3: (id: string) => void }) => {
  const contrats = data.contrats.filter((c: any) => c.banque_id === b.id);
  const agences = data.agences.filter((a: any) => a.banque_id === b.id);
  const equipements = data.equipements.filter((e: any) => e.banque_id === b.id);

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-8">
          <div className="w-24 h-24 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white text-3xl font-black uppercase shadow-xl">{b.nom.charAt(0)}</div>
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">{b.nom}</h2>
            <div className="flex gap-3 mt-2">
                <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">{contrats.length} Contrats</span>
                <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">{agences.length} Agences</span>
                <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">{equipements.length} Équipements</span>
            </div>
          </div>
        </div>
        <button onClick={onEdit} className="px-8 py-4 bg-white border border-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-widest text-blue-600 shadow-sm hover:shadow-md transition-all"><i className="fas fa-edit mr-2"></i> Modifier Client</button>
      </div>

      <div className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Contrats de maintenance actifs</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {contrats.map((c: Contrat) => (
            <div key={c.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
               <div className="flex justify-between items-start mb-6">
                  <div>
                    <h4 className="text-lg font-black text-slate-900">{c.numero_contrat}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Échéance: {c.date_fin}</p>
                  </div>
                  <button onClick={() => onLevel3(c.id)} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner"><i className="fas fa-layer-group"></i></button>
               </div>
               <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-6">
                  <div className="text-center">
                    <div className="text-xl font-black text-slate-900">{data.agences.filter((a: any) => a.banque_id === b.id).length}</div>
                    <div className="text-[8px] font-black text-slate-400 uppercase">Agences</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-black text-slate-900">{data.equipements.filter((e: any) => e.contrat_id === c.id).length}</div>
                    <div className="text-[8px] font-black text-slate-400 uppercase">Équipements</div>
                  </div>
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const AgenceDetails = ({ a, data, onEdit }: { a: Agence, data: any, onEdit: () => void }) => {
  const eqs = data.equipements.filter((e: any) => e.agence_id === a.id);
  return (
    <div className="space-y-10 animate-fade-in">
       <div className="bg-slate-900 p-10 rounded-[3rem] text-white flex justify-between items-center shadow-2xl">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">{a.nom_agence}</h2>
            <p className="text-blue-400 text-xs font-bold uppercase tracking-widest">{a.code_agence} • {a.ville} • {a.region}</p>
          </div>
          <button onClick={onEdit} className="bg-white/10 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all border border-white/10">Modifier</button>
       </div>

       <div className="space-y-6">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Inventaire des équipements ({eqs.length})</h3>
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-8 py-4">Modèle / Type</th>
                  <th className="px-8 py-4">SN / Contrat</th>
                  <th className="px-8 py-4">Mises en service</th>
                  <th className="px-8 py-4">Dernière Int.</th>
                  <th className="px-8 py-4">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {eqs.map((e: Equipement) => (
                  <tr key={e.id} className="hover:bg-slate-50/50 transition-all">
                    <td className="px-8 py-5">
                      <div className="font-black text-slate-900 text-sm">{e.marque_modele}</div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase">{e.type}</div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-xs font-mono font-bold text-blue-600">{e.numero_serie}</div>
                      <div className="text-[9px] text-slate-400 font-bold">{data.contrats.find((c:any)=>c.id === e.contrat_id)?.numero_contrat}</div>
                    </td>
                    <td className="px-8 py-5 text-xs font-bold text-slate-600">{e.date_installation}</td>
                    <td className="px-8 py-5 text-xs font-bold text-slate-400">{e.date_derniere_intervention || 'Jamais'}</td>
                    <td className="px-8 py-5">
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

const ContratDetails = ({ c, data, onEdit, onLevel3 }: { c: Contrat, data: any, onEdit: () => void, onLevel3: () => void }) => {
  const bank = data.banques.find((b: any) => b.id === c.banque_id);
  const agenceCount = data.agences.filter((a:any) => a.banque_id === c.banque_id).length;
  const eqCount = data.equipements.filter((e:any) => e.contrat_id === c.id).length;

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-8">
           <div className="w-24 h-24 bg-emerald-600 rounded-[2rem] flex items-center justify-center text-white text-3xl font-black shadow-xl uppercase"><i className="fas fa-file-contract"></i></div>
           <div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">{c.numero_contrat}</h2>
              <p className="text-emerald-600 text-xs font-bold uppercase tracking-widest">Client: {bank?.nom} • {c.statut}</p>
           </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onEdit} className="px-6 py-4 bg-white border border-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-600 shadow-sm"><i className="fas fa-edit mr-2"></i> Modifier</button>
          <button onClick={onLevel3} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-emerald-600 transition-all"><i className="fas fa-list-check mr-2"></i> Liste Équipements / Agences</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
         <StatTile label="Agences Couvertes" val={agenceCount} icon="fa-building" color="text-blue-500" />
         <StatTile label="Équipements Liés" val={eqCount} icon="fa-microchip" color="text-emerald-500" />
         <StatTile label="Début Contrat" val={c.date_debut} icon="fa-calendar-check" color="text-slate-400" />
         <StatTile label="Fin Contrat" val={c.date_fin} icon="fa-calendar-times" color="text-rose-400" />
      </div>

      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
         <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 px-4">Conditions SLA & Pénalités</h3>
         <div className="bg-slate-50 p-8 rounded-3xl text-sm font-medium text-slate-600 leading-relaxed">
            {c.sla_conditions}
            <div className="mt-6 pt-6 border-t border-slate-200 text-rose-600 font-black uppercase text-[10px]">
               Pénalité de retard : {c.penalite_retard_jour} TND / jour
            </div>
         </div>
      </div>
    </div>
  );
};

const ContratLevel3 = ({ id, data }: { id: string, data: any }) => {
  const [search, setSearch] = useState("");
  const [fStatut, setFStatut] = useState("All");
  const [fModele, setFModele] = useState("All");

  const eqs = data.equipements.filter((e: any) => e.contrat_id === id).filter((e: any) => {
     const matchS = e.numero_serie.toLowerCase().includes(search.toLowerCase()) || e.marque_modele.toLowerCase().includes(search.toLowerCase());
     const matchStat = fStatut === "All" || e.statut === fStatut;
     const matchMod = fModele === "All" || e.modele_id === fModele;
     return matchS && matchStat && matchMod;
  });

  return (
    <div className="space-y-8 animate-fade-in">
       <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
            <input type="text" placeholder="Rechercher par SN ou Modèle..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none" />
          </div>
          <select value={fStatut} onChange={e => setFStatut(e.target.value)} className="bg-white border px-4 py-4 rounded-2xl text-[10px] font-black uppercase">
            <option value="All">Tout Statut</option>
            <option value="Actif">Actif</option>
            <option value="Inactif">Inactif</option>
          </select>
       </div>

       <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
               <tr>
                 <th className="px-8 py-5">Agence (Ville/Région)</th>
                 <th className="px-8 py-5">Équipement (Type/Marque/Modèle)</th>
                 <th className="px-8 py-5">SN / Dates</th>
                 <th className="px-8 py-5">Statut</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
               {eqs.map((e: Equipement) => {
                 const ag = data.agences.find((a:any)=>a.id === e.agence_id);
                 return (
                    <tr key={e.id} className="hover:bg-slate-50 transition-all">
                       <td className="px-8 py-6">
                          <div className="font-black text-slate-900">{ag?.nom_agence}</div>
                          <div className="text-[9px] text-slate-400 font-bold uppercase">{ag?.ville} • {ag?.region}</div>
                       </td>
                       <td className="px-8 py-6">
                          <div className="font-black text-slate-900">{e.marque_modele}</div>
                          <div className="text-[9px] text-slate-400 font-bold uppercase">{e.type}</div>
                       </td>
                       <td className="px-8 py-6">
                          <div className="text-xs font-mono font-bold text-blue-600">{e.numero_serie}</div>
                          <div className="text-[8px] text-slate-400 font-black uppercase">Inst: {e.date_installation} • Last: {e.date_derniere_intervention || 'N/A'}</div>
                       </td>
                       <td className="px-8 py-6">
                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${e.statut === 'Actif' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{e.statut}</span>
                       </td>
                    </tr>
                 );
               })}
            </tbody>
          </table>
       </div>
    </div>
  );
};

const EquipementInventaireDetails = ({ e, data, onEdit, onDelete }: { e: Equipement, data: any, onEdit: () => void, onDelete: () => void }) => {
  const banque = data.banques.find((b: any) => b.id === e.banque_id);
  const agence = data.agences.find((a: any) => a.id === e.agence_id);
  const contrat = data.contrats.find((c: any) => c.id === e.contrat_id);

  return (
    <div className="space-y-12 animate-fade-in pb-10">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-8">
          <div className="w-24 h-24 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white text-3xl font-black shadow-xl"><i className="fas fa-microchip"></i></div>
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">{e.marque_modele}</h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-blue-600 font-mono text-xs font-bold uppercase tracking-widest">S/N: {e.numero_serie}</span>
              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${e.statut === 'Actif' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{e.statut}</span>
            </div>
          </div>
        </div>
        <button onClick={onEdit} className="px-8 py-4 bg-white border border-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-widest text-blue-600 shadow-sm"><i className="fas fa-edit mr-2"></i> Modifier l'unité</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
         <div className="space-y-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Section 1: Information Affectation</h3>
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
               <DetailRow label="Client" val={banque?.nom} />
               <DetailRow label="Agence" val={agence?.nom_agence} />
               <DetailRow label="Localisation" val={agence?.adresse} />
               <div className="pt-4">
                  <a href={agence?.maps_url} target="_blank" className="w-full py-4 bg-slate-50 text-blue-600 rounded-2xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 transition-all border border-slate-100">
                    <i className="fas fa-map-marked-alt text-base"></i> Voir sur Google Maps
                  </a>
               </div>
            </div>
         </div>

         <div className="space-y-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Section 2: Information Technique</h3>
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
               <DetailRow label="Marque" val={e.marque_id} />
               <DetailRow label="Type Unité" val={e.type} />
               <DetailRow label="Modèle" val={e.marque_modele} />
               <DetailRow label="Mise en service" val={e.date_installation} />
               <DetailRow label="Dernière intervention" val={e.date_derniere_intervention || 'N/A'} />
               <DetailRow label="Contrat" val={contrat?.numero_contrat} />
            </div>
         </div>
      </div>
    </div>
  );
};

const UserForm = ({ initialData, onSubmit }: { initialData?: Utilisateur, onSubmit: (u: Utilisateur) => void }) => {
  const [formData, setFormData] = useState<Utilisateur>(initialData || {
    id: `user-${Date.now()}`,
    nom: '',
    prenom: '',
    roles: [UserRole.Technicien],
    email: '',
    telephone: '',
    login: '',
    mot_de_passe: '',
    regions_assignees: [],
    actif: true
  });

  return (
    <div className="space-y-12 animate-fade-in pb-10">
      <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 space-y-8">
        <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest px-4">Configuration Utilisateur</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <FormInput label="Nom" value={formData.nom} onChange={(v:string) => setFormData({...formData, nom: v})} />
          <FormInput label="Prénom" value={formData.prenom} onChange={(v:string) => setFormData({...formData, prenom: v})} />
          <FormInput label="Login" value={formData.login} onChange={(v:string) => setFormData({...formData, login: v})} />
          <FormInput label="Mot de passe" type="password" value={formData.mot_de_passe} onChange={(v:string) => setFormData({...formData, mot_de_passe: v})} />
          
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-5">Rôles (Multi-sélection)</label>
            <div className="flex gap-2 p-4 bg-slate-50 rounded-[1.5rem]">
               {Object.values(UserRole).map(role => (
                 <button 
                  key={role} 
                  onClick={() => {
                    const roles = formData.roles.includes(role) ? formData.roles.filter(r => r !== role) : [...formData.roles, role];
                    setFormData({...formData, roles});
                  }}
                  className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${formData.roles.includes(role) ? 'bg-blue-600 text-white' : 'bg-white text-slate-400'}`}
                 >
                   {role}
                 </button>
               ))}
            </div>
          </div>
        </div>
      </div>
      <button onClick={() => onSubmit(formData)} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl">Enregistrer l'utilisateur</button>
    </div>
  );
};

const ClientForm = ({ onSubmit, initialData }: { onSubmit: (b: Banque) => void, initialData?: Banque }) => {
  const [formData, setFormData] = useState<Banque>(initialData || { id: '', nom: '', adresseSiege: '', email_responsable: '', tel_responsable: '', infos: { adresseSiege: '', logo: '', contacts: [] } });
  return (
    <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 space-y-8">
      <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest px-4">Fiche Client</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormInput label="ID / Code" value={formData.id} onChange={(v:string) => setFormData({...formData, id: v})} />
        <FormInput label="Nom de la banque" value={formData.nom} onChange={(v:string) => setFormData({...formData, nom: v})} />
        <FormInput label="Siège" value={formData.adresseSiege} onChange={(v:string) => setFormData({...formData, adresseSiege: v})} />
        <FormInput label="Email Support" value={formData.email_responsable} onChange={(v:string) => setFormData({...formData, email_responsable: v})} />
      </div>
      <button onClick={() => onSubmit(formData)} className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest">Enregistrer Client</button>
    </div>
  );
};

/* --- UI HELPERS --- */

const FormInput = ({ label, value, onChange, placeholder, type = "text" }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black uppercase text-slate-400 ml-5 tracking-widest">{label}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full px-7 py-4 bg-slate-50 border-none rounded-[1.5rem] text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 shadow-inner" />
  </div>
);

const DetailRow = ({ label, val }: any) => (
  <div className="flex justify-between items-center pb-4 border-b border-slate-50 last:border-0 last:pb-0">
     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
     <span className="text-sm font-black text-slate-900">{val || 'N/A'}</span>
  </div>
);

const StatTile = ({ label, val, icon, color = "text-blue-500" }: any) => (
  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-5">
    <div className={`w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center ${color} text-xl shadow-inner`}><i className={`fas ${icon}`}></i></div>
    <div>
      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</div>
      <div className="text-lg font-black text-slate-900">{val}</div>
    </div>
  </div>
);

export default BackOffice;
