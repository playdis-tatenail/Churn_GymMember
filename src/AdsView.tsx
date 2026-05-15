import {
  ArrowLeft,
  BrainCircuit,
  Copy,
  Check,
  Mail,
  CheckCircle2,
  Inbox,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { Member } from "./App";

interface AdsViewProps {
  members: Member[];
  onBack: () => void;
  onMarkEmailSent: (memberId: string) => void;
}

export default function AdsView({
  members,
  onBack,
  onMarkEmailSent,
}: AdsViewProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // หน้า Marketing จะแสดงเฉพาะคนที่ยังไม่ได้ส่งอีเมล และมีความเสี่ยงตั้งแต่ Medium Risk ขึ้นไป
  const pendingMarketingMembers = useMemo(() => {
    return members.filter((m) => m.riskScore >= 0.4 && !m.emailSent);
  }, [members]);

  const sentEmailMembers = useMemo(() => {
    return members.filter((m) => m.emailSent);
  }, [members]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenGmailAndMarkSent = (member: Member, aiScript: string) => {
    if (!member.email) {
      alert("สมาชิกคนนี้ไม่มีอีเมลในระบบ");
      return;
    }

    const subject = encodeURIComponent("สิทธิพิเศษสำหรับคุณ");
    const body = encodeURIComponent(aiScript);
    const recipient = encodeURIComponent(member.email);
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${recipient}&su=${subject}&body=${body}`;

    window.open(gmailUrl, "_blank");
    onMarkEmailSent(member.id);
  };

  return (
    <div className="max-w-7xl mx-auto p-8 font-sans animate-in slide-in-from-right duration-500">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer text-gray-500"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            AI Marketing Center
          </h1>
          <p className="text-xs text-blue-600 font-black uppercase tracking-widest italic">
            Powered by Typhoon LLM
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <p className="text-xs text-gray-400 font-black uppercase tracking-widest">
            Pending Marketing Email
          </p>
          <p className="text-3xl font-black text-gray-900 mt-2">
            {pendingMarketingMembers.length}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            คนที่ยังต้องติดต่อในหน้านี้
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-5">
          <p className="text-xs text-blue-500 font-black uppercase tracking-widest">
            Email Sent
          </p>
          <p className="text-3xl font-black text-blue-600 mt-2">
            {sentEmailMembers.length}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            ส่งแล้ว จะไม่ขึ้นในตาราง Marketing
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-5">
          <p className="text-xs text-purple-500 font-black uppercase tracking-widest">
            Total Risk Members
          </p>
          <p className="text-3xl font-black text-purple-600 mt-2">
            {members.filter((m) => m.riskScore >= 0.4).length}
          </p>
          <p className="text-xs text-gray-400 mt-1">Medium + High Risk</p>
        </div>
      </div>

      {/* ตารางแบบอัปเกรด */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden mb-8">
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="font-bold text-gray-700 flex items-center gap-2">
            <BrainCircuit size={20} className="text-purple-500" />
            AI-Generated Retention Strategy
          </h2>
          <span className="text-xs text-gray-400 font-bold">
            แสดงเฉพาะคนที่ยังไม่ได้ส่งอีเมล
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-gray-400 text-[10px] uppercase tracking-widest border-b border-gray-50 bg-white">
                <th className="px-6 py-5 font-bold">ID / Name</th>
                <th className="px-6 py-5 font-bold">Email</th>
                <th className="px-6 py-5 font-bold text-center">Risk</th>
                <th className="px-6 py-5 font-bold w-1/4">
                  AI Insight (Staff Only)
                </th>
                <th className="px-6 py-5 font-bold w-1/3">
                  AI Promotion Script (For Customer)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {pendingMarketingMembers.map((member) => {
                const aiInsight =
                  member.aiInsight ||
                  "ลูกค้ามีแนวโน้มเสี่ยงลาออก ควรติดต่อเพื่อสอบถามและเสนอโปรโมชันที่เหมาะสม";
                const aiScript =
                  member.aiScript ||
                  `สวัสดีครับคุณ ${member.name} เห็นว่าช่วงนี้อาจไม่ได้เข้ายิมบ่อย ทางยิมมีสิทธิพิเศษให้เป็นพิเศษนะครับ`;

                return (
                  <tr
                    key={member.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    {/* ID / Name */}
                    <td className="px-6 py-5">
                      <p className="font-bold text-gray-900">{member.id}</p>
                      <p className="text-xs text-gray-500">{member.name}</p>
                    </td>

                    {/* Email */}
                    <td className="px-6 py-5">
                      <p className="text-xs font-bold text-blue-700">
                        {member.email || "No email"}
                      </p>
                      <p className="text-[10px] font-black uppercase text-gray-400 mt-1">
                        Pending
                      </p>
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
                        <span className="font-bold block mb-1 underline">
                          Why they churn?
                        </span>
                        {aiInsight}
                      </div>
                    </td>

                    {/* AI Script + Action Buttons */}
                    <td className="px-6 py-5">
                      <div className="relative group">
                        <div className="text-xs leading-relaxed text-blue-700 bg-blue-50 p-3 pr-24 rounded-xl border border-blue-100 italic">
                          <span className="font-bold block mb-1 not-italic underline text-blue-800">
                            Draft Message
                          </span>
                          "{aiScript}"
                        </div>

                        <div className="absolute top-2 right-2 flex items-center gap-1.5">
                          <button
                            onClick={() =>
                              handleOpenGmailAndMarkSent(member, aiScript)
                            }
                            className="flex items-center justify-center w-8 h-8 bg-white border border-blue-200 rounded-lg text-blue-600 hover:bg-blue-600 hover:text-white transition-all cursor-pointer shadow-sm"
                            title="เปิด Gmail และ Mark ว่าส่งแล้ว"
                          >
                            <Mail size={14} />
                          </button>

                          <button
                            onClick={() => handleCopy(member.id, aiScript)}
                            className="flex items-center justify-center w-8 h-8 bg-white border border-blue-200 rounded-lg text-blue-600 hover:bg-blue-600 hover:text-white transition-all cursor-pointer shadow-sm"
                            title="คัดลอก"
                          >
                            {copiedId === member.id ? (
                              <Check size={14} />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        </div>

                        <button
                          onClick={() => onMarkEmailSent(member.id)}
                          className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-black text-blue-700 hover:underline cursor-pointer"
                        >
                          <CheckCircle2 size={13} />
                          Mark as Sent
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {pendingMarketingMembers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Inbox className="mx-auto text-gray-300 mb-3" size={34} />
                    <p className="text-sm font-bold text-gray-500">
                      ไม่มีรายการที่ต้องส่งอีเมลในหน้า Marketing แล้ว
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      รายการที่ส่งแล้วจะถูกย้ายไปอยู่ในตาราง Email Sent Log
                      ด้านล่าง
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="font-bold text-gray-700 flex items-center gap-2">
            <Mail size={20} className="text-blue-500" />
            Email Sent Log
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            ตารางนี้เก็บรายชื่อที่กดส่งอีเมลแล้ว เพื่อไม่ให้กลับไปขึ้นใน
            Marketing อีก
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-gray-400 text-[10px] uppercase tracking-widest border-b border-gray-50 bg-white">
                <th className="px-6 py-4 font-bold">ID</th>
                <th className="px-6 py-4 font-bold">Name</th>
                <th className="px-6 py-4 font-bold">Email</th>
                <th className="px-6 py-4 font-bold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {sentEmailMembers.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-bold text-gray-900">
                    {member.id}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {member.name}
                  </td>
                  <td className="px-6 py-4 text-xs text-blue-700">
                    {member.email || "-"}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase text-blue-700 bg-blue-100">
                      <CheckCircle2 size={12} /> Sent
                    </span>
                  </td>
                </tr>
              ))}

              {sentEmailMembers.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-sm text-gray-400"
                  >
                    ยังไม่มีรายการที่ส่งอีเมลแล้ว
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
