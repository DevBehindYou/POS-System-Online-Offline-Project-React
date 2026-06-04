import React from 'react';

const DashboardStats = ({ today, month, products, customers }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const stats = [
    {
      title: "Today's Sales",
      value: today?.sales_count || 0,
      subtitle: formatCurrency(today?.revenue || 0),
      icon: '📊',
      bgColor: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgLight: 'bg-blue-50'
    },
    {
      title: "This Month",
      value: month?.sales_count || 0,
      subtitle: formatCurrency(month?.revenue || 0),
      icon: '📈',
      bgColor: 'bg-green-500',
      textColor: 'text-green-600',
      bgLight: 'bg-green-50'
    },
    {
      title: 'Active Products',
      value: products?.active || 0,
      subtitle: `${products?.total || 0} total`,
      icon: '📦',
      bgColor: 'bg-purple-500',
      textColor: 'text-purple-600',
      bgLight: 'bg-purple-50'
    },
    {
      title: 'Total Customers',
      value: customers?.total || 0,
      subtitle: 'Registered customers',
      icon: '👥',
      bgColor: 'bg-orange-500',
      textColor: 'text-orange-600',
      bgLight: 'bg-orange-50'
    },
    {
      title: 'Low Stock Items',
      value: products?.low_stock || 0,
      subtitle: (products?.low_stock || 0) > 0 ? 'Need attention' : 'All good',
      icon: '⚠️',
      bgColor: (products?.low_stock || 0) > 0 ? 'bg-red-500' : 'bg-gray-500',
      textColor: (products?.low_stock || 0) > 0 ? 'text-red-600' : 'text-gray-600',
      bgLight: (products?.low_stock || 0) > 0 ? 'bg-red-50' : 'bg-gray-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {stats.map((stat, index) => (
        <div key={index} className={`${stat.bgLight} rounded-lg p-6 border border-gray-200`}>
          <div className="flex items-center">
            <div className={`${stat.bgColor} text-white p-3 rounded-lg text-2xl`}>
              {stat.icon}
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.subtitle}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;