import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./sidebar";
import Headbar from "./headbar";
import { getUser, logout as apiLogout } from "../api";

const ROUTES_MAP = {
  dashboard: {
    path: "/dashboard",
    title: "Dashboard",
    match: (pathname) => pathname.startsWith("/dashboard"),
  },
  "master-jenis": {
    path: "/master/jenis",
    title: "Master - Jenis Pelayanan",
    match: (pathname) => pathname.startsWith("/master/jenis"),
  },
  "master-identitas": {
    path: "/master/identitas",
    title: "Master - Identitas",
    match: (pathname) => pathname.startsWith("/master/identitas"),
  },
  users: {
    path: "/users",
    title: "Kelola User",
    match: (pathname) => pathname.startsWith("/users"),
  },
  pendaftaran: {
    path: "/pendaftaran",
    title: "Pendaftaran Pengunjung",
    match: (pathname) => pathname.startsWith("/pendaftaran"),
  },
  antrian: {
    path: "/antrian",
    title: "Antrian",
    match: (pathname) => pathname.startsWith("/antrian"),
  },
  laporan: {
    path: "/laporan",
    title: "Laporan",
    match: (pathname) => pathname.startsWith("/laporan"),
  },
};

const getActiveMenuFromPath = (pathname) => {
  const found = Object.entries(ROUTES_MAP).find(([, route]) =>
    route.match(pathname)
  );
  return found ? found[0] : "pendaftaran";
};

const getPathFromId = (id) => {
  return ROUTES_MAP[id]?.path || "/pendaftaran";
};

export default function AppLayout({
  titles,
  children,
  onLogout,
  onNavigate,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const [user] = useState(() => getUser());

  const activeFromPath = useMemo(() => {
    return getActiveMenuFromPath(location.pathname);
  }, [location.pathname]);

  const titleMap = useMemo(() => {
    const baseTitles = Object.fromEntries(
      Object.entries(ROUTES_MAP).map(([key, value]) => [key, value.title])
    );

    return {
      ...baseTitles,
      ...(titles || {}),
    };
  }, [titles]);

  const handleNavigate = (id) => {
    const path = getPathFromId(id);
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
    <div className="h-screen overflow-hidden bg-slate-50">
      <div className="grid h-screen grid-cols-1 md:grid-cols-[280px_1fr]">
        <Sidebar
          active={activeFromPath}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          user={user}
        />

        <main className="flex h-screen min-w-0 flex-col">
          <Headbar
            title={titleMap[activeFromPath] || "Pendaftaran Pengunjung"}
            user={user}
          />

          <div className="flex-1 overflow-y-auto">
            <div className="w-full p-6 md:p-8">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}