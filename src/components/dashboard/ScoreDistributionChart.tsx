import React from 'react';

interface ScoreDistributionItem {
  range: string;
  count: number;
  fill: string;
}

interface FunnelItem {
  stage: string;
  count: number;
  color: string;
}

interface ScoreDistributionChartProps {
  distribution: ScoreDistributionItem[];
  funnel?: FunnelItem[];
}

export const ScoreDistributionChart: React.FC<ScoreDistributionChartProps> = ({
  distribution,
  funnel
}) => {
  const maxCount = Math.max(1, ...distribution.map(d => d.count));
  const totalScreened = distribution.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Score Brackets Bar Distribution */}
      <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-semibold text-slate-900">ATS Score Distribution</h3>
            <p className="text-xs text-slate-500 mt-0.5">Applicant volume grouped by ATS screening score bracket</p>
          </div>
          <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
            {totalScreened} Total Evaluated
          </span>
        </div>

        <div className="space-y-4">
          {distribution.map(item => {
            const percentage = totalScreened > 0 ? Math.round((item.count / totalScreened) * 100) : 0;
            const barWidth = Math.max(4, Math.round((item.count / maxCount) * 100));

            return (
              <div key={item.range} className="group">
                <div className="flex items-center justify-between text-xs font-medium text-slate-700 mb-1.5">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.fill }} />
                    <span className="font-semibold">{item.range}</span>
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">{percentage}%</span>
                    <span className="font-bold text-slate-900 w-8 text-right">{item.count}</span>
                  </div>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: item.fill,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hiring Pipeline Funnel */}
      {funnel && (
        <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Recruitment Funnel</h3>
                <p className="text-xs text-slate-500 mt-0.5">Progression through hiring stages</p>
              </div>
            </div>

            <div className="space-y-3">
              {funnel.map((step, idx) => {
                const total = funnel[0]?.count || 1;
                const conversion = total > 0 ? Math.round((step.count / total) * 100) : 0;

                return (
                  <div key={step.stage} className="p-3 rounded-lg border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-800 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                          {idx + 1}
                        </span>
                        {step.stage}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{step.count}</span>
                        <span className="text-[11px] text-slate-500">({conversion}%)</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-2">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(5, conversion)}%`,
                          backgroundColor: step.color
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Overall Conversion: {funnel[0]?.count ? Math.round(((funnel[funnel.length - 1]?.count || 0) / funnel[0].count) * 100) : 0}%</span>
            <span className="text-emerald-600 font-medium">Explainable ATS screening</span>
          </div>
        </div>
      )}
    </div>
  );
};
