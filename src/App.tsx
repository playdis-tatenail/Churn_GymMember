import { useState } from 'react';
import Dashboard from './Dashboard';
import ImportView from './ImportData';
import AdsView from './AdsView';

interface Member {
  id: string;
  name: string;
  riskScore: number;
  status: string;
}

const initialData: Member[] = [
  { id: 'MEM-001', name: 'สมชาย รักยิม', riskScore: 0.85, status: 'High Risk' },
  { id: 'MEM-002', name: 'สมศรี พีคสุด', riskScore: 0.12, status: 'Low Risk' },
  { id: 'MEM-003', name: 'ไก่ กาเก่กุ้ง', riskScore: 0.78, status: 'High Risk' },
];

const getStatus = (score: number): string => score >= 0.5 ? 'High Risk' : 'Low Risk';

export default function App() {
  const [view, setView] = useState<'dashboard' | 'import' | 'marketing'>('dashboard');
  const [members, setMembers] = useState<Member[]>(initialData);

  const handleClearData = () => {
    if (confirm("Are you sure you want to clear all data?")) {
      setMembers([]);
    }
  };

  const handleRefreshData = () => {
    setMembers(initialData);
  };

  const handleImportComplete = (newData: any[]) => {
    const formattedData: Member[] = newData.map((item, index) => {
      const riskScore = item.Activity_Score != null
        ? parseFloat(item.Activity_Score)
        : Math.random();
      return {
        id: item.Member_ID || `NEW-${index}-${Math.floor(Math.random() * 1000)}`,
        name: item.Name || 'Unknown Member',
        riskScore,
        status: getStatus(riskScore), // ✅ เพิ่ม status ให้ครบ
      };
    });

    setMembers(formattedData);
    setView('dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {view === 'dashboard' && (
        <Dashboard
          members={members}
          onNavigateToImport={() => setView('import')}
          onNavigateToMarketing={() => setView('marketing')}
          onClear={handleClearData}
          onRefresh={handleRefreshData}
        />
      )}

      {view === 'import' && (
        <div className="p-8">
          <ImportView
            onComplete={handleImportComplete}
            onCancel={() => setView('dashboard')}
          />
        </div>
      )}

      {view === 'marketing' && (
        <AdsView
          members={members}
          onBack={() => setView('dashboard')}
        />
      )}
    </div>
  );
}