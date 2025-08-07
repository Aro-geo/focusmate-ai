/* eslint-disable */
// This file contains chart components that require inline styles for dynamic sizing
// The ESLint rules are disabled for this file specifically

import React from 'react';

// Bar chart component with dynamic height
export const FocusTimeBarChart: React.FC<{
  data: Array<{
    date: string;
    focusMinutes: number;
    sessions: number;
    completedTasks: number;
    mood: string;
  }>;
  formatMinutes: (minutes: number) => string;
}> = ({ data, formatMinutes }) => {
  const maxFocusMinutes = Math.max(...data.map(day => day.focusMinutes));
  
  return (
    <div className="h-64 relative">
      <div className="flex items-end justify-between h-48 relative">
        {data.map((day, index) => (
          <div key={index} className="flex flex-col items-center w-full">
            <div className="relative w-full flex justify-center">
              <div className="h-full w-12 flex items-end">
                <div 
                  className="w-full bg-indigo-500 rounded-t-md hover:bg-indigo-600 transition"
                  style={{ height: `${(day.focusMinutes / maxFocusMinutes) * 100}%` }}
                >
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition">
                    {formatMinutes(day.focusMinutes)}
                  </div>
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-600 mt-2">{day.date}</div>
          </div>
        ))}
      </div>
      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 h-48 flex flex-col justify-between">
        <span className="text-xs text-gray-400">{formatMinutes(maxFocusMinutes)}</span>
        <span className="text-xs text-gray-400">{formatMinutes(maxFocusMinutes/2)}</span>
        <span className="text-xs text-gray-400">0m</span>
      </div>
    </div>
  );
};

// Task distribution chart component
export const TaskDistributionChart: React.FC<{
  data: Array<{
    name: string;
    totalMinutes: number;
    percentage: number;
  }>;
}> = ({ data }) => {
  return (
    <div className="space-y-4">
      {data.map((category, index) => (
        <div key={index}>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-700">{category.name}</span>
            <span className="text-gray-500">{category.percentage}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full ${
                index === 0 ? 'bg-indigo-600' : 
                index === 1 ? 'bg-emerald-600' : 
                index === 2 ? 'bg-purple-600' : 
                index === 3 ? 'bg-amber-600' : 'bg-slate-400'
              }`}
              style={{ width: `${category.percentage}%` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
};
