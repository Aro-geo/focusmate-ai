import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import './AdvancedChart.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface ChartProps {
  type: 'line' | 'bar' | 'doughnut';
  data: any;
  options?: any;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const AdvancedChart: React.FC<ChartProps> = ({ 
  type, 
  data, 
  options = {}, 
  size = 'md',
  className = "" 
}) => {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            family: 'Inter'
          }
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#6366f1',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        padding: 12,
      },
    },
    scales: type !== 'doughnut' ? {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
            family: 'Inter'
          },
          color: '#6b7280'
        }
      },
      y: {
        grid: {
          color: '#f3f4f6',
          borderDash: [5, 5],
        },
        ticks: {
          font: {
            size: 11,
            family: 'Inter'
          },
          color: '#6b7280'
        }
      },
    } : {},
    ...options,
  };

  const renderChart = () => {
    switch (type) {
      case 'line':
        return <Line data={data} options={defaultOptions} />;
      case 'bar':
        return <Bar data={data} options={defaultOptions} />;
      case 'doughnut':
        return <Doughnut data={data} options={defaultOptions} />;
      default:
        return <Line data={data} options={defaultOptions} />;
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <div className={`chart-container-${size}`}>
        {renderChart()}
      </div>
    </div>
  );
};

// Predefined chart configurations
export const createProductivityChartData = (data: number[], labels: string[]) => ({
  labels,
  datasets: [
    {
      label: 'Productivity Score',
      data,
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      borderWidth: 3,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#6366f1',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointRadius: 6,
      pointHoverRadius: 8,
    },
  ],
});

export const createPomodoroChartData = (completed: number[], focusTime: number[], labels: string[]) => ({
  labels,
  datasets: [
    {
      label: 'Sessions Completed',
      data: completed,
      backgroundColor: 'rgba(99, 102, 241, 0.8)',
      borderColor: '#6366f1',
      borderWidth: 2,
      borderRadius: 6,
      borderSkipped: false,
    },
    {
      label: 'Avg Focus Time (min)',
      data: focusTime,
      backgroundColor: 'rgba(168, 85, 247, 0.8)',
      borderColor: '#a855f7',
      borderWidth: 2,
      borderRadius: 6,
      borderSkipped: false,
    },
  ],
});

export const createMoodChartData = (moodData: { mood: string; count: number; percentage: number }[]) => ({
  labels: moodData.map(item => item.mood),
  datasets: [
    {
      data: moodData.map(item => item.percentage),
      backgroundColor: [
        '#10b981', // Energetic - green
        '#6366f1', // Productive - indigo
        '#8b5cf6', // Focused - purple
        '#f59e0b', // Neutral - amber
        '#ef4444', // Tired - red
      ],
      borderColor: '#ffffff',
      borderWidth: 3,
      hoverOffset: 10,
    },
  ],
});

export const createTasksChartData = (completed: number[], created: number[], labels: string[]) => ({
  labels,
  datasets: [
    {
      label: 'Tasks Completed',
      data: completed,
      backgroundColor: 'rgba(16, 185, 129, 0.8)',
      borderColor: '#10b981',
      borderWidth: 2,
      borderRadius: 6,
    },
    {
      label: 'Tasks Created',
      data: created,
      backgroundColor: 'rgba(99, 102, 241, 0.8)',
      borderColor: '#6366f1',
      borderWidth: 2,
      borderRadius: 6,
    },
  ],
});

export default AdvancedChart;
