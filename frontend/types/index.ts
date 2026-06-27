export interface LabMarker {
  name: string;
  value: string | number;
  unit?: string;
  reference_range?: string;
  status?: "normal" | "high" | "low";
  explanation?: string;
  flag?: boolean;
}

export interface AnalysisResult {
  id: string;
  status: "pending" | "processing" | "complete" | "failed";
  risk_level: "green" | "yellow" | "red" | null;
  genlayer_tx_hash: string | null;
  consensus_output: Record<string, unknown> | null;
  created_at: string;
}

export interface TimelineEntry {
  id: string;
  metric_type: string;
  value: number;
  unit?: string;
  recorded_at: string;
  notes?: string;
}

export interface TriageResult {
  triage_level: "green" | "yellow" | "red";
  triage_summary: string;
  primary_concerns: string[];
  immediate_actions: string[];
  emergency_services: boolean;
  disclaimer: string;
}

export type RiskLevel = "green" | "yellow" | "red";
