import {
  Search,
  Users,
  AlertTriangle,
  CheckCircle2,
  Upload,
  RotateCw,
  Trash2,
  Download,
  X,
  Eye,
  Phone,
  Mail,
  BarChart3,
  Send,
  RefreshCcw,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { Member } from "./App";

interface DashboardProps {
  members: Member[];
  onNavigateToImport: () => void;
  onNavigateToMarketing: () => void;
  onClear: () => void;
  onRefresh: () => void;
  onMarkEmailSent: (memberId: string) => void;
  onClearSentEmails: () => void;
}

function getRiskStyle(score: number) {
  if (score >= 0.7) {
    return {
      row: "bg-red-50/80 border-l-4 border-l-red-500",
      badge: "text-red-700 bg-red-100",
      actionText: "Contact Now",
      actionClass: "text-red-600",
    };
  }

  if (score >= 0.4) {
    return {
      row: "bg-yellow-50/60 border-l-4 border-l-yellow-400",
      badge: "text-yellow-700 bg-yellow-100",
      actionText: "Send Promo",
      actionClass: "text-yellow-700",
    };
  }

  return {
    row: "hover:bg-gray-50",
    badge: "text-green-700 bg-green-100",
    actionText: "Details",
    actionClass: "text-gray-500",
  };
}

function toPercent(score: number) {
  return `${(score * 100).toFixed(0)}%`;
}

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export default function Dashboard({
  members,
  onNavigateToImport,
  onClear,
  onRefresh,
  onNavigateToMarketing,
  onMarkEmailSent,
  onClearSentEmails,
}: DashboardProps) {
  const [searchId, setSearchId] = useState("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const filteredMembers = useMemo(() => {
    const keyword = searchId.toLowerCase().trim();
    if (!keyword) return members;

    return members.filter((member) => {
      return (
        String(member.id).toLowerCase().includes(keyword) ||
        String(member.name).toLowerCase().includes(keyword) ||
        String(member.email ?? "")
          .toLowerCase()
          .includes(keyword)
      );
    });
  }, [members, searchId]);

  const summary = useMemo(() => {
    const total = members.length;
    const high = members.filter((m) => m.riskScore >= 0.7).length;
    const medium = members.filter(
      (m) => m.riskScore >= 0.4 && m.riskScore < 0.7,
    ).length;
    const low = members.filter((m) => m.riskScore < 0.4).length;
    const averageRisk =
      total > 0 ? members.reduce((sum, m) => sum + m.riskScore, 0) / total : 0;
    const emailSent = members.filter((m) => m.emailSent).length;
    const emailPending = members.filter(
      (m) => !m.emailSent && m.riskScore >= 0.4,
    ).length;

    return { total, high, medium, low, averageRisk, emailSent, emailPending };
  }, [members]);

  const handleExportReport = () => {
    if (members.length === 0) {
      alert("ยังไม่มีข้อมูลสำหรับ Export");
      return;
    }

    const header = [
      "Member ID",
      "Name",
      "Email",
      "Email Sent",
      "Phone",
      "Risk Score",
      "Risk Level",
      "Recommended Action",
      "AI Insight",
      "AI Script",
    ];
    const rows = members.map((m) => [
      m.id,
      m.name,
      m.email ?? "",
      m.emailSent ? "Sent" : "Pending",
      m.phone ?? "",
      toPercent(m.riskScore),
      m.status,
      m.recommendedAction ?? "",
      m.aiInsight ?? "",
      m.aiScript ?? "",
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map(csvEscape).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "gym-churn-report.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8 font-sans max-w-6xl mx-auto">
      <header className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            GYM Staff Panel
          </h1>
          <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">
            Churn Prediction System
          </p>
        </div>

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
            onClick={onClearSentEmails}
            title="Reset Email Sent"
            className="p-2.5 bg-white border border-gray-200 text-blue-500 hover:bg-blue-50 rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <RefreshCcw size={18} />
          </button>

          <button
            onClick={handleExportReport}
            className="flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm cursor-pointer ml-2"
          >
            <Download size={18} />
            Export Report
          </button>

          <button
            onClick={onNavigateToImport}
            className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md cursor-pointer"
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
        </div>
      </header>

      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-400 font-black uppercase tracking-widest">
                Total Members
              </p>
              <Users size={18} className="text-gray-400" />
            </div>
            <p className="text-3xl font-black text-gray-900">{summary.total}</p>
            <p className="text-xs text-gray-400 mt-1">
              จำนวนสมาชิกทั้งหมดในไฟล์
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-red-400 font-black uppercase tracking-widest">
                High Risk
              </p>
              <AlertTriangle size={18} className="text-red-400" />
            </div>
            <p className="text-3xl font-black text-red-600">{summary.high}</p>
            <p className="text-xs text-gray-400 mt-1">ควรติดต่อทันที</p>
          </div>

          <div className="bg-white rounded-2xl border border-yellow-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-yellow-500 font-black uppercase tracking-widest">
                Medium Risk
              </p>
              <BarChart3 size={18} className="text-yellow-500" />
            </div>
            <p className="text-3xl font-black text-yellow-600">
              {summary.medium}
            </p>
            <p className="text-xs text-gray-400 mt-1">ควรส่งโปรโมชัน</p>
          </div>

          <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-green-500 font-black uppercase tracking-widest">
                Average Risk
              </p>
              <CheckCircle2 size={18} className="text-green-500" />
            </div>
            <p className="text-3xl font-black text-gray-900">
              {toPercent(summary.averageRisk)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Low Risk: {summary.low} คน
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-blue-500 font-black uppercase tracking-widest">
                Email Sent
              </p>
              <Mail size={18} className="text-blue-500" />
            </div>
            <p className="text-3xl font-black text-blue-600">
              {summary.emailSent}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Pending Marketing: {summary.emailPending} คน
            </p>
          </div>
        </div>

        <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search Member ID, Name, or Email..."
              className="w-full bg-transparent py-3 pl-11 pr-4 focus:outline-none text-gray-700"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
            />
          </div>
          <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2.5 rounded-xl font-bold text-sm transition-colors cursor-pointer mr-1">
            Check ID
          </button>
        </div>

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
                  <th className="px-6 py-4 font-bold">Email</th>
                  <th className="px-6 py-4 font-bold text-center">
                    Email Status
                  </th>
                  <th className="px-6 py-4 font-bold text-center">
                    Risk Level
                  </th>
                  <th className="px-6 py-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMembers.map((member) => {
                  const style = getRiskStyle(member.riskScore);
                  const showWarning = member.riskScore >= 0.4;

                  return (
                    <tr
                      key={member.id}
                      className={`transition-all ${style.row}`}
                    >
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
                        {member.emailSent ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase text-blue-700 bg-blue-100">
                            <CheckCircle2 size={12} /> Sent
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase text-gray-500 bg-gray-100">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${style.badge}`}
                        >
                          {showWarning ? (
                            <AlertTriangle size={12} />
                          ) : (
                            <CheckCircle2 size={12} />
                          )}
                          {toPercent(member.riskScore)} Risk
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedMember(member)}
                          className={`inline-flex items-center gap-1.5 text-xs font-bold cursor-pointer hover:underline ${style.actionClass}`}
                        >
                          <Eye size={14} />
                          {style.actionText}
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredMembers.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-10 text-center text-sm text-gray-400"
                    >
                      ไม่พบข้อมูลสมาชิกที่ค้นหา
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedMember && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 font-black uppercase tracking-widest">
                  Member Detail
                </p>
                <h3 className="text-xl font-black text-gray-900">
                  {selectedMember.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-500 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-gray-50 rounded-2xl p-4">
                  <p className="text-xs text-gray-400 font-bold mb-1">
                    Member ID
                  </p>
                  <p className="font-black text-gray-900">
                    {selectedMember.id}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4">
                  <p className="text-xs text-gray-400 font-bold mb-1">
                    Risk Score
                  </p>
                  <p className="font-black text-red-600">
                    {toPercent(selectedMember.riskScore)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4">
                  <p className="text-xs text-gray-400 font-bold mb-1">
                    Risk Level
                  </p>
                  <p className="font-black text-gray-900">
                    {selectedMember.status}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                  <div className="flex items-center gap-2 text-blue-700 mb-1">
                    <Mail size={16} />
                    <p className="text-xs font-black uppercase">Email</p>
                  </div>
                  <p className="text-sm text-blue-900">
                    {selectedMember.email || "ไม่พบข้อมูล"}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                  <div className="flex items-center gap-2 text-blue-700 mb-1">
                    <Phone size={16} />
                    <p className="text-xs font-black uppercase">Phone</p>
                  </div>
                  <p className="text-sm text-blue-900">
                    {selectedMember.phone || "ไม่พบข้อมูล"}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-gray-200 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-gray-400 font-black uppercase tracking-widest">
                    Email Follow-up Status
                  </p>
                  <p
                    className={`text-sm font-bold ${selectedMember.emailSent ? "text-blue-700" : "text-gray-700"}`}
                  >
                    {selectedMember.emailSent
                      ? "Sent แล้ว — ไม่แสดงในหน้า Marketing"
                      : "Pending — ยังแสดงในหน้า Marketing"}
                  </p>
                </div>
                {!selectedMember.emailSent && (
                  <button
                    onClick={() => {
                      onMarkEmailSent(selectedMember.id);
                      setSelectedMember({ ...selectedMember, emailSent: true });
                    }}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-black cursor-pointer"
                  >
                    <Send size={14} />
                    Mark Email Sent
                  </button>
                )}
              </div>

              <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
                <p className="text-xs font-black uppercase text-purple-700 mb-2">
                  AI Insight / เหตุผลความเสี่ยง
                </p>
                <p className="text-sm leading-relaxed text-purple-900">
                  {selectedMember.aiInsight || "ยังไม่มี Insight จาก backend"}
                </p>
              </div>

              <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
                <p className="text-xs font-black uppercase text-green-700 mb-2">
                  Recommended Action
                </p>
                <p className="text-sm leading-relaxed text-green-900">
                  {selectedMember.recommendedAction || "ดูแลตามปกติ"}
                </p>
              </div>

              <div className="bg-gray-900 rounded-2xl p-4 text-white">
                <p className="text-xs font-black uppercase text-gray-300 mb-2">
                  Draft Message
                </p>
                <p className="text-sm leading-relaxed">
                  {selectedMember.aiScript || "ยังไม่มีข้อความแนะนำ"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
