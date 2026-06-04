import React from 'react';

const Cart = ({ items, onQuantityChange, onPriceChange, onRemoveItem, totals }) => {
  const formatCurrency = (amount) => {
    return `$${amount.toFixed(2)}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Shopping Cart</h3>
        <span className="text-sm text-gray-500">({items.length} items)</span>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {items.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🛒</div>
            <p className="text-gray-500 mb-2">Cart is empty</p>
            <p className="text-sm text-gray-400">
              Search for products or scan barcodes to add items
            </p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.product_id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{item.name}</div>
                  {item.barcode && (
                    <div className="text-sm text-gray-500">#{item.barcode}</div>
                  )}
                  <div className="text-xs text-gray-400">
                    Available: {item.stock_available}
                  </div>
                </div>
                <button
                  onClick={() => onRemoveItem(item.product_id)}
                  className="text-red-500 hover:text-red-700 ml-2"
                  title="Remove item"
                >
                  🗑️
                </button>
              </div>

              <div className="flex items-center space-x-3">
                {/* Quantity Control */}
                <div className="flex items-center border border-gray-300 rounded">
                  <button
                    onClick={() => onQuantityChange(item.product_id, item.quantity - 1)}
                    className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => onQuantityChange(item.product_id, parseInt(e.target.value) || 0)}
                    className="w-16 px-2 py-1 text-center border-x border-gray-300 focus:outline-none"
                    min="1"
                    max={item.stock_available}
                  />
                  <button
                    onClick={() => onQuantityChange(item.product_id, item.quantity + 1)}
                    className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>

                {/* Price Control */}
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">@</span>
                  <input
                    type="number"
                    value={item.unit_price}
                    onChange={(e) => onPriceChange(item.product_id, e.target.value)}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="0.01"
                  />
                </div>

                {/* Total */}
                <div className="flex-1 text-right">
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(item.unit_price * item.quantity)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {items.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal:</span>
            <span>{formatCurrency(totals.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Tax:</span>
            <span>{formatCurrency(totals.taxAmount)}</span>
          </div>
          {totals.discountAmount > 0 && (
            <div className="flex justify-between text-sm text-red-600">
              <span>Discount:</span>
              <span>-{formatCurrency(totals.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
            <span>Total:</span>
            <span>{formatCurrency(totals.total)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;