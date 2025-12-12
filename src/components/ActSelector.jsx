import React, { useState } from 'react';
import { AVAILABLE_ACTS, getAllActs, getAllRules } from '../data/actRegistry';
import { ArrowRight, Check, AlertCircle, ListChecks } from 'lucide-react';

const ActSelector = ({ factoryName, location, onActsSelected }) => {
  const [selectedActs, setSelectedActs] = useState([]);
  const [loading, setLoading] = useState(false);

  const toggleAct = (actId) => {
    setSelectedActs(prev => 
      prev.includes(actId) 
        ? prev.filter(id => id !== actId)
        : [...prev, actId]
    );
  };

  const handleStartAudit = async () => {
    if (selectedActs.length === 0) {
      alert('Please select at least one act to audit');
      return;
    }
    setLoading(true);
    // Pass selected acts to parent
    onActsSelected(selectedActs);
    setLoading(false);
  };

  const selectAllActs = () => {
    const allActIds = getAllActs().map(act => act.id);
    setSelectedActs(prev => {
      const newSet = new Set([...prev, ...allActIds]);
      return Array.from(newSet);
    });
  };

  const selectAllRules = () => {
    const allRuleIds = getAllRules().map(rule => rule.id);
    setSelectedActs(prev => {
      const newSet = new Set([...prev, ...allRuleIds]);
      return Array.from(newSet);
    });
  };

  const deselectAll = () => {
    setSelectedActs([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 animate-fade-in">
      
      {/* Header */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-600 p-6 rounded-r-xl">
          <h1 className="text-2xl font-bold text-gray-900">Select Compliance Acts</h1>
          <p className="text-gray-600 mt-2">Choose which compliance acts you want to audit for this factory</p>
          <div className="mt-4 flex flex-col gap-1 text-sm">
            <p className="text-gray-700 font-semibold">📍 {factoryName}</p>
            <p className="text-gray-600">{location}</p>
          </div>
        </div>
      </div>

      {/* Quick Selection Buttons */}
      <div className="mb-6 flex gap-3">
        <button
          onClick={selectAllActs}
          className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 font-semibold rounded-lg hover:bg-blue-200 transition-colors border border-blue-300"
        >
          <ListChecks size={18} />
          Select All Acts
        </button>
        <button
          onClick={selectAllRules}
          className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 font-semibold rounded-lg hover:bg-purple-200 transition-colors border border-purple-300"
        >
          <ListChecks size={18} />
          Select All Rules
        </button>
        <button
          onClick={deselectAll}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors border border-gray-300"
        >
          Clear Selection
        </button>
      </div>

      {/* Acts Selection Grid */}
      <div className="space-y-4 mb-8">
        {AVAILABLE_ACTS.map(act => {
          const isSelected = selectedActs.includes(act.id);
          return (
            <div
              key={act.id}
              onClick={() => toggleAct(act.id)}
              className={`p-5 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-100'
                  : 'border-gray-200 bg-white hover:border-blue-300'
              }`}
            >
              {/* Selection Checkbox */}
              <div className="flex items-center gap-4">
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  isSelected
                    ? 'border-blue-600 bg-blue-600'
                    : 'border-gray-300 bg-white'
                }`}>
                  {isSelected && <Check size={16} className="text-white" strokeWidth={3} />}
                </div>

                <div className="flex-1 flex items-center justify-between">
                  <div className="flex-1">
                    {/* Act Name and Badge on same line */}
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className={`font-bold text-lg transition-colors ${
                        isSelected ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {act.name}
                      </h3>
                      <span className={`text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded ${
                        act.type === 'rules' 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {act.type === 'rules' ? '📋 RULE' : '📜 ACT'}
                      </span>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 py-1 bg-gray-100 rounded">
                        {act.shortName}
                      </span>
                    </div>

                    {/* Description */}
                    <p className={`text-sm leading-relaxed ${
                      isSelected ? 'text-blue-800' : 'text-gray-600'
                    }`}>
                      {act.description}
                    </p>
                  </div>

                  {/* Items Count */}
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold ml-6 ${
                    isSelected
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    <AlertCircle size={16} />
                    <span>{act.data.length} audit items</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Section */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Items to Audit</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {AVAILABLE_ACTS.reduce((sum, act) => 
                selectedActs.includes(act.id) ? sum + act.data.length : sum, 0
              )}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              across {selectedActs.length} selected {selectedActs.length === 1 ? 'act' : 'acts'}
            </p>
          </div>
          <div className="flex flex-col gap-2 items-end">
            {selectedActs.map(actId => {
              const act = AVAILABLE_ACTS.find(a => a.id === actId);
              return (
                <div key={actId} className="text-sm text-gray-700">
                  <span className="font-semibold">{act.shortName}:</span>
                  <span className="text-gray-500 ml-2">{act.data.length} items</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          disabled={loading}
          className="flex-1 px-6 py-4 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors border border-gray-200"
        >
          Cancel
        </button>
        <button
          onClick={handleStartAudit}
          disabled={loading || selectedActs.length === 0}
          className={`flex-1 px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all transform ${
            selectedActs.length === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:-translate-y-1 active:scale-95'
          }`}
        >
          Start Audit for {selectedActs.length} {selectedActs.length === 1 ? 'Act' : 'Acts'}
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default ActSelector;
