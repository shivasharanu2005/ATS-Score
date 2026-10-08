import React from 'react';

interface CircularScoreProps {
  score: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
}

export const CircularScore: React.FC<CircularScoreProps> = ({
  score,
  size = 'md',
  showLabel = true
}) => {
  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));
  
  // Dimensions based on size
  const config = {
    sm: { radius: 18, stroke: 3.5, sizePx: 44, fontSize: 'text-xs font-bold' },
    md: { radius: 26, stroke: 4.5, sizePx: 64, fontSize: 'text-sm font-bold' },
    lg: { radius: 38, stroke: 6, sizePx: 96, fontSize: 'text-xl font-extrabold' },
    xl: { radius: 52, stroke: 8, sizePx: 130, fontSize: 'text-3xl font-black' },
  }[size];

  const circumference = 2 * Math.PI * config.radius;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  // Color schemes: Green (>=80), Blue/Indigo (70-79), Amber (60-69), Red (<60)
  let strokeColor = '#10b981'; // green-500
  let badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let label = 'Strong Match';

  if (normalizedScore < 60) {
    strokeColor = '#ef4444'; // red-500
    badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
    label = 'Weak Match';
  } else if (normalizedScore < 70) {
    strokeColor = '#f59e0b'; // amber-500
    badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
    label = 'Moderate Match';
  } else if (normalizedScore < 85) {
    strokeColor = '#3b82f6'; // blue-500
    badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
    label = 'Good Match';
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative inline-flex items-center justify-center" style={{ width: config.sizePx, height: config.sizePx }}>
        <svg
          className="transform -rotate-90"
          width={config.sizePx}
          height={config.sizePx}
        >
          {/* Background circle */}
          <circle
            cx={config.sizePx / 2}
            cy={config.sizePx / 2}
            r={config.radius}
            stroke="#e2e8f0"
            strokeWidth={config.stroke}
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={config.sizePx / 2}
            cy={config.sizePx / 2}
            r={config.radius}
            stroke={strokeColor}
            strokeWidth={config.stroke}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`${config.fontSize} text-slate-800 tracking-tight`}>
            {normalizedScore}
          </span>
          {size === 'xl' && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 -mt-1">
              / 100
            </span>
          )}
        </div>
      </div>
      {showLabel && (
        <span className={`mt-1.5 px-2 py-0.5 text-[11px] font-medium rounded-full border ${badgeColor}`}>
          {label}
        </span>
      )}
    </div>
  );
};
