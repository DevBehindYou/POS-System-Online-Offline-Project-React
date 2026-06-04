import React from 'react';
import { useNavigate } from 'react-router-dom';

const RecentSales = ({ sales }) => {
  const navigate = useNavigate();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewSale = (saleId) => {
    navigate(`/sales/${saleId}`);
  };

  const handleViewAllSales = () => {
    navigate('/sales');
  };

  // Mock data if none provided
  const mockSales = [
    {
      id: 1,
      invoice_number: 'INV-240901-001',
      total_amount: 125.50,
      sale_date: new Date().toISOString(),
      customer_name: 'John Doe'
    },
    {
      id: 2,
      invoice_number: 'INV-240901-002',
      total_amount: 89.25,
      sale_date: new Date(Date.now() - 3600000).toISOString(),
      customer_name: null
    },
    {
      id: 3,
      invoice_number: 'INV-240901-003',
      total_amount: 245.75,
      sale_date: new Date(Date.now() - 7200000).toISOString(),
      customer_name: 'Jane Smith'
    }
  ];

  const salesData = sales && sales.length > 0 ? sales : mockSales;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Recent Sales</h3>
        <button 
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          onClick={handleViewAllSales}
        >
          View All →
        </button>
      </div>

      <div className="space-y-3">
        {salesData.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🛒</div>
            <p className="text-gray-500">No sales recorded yet today</p>
          </div>
        ) : (
          salesData.map((sale) => (
            <div 
              key={sale.id} 
              onClick={() => handleViewSale(sale.id)}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
            >
              <div className="flex-1">
                <div className="font-medium text-gray-900">#{sale.invoice_number}</div>
                <div className="text-sm text-gray-600">
                  {sale.customer_name ? (
                    <span>{sale.customer_name}</span>
                  ) : (
                    <span className="italic">Walk-in Customer</span>
                  )}
                  <span className="mx-2">•</span>
                  <span>{formatTime(sale.sale_date)}</span>
                </div>
              </div>
              <div className="font-semibold text-gray-900">
                {formatCurrency(sale.total_amount)}
              </div>
              <div className="ml-3 text-gray-400">
                →
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecentSales;