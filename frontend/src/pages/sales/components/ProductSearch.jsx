import React, { useState, useEffect } from 'react';
import apiClient from '../../../utils/api';

const ProductSearch = ({ onProductSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchProducts();
    } else {
      setProducts([]);
      setShowResults(false);
    }
  }, [searchQuery]);

  const searchProducts = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getProducts({
        search: searchQuery,
        status: 'active',
        limit: 10
      });
      setProducts(response.products || []);
      setShowResults(true);
    } catch (error) {
      console.error('Error searching products:', error);
      // Use mock data for demo
      const mockProducts = [
        {
          id: 1,
          name: 'iPhone 15 Pro',
          selling_price: 999.99,
          stock_quantity: 10,
          barcode: '123456789',
          is_active: true
        },
        {
          id: 2,
          name: 'Samsung Galaxy S24',
          selling_price: 899.99,
          stock_quantity: 8,
          barcode: '987654321',
          is_active: true
        }
      ];
      setProducts(mockProducts);
      setShowResults(true);
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = (product) => {
    onProductSelect(product);
    setSearchQuery('');
    setShowResults(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Product Search</h3>
      
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search products by name..."
          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {showResults && (
        <div className="mt-4 max-h-64 overflow-y-auto border border-gray-200 rounded-md">
          {products.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No products found</div>
          ) : (
            products.map((product) => (
              <div
                key={product.id}
                onClick={() => handleProductSelect(product)}
                className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{product.name}</div>
                  <div className="text-sm text-gray-500 space-x-4">
                    <span className="font-medium text-green-600">
                      ${parseFloat(product.selling_price).toFixed(2)}
                    </span>
                    <span>Stock: {product.stock_quantity}</span>
                    {product.barcode && (
                      <span className="text-gray-400">#{product.barcode}</span>
                    )}
                  </div>
                </div>
                <button className="ml-3 w-8 h-8 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors flex items-center justify-center">
                  +
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ProductSearch;