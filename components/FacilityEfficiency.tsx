import React, { useEffect, useState } from 'react';
import { Factory, TrendingUp, TrendingDown, RefreshCw, AlertTriangle, Target, PackageIcon } from 'lucide-react';

interface FacilityEfficiencyProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface ProductionInfo {
  efficiency: number;
  theoretical_production_per_minute: number;
  actual_production_per_minute: number;
  bottlenecks: string[];
  target_item: string;
}

interface MaterialInfo {
  name: string;
  label: string;
  efficiency: number;
  status: string;
  theoretical_rate: number;
  actual_rate: number;
  supply_ratio: number;
  limiting_ingredient: string | null;
  produced: number;
  consumed: number;
  shortage: number;
  utilization: number;
  loading: boolean;
}

/**
 * 설비 효율성 표시 컴포넌트
 */
export const FacilityEfficiency: React.FC<FacilityEfficiencyProps> = ({
  autoRefresh = true,
  refreshInterval = 30000 // 30초
}) => {
  const [materials, setMaterials] = useState<MaterialInfo[]>([]);
  const [production, setProduction] = useState<ProductionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchFacilities = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/facilities', { cache: 'no-store' });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setMaterials(data.materials || []);
        setProduction(data.production);
        setLastUpdate(new Date());
        setError(null);
      } else {
        throw new Error(data.error || 'Failed to fetch production data');
      }
    } catch (err) {
      console.error('[FacilityEfficiency] Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();

    if (autoRefresh) {
      const interval = setInterval(fetchFacilities, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const getEfficiencyColor = (efficiency?: number) => {
    if (!efficiency) return 'text-slate-400';
    if (efficiency >= 80) return 'text-green-400';
    if (efficiency >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getEfficiencyBg = (efficiency?: number) => {
    if (!efficiency) return 'bg-slate-500';
    if (efficiency >= 80) return 'bg-green-500';
    if (efficiency >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Factory className="text-blue-400" size={24} />
          <h2 className="text-xl font-bold text-slate-100">Production Analysis</h2>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdate && (
            <span className="text-xs text-slate-400">
              Updated: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchFacilities}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`text-slate-300 ${loading ? 'animate-spin' : ''}`} size={18} />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/40 rounded-lg text-red-400 text-sm">
          Error: {error}
        </div>
      )}

      {/* 전체 생산 효율성 */}
      {production && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
            <div className="flex items-center gap-2 mb-2">
              <Target className="text-blue-400" size={18} />
              <span className="text-sm text-slate-400">Production Operating Rate</span>
            </div>
            <div className={`text-3xl font-bold ${getEfficiencyColor(production.efficiency)}`}>
              {production.efficiency.toFixed(1)}%
            </div>
          </div>

          <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
            <div className="text-sm text-slate-400 mb-2">Car Production Rate</div>
            <div className="text-2xl font-bold text-white">
              {production.actual_production_per_minute.toFixed(2)}
            </div>
            <div className="text-xs text-slate-500">
              cars/min (max: {production.theoretical_production_per_minute.toFixed(2)})
            </div>
          </div>

          <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="text-amber-400" size={18} />
              <span className="text-sm text-slate-400">Bottlenecks</span>
            </div>
            {production.bottlenecks && production.bottlenecks.length > 0 ? (
              <div className="space-y-1">
                {production.bottlenecks.map((item: string, idx: number) => (
                  <div key={idx} className="text-sm text-amber-400">
                    • {item}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-green-400">None</div>
            )}
          </div>
        </div>
      )}

      {loading && materials.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <RefreshCw className="animate-spin mx-auto mb-2" size={32} />
          Loading production data...
        </div>
      ) : materials.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <PackageIcon className="mx-auto mb-2" size={32} />
          No production data available
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {materials.map((material) => (
            <div
              key={material.name}
              className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 hover:border-slate-500 transition"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <PackageIcon className="text-blue-400" size={16} />
                    <h3 className="text-sm font-semibold text-slate-200">
                      {material.label}
                    </h3>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Production:</span>
                      <span className="text-green-400 font-mono font-bold">
                        {material.produced.toFixed(2)}/s
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Consumption:</span>
                      <span className="text-blue-400 font-mono font-bold">
                        {material.consumed.toFixed(2)}/s
                      </span>
                    </div>
                    {material.shortage > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Shortage:</span>
                        <span className="text-red-400 font-mono font-bold">
                          -{material.shortage.toFixed(2)}/s
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-right ml-3">
                  {material.efficiency >= 80 ? (
                    <TrendingUp className="text-green-400 mb-1" size={20} />
                  ) : material.efficiency >= 60 ? (
                    <TrendingUp className="text-yellow-400 mb-1" size={20} />
                  ) : (
                    <TrendingDown className="text-red-400 mb-1" size={20} />
                  )}
                </div>
              </div>

              {material.shortage > 0 ? (
                <div className="bg-red-500/10 border border-red-500/30 rounded p-2">
                  <div className="text-xs text-red-400 font-bold mb-1">
                    ⚠️ Production Bottleneck
                  </div>
                  <div className="text-xs text-slate-300">
                    Current utilization: <span className="text-red-400 font-bold">{material.utilization.toFixed(1)}%</span>
                  </div>
                  <div className="text-xs text-slate-300 mt-1">
                    Need {((material.shortage / material.produced) * 100).toFixed(0)}% more capacity
                  </div>
                </div>
              ) : (
                <div className="bg-green-500/10 border border-green-500/30 rounded p-2">
                  <div className="text-xs text-green-400 font-bold">
                    ✓ Sufficient Capacity
                  </div>
                  <div className="text-xs text-slate-300">
                    Operating at {material.efficiency.toFixed(1)}%
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


