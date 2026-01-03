
import { Banque, Agence, Region, Tournee, Mission, SousMission, FormTemplate, FormField, Contrat, Equipement, AuditLog, Frequence, InterventionStatus, GeoRegion, SousRegion, Gouvernorat, VilleGeo } from './types';

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

// RÉFÉRENTIEL GÉOGRAPHIQUE RÉEL TUNISIE
export const REAL_GEO_REGIONS: GeoRegion[] = [
  { region_id: 'reg-gt', nom: 'Grand Tunis' },
  { region_id: 'reg-ne', nom: 'Nord-Est' },
  { region_id: 'reg-no', nom: 'Nord-Ouest' },
  { region_id: 'reg-sa', nom: 'Sahel' },
  { region_id: 'reg-ce', nom: 'Centre' },
  { region_id: 'reg-su', nom: 'Sud' }
];

export const REAL_SOUS_REGIONS: SousRegion[] = [
  { sous_region_id: 'sr-gt', region_id: 'reg-gt', nom: 'Zone Tunis' },
  { sous_region_id: 'sr-ne', region_id: 'reg-ne', nom: 'Zone Cap Bon' },
  { sous_region_id: 'sr-no', region_id: 'reg-no', nom: 'Zone Montagne' },
  { sous_region_id: 'sr-sa', region_id: 'reg-sa', nom: 'Zone Littoral' },
  { sous_region_id: 'sr-ce', region_id: 'reg-ce', nom: 'Zone Steppe' },
  { sous_region_id: 'sr-su', region_id: 'reg-su', nom: 'Zone Désert' }
];

export const REAL_GOUVERNORATS: Gouvernorat[] = [
  { gouvernorat_id: 'gv-tunis', sous_region_id: 'sr-gt', nom: 'Tunis' },
  { gouvernorat_id: 'gv-ariana', sous_region_id: 'sr-gt', nom: 'Ariana' },
  { gouvernorat_id: 'gv-ben-arous', sous_region_id: 'sr-gt', nom: 'Ben Arous' },
  { gouvernorat_id: 'gv-manouba', sous_region_id: 'sr-gt', nom: 'Manouba' },
  { gouvernorat_id: 'gv-nabeul', sous_region_id: 'sr-ne', nom: 'Nabeul' },
  { gouvernorat_id: 'gv-bizerte', sous_region_id: 'sr-ne', nom: 'Bizerte' },
  { gouvernorat_id: 'gv-beja', sous_region_id: 'sr-no', nom: 'Béja' },
  { gouvernorat_id: 'gv-jendouba', sous_region_id: 'sr-no', nom: 'Jendouba' },
  { gouvernorat_id: 'gv-sousse', sous_region_id: 'sr-sa', nom: 'Sousse' },
  { gouvernorat_id: 'gv-monastir', sous_region_id: 'sr-sa', nom: 'Monastir' },
  { gouvernorat_id: 'gv-mahdia', sous_region_id: 'sr-sa', nom: 'Mahdia' },
  { gouvernorat_id: 'gv-sfax', sous_region_id: 'sr-su', nom: 'Sfax' },
  { gouvernorat_id: 'gv-gabes', sous_region_id: 'sr-su', nom: 'Gabès' },
  { gouvernorat_id: 'gv-gafsa', sous_region_id: 'sr-su', nom: 'Gafsa' }
];

export const REAL_VILLES: VilleGeo[] = [
  { ville_id: 'v-tunis-medina', gouvernorat_id: 'gv-tunis', nom: 'Tunis Médina' },
  { ville_id: 'v-marsa', gouvernorat_id: 'gv-tunis', nom: 'La Marsa' },
  { ville_id: 'v-goulette', gouvernorat_id: 'gv-tunis', nom: 'La Goulette' },
  { ville_id: 'v-lac', gouvernorat_id: 'gv-tunis', nom: 'Les Berges du Lac' },
  { ville_id: 'v-ariana-v', gouvernorat_id: 'gv-ariana', nom: 'Ariana Ville' },
  { ville_id: 'v-mnihla', gouvernorat_id: 'gv-ariana', nom: 'Mnihla' },
  { ville_id: 'v-e-zahra', gouvernorat_id: 'gv-ben-arous', nom: 'Ezzahra' },
  { ville_id: 'v-hammamet', gouvernorat_id: 'gv-nabeul', nom: 'Hammamet' },
  { ville_id: 'v-nabeul-v', gouvernorat_id: 'gv-nabeul', nom: 'Nabeul Ville' },
  { ville_id: 'v-bizerte-v', gouvernorat_id: 'gv-bizerte', nom: 'Bizerte Ville' },
  { ville_id: 'v-sousse-v', gouvernorat_id: 'gv-sousse', nom: 'Sousse Ville' },
  { ville_id: 'v-kantaoui', gouvernorat_id: 'gv-sousse', nom: 'Port El Kantaoui' },
  { ville_id: 'v-monastir-v', gouvernorat_id: 'gv-monastir', nom: 'Monastir Ville' },
  { ville_id: 'v-sfax-v', gouvernorat_id: 'gv-sfax', nom: 'Sfax Ville' }
];

const generateAgencies = (): Agence[] => {
  const ags: Agence[] = [];
  MOCK_BANQUES.forEach((bank, bIdx) => {
    for (let i = 0; i < 10; i++) {
      const cityRef = REAL_VILLES[(bIdx * 5 + i) % REAL_VILLES.length];
      const gouvRef = REAL_GOUVERNORATS.find(g => g.gouvernorat_id === cityRef.gouvernorat_id);
      const srRef = REAL_SOUS_REGIONS.find(sr => sr.sous_region_id === gouvRef?.sous_region_id);
      const regRef = REAL_GEO_REGIONS.find(r => r.region_id === srRef?.region_id);
      
      const id = `ag-${bank.id}-${i + 1}`;
      ags.push({
        id,
        agenceid: id,
        banque_id: bank.id,
        // Fix: Removed reference to cityRef.name which does not exist on VilleGeo, used cityRef.nom instead.
        nom_agence: `${bank.nom} Agence ${cityRef.nom}`,
        adresse: `Boulevard de l'Indépendance, ${cityRef.nom}`,
        region: (regRef?.nom as Region) || Region.GrandTunis,
        ville: cityRef.nom,
        code_agence: `AG${bank.id.toUpperCase()}${(i+1).toString().padStart(3, '0')}`,
        contacts: [],
        nom_responsable: `Responsable ${cityRef.nom}`,
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
  { id: "l1", timestamp: new Date().toISOString(), action: "Initialisation", details: "Système chargé avec le référentiel réel de la Tunisie." }
];
