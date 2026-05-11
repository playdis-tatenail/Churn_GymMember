import { Search, Users, AlertTriangle, CheckCircle2, Upload, RotateCw, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface DashboardProps {
  members: any[];
  onNavigateToImport: () => void;
  onNavigateToMarketing: () => void; // เพิ่มอันนี้
  onClear: () => void;
  onRefresh: () => void;
}

export default function Dashboard({ members, onNavigateToImport, onClear, onRefresh ,onNavigateToMarketing }: DashboardProps) {
  const [searchId, setSearchId] = useState('');

  return (
    <div className="p-8 font-sans max-w-6xl mx-auto">
      <header className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">GYM Staff Panel</h1>
          <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Churn Prediction System</p>
        </div>
        
        {/* กลุ่มปุ่มจัดการข้อมูล - ต้องมี </div> ปิดกลุ่มนี้ */}
        <div className="flex gap-2">
          <button 
            onClick={onRefresh}
            title="Refresh Data"
            className="p-2.5 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <RotateCw size={18} />
          </button>
          
          <button 
            onClick={onClear}
            title="Clear All"
            className="p-2.5 bg-white border border-gray-200 text-red-500 hover:bg-red-50 rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Trash2 size={18} />
          </button>

          <button 
            onClick={onNavigateToImport}
            className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md cursor-pointer ml-2"
          >
            <Upload size={18} />
            Import CSV
          </button>
          <button 
            onClick={onNavigateToMarketing}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer"
          >
            Marketing Mode 🚀
          </button>

        </div> {/* <-- ปิด div กลุ่มปุ่ม */}
      </header> {/* <-- ปิด header */}

      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Search Bar */}
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search Member ID..." 
              className="w-full bg-transparent py-3 pl-11 pr-4 focus:outline-none text-gray-700"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
            />
          </div>
          <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2.5 rounded-xl font-bold text-sm transition-colors cursor-pointer mr-1">
            Check ID
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Users size={18} className="text-gray-400" />
            <h2 className="font-bold text-gray-700">Member Analysis List</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-gray-400 text-[10px] uppercase tracking-widest">
                  <th className="px-6 py-4 font-bold">ID</th>
                  <th className="px-6 py-4 font-bold">Name</th>
                  <th className="px-6 py-4 font-bold text-center">Risk Level</th>
                  <th className="px-6 py-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {members.filter(m => m.id.includes(searchId)).map((member) => {
                  const isHighRisk = member.riskScore > 0.5;
                  return (
                    <tr key={member.id} className={`transition-all ${isHighRisk ? 'bg-red-50/80 border-l-4 border-l-red-500' : 'hover:bg-gray-50'}`}>
                      <td className="px-6 py-4 font-bold text-gray-900">{member.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{member.name}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                          isHighRisk ? 'text-red-700 bg-red-100' : 'text-green-700 bg-green-100'
                        }`}>
                          {isHighRisk ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
                          {(member.riskScore * 100).toFixed(0)}% Risk
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className={`text-xs font-bold cursor-pointer hover:underline ${isHighRisk ? 'text-red-600' : 'text-gray-400'}`}>
                          {isHighRisk ? 'Contact Now' : 'Details'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}