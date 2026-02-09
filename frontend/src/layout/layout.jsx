// src/components/layout/AppLayout.jsx
import { useMemo, useState } from "react";
import Sidebar from "./sidebar";
import Headbar from "./headbar";

export default function AppLayout({
  initialActive = "pendaftaran",
  titles,
  children,
  onLogout,
  onNavigate,
}) {
  const [active, setActive] = useState(initialActive);

  const titleMap = useMemo(
    () => ({
      dashboard: "Dashboard",
      master: "Master Data",
      pendaftaran: "Pendaftaran Pengunjung",
      antrian: "Antrian",
      laporan: "Laporan",
      ...(titles || {}),
    }),
    [titles]
  );

  const handleNavigate = (id) => {
    setActive(id);
    onNavigate?.(id);
  };

  return (
    <div className="h-screen bg-slate-50 overflow-hidden">
      <div className="grid h-screen grid-cols-1 md:grid-cols-[280px_1fr]">
        <Sidebar active={active} onNavigate={handleNavigate} onLogout={onLogout} />

        <main className="min-w-0 h-screen flex flex-col">
          {/* headbar tetap */}
          <Headbar title={titleMap[active] || "Pendaftaran Pengunjung"} />

          {/* konten scroll */}
          <div className="flex-1 overflow-y-auto">
            <div className="w-full p-6 md:p-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}