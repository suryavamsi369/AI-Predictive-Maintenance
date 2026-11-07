import {
  Machine,
  MachineCreate,
  MachineDetail,
  MachineSensorData,
  ModelInfo,
  PredictionRecord,
  PredictionResponse,
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.detail || JSON.stringify(errorJson);
    } catch {
      // Use statusText if json parsing fails
    }
    throw new Error(errorDetail || `HTTP Error ${response.status}`);
  }
  return response.json();
}

export const api = {
  async getHealth(): Promise<{ status: string }> {
    const res = await fetch(`${API_BASE}/health`);
    return handleResponse<{ status: string }>(res);
  },

  async getModelInfo(): Promise<ModelInfo> {
    const res = await fetch(`${API_BASE}/model-info`);
    return handleResponse<ModelInfo>(res);
  },

  async getMachines(statusFilter?: string): Promise<Machine[]> {
    const query = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : '';
    const res = await fetch(`${API_BASE}/machines${query}`);
    return handleResponse<Machine[]>(res);
  },

  async getMachineDetails(machineId: string): Promise<MachineDetail> {
    const res = await fetch(`${API_BASE}/machines/${encodeURIComponent(machineId)}`);
    return handleResponse<MachineDetail>(res);
  },

  async registerMachine(data: MachineCreate): Promise<Machine> {
    const res = await fetch(`${API_BASE}/machines`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Machine>(res);
  },

  async getPredictions(machineId?: string, limit = 100): Promise<PredictionRecord[]> {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (machineId) {
      params.append('machine_id', machineId);
    }
    const res = await fetch(`${API_BASE}/predictions?${params.toString()}`);
    return handleResponse<PredictionRecord[]>(res);
  },

  async getMachinePredictions(machineId: string, limit = 50): Promise<PredictionRecord[]> {
    const res = await fetch(
      `${API_BASE}/predictions/${encodeURIComponent(machineId)}?limit=${limit}`
    );
    return handleResponse<PredictionRecord[]>(res);
  },

  async runPrediction(telemetry: MachineSensorData): Promise<PredictionResponse> {
    const res = await fetch(`${API_BASE}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(telemetry),
    });
    return handleResponse<PredictionResponse>(res);
  },
};

