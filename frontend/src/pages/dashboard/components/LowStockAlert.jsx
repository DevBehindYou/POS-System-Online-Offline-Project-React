import React from 'react';
import { useNavigate } from 'react-router-dom';

const LowStockAlert = ({ products }) => {
  const navigate = useNavigate();

  const handleViewProduct = (productId) => {
    navigate(`/products/${productId}`);
  };

  const handleViewAllProducts = () => {
    navigate('/products?status=low_stock');
  };

  // Mock data if none provided
  const mockLowStockProducts = [
    {
      id: 1,
      name: 'iPhone 15 Pro',
      stock_quantity: 2,
      min_stock_level: 5
    },
    {
      id: 2,
      name: 'Samsung Galaxy S24',
      stock_quantity: 1,
      min_stock_level: 3
    }
  ];

  const productsData = products && products.length > 0 ? products : mockLowStockProducts;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <span className="text-yellow-500 mr-2">⚠️</span>
          Low Stock Alert
        </h3>
        {productsData.length > 0 && (
          <button 
            className="text-red-600 hover:text-red-800 text-sm font-medium"
            onClick={handleViewAllProducts}
          >
            View All →
          </button>
        )}
      </div>

      <div className="space-y-3">
        {productsData.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">✅</div>
            <p className="text-gray-500">All products are well stocked</p>
          </div>
        ) : (
          productsData.map((product) => (
            <div 
              key={product.id} 
              onClick={() => handleViewProduct(product.id)}
              className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 cursor-pointer transition-colors"
            >
              <div className="flex-1">
                <div className="font-medium text-gray-900">{product.name}</div>
                <div className="text-sm text-gray-600">
                  <span className="text-red-600 font-medium">Stock: {product.stock_quantity}</span>
                  <span className="mx-2">•</span>
                  <span>Min: {product.min_stock_level}</span>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span className="text-red-600 font-medium text-sm">Critical</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LowStockAlert;