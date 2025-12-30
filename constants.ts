
import { Banque, Agence, Region, Tournee, Mission, SousMission, FormTemplate, FormField, Contrat, Equipement, AuditLog, Frequence, InterventionStatus } from './types';

export const MOCK_BANQUES: Banque[] = [
  { 
    id: "b1", nom: "BIAT", adresseSiege: "Tunis, Avenue Habib Bourguiba", email_responsable: "it.support@biat.com.tn", tel_responsable: "71 131 000",
    infos: { adresseSiege: "Tunis Centre", logo: "https://via.placeholder.com/100?text=BIAT", contacts: [] }
  },
  { 
    id: "b2", nom: "STB Bank", adresseSiege: "Tunis, Rue Hedi Nouira", email_responsable: "maintenance@stb.com.tn", tel_responsable: "71 340 101",
    infos: { adresseSiege: "Tunis Centre", logo: "https://via.placeholder.com/100?text=STB", contacts: [] }
  },
  { 
    id: "b3", nom: "BNA Bank", adresseSiege: "Tunis, Rue de la Monnaie", email_responsable: "infrastructure@bna.com.tn", tel_responsable: "71 835 400",
    infos: { adresseSiege: "Tunis Centre", logo: "https://via.placeholder.com/100?text=BNA", contacts: [] }
  },
  { 
    id: "b4", nom: "BH Bank", adresseSiege: "Tunis, Avenue Mohamed V", email_responsable: "tech@bh.com.tn", tel_responsable: "71 126 000",
    infos: { adresseSiege: "Tunis, Lafayette", logo: "https://via.placeholder.com/100?text=BH", contacts: [] }
  }
];

const VILLES_REF = [
  { name: 'Tunis Médina', g: 'Tunis', r: Region.GrandTunis }, { name: 'La Marsa', g: 'Tunis', r: Region.GrandTunis },
  { name: 'Ariana Ville', g: 'Ariana', r: Region.GrandTunis }, { name: 'Raoued', g: 'Ariana', r: Region.GrandTunis },
  { name: 'Ben Arous Ville', g: 'Ben Arous', r: Region.GrandTunis }, { name: 'Megrine', g: 'Ben Arous', r: Region.GrandTunis },
  { name: 'Manouba Ville', g: 'Manouba', r: Region.GrandTunis },
  { name: 'Nabeul Ville', g: 'Nabeul', r: Region.NordEst }, { name: 'Hammamet', g: 'Nabeul', r: Region.NordEst },
  { name: 'Bizerte Ville', g: 'Bizerte', r: Region.NordEst }, { name: 'Ras Jebel', g: 'Bizerte', r: Region.NordEst },
  { name: 'Sousse Ville', g: 'Sousse', r: Region.Sahel }, { name: 'Hammam Sousse', g: 'Sousse', r: Region.Sahel },
  { name: 'Monastir Ville', g: 'Monastir', r: Region.Sahel }, { name: 'Sahline', g: 'Monastir', r: Region.Sahel },
  { name: 'Mahdia Ville', g: 'Mahdia', r: Region.Sahel }, { name: 'Chebba', g: 'Mahdia', r: Region.Sahel },
  { name: 'Sfax Ville', g: 'Sfax', r: Region.Sud }, { name: 'Sakiet Ezzit', g: 'Sfax', r: Region.Sud },
  { name: 'Kairouan Ville', g: 'Kairouan', r: Region.Centre }, { name: 'Sbikha', g: 'Kairouan', r: Region.Centre },
  { name: 'Gabès Ville', g: 'Gabès', r: Region.Sud }, { name: 'Metouia', g: 'Gabès', r: Region.Sud },
  { name: 'Djerba Houmt Souk', g: 'Medenine', r: Region.Sud }, { name: 'Zarzis', g: 'Medenine', r: Region.Sud },
  { name: 'Gafsa Ville', g: 'Gafsa', r: Region.Sud }, { name: 'Metlaoui', g: 'Gafsa', r: Region.Sud },
  { name: 'Béja Ville', g: 'Béja', r: Region.NordOuest }, { name: 'Medjez El Bab', g: 'Béja', r: Region.NordOuest },
  { name: 'Jendouba Ville', g: 'Jendouba', r: Region.NordOuest }, { name: 'Tabarka', g: 'Jendouba', r: Region.NordOuest },
  { name: 'Le Kef Ville', g: 'Le Kef', r: Region.NordOuest }, { name: 'Siliana Ville', g: 'Siliana', r: Region.NordOuest },
  { name: 'Zaghouan Ville', g: 'Zaghouan', r: Region.NordEst }, { name: 'Kasserine Ville', g: 'Kasserine', r: Region.Centre },
  { name: 'Sidi Bouzid Ville', g: 'Sidi Bouzid', r: Region.Centre }, { name: 'Tataouine Ville', g: 'Tataouine', r: Region.Sud },
  { name: 'Kebili Ville', g: 'Kebili', r: Region.Sud }, { name: 'Tozeur Ville', g: 'Tozeur', r: Region.Sud },
  { name: 'El Hamma', g: 'Gabès', r: Region.Sud }
];

