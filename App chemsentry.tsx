import React, { useState, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { DashboardMetrics } from './components/DashboardMetrics';
import { FactoryMap } from './components/FactoryMap';
import { PredictiveAnalytics } from './components/PredictiveAnalytics';
import { SimulationState, LeakScenario, PlantMetrics, WeatherCondition, Sector } from './types';

// Define Sectors globally so both Map and Dashboard can access them
export const SECTORS: Sector[] = [
  { id: 'A', name: 'SECTOR A [STORAGE]', x: 50, y: 50, width: 200, height: 120 },
  { id: 'B', name: 'SECTOR B [PROCESSING]', x: 350, y: 50, width: 200, height: 120 },
  { id: 'C', name: 'SECTOR C [ADMIN]', x: 50, y: 230, width: 200, height: 120 },
  { id: 'D', name: 'SECTOR D [LOGISTICS]', x: 350, y: 230, width: 200, height: 120 },
];

const App: React.FC = () => {
  // 1. State Management
  const [simulationState, setSimulationState] = useState<SimulationState>({
    scenario: LeakScenario.NORMAL,
    weather: WeatherCondition.CLEAR,
    windSpeed: 15,
    windDirection: 90, // East
    pressure: 10,
    temperature: 25, // C
    leakSourceId: 'MAIN',
    leakRate: 75, // Default intensity
  });

  const [activeSensorCount, setActiveSensorCount] = useState(0);
  const [selectedSectorId, setSelectedSectorId] = useState<string | null>(null);

  const handleStateChange = (updates: Partial<SimulationState>) => {
    setSimulationState(prev => ({ ...prev, ...updates }));
  };

  // 2. Logic Calculations
  const calculatedMetrics: PlantMetrics = useMemo(() => {
    const { scenario, windSpeed, pressure, temperature, weather, leakRate } = simulationState;
    
    let basePPM = 0;
    if (scenario === LeakScenario.MINOR) basePPM = 30;
    if (scenario === LeakScenario.CATASTROPHIC) basePPM = 150;
    if (scenario === LeakScenario.FIRE) basePPM = 400; // Smoke + Toxic

    // Weather affects dispersion
    let dispersionFactor = 1.0;
    if (weather === WeatherCondition.RAIN || weather === WeatherCondition.STORM) {
        dispersionFactor = 0.7; // Rain suppresses gas somewhat
    } else if (weather === WeatherCondition.FOG) {
        dispersionFactor = 1.2; // Fog keeps it low and concentrated
    }

    // Intensity Multiplier based on Leak Rate (0-100%)
    const intensityMultiplier = leakRate / 50; // Normalize so 50 is roughly standard, 100 is double

    const toxicGasLevel = basePPM > 0 ? ((basePPM + (pressure * 0.5)) * dispersionFactor * intensityMultiplier) : 0 + (Math.random() * 2);

    // Thermal index calculation
    let thermalIndex = temperature;
    if (scenario === LeakScenario.FIRE) thermalIndex += ((Math.random() * 200) + 300) * (leakRate / 80);

    // Status Determination
    let status: PlantMetrics['status'] = 'SECURE';
    if (toxicGasLevel > 20 || thermalIndex > 60) status = 'WARNING';
    if (toxicGasLevel > 50 || thermalIndex > 150) status = 'CRITICAL';
    if (scenario === LeakScenario.FIRE || toxicGasLevel > 200) status = 'EVACUATE';

    const riskRadius = basePPM > 0 ? ((windSpeed * 12) + (pressure * 8)) * (leakRate / 60) : 0;
    const financialRisk = status === 'SECURE' ? 0 : (status === 'WARNING' ? 500000 : 50000000) * (leakRate / 50);

    return {
      status,
      toxicGasLevel,
      thermalIndex,
      riskRadius,
      financialRisk,
      activeSensors: activeSensorCount
    };
  }, [simulationState, activeSensorCount]);

  // 3. Generate Chart Data
  const chartData = useMemo(() => {
    const data = [];
    const now = new Date();
    const currentPPM = calculatedMetrics.toxicGasLevel;
    
    for (let i = 0; i <= 60; i += 5) {
      const time = new Date(now.getTime() + i * 60000);
      let predictedPPM = currentPPM;
      
      if (simulationState.scenario !== LeakScenario.NORMAL) {
         const growthFactor = 1 / (1 + Math.exp(-0.1 * (i - 20))); 
         predictedPPM = currentPPM * (0.5 + growthFactor);
      } else {
         predictedPPM = Math.random() * 5;
      }

      data.push({
        time: `${time.getHours()}:${time.getMinutes().toString().padStart(2, '0')}`,
        ppm: parseFloat(predictedPPM.toFixed(1))
      });
    }
    return data;
  }, [calculatedMetrics.toxicGasLevel, simulationState.scenario]);

  const selectedSector = useMemo(() => 
    SECTORS.find(s => s.id === selectedSectorId) || null
  , [selectedSectorId]);

  return (
    <div className="flex h-screen w-full bg-industrial-bg text-industrial-text overflow-hidden selection:bg-industrial-accent selection:text-white font-sans">
      
      {/* 1. LEFT PANE: GLOBAL CONTROLS */}
      <Sidebar state={simulationState} onChange={handleStateChange} />

      {/* 2. CENTER PANE: VISUALIZATION & ANALYTICS */}
      <main className="flex-1 flex flex-col min-w-0 border-r border-slate-800 relative">
        
        {/* Top: Map Viewport (Flexible Height) */}
        <div className="flex-1 relative bg-[#020617] overflow-hidden flex flex-col">
            {/* Minimal Header */}
            <div className="absolute top-0 left-0 right-0 h-10 bg-slate-950/80 z-20 flex items-center px-4 border-b border-slate-800/50 backdrop-blur-sm pointer-events-none">
               <span className="text-[10px] font-mono font-bold text-industrial-dim tracking-widest">
                  MAIN_FACILITY // LIVE_VIEW
               </span>
               <div className="flex-1"></div>
               {simulationState.leakSourceId !== 'MAIN' && (
                   <span className="text-[9px] text-red-500 font-mono animate-pulse mr-4">
                      !! SIMULATION ACTIVE: {simulationState.leakSourceId} !!
                   </span>
               )}
            </div>

            <FactoryMap 
                state={simulationState} 
                sectors={SECTORS}
                selectedSectorId={selectedSectorId}
                onSelectSector={setSelectedSectorId}
                onUpdate={handleStateChange}
                onSensorUpdate={setActiveSensorCount}
            />
        </div>

        {/* Bottom: Predictive Analytics (Fixed Height) */}
        <div className="h-56 bg-slate-950 border-t border-slate-800 z-20 flex flex-col">
           <PredictiveAnalytics data={chartData} />
        </div>
      </main>

      {/* 3. RIGHT PANE: INTELLIGENCE HUB */}
      <aside className="w-80 lg:w-96 bg-slate-900/90 backdrop-blur-sm flex flex-col z-20 shadow-2xl">
         {/* Top: System Status */}
         <div className="h-16 border-b border-slate-800 flex items-center justify-between px-5 bg-black/20">
            <div className="flex flex-col">
                <span className="font-bold text-slate-100 text-sm tracking-widest">COMMAND CENTER</span>
                <span className="text-[9px] text-slate-500 font-mono">INTEL & OPS</span>
            </div>
            <div className={`w-3 h-3 rounded-full ${calculatedMetrics.status === 'SECURE' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-red-500 shadow-[0_0_10px_#ef4444] animate-pulse'}`}></div>
         </div>

         <DashboardMetrics 
            metrics={calculatedMetrics} 
            state={simulationState}
            selectedSector={selectedSector}
            onUpdate={handleStateChange}
         />
      </aside>

    </div>
  );
};

export default App;