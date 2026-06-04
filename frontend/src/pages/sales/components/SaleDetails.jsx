import React from 'react';
import { useParams } from 'react-router-dom';

const SaleDetails = () => {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Sale Details - #{id}
        </h1>
        <p className="text-gray-600">Sale details will be implemented here.</p>
      </div>
    </div>
  );
};

export default SaleDetails;
