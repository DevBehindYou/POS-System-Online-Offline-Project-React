import React, { useState, useEffect } from 'react';

const PaymentModal = ({ total, onClose, onPaymentComplete }) => {
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountReceived, setAmountReceived] = useState(total);
  const [change, setChange] = useState(0);

  useEffect(() => {
    if (paymentMethod === 'cash') {
      const changeAmount = Math.max(0, amountReceived - total);
      setChange(changeAmount);
    } else {
      setChange(0);
      setAmountReceived(total);
    }
  }, [amountReceived, total, paymentMethod]);

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    if (method !== 'cash') {
      setAmountReceived(total);
      setChange(0);
    }
  };

  const handleAmountChange = (e) => {
    const amount = parseFloat(e.target.value) || 0;
    setAmountReceived(amount);
  };

  const handleProcessPayment = () => {
    if (paymentMethod === 'cash' && amountReceived < total) {
      alert('Amount received is less than total amount');
      return;
    }

    onPaymentComplete({
      method: paymentMethod,
      received: amountReceived,
      change: change
    });
  };

  const quickAmountButtons = [
    { label: 'Exact', value: total },
    { label: '$5', value: total + 5 },
    { label: '$10', value: total + 10 },
    { label: '$20', value: total + 20 },
    { label: '$50', value: total + 50 },
    { label: '$100', value: total + 100 }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Process Payment</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Total Amount */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 font-medium">Total Amount:</span>
              <span className="text-2xl font-bold text-blue-600">
                ${total.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Payment Method</h3>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handlePaymentMethodChange('cash')}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  paymentMethod === 'cash'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">💵</div>
                <div className="text-sm font-medium">Cash</div>
              </button>
              <button
                onClick={() => handlePaymentMethodChange('card')}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  paymentMethod === 'card'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">💳</div>
                <div className="text-sm font-medium">Card</div>
              </button>
              <button
                onClick={() => handlePaymentMethodChange('upi')}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  paymentMethod === 'upi'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">📱</div>
                <div className="text-sm font-medium">UPI</div>
              </button>
            </div>
          </div>

          {/* Cash Payment Details */}
          {paymentMethod === 'cash' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="amount-received" className="block text-sm font-medium text-gray-700 mb-2">
                  Amount Received
                </label>
                <input
                  type="number"
                  id="amount-received"
                  value={amountReceived}
                  onChange={handleAmountChange}
                  step="0.01"
                  min={total}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Amounts</h4>
                <div className="grid grid-cols-3 gap-2">
                  {quickAmountButtons.map((button, index) => (
                    <button
                      key={index}
                      onClick={() => setAmountReceived(button.value)}
                      className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      {button.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium">Change:</span>
                  <span className={`text-xl font-bold ${change > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                    ${change.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Non-Cash Payment Instructions */}
          {paymentMethod !== 'cash' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              {paymentMethod === 'card' && (
                <p className="text-yellow-800 flex items-center">
                  <span className="text-2xl mr-3">💳</span>
                  Please process the card payment for ${total.toFixed(2)}
                </p>
              )}
              {paymentMethod === 'upi' && (
                <p className="text-yellow-800 flex items-center">
                  <span className="text-2xl mr-3">📱</span>
                  Please complete the UPI payment for ${total.toFixed(2)}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex space-x-3 p-6 border-t border-gray-200">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleProcessPayment}
            disabled={paymentMethod === 'cash' && amountReceived < total}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Complete Payment
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;