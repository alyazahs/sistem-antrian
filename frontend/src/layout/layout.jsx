import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./sidebar";
import Headbar from "./headbar";
import { getMe, logout as apiLogout } from "../api"; 

export default function AppLayout({
  titles,
  children,
  onLogout,
  onNavigate,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);

    // active menu item berdasarkan path saat ini 
  const activeFromPath = useMemo(() => {
    const path = location.pathname;

    if (path.startsWith("/dashboard")) return "dashboard";
    if (path.startsWith("/master/jenis")) return "master-jenis";
    if (path.startsWith("/master/identitas")) return "master-identitas";
    if (path.startsWith("/users")) return "users";
    if (path.startsWith("/pendaftaran")) return "pendaftaran";
    if (path.startsWith("/antrian")) return "antrian";
    if (path.startsWith("/laporan")) return "laporan";

    return "pendaftaran";
  }, [location.pathname]);

  const titleMap = useMemo(
    () => ({
      dashboard: "Dashboard",
      "master-jenis": "Master - Jenis Pelayanan",
      "master-identitas": "Master - Identitas",
      users: "Kelola User",
      pendaftaran: "Pendaftaran Pengunjung",
      antrian: "Antrian",
      laporan: "Laporan",
      ...(titles || {}),
    }),
    [titles]
  );

  useEffect(() => {
    let mounted = true;
    getMe()
      .then((res) => {
        if (!mounted) return;
        if (res?.success) setUser(res.user);
      })
      .catch(() => {
        // kalau token invalid, interceptor api.js biasanya udah redirect /login
        if (mounted) setUser(null);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // navigasi sidebar
  const idToPath = (id) => {
    switch (id) {
      case "dashboard":
        return "/dashboard";
      case "master-jenis":
        return "/master/jenis";
      case "master-identitas":
        return "/master/identitas";
      case "users":
        return "/users";
      case "pendaftaran":
        return "/pendaftaran";
      case "antrian":
        return "/antrian";
      case "laporan":
        return "/laporan";
      default:
        return "/pendaftaran";
    }
  };

  const handleNavigate = (id) => {
    const path = idToPath(id);
    navigate(path);
    onNavigate?.(id);
  };

  const handleLogout = () => {
    if (typeof onLogout === "function") {
      onLogout();
      return;
    }
    apiLogout();
  };

  return (
    <div className="h-screen bg-slate-50 overflow-hidden">
      <div className="grid h-screen grid-cols-1 md:grid-cols-[280px_1fr]">
        <Sidebar
          active={activeFromPath}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          user={user}
        />

        <main className="min-w-0 h-screen flex flex-col">
          <Headbar title={titleMap[activeFromPath] || "Pendaftaran Pengunjung"} />

          <div className="flex-1 overflow-y-auto">
            <div className="w-full p-6 md:p-8">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}