const generateAgencies = (): Agence[] => {
  const ags: Agence[] = [];
  MOCK_BANQUES.forEach((bank, bIdx) => {
    for (let i = 0; i < 10; i++) {
      const cityRef = VILLES_REF[(bIdx * 10 + i) % VILLES_REF.length];
      const id = `ag-${bank.id}-${i + 1}`;
      ags.push({
        id,
        agenceid: id,
        banque_id: bank.id,
        nom_agence: `${bank.nom} Agence ${cityRef.name}`,
        adresse: `Boulevard de l'Indépendance, ${cityRef.name}`,
        region: cityRef.r,
        ville: cityRef.name,
        code_agence: `AG${bank.id.toUpperCase()}${(i+1).toString().padStart(3, '0')}`,
        contacts: [],
        nom_responsable: `Responsable ${cityRef.name}`,
        tel_responsable: `71 ${(Math.floor(Math.random() * 900) + 100).toString()} ${(Math.floor(Math.random() * 900) + 100).toString()}`,
        latitude: 36.0 + (Math.random() * 4 - 2),
        longitude: 9.0 + (Math.random() * 2 - 1)
      });
    }
  });
  return ags;
};

export const MOCK_AGENCES: Agence[] = generateAgencies();

export const MOCK_CONTRATS: Contrat[] = MOCK_BANQUES.flatMap(bank => [
  {
    id: `cont-${bank.id}-1`, banque_id: bank.id, numero_contrat: `MAIN-2024-${bank.id}-ATM`,
    date_debut: "2024-01-01", date_fin: "2024-12-31", frequence: "Trimestrielle", statut: "Actif",
    penalite_retard_jour: 150, sla_conditions: "Maintenance Préventive ATM"
  },
  {
    id: `cont-${bank.id}-2`, banque_id: bank.id, numero_contrat: `MAIN-2024-${bank.id}-BACK`,
    date_debut: "2024-01-01", date_fin: "2025-06-30", frequence: "Semestrielle", statut: "Actif",
    penalite_retard_jour: 100, sla_conditions: "Maintenance Compteuses & Change"
  }
]);

const generateEquipments = (): Equipement[] => {
  const eqs: Equipement[] = [];
  const models = [
    { m: "NCR SelfServ 22", tid: "ATM (GAB)", mid: "mod1", mqid: "mq1" },
    { m: "DN Series 200", tid: "ATM (GAB)", mid: "mod3", mqid: "mq2" },
    { m: "GLORY GFS-220", tid: "Compteuse de billets", mid: "mod5", mqid: "mq5" },
    { m: "Hyosung Monimax 5600", tid: "ATM (GAB)", mid: "mod4", mqid: "mq3" },
    { m: "SARTRE Safe 500", tid: "Coffre-fort intelligent", mid: "mod6", mqid: "mq6" }
  ];

  MOCK_BANQUES.forEach(bank => {
    const bankAgencies = MOCK_AGENCES.filter(a => a.banque_id === bank.id);
    const bankContracts = MOCK_CONTRATS.filter(c => c.banque_id === bank.id);
    
    for (let i = 1; i <= 20; i++) {
      const ag = bankAgencies[(i - 1) % bankAgencies.length];
      const model = models[i % models.length];
      const cont = bankContracts[i % 2 === 0 ? 0 : 1];
      const sn = `SN-${bank.id.toUpperCase()}-${i.toString().padStart(4, '0')}`;
      eqs.push({
        id: sn,
        equipementid: sn,
        numero_serie: sn,
        type: model.tid,
        type_id: model.tid,
        marque_modele: model.m,
        marque_id: model.mqid,
        modele_id: model.mid,
        agence_id: ag.id,
        agenceid: ag.id,
        banque_id: bank.id,
        contrat_id: cont.id,
        contratid: cont.id,
        date_installation: `202${Math.floor(Math.random() * 4)}-01-01`,
        date_derniere_intervention: "2024-03-15",
        statut: "Actif"
      });
    }
  });
  return eqs;
};

