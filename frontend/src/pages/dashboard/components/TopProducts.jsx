import React from 'react';

const TopProducts = ({ products }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Mock data if none provided
  const mockTopProducts = [
    {
      name: 'iPhone 15 Pro Max',
      total_sold: 25,
      total_revenue: 24975.00
    },
    {
      name: 'Samsung Galaxy S24 Ultra',
      total_sold: 18,
      total_revenue: 19782.00
    },
    {
      name: 'MacBook Air M3',
      total_sold: 12,
      total_revenue: 14388.00
    },
    {
      name: 'iPad Pro 11"',
      total_sold: 15,
      total_revenue: 11985.00
    },
    {
      name: 'AirPods Pro 2',
      total_sold: 32,
      total_revenue: 7968.00
    }
  ];

  const productsData = products && products.length > 0 ? products : mockTopProducts;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Top Products This Month</h3>
      </div>

      <div className="space-y-4">
        {productsData.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📦</div>
            <p className="text-gray-500">No sales data available for this month</p>
          </div>
        ) : (
          productsData.map((product, index) => (
            <div key={index} className="flex items-center space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                #{index + 1}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">{product.name}</div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{product.total_sold} sold</span>
                  <span className="mx-2">•</span>
                  <span>{formatCurrency(product.total_revenue)}</span>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(product.total_sold / productsData[0].total_sold) * 100}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TopProducts;