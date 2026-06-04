import React from 'react';

const ReceiptModal = ({ sale, onClose }) => {
  const formatCurrency = (amount) => {
    return `${parseFloat(amount).toFixed(2)}`;
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString || new Date()).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-screen overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 print:hidden">
          <h2 className="text-xl font-semibold text-gray-900">Sale Receipt</h2>
          <div className="flex space-x-2">
            <button 
              onClick={handlePrint}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
            >
              Print
            </button>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Receipt Content */}
        <div className="p-6" id="receipt-content">
          {/* Store Header */}
          <div className="text-center mb-6 border-b border-gray-200 pb-4">
            <div className="text-2xl mb-2">🏪</div>
            <h1 className="text-xl font-bold text-gray-900">POS System</h1>
            <p className="text-sm text-gray-600">Thank you for your business!</p>
          </div>

          {/* Sale Info */}
          <div className="space-y-2 mb-6 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Invoice:</span>
              <span className="font-mono font-medium">{sale.invoice_number || 'INV-DEMO-001'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span>{formatDateTime(new Date())}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Cashier:</span>
              <span>{sale.cashier?.username || 'Demo User'}</span>
            </div>
            {sale.customer && (
              <div className="flex justify-between">
                <span className="text-gray-600">Customer:</span>
                <span>{sale.customer.name}</span>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="border-t border-b border-gray-200 py-4 mb-4">
            <div className="space-y-3">
              {sale.items?.map((item, index) => (
                <div key={index} className="flex justify-between items-start text-sm">
                  <div className="flex-1 mr-2">
                    <div className="font-medium text-gray-900">{item.name}</div>
                    <div className="text-gray-500 text-xs">
                      {item.quantity} × {formatCurrency(item.unit_price)}
                    </div>
                  </div>
                  <div className="font-medium">
                    {formatCurrency(item.unit_price * item.quantity)}
                  </div>
                </div>
              )) || (
                <div className="text-center text-gray-500">No items</div>
              )}
            </div>
          </div>

          {/* Totals */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span>{formatCurrency(sale.totals?.subtotal || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax:</span>
              <span>{formatCurrency(sale.totals?.taxAmount || 0)}</span>
            </div>
            {(sale.totals?.discountAmount || 0) > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Discount:</span>
                <span>-{formatCurrency(sale.totals.discountAmount)}</span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-2 mt-2">
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>{formatCurrency(sale.totals?.total || 0)}</span>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method:</span>
              <span className="capitalize font-medium">{sale.payment_method || 'cash'}</span>
            </div>
            {sale.payment_method === 'cash' && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount Received:</span>
                  <span>{formatCurrency(sale.payment_received || sale.totals?.total || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Change:</span>
                  <span>{formatCurrency(sale.change_amount || 0)}</span>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
            <p>Thank you for shopping with us!</p>
            <p className="mt-1">Please keep this receipt for your records</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3 p-4 border-t border-gray-200 print:hidden">
          <button 
            onClick={handlePrint}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            🖨️ Print Receipt
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            ✓ New Sale
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;