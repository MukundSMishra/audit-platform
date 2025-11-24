import React from 'react';

const RiskBadge = ({ level }) => {
  const colors = {
    'Critical': 'bg-red-600 text-white',
    'High': 'bg-orange-500 text-white',
    'Medium': 'bg-yellow-400 text-black',
    'Low': 'bg-blue-500 text-white'
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${colors[level] || 'bg-gray-500'}`}>
      {level} Risk
    </span>
  );
};

export default RiskBadge;