export const MOCK_EQUIPEMENTS: Equipement[] = generateEquipments();

export const MOCK_FORM_TEMPLATES: FormTemplate[] = [
  { id: "t1", template_id: "t1", type_id: "ATM (GAB)", typeEquipement: "ATM (GAB)", nom_template: "Maintenance Standard ATM", version: "1.0", actif: true, fields: [] },
  { id: "t2", template_id: "t2", type_id: "Compteuse de billets", typeEquipement: "Compteuse de billets", nom_template: "Révision Compteuse Glory", version: "1.1", actif: true, fields: [] },
  { id: "t3", template_id: "t3", type_id: "Coffre-fort intelligent", typeEquipement: "Coffre-fort intelligent", nom_template: "Entretien Coffre-fort", version: "1.0", actif: true, fields: [] }
];

export const MOCK_FORM_FIELDS: FormField[] = [
  { id: "f1", label: "État du clavier", field_type: "checkbox", obligatoire: true, ordre: 1, required: true, type: "checkbox", template_id: "t1" },
  { id: "f2", label: "Propreté écran", field_type: "checkbox", obligatoire: true, ordre: 2, required: true, type: "checkbox", template_id: "t1" },
  { id: "f3", label: "Photo façade", field_type: "image", obligatoire: true, ordre: 3, required: true, type: "photo", template_id: "t1" },
  { id: "f4", label: "Observations", field_type: "texte", obligatoire: false, ordre: 4, required: false, type: "text", template_id: "t1" },
  // Champs pour compteuse
  { id: "f5", label: "Nettoyage capteurs IR", field_type: "checkbox", obligatoire: true, ordre: 1, required: true, type: "checkbox", template_id: "t2" },
  { id: "f6", label: "Test rejet faux billets", field_type: "checkbox", obligatoire: true, ordre: 2, required: true, type: "checkbox", template_id: "t2" },
  // Champs pour coffre
  { id: "f7", label: "Graissage charnières", field_type: "checkbox", obligatoire: true, ordre: 1, required: true, type: "checkbox", template_id: "t3" },
  { id: "f8", label: "Contrôle serrure électronique", field_type: "checkbox", obligatoire: true, ordre: 2, required: true, type: "checkbox", template_id: "t3" }
];

export const MOCK_TOURNEES: Tournee[] = [
  { 
    id: "tour1", tournee_id: "tour1", code_tournee: "T2024-Q1", nom: "Maintenance Trimestrielle Q1",
    description: "Visite préventive trimestrielle de l'ensemble du parc ATM pour le compte de nos clients bancaires principaux.", 
    date_debut: "2024-01-01", date_limite: "2024-03-31", statut: "declenchee", created_by: "u1", created_at: "2023-12-01"
  }
];

export const MOCK_MISSIONS: Mission[] = [
  { mission_id: "m1", tournee_id: "tour1", agenceid: "ag-b1-1", technicien_id: "u1", ordre_passage: 1, statut: "a_faire" },
  { mission_id: "m2", tournee_id: "tour1", agenceid: "ag-b1-2", technicien_id: "u1", ordre_passage: 2, statut: "a_faire" },
  { mission_id: "m3", tournee_id: "tour1", agenceid: "ag-b2-1", technicien_id: "u1", ordre_passage: 3, statut: "a_faire" }
];

export const MOCK_SUBMISSIONS: SousMission[] = [
  { sub_mission_id: "sm1", mission_id: "m1", equipementid: "SN-B1-0001", type_id: "ATM (GAB)", statut: "a_faire", fonctionnalite: "fonctionnel" },
  { sub_mission_id: "sm2", mission_id: "m2", equipementid: "SN-B1-0002", type_id: "ATM (GAB)", statut: "a_faire", fonctionnalite: "fonctionnel" }
];

export const MOCK_LOGS: AuditLog[] = [
  { id: "l1", timestamp: new Date().toISOString(), action: "Initialisation", details: "Système chargé avec 4 banques, 40 agences et 80 équipements (Référentiel Tunisie)." }
];
