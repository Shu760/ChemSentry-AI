export enum LeakScenario {
  NORMAL = 'Normal Operations',
  MINOR = 'Minor Valve Leak',
  CATASTROPHIC = 'Catastrophic Pipe Burst',
  FIRE = 'Chemical Fire Hazard'
}

export enum WeatherCondition {
  CLEAR = 'Clear Sky',
  RAIN = 'Heavy Rain',
  FOG = 'Dense Fog',
  STORM = 'Thunderstorm'
}

export interface SimulationState {
  scenario: LeakScenario;
  weather: WeatherCondition;
  windSpeed: number; // km/h
  windDirection: number; // degrees (0-360)
  pressure: number; // bar
  temperature: number; // Celsius
  leakSourceId: string; // 'MAIN' or Sector ID ('A', 'B', 'C', 'D')
  leakRate: number; // 0-100% (Volume/Intensity)
}

export interface PlantMetrics {
  status: 'SECURE' | 'WARNING' | 'CRITICAL' | 'EVACUATE';
  toxicGasLevel: number; // PPM
  thermalIndex: number; // Heat stress
  riskRadius: number; // meters
  financialRisk: number; // INR
  activeSensors: number; // Count of sensors detecting gas
}

export interface Sensor {
  id: string;
  x: number;
  y: number;
  reading: number; // PPM
  status: 'OK' | 'WARN' | 'CRIT';
}

export interface AiRecommendation {
  text: string;
  loading: boolean;
  timestamp: string;
}

export interface Sector {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}