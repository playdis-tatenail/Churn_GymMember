import { useEffect, useState } from "react";
import Dashboard from "./Dashboard";
import ImportView from "./ImportData";
import AdsView from "./AdsView";

export interface Member {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  riskScore: number;
  status: string;
  aiInsight?: string;
  aiScript?: string;
  recommendedAction?: string;
  emailSent?: boolean;
}

const initialData: Member[] = [
  {
    id: "MEM-001",
    name: "สมชาย รักยิม",
    email: "somchai@example.com",
    riskScore: 0.85,
    status: "High Risk",
    emailSent: false,
  },
  {
    id: "MEM-002",
    name: "สมศรี พีคสุด",
    email: "somsri@example.com",
    riskScore: 0.12,
    status: "Low Risk",
    emailSent: false,
  },
  {
    id: "MEM-003",
    name: "ไก่ กาเก่กุ้ง",
    email: "kai@example.com",
    riskScore: 0.78,
    status: "High Risk",
    emailSent: false,
  },
];

const SENT_EMAIL_STORAGE_KEY = "gym_churn_sent_email_ids";
const getStatus = (score: number): string =>
  score >= 0.7 ? "High Risk" : score >= 0.4 ? "Medium Risk" : "Low Risk";

function loadSentEmailIds(): string[] {
  try {
    const raw = localStorage.getItem(SENT_EMAIL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [view, setView] = useState<"dashboard" | "import" | "marketing">(
    "dashboard",
  );
  const [sentEmailIds, setSentEmailIds] = useState<string[]>(loadSentEmailIds);
  const [members, setMembers] = useState<Member[]>(() => {
    const sentIds = loadSentEmailIds();
    return initialData.map((m) => ({
      ...m,
      emailSent: sentIds.includes(m.id),
    }));
  });

  useEffect(() => {
    localStorage.setItem(SENT_EMAIL_STORAGE_KEY, JSON.stringify(sentEmailIds));
  }, [sentEmailIds]);

  const syncEmailSent = (data: Member[], sentIds = sentEmailIds) => {
    return data.map((member) => ({
      ...member,
      emailSent: Boolean(member.emailSent || sentIds.includes(member.id)),
    }));
  };

  const handleMarkEmailSent = (memberId: string) => {
    setSentEmailIds((prev) => {
      if (prev.includes(memberId)) return prev;
      return [...prev, memberId];
    });

    setMembers((prev) =>
      prev.map((member) =>
        member.id === memberId ? { ...member, emailSent: true } : member,
      ),
    );
  };

  const handleClearSentEmails = () => {
    if (confirm("ต้องการล้างสถานะ Email Sent ทั้งหมดใช่ไหม?")) {
      setSentEmailIds([]);
      setMembers((prev) =>
        prev.map((member) => ({ ...member, emailSent: false })),
      );
      localStorage.removeItem(SENT_EMAIL_STORAGE_KEY);
    }
  };

  const handleClearData = () => {
    if (confirm("Are you sure you want to clear all data?")) {
      setMembers([]);
    }
  };

  const handleRefreshData = () => {
    setMembers(syncEmailSent(initialData));
  };

  const handleImportComplete = (newData: any[]) => {
    const formattedData: Member[] = newData.map((item, index) => {
      const riskScore = Number(
        item.riskScore ?? item.Activity_Score ?? item.Risk_Score ?? 0,
      );
      const id =
        item.id ||
        item.Member_ID ||
        item.Customer_ID ||
        `NEW-${index}-${Math.floor(Math.random() * 1000)}`;
      const emailSentValue =
        item.emailSent ?? item.Email_Sent ?? item.email_sent ?? false;

      return {
        id,
        name: item.name || item.Name || item.Customer_Name || "Unknown Member",
        email: item.email || item.Email || item.Gmail || item.gmail || "",
        phone: item.phone || item.Phone || item.Mobile || "",
        riskScore,
        status: item.status || item.Risk_Level || getStatus(riskScore),
        aiInsight: item.aiInsight || item.AI_Insight || "",
        aiScript: item.aiScript || item.AI_Script || "",
        recommendedAction:
          item.recommendedAction || item.Recommended_Action || "",
        emailSent:
          emailSentValue === true ||
          String(emailSentValue).toLowerCase() === "true" ||
          sentEmailIds.includes(id),
      };
    });

    setMembers(syncEmailSent(formattedData));
    setView("dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {view === "dashboard" && (
        <Dashboard
          members={members}
          onNavigateToImport={() => setView("import")}
          onNavigateToMarketing={() => setView("marketing")}
          onClear={handleClearData}
          onRefresh={handleRefreshData}
          onMarkEmailSent={handleMarkEmailSent}
          onClearSentEmails={handleClearSentEmails}
        />
      )}

      {view === "import" && (
        <div className="p-8">
          <ImportView
            onComplete={handleImportComplete}
            onCancel={() => setView("dashboard")}
          />
        </div>
      )}

      {view === "marketing" && (
        <AdsView
          members={members}
          onBack={() => setView("dashboard")}
          onMarkEmailSent={handleMarkEmailSent}
        />
      )}
    </div>
  );
}
