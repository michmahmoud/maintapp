
import React, { useState, useMemo } from 'react';
import { UserSession, UserRole, Banque, Agence, Contrat, Equipement, Utilisateur, Tournee, Mission, SousMission, FormTemplate, FormField, FormResponse, MarqueModele, Intervention, GeoRegion, SousRegion, Gouvernorat, VilleGeo, Municipalite, Marque, MachineType, MachineModel, Region } from './types';
import { MOCK_BANQUES, MOCK_AGENCES, MOCK_TOURNEES, MOCK_MISSIONS, MOCK_SUBMISSIONS, MOCK_FORM_TEMPLATES, MOCK_FORM_FIELDS, MOCK_EQUIPEMENTS, MOCK_CONTRATS } from './constants';
import Dashboard from './components/Dashboard';
import AgentView from './components/AgentView';
import BackOffice from './components/BackOffice';
import ClientPortal from './components/ClientPortal';

const CURRENT_USER: Utilisateur = {
  id: "u1",
  nom: "Zahra",
  prenom: "Amine",
  roles: [UserRole.Admin, UserRole.Coordinateur, UserRole.Technicien],
  email: "amine.zahra@expert.tn",
  telephone: "55888999",
  login: "azahra",
  regions_assignees: [],
  actif: true
};

const App: React.FC = () => {
  const [session, setSession] = useState<UserSession | null>(null);
  const [activeSpace, setActiveSpace] = useState<UserRole | 'CLIENT' | null>(null);
  
  const [banques, setBanques] = useState<Banque[]>(MOCK_BANQUES);
  const [agences, setAgences] = useState<Agence[]>(MOCK_AGENCES);
  const [contrats, setContrats] = useState<Contrat[]>(MOCK_CONTRATS);
  const [equipements, setEquipements] = useState<Equipement[]>(MOCK_EQUIPEMENTS);
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([CURRENT_USER]);
  const [marquesModeles, setMarquesModeles] = useState<MarqueModele[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [tournees, setTournees] = useState<Tournee[]>(MOCK_TOURNEES);
  const [missions, setMissions] = useState<Mission[]>(MOCK_MISSIONS);
  const [subMissions, setSubMissions] = useState<SousMission[]>(MOCK_SUBMISSIONS);
  const [formTemplates, setFormTemplates] = useState<FormTemplate[]>(MOCK_FORM_TEMPLATES);
  const [formFields] = useState<FormField[]>(MOCK_FORM_FIELDS);

  // Hiérarchie Adresses
  const [geoRegions, setGeoRegions] = useState<GeoRegion[]>([
    { region_id: 'reg1', nom: 'Grand Tunis' },
    { region_id: 'reg2', nom: 'Nord-Est' },
    { region_id: 'reg3', nom: 'Nord-Ouest' },
    { region_id: 'reg4', nom: 'Centre' },
    { region_id: 'reg5', nom: 'Sahel' },
    { region_id: 'reg6', nom: 'Sud' }
  ]);
  const [sousRegions, setSousRegions] = useState<SousRegion[]>([]);
  const [gouvernorats, setGouvernorats] = useState<Gouvernorat[]>([]);
  const [villesGeo, setVillesGeo] = useState<VilleGeo[]>([]);
  const [municipalites, setMunicipalites] = useState<Municipalite[]>([]);

  const [marques, setMarques] = useState<Marque[]>([
    { id: 'mq1', nom: 'NCR' }, { id: 'mq2', nom: 'Diebold Nixdorf' }, { id: 'mq3', nom: 'Hyosung' }, { id: 'mq4', nom: 'GRG Banking' }, { id: 'mq5', nom: 'GLORY' }, { id: 'mq6', nom: 'SARTRE' }
  ]);
  const [machineTypes, setMachineTypes] = useState<MachineType[]>([
    { id: 'mt1', nom: 'ATM (GAB)' }, { id: 'mt2', nom: 'Compteuse de billets' }, { id: 'mt3', nom: 'Coffre-fort intelligent' }, { id: 'mt4', nom: 'Borne de change' }
  ]);
  const [machineModels, setMachineModels] = useState<MachineModel[]>([
    { id: 'mod1', nom: 'SelfServ 22', photo: 'https://via.placeholder.com/150', type_id: 'mt1', marque_id: 'mq1' },
    { id: 'mod2', nom: 'SelfServ 84', photo: 'https://via.placeholder.com/150', type_id: 'mt1', marque_id: 'mq1' },
    { id: 'mod3', nom: 'DN Series 200', photo: 'https://via.placeholder.com/150', type_id: 'mt1', marque_id: 'mq2' },
    { id: 'mod4', nom: 'Monimax 5600', photo: 'https://via.placeholder.com/150', type_id: 'mt1', marque_id: 'mq3' },
    { id: 'mod5', nom: 'GFS-220', photo: 'https://via.placeholder.com/150', type_id: 'mt2', marque_id: 'mq5' },
    { id: 'mod6', nom: 'Safe 500', photo: 'https://via.placeholder.com/150', type_id: 'mt3', marque_id: 'mq6' }
  ]);

  const availableRoles = useMemo(() => {
    if (!session) return [];
    if (session.role === 'CLIENT') return ['CLIENT'];
    return CURRENT_USER.roles;
  }, [session]);

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">BankMaint <span className="text-blue-500">AI</span></h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Système Intégré de Gestion de Maintenance</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <LoginCard title="Admin" icon="fa-shield-halved" desc="Référentiel & Systèmes" color="bg-rose-500" onClick={() => { setSession({role: UserRole.Admin, userId: "u1"}); setActiveSpace(UserRole.Admin); }} />
            <LoginCard title="Coordinateur" icon="fa-diagram-project" desc="Tournées & Rapports" color="bg-blue-500" onClick={() => { setSession({role: UserRole.Coordinateur, userId: "u1"}); setActiveSpace(UserRole.Coordinateur); }} />
            <LoginCard title="Technicien" icon="fa-screwdriver-wrench" desc="Interventions Terrain" color="bg-amber-500" onClick={() => { setSession({role: UserRole.Technicien, userId: "u1"}); setActiveSpace(UserRole.Technicien); }} />
            <LoginCard title="Espace Client" icon="fa-building-columns" desc="Reporting Externe" color="bg-emerald-500" onClick={() => { setSession({role: "CLIENT", bankId: "b1"}); setActiveSpace("CLIENT"); }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="bg-white border-b border-slate-100 px-6 h-16 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white text-xs font-black">BM</div>
          {availableRoles.length > 1 && (
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {availableRoles.map(role => (
                <button key={role} onClick={() => setActiveSpace(role as any)} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${activeSpace === role ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                  {role}
                </button>
              ))}
            </div>
          )}
        </div>
        <button onClick={() => setSession(null)} className="text-slate-400 hover:text-red-500 transition-colors text-sm"><i className="fas fa-power-off"></i></button>
      </nav>

      <main className="flex-1">
        {activeSpace === UserRole.Admin && (
          <div className="p-6 lg:p-10 max-w-7xl mx-auto">
            <BackOffice 
              data={{ 
                banques, agences, contrats, equipements, utilisateurs, interventions, formTemplates, marquesModeles,
                geoRegions, sousRegions, gouvernorats, villesGeo, municipalites, marques, machineTypes, machineModels
              }}
              setters={{ 
                setBanques, setAgences, setContrats, setEquipements, 
                setUtilisateurs: (u: any) => { if(typeof u === 'function') setUtilisateurs(u); else setUtilisateurs(u); }, 
                setInterventions: ()=>{}, setFormTemplates, setMarquesModeles,
                setGeoRegions, setSousRegions, setGouvernorats, setVillesGeo, setMunicipalites,
                setMarques, setMachineTypes, setMachineModels
              }}
            />
          </div>
        )}
        {activeSpace === UserRole.Coordinateur && <Dashboard data={{ agences, contrats, utilisateurs, tournees, equipements, banques, missions }} />}
        {activeSpace === UserRole.Technicien && <AgentView userId={session.userId!} data={{ tournees, missions, subMissions, agences, equipements, formTemplates, formFields, banques }} onUpdateSubMission={()=>{}} onUpdateMissionStatus={()=>{}} />}
        {activeSpace === 'CLIENT' && <ClientPortal bankId={session.bankId!} data={{ banques, agences, equipements, interventions, utilisateurs }} />}
      </main>
    </div>
  );
};

const LoginCard = ({ title, icon, desc, color, onClick }: any) => (
  <button onClick={onClick} className="bg-white p-8 rounded-[2.5rem] shadow-xl text-left hover:scale-105 transition-all group border border-white/10">
    <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center text-white text-2xl mb-6 shadow-lg group-hover:rotate-12 transition-transform`}><i className={`fas ${icon}`}></i></div>
    <h3 className="text-xl font-black text-slate-900 mb-1">{title}</h3>
    <p className="text-slate-400 text-xs font-medium">{desc}</p>
  </button>
);

export default App;
