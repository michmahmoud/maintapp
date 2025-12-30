
export enum Region {
  GrandTunis = "Grand Tunis",
  NordEst = "Nord-Est",
  NordOuest = "Nord-Ouest",
  Centre = "Centre",
  Sahel = "Sahel",
  Sud = "Sud"
}

export enum UserRole {
  Admin = "ADMIN",
  Coordinateur = "COORDINATEUR",
  Technicien = "TECHNICIEN"
}

export enum InterventionStatus {
  Programmee = "Programmée",
  EnCours = "En Cours",
  Terminee = "Terminée",
  Annulee = "Annulée"
}

export enum Frequence {
  Trimestrielle = "Trimestrielle",
  Semestrielle = "Semestrielle",
  Annuelle = "Annuelle"
}

export interface BankContact {
  nom: string;
  poste: string;
  email: string;
  telephones: string[];
}

export interface AgencyContact {
  nom: string;
  poste: string;
  telephone: string;
  email?: string;
}

export interface Marque {
  id: string;
  nom: string;
}

export interface MachineType {
  id: string;
  nom: string;
}

export interface MachineModel {
  id: string;
  nom: string;
  photo: string;
  type_id: string;
  marque_id: string;
}

export interface MarqueModele {
  id: string;
  marque: string;
  modeles: string[];
  photo: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
}

export interface Utilisateur {
  id: string;
  nom: string;
  prenom: string;
  roles: UserRole[];
  email: string;
  telephone: string;
  login: string;
  mot_de_passe?: string;
  regions_assignees: Region[];
  actif: boolean;
}

export interface Banque {
  id: string;
  nom: string;
  adresseSiege: string;
  email_responsable: string;
  tel_responsable: string;
  logo?: string;
  infos: {
    adresseSiege: string;
    logo: string;
    contacts: BankContact[];
  };
}

export interface Agence {
  id: string;
  agenceid: string;
  banque_id: string;
  nom_agence: string;
  adresse: string;
  maps_url?: string;
  region: Region;
  ville?: string;
  municipalite?: string;
  code_agence: string;
  contacts: AgencyContact[];
  nom_responsable?: string;
  tel_responsable?: string;
  mail_responsable?: string;
  latitude?: number;
  longitude?: number;
}

export interface Contrat {
  id: string;
  banque_id: string;
  numero_contrat: string;
  date_debut: string;
  date_fin: string;
  frequence: Frequence | string;
  statut: string;
  penalite_retard_jour: number;
  sla_conditions: string;
  equipements_ids?: string[];
}

export interface Equipement {
  id: string;
  numero_serie: string;
  type: string;
  marque_modele: string;
  marque_id: string;
  modele_id: string;
  agence_id: string;
  banque_id: string;
  contrat_id: string;
  date_installation: string;
  date_derniere_intervention?: string;
  statut: string;
  equipementid: string;
  type_id: string;
  agenceid: string;
  contratid: string;
}

export interface Intervention {
  id: string;
  type: string;
  statut: InterventionStatus | string;
  agence_id: string;
  technicien_id: string;
  equipement_id: string;
  date_prevue: string;
  date_reelle?: string;
  date_limite: string;
  montant_penalite?: number;
  rapport?: string;
}

export interface Tournee {
  id: string;
  tournee_id: string;
  code_tournee: string;
  nom: string;
  description: string;
  date_debut: string;
  date_limite: string;
  statut: string;
  created_by: string;
  created_at: string;
}

export interface Mission {
  mission_id: string;
  tournee_id: string;
  agenceid: string;
  technicien_id: string;
  ordre_passage: number;
  statut: 'a_faire' | 'en_cours' | 'terminee';
  started_at?: string;
  completed_at?: string;
}

export interface SousMission {
  sub_mission_id: string;
  mission_id: string;
  equipementid: string;
  type_id: string;
  statut: 'a_faire' | 'en_cours' | 'valide';
  fonctionnalite: 'fonctionnel' | 'non_fonctionnel';
}

export interface FormTemplate {
  id: string;
  typeEquipement: string;
  nom_template: string;
  version: string;
  actif: boolean;
  fields?: FormField[];
  template_id: string;
  type_id: string;
}

export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'checkbox' | 'photo';
  field_type: 'texte' | 'checkbox' | 'image';
  required: boolean;
  obligatoire: boolean;
  ordre: number;
  template_id?: string;
}

export interface FormResponse {
  response_id: string;
  sub_mission_id: string;
  field_id: string;
  valeur: string;
  created_at: string;
}

export interface UserSession {
  role: UserRole | "CLIENT";
  userId?: string;
  bankId?: string;
}

// Hiérarchie d'adresses étendue (5 niveaux)
export interface GeoRegion {
  region_id: string;
  nom: string;
}

export interface SousRegion {
  sous_region_id: string;
  region_id: string;
  nom: string;
}

export interface Gouvernorat {
  gouvernorat_id: string;
  sous_region_id: string;
  nom: string;
}

export interface VilleGeo {
  ville_id: string;
  gouvernorat_id: string;
  nom: string;
}

export interface Municipalite {
  municipalite_id: string;
  ville_id: string;
  nom: string;
}
