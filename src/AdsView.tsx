import { ArrowLeft, BrainCircuit, Copy, Check , Mail } from 'lucide-react';
import { useState } from 'react';

interface AdsViewProps {
  members: any[];
  onBack: () => void;
}

export default function AdsView({ members, onBack }: AdsViewProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // กรองเฉพาะกลุ่มที่เสี่ยงลาออก (High Risk)
  const highRiskMembers = members.filter(m => m.riskScore > 0.5);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };
  

  return (
  <div className="max-w-7xl mx-auto p-8 font-sans animate-in slide-in-from-right duration-500">
    {/* Header */}
    <div className="flex items-center gap-4 mb-8">
      <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer text-gray-500">
        <ArrowLeft size={24} />
      </button>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">AI Marketing Center</h1>
        <p className="text-xs text-blue-600 font-black uppercase tracking-widest italic">Powered by Typhoon LLM</p>
      </div>
    </div>

    {/* ตารางแบบอัปเกรด */}
    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <h2 className="font-bold text-gray-700 flex items-center gap-2">
          <BrainCircuit size={20} className="text-purple-500" />
          AI-Generated Retention Strategy
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-gray-400 text-[10px] uppercase tracking-widest border-b border-gray-50 bg-white">
              <th className="px-6 py-5 font-bold">ID / Name</th>
              <th className="px-6 py-5 font-bold text-center">Risk</th>
              <th className="px-6 py-5 font-bold w-1/3">AI Insight (Staff Only)</th>
              <th className="px-6 py-5 font-bold w-1/3">AI Promotion Script (For Customer)</th>
            </tr>
          </thead>
          {/*เดี่ยวต้องเอามาเชื่อม  */}
          <tbody className="divide-y divide-gray-50 bg-white">
            {highRiskMembers.map((member) => {
              const aiInsight = "ไม่ได้เข้ายิมมา 12 วันต่อเนื่อง ความถี่ปกติคือ 3 ครั้ง/สัปดาห์ คาดว่าติดธุระหรือเริ่มหมดไฟ";
              const aiScript = `สวัสดีครับคุณ ${member.name} เห็นว่าหายหน้าไปนาน ทางยิมมอบคูปอง Personal Trainer ฟรี 1 เซสชั่นให้เป็นพิเศษนะครับ!`;

              return (
                <tr key={member.id} className="hover:bg-gray-50/50 transition-colors">
                  {/* ID / Name */}
                  <td className="px-6 py-5">
                    <p className="font-bold text-gray-900">{member.id}</p>
                    <p className="text-xs text-gray-500">{member.name}</p>
                  </td>

                  {/* Risk Score */}
                  <td className="px-6 py-5 text-center">
                    <span className="text-red-600 bg-red-50 px-2 py-1 rounded-lg text-xs font-black border border-red-100">
                      {(member.riskScore * 100).toFixed(0)}%
                    </span>
                  </td>

                  {/* AI Insight */}
                  <td className="px-6 py-5">
                    <div className="text-xs leading-relaxed text-purple-700 bg-purple-50 p-3 rounded-xl border border-purple-100">
                      <span className="font-bold block mb-1 underline">Why they churn?</span>
                      {aiInsight}
                    </div>
                  </td>

                  {/* AI Script + Action Buttons */}
                  <td className="px-6 py-5">
                    <div className="relative group">
                      {/* Box ข้อความ: เพิ่ม pr-24 เพื่อกันข้อความไหลไปใต้ปุ่ม */}
                      <div className="text-xs leading-relaxed text-blue-700 bg-blue-50 p-3 pr-24 rounded-xl border border-blue-100 italic">
                        <span className="font-bold block mb-1 not-italic underline text-blue-800">Draft Message</span>
                        "{aiScript}"
                      </div>

                      {/* ปุ่มกดวางคู่กัน */}
                      <div className="absolute top-2 right-2 flex items-center gap-1.5">
                        {/* ปุ่ม Mail */}
                        <button 
                          onClick={() => {
                            const subject = encodeURIComponent("สิทธิพิเศษสำหรับคุณ");
                            const body = encodeURIComponent(aiScript);
                            const recipient = member.email;

                            const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${recipient}&su=${subject}&body=${body}`;
                            window.open(gmailUrl, '_blank');
                          }}
                          className="flex items-center justify-center w-8 h-8 bg-white border border-blue-200 rounded-lg text-blue-600 hover:bg-blue-600 hover:text-white transition-all cursor-pointer shadow-sm"
                          title="ส่งอีเมล"
                        >
                          <Mail size={14} />
                        </button>

                        {/* ปุ่ม Copy */}
                        <button 
                          onClick={() => handleCopy(member.id, aiScript)}
                          className="flex items-center justify-center w-8 h-8 bg-white border border-blue-200 rounded-lg text-blue-600 hover:bg-blue-600 hover:text-white transition-all cursor-pointer shadow-sm"
                          title="คัดลอก"
                        >
                          {copiedId === member.id ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  </div>
  )
};