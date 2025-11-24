import React, { useState } from 'react';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { FileText, ShieldCheck } from 'lucide-react';

// Import our new parts
import AuditCard from './components/AuditCard';
import auditData from './data/factoriesAct.json';

function App() {
  // State to track answers
  const [answers, setAnswers] = useState({});

  const handleUpdateStatus = (id, status) => {
    setAnswers(prev => ({ ...prev, [id]: status }));
  };

  // The Reporter Agent (PDF Logic)
  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(243, 244, 246);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setFontSize(22);
    doc.setTextColor(17, 24, 39);
    doc.text("Audit Report: Factories Act", 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);

    // Table Data
    const rows = auditData.map(item => [
      item.audit_item_id,
      item.audit_content.question_text.substring(0, 60) + "...",
      item.risk_profile.severity_level,
      answers[item.audit_item_id] || "Pending"
    ]);

    autoTable(doc, {
      head: [['ID', 'Question', 'Risk', 'Status']],
      body: rows,
      startY: 45,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] }
    });

    doc.save('Compliance_Report.pdf');
  };

  return (
    <div className="max-w-3xl mx-auto min-h-screen pb-32 pt-6 px-4">
      
      {/* HEADER */}
      <header className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="text-blue-600" /> AuditAI Platform
          </h1>
          <p className="text-sm text-gray-500 mt-1">Factories Act, 1948 Compliance Module</p>
        </div>
        <div className="text-right hidden sm:block">
          <div className="text-3xl font-bold text-gray-900">
            {Object.keys(answers).length}<span className="text-gray-400 text-lg">/{auditData.length}</span>
          </div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Progress</div>
        </div>
      </header>

      {/* AUDIT LIST */}
      <div>
        {auditData.map((item, index) => (
          <AuditCard 
            key={item.audit_item_id}
            item={item}
            index={index}
            currentStatus={answers[item.audit_item_id]}
            onUpdateStatus={handleUpdateStatus}
          />
        ))}
      </div>

      {/* FOOTER ACTION */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 shadow-lg z-50">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <div className="text-xs text-gray-500">
            <strong>Status:</strong> Local Mode (Data not saved to cloud yet)
          </div>
          <button 
            onClick={generatePDF}
            className="bg-gray-900 hover:bg-black text-white font-bold py-3 px-6 rounded-xl shadow transition-transform active:scale-95 flex items-center gap-2"
          >
            <FileText size={18} /> Download Report
          </button>
        </div>
      </div>

    </div>
  );
}

export default App;