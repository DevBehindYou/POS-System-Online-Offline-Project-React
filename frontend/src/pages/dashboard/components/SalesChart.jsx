import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const SalesChart = ({ data }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  // Mock data if none provided
  const mockData = [
    { date: '2024-01-01', total_revenue: '1200.50', sales_count: 15 },
    { date: '2024-01-02', total_revenue: '980.25', sales_count: 12 },
    { date: '2024-01-03', total_revenue: '1450.75', sales_count: 18 },
    { date: '2024-01-04', total_revenue: '1100.00', sales_count: 14 },
    { date: '2024-01-05', total_revenue: '1350.30', sales_count: 16 },
    { date: '2024-01-06', total_revenue: '1600.80', sales_count: 20 },
    { date: '2024-01-07', total_revenue: '1250.45', sales_count: 15 }
  ];

  const chartData = data && data.length > 0 ? data : mockData;

  const lineChartData = {
    labels: chartData.map(item => formatDate(item.date)),
    datasets: [
      {
        label: 'Revenue',
        data: chartData.map(item => parseFloat(item.total_revenue)),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Sales Count',
        data: chartData.map(item => item.sales_count),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        yAxisID: 'y1'
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: {
        position: 'top'
      },
      title: {
        display: true,
        text: 'Sales Trend (Last 7 Days)'
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            if (context.datasetIndex === 0) {
              return `Revenue: ${formatCurrency(context.raw)}`;
            }
            return `Sales: ${context.raw} transactions`;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Date'
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Revenue ($)'
        },
        ticks: {
          callback: function(value) {
            return formatCurrency(value);
          }
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Sales Count'
        },
        grid: {
          drawOnChartArea: false
        }
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div style={{ height: '400px' }}>
        <Line data={lineChartData} options={options} />
      </div>
    </div>
  );
};

export default SalesChart;