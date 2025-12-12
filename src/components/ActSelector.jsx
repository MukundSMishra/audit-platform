import React, { useState } from 'react';
import { AVAILABLE_ACTS, getAllActs, getAllRules } from '../data/actRegistry';
import { ArrowRight, Check, AlertCircle, ListChecks, FileText, Scroll } from 'lucide-react';

const ActSelector = ({ factoryName, location, onActsSelected }) => {
  const [selectedActs, setSelectedActs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('acts'); // 'acts' or 'rules'

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

  const deselectAllActs = () => {
    const allActIds = getAllActs().map(act => act.id);
    setSelectedActs(prev => prev.filter(id => !allActIds.includes(id)));
  };

  const deselectAllRules = () => {
    const allRuleIds = getAllRules().map(rule => rule.id);
    setSelectedActs(prev => prev.filter(id => !allRuleIds.includes(id)));
  };

  const actsToDisplay = activeTab === 'acts' ? getAllActs() : getAllRules();
  const selectedCount = selectedActs.length;
  const totalItems = AVAILABLE_ACTS.reduce((sum, act) => 
    selectedActs.includes(act.id) ? sum + act.data.length : sum, 0
  );

  return (
    <div className="max-w-4xl mx-auto p-6 animate-fade-in">
      
      {/* Header */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-600 p-6 rounded-r-xl">
          <h1 className="text-2xl font-bold text-gray-900">Select Compliance Acts & Rules</h1>
          <p className="text-gray-600 mt-2">Choose which compliance acts and rules you want to audit for this factory</p>
          <div className="mt-4 flex flex-col gap-1 text-sm">
            <p className="text-gray-700 font-semibold">📍 {factoryName}</p>
            <p className="text-gray-600">{location}</p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="mb-6">
        <div className="flex gap-2 border-b-2 border-gray-200">
          <button
            onClick={() => setActiveTab('acts')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all relative ${
              activeTab === 'acts'
                ? 'text-blue-700 border-b-2 border-blue-600 -mb-0.5'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText size={20} />
            Acts ({getAllActs().length})
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all relative ${
              activeTab === 'rules'
                ? 'text-purple-700 border-b-2 border-purple-600 -mb-0.5'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Scroll size={20} />
            Rules ({getAllRules().length})
          </button>
        </div>
      </div>

      {/* Tab Action Buttons */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex gap-3">
          {activeTab === 'acts' ? (
            <>
              <button
                onClick={selectAllActs}
                className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 font-semibold rounded-lg hover:bg-blue-200 transition-colors border border-blue-300"
              >
                <ListChecks size={18} />
                Select All Acts
              </button>
              <button
                onClick={deselectAllActs}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors border border-gray-300"
              >
                Deselect All Acts
              </button>
            </>
          ) : (
            <>
              <button
                onClick={selectAllRules}
                className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 font-semibold rounded-lg hover:bg-purple-200 transition-colors border border-purple-300"
              >
                <ListChecks size={18} />
                Select All Rules
              </button>
              <button
                onClick={deselectAllRules}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors border border-gray-300"
              >
                Deselect All Rules
              </button>
            </>
          )}
        </div>
        <button
          onClick={deselectAll}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 font-semibold rounded-lg hover:bg-red-100 transition-colors border border-red-300"
        >
          Clear All Selection
        </button>
      </div>

      {/* Acts/Rules Selection Grid */}
      <div className="space-y-4 mb-8">
        {actsToDisplay.map(act => {
          const isSelected = selectedActs.includes(act.id);
          return (
            <div
              key={act.id}
              onClick={() => toggleAct(act.id)}
              className={`p-5 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md ${
                isSelected
                  ? act.type === 'rules'
                    ? 'border-purple-500 bg-purple-50 shadow-lg shadow-purple-100'
                    : 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-100'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              {/* Selection Checkbox */}
              <div className="flex items-center gap-4">
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  isSelected
                    ? act.type === 'rules'
                      ? 'border-purple-600 bg-purple-600'
                      : 'border-blue-600 bg-blue-600'
                    : 'border-gray-300 bg-white'
                }`}>
                  {isSelected && <Check size={16} className="text-white" strokeWidth={3} />}
                </div>

                <div className="flex-1 flex items-center justify-between">
                  <div className="flex-1">
                    {/* Act Name and Badge on same line */}
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className={`font-bold text-lg transition-colors ${
                        isSelected 
                          ? act.type === 'rules' ? 'text-purple-900' : 'text-blue-900' 
                          : 'text-gray-900'
                      }`}>
                        {act.name}
                      </h3>
                      <span className={`text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded ${
                        act.type === 'rules' 
                          ? 'bg-purple-100 text-purple-700 border border-purple-300' 
                          : 'bg-blue-100 text-blue-700 border border-blue-300'
                      }`}>
                        {act.type === 'rules' ? '📋 RULE' : '📜 ACT'}
                      </span>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 py-1 bg-gray-100 rounded border border-gray-200">
                        {act.shortName}
                      </span>
                    </div>

                    {/* Description */}
                    <p className={`text-sm leading-relaxed ${
                      isSelected 
                        ? act.type === 'rules' ? 'text-purple-800' : 'text-blue-800' 
                        : 'text-gray-600'
                    }`}>
                      {act.description}
                    </p>
                  </div>

                  {/* Items Count */}
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold ml-6 ${
                    isSelected
                      ? act.type === 'rules' 
                        ? 'bg-purple-100 text-purple-700 border border-purple-300' 
                        : 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-gray-100 text-gray-700 border border-gray-200'
                  }`}>
                    <AlertCircle size={16} />
                    <span>{act.data.length} items</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Section */}
      {selectedActs.length > 0 && (
        <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 border-2 border-blue-200 rounded-2xl p-8 shadow-lg mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 text-white p-2 rounded-lg">
                <ListChecks size={24} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                Selected for Audit
              </h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-white border-2 border-blue-300 rounded-lg px-6 py-3 shadow-sm">
                <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Items</div>
                <div className="text-3xl font-bold text-blue-700 mt-1">{totalItems}</div>
              </div>
            </div>
          </div>

          {/* Professional Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedActs.map(actId => {
              const act = AVAILABLE_ACTS.find(a => a.id === actId);
              const isPurple = act.type === 'rules';
              return (
                <div
                  key={actId}
                  className={`group relative bg-white border-2 rounded-xl p-5 transition-all hover:shadow-md ${
                    isPurple 
                      ? 'border-purple-200 hover:border-purple-400' 
                      : 'border-blue-200 hover:border-blue-400'
                  }`}
                >
                  {/* Colored accent bar */}
                  <div className={`absolute top-0 left-0 w-1.5 h-full rounded-l-xl ${
                    isPurple ? 'bg-purple-500' : 'bg-blue-500'
                  }`} />
                  
                  <div className="flex items-start justify-between gap-4 pl-3">
                    <div className="flex-1">
                      {/* Act Name & Badge */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded ${
                          isPurple 
                            ? 'bg-purple-100 text-purple-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {act.type === 'rules' ? '📋' : '📜'}
                        </span>
                        <h4 className={`font-bold text-base leading-tight ${
                          isPurple ? 'text-purple-900' : 'text-blue-900'
                        }`}>
                          {act.name}
                        </h4>
                      </div>
                      
                      {/* Short Name */}
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        {act.shortName}
                      </div>
                    </div>

                    {/* Item Count Badge */}
                    <div className={`flex-shrink-0 px-4 py-2 rounded-lg text-center border-2 ${
                      isPurple 
                        ? 'bg-purple-50 border-purple-300' 
                        : 'bg-blue-50 border-blue-300'
                    }`}>
                      <div className={`text-2xl font-bold ${
                        isPurple ? 'text-purple-700' : 'text-blue-700'
                      }`}>
                        {act.data.length}
                      </div>
                      <div className="text-xs font-semibold text-gray-600 uppercase">items</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
