
import { GoogleGenAI, Type } from "@google/genai";
import { Intervention, Agence, Region } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateManagerInsights = async (
  interventions: Intervention[], 
  agences: Agence[]
) => {
  const data = interventions.map(i => {
    // Correctly access agence by id or agenceid for compatibility
    const agence = agences.find(a => a.id === i.agence_id || a.agenceid === i.agence_id);
    return {
      type: i.type,
      statut: i.statut,
      // Fix: region_id does not exist on type 'Agence'.
      region: agence?.region,
      date_limite: i.date_limite,
      penalite: i.montant_penalite || 0,
      rapport: i.rapport || "N/A"
    };
  });

  const prompt = `En tant qu'expert en gestion de maintenance bancaire en Tunisie, analyse ces données d'interventions et fournis un résumé exécutif court (3-4 phrases) soulignant les points critiques, les régions à problèmes et les recommandations pour réduire les pénalités. Voici les données: ${JSON.stringify(data)}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "L'analyse AI est temporairement indisponible.";
  }
};

export interface StructuredReportData {
  checklist: Record<string, boolean>;
  anomalie: string;
  remediation: string;
  pieces_changees: string;
  observations: string;
}

export const suggestReportContent = async (data: StructuredReportData) => {
  const checklistStr = Object.entries(data.checklist)
    .map(([key, val]) => `${key}: ${val ? 'OK' : 'Échec'}`)
    .join(', ');

  const prompt = `Rédige un rapport technique professionnel de maintenance bancaire basé sur les éléments suivants:
  - Checklist effectuée: ${checklistStr}
  - Anomalie détectée: ${data.anomalie || 'Aucune'}
  - Remédiation effectuée: ${data.remediation || 'N/A'}
  - Pièces changées: ${data.pieces_changees || 'Aucune'}
  - Notes supplémentaires: ${data.observations || 'RAS'}
  
  Le rapport doit être structuré, formel et rassurer le client bancaire sur la fiabilité de son équipement.`;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    return `Rapport de maintenance: ${checklistStr}. Pièces: ${data.pieces_changees}.`;
  }
};
