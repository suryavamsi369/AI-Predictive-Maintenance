export interface MachineSensorData {
  machine_id: string;
  temperature: number;
  vibration: number;
  pressure: number;
  rpm: number;
  operating_hours: number;
}

export interface PredictionResponse {
  status: string;
  model_status: string;
  prediction: string | null;
  health_status?: string | null;
  failure_probability?: number | null;
  risk_level?: string | null;
  message: string;
  received_data: MachineSensorData;
}

export interface Machine {
  id: number;
  machine_id: string;
  name?: string | null;
  model_type?: string | null;
  location?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface MachineCreate {
  machine_id: string;
  name?: string;
  model_type?: string;
  location?: string;
  status?: string;
}

export interface MachineDetail extends Machine {
  total_predictions: number;
  latest_prediction?: PredictionRecord | null;
}

export interface PredictionRecord {
  id: number;
  machine_id: string;
  temperature: number;
  vibration: number;
  pressure: number;
  rpm: number;
  operating_hours: number;
  prediction: string;
  health_status?: string | null;
  failure_probability?: number | null;
  risk_level?: string | null;
  timestamp: string;
}

export interface ModelInfo {
  model_loaded: boolean;
  model_path: string;
  feature_names: string[];
  target_names: string[];
  metadata: {
    version?: string;
    algorithm?: string;
    trained_at?: string;
    metrics?: {
      accuracy?: number;
      precision?: number;
      recall?: number;
      f1_score?: number;
      roc_auc?: number;
    };
  };
}

export type ViewTab = 'overview' | 'fleet' | 'diagnostics' | 'history' | 'model';

