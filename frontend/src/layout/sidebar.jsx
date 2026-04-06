import { useEffect, useState } from "react";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";

export default function Sidebar({
  active = "pendaftaran",
  onNavigate = () => {},
  onLogout = () => {},
}) {
  const [role, setRole] = useState(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setRole(user.role);
    }
  }, []);

  const activeIsMaster = active.startsWith("master-");
  const [masterOpen, setMasterOpen] = useState(activeIsMaster);

  useEffect(() => {
    if (activeIsMaster) setMasterOpen(true);
  }, [activeIsMaster]);

  const Item = ({
    id,
    icon,
    label,
    indent = false,
    onClick,
    showCaret = false,
  }) => {
    const isActive = id === active;
    const isMasterTrigger = id === "__master__";

    return (
      <button
        type="button"
        onClick={onClick ? onClick : () => onNavigate(id)}
        className={[
          "group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all duration-200",
          indent ? "pl-11 text-[14px]" : "",
          isActive
            ? "bg-gradient-to-r from-[#2BB0A6] to-[#23978F] text-white shadow-lg shadow-[#2BB0A6]/20"
            : "text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm",
        ].join(" ")}
      >
        <span
          className={[
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition",
            isActive
              ? "bg-white/20 text-white"
              : "bg-white/70 text-slate-500 group-hover:bg-[#2BB0A6]/10 group-hover:text-[#2BB0A6]",
          ].join(" ")}
        >
          <i className={[icon, "text-sm"].join(" ")} />
        </span>

        <span className="flex-1 font-semibold">{label}</span>

        {showCaret ? (
          <i
            className={[
              "pi text-xs transition-transform duration-200",
              masterOpen ? "pi-chevron-up" : "pi-chevron-down",
              isMasterTrigger && !isActive ? "text-slate-400" : "",
            ].join(" ")}
          />
        ) : null}
      </button>
    );
  };

  const confirmLogout = () => {
    confirmDialog({
      message: "Apakah Anda yakin ingin logout?",
      header: "Konfirmasi Logout",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Ya",
      rejectLabel: "Batal",
      acceptClassName: "p-button-danger",
      accept: () => onLogout(),
    });
  };

  return (
    <aside className="sticky top-0 flex h-screen w-[280px] flex-col border-r border-slate-200 bg-gradient-to-b from-[#D9F1ED] via-[#EAF8F5] to-[#F7FCFB] px-4 py-5 shadow-[4px_0_20px_rgba(15,23,42,0.04)]">
      <div className="mb-5 shrink-0 rounded-3xl bg-white/70 p-4 shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2BB0A6]/10">
            <img
              src="/logo-kab.png"
              alt="Jiwan Logo"
              className="h-12 w-12 object-contain"
            />
          </div>

          <div className="leading-tight">
            <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Sistem Antrian
            </span>
            <span className="block text-lg font-extrabold text-slate-800">
              Kecamatan Jiwan
            </span>
            <span className="mt-1 block text-xs text-slate-500">
              Pelayanan masyarakat
            </span>
          </div>
        </div>
      </div>

      <div className="mb-3 shrink-0 px-2 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
        Menu Utama
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-1 pr-2 pb-4">
        <div className="flex flex-col gap-2">
          <Item id="dashboard" icon="fa-solid fa-chart-pie" label="Dashboard" />

          <Item
            id="__master__"
            icon="fa-solid fa-database"
            label="Master Data"
            onClick={() => setMasterOpen((v) => !v)}
            showCaret
          />

          <div
            className={[
              "overflow-hidden transition-all duration-300",
              masterOpen ? "max-h-60 opacity-100" : "max-h-0 opacity-0",
            ].join(" ")}
          >
            <div className="ml-3 mt-1 space-y-2 border-l-2 border-[#2BB0A6]/20 pl-2">
              <Item
                id="master-jenis"
                icon="fa-solid fa-list"
                label="Jenis Pelayanan"
                indent
              />
              <Item
                id="master-identitas"
                icon="fa-solid fa-user"
                label="Identitas"
                indent
              />
            </div>
          </div>

          <Item
            id="pendaftaran"
            icon="fa-solid fa-id-card"
            label="Pendaftaran"
          />
          <Item id="antrian" icon="fa-solid fa-users" label="Antrian" />
          <Item id="laporan" icon="fa-solid fa-file-lines" label="Laporan" />

          {role === "kasi_pelayanan" && (
            <Item
              id="users"
              icon="fa-solid fa-user-gear"
              label="Kelola User"
            />
          )}
        </div>
      </nav>

      <div className="mt-4 shrink-0 rounded-3xl border border-white/70 bg-white/60 p-3 shadow-sm backdrop-blur-sm">
        <button
          type="button"
          onClick={confirmLogout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-white to-red-50 px-4 py-3 font-bold text-slate-700 transition-all duration-200 hover:-translate-y-[1px] hover:text-red-600 hover:shadow-md active:scale-[0.99]"
        >
          <i className="fa-solid fa-arrow-right-from-bracket" />
          Logout
        </button>
      </div>

      <ConfirmDialog />
    </aside>
  );
}