import { useState } from "react";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";

function SidebarItem({
  id,
  icon,
  label,
  active,
  indent = false,
  onClick,
  onNavigate,
  showCaret = false,
  masterOpen = false,
}) {
  const isActive =
    id === active || (id === "__master__" && active.startsWith("master-"));

  const isMasterTrigger = id === "__master__";

  return (
    <button
      type="button"
      onClick={onClick ? onClick : () => onNavigate(id)}
      className={[
        "group relative flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all duration-200",
        indent ? "pl-11 text-[14px]" : "",
        isActive
          ? "bg-white text-[#073b3a] shadow-lg shadow-black/20"
          : "text-teal-50/85 hover:bg-white/12 hover:text-white hover:shadow-sm",
      ].join(" ")}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-[#22c55e]" />
      )}

      <span
        className={[
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition",
          isActive
            ? "bg-[#0f766e] text-white shadow-sm"
            : "bg-white/10 text-teal-50 group-hover:bg-white/20 group-hover:text-white",
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
            isMasterTrigger && !isActive ? "text-teal-100/60" : "",
          ].join(" ")}
        />
      ) : null}
    </button>
  );
}

export default function Sidebar({
  active = "pendaftaran",
  onNavigate = () => {},
  onLogout = () => {},
  user = null,
}) {
  const role = user?.role ?? null;

  const activeIsMaster = active.startsWith("master-");
  const [masterManuallyOpen, setMasterManuallyOpen] = useState(false);
  const masterOpen = activeIsMaster || masterManuallyOpen;

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
    <aside className="sticky top-0 flex h-screen w-[280px] flex-col overflow-hidden border-r border-teal-950/40 bg-[#073b3a] px-4 py-5 shadow-[10px_0_35px_rgba(2,6,23,0.25)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(45,212,191,0.22),transparent_34%),linear-gradient(180deg,rgba(6,78,75,1),rgba(6,47,51,1))]" />

      <div className="relative mb-5 shrink-0 rounded-3xl border border-white/15 bg-white/95 p-4 shadow-[0_12px_30px_rgba(0,0,0,0.20)] backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 shadow-sm ring-1 ring-teal-100">
            <img
              src="/logo-kab.png"
              alt="Jiwan Logo"
              className="h-12 w-12 object-contain"
            />
          </div>

          <div className="leading-tight">
            <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
              Sistem Antrian
            </span>
            <span className="block text-lg font-extrabold text-slate-950">
              Kecamatan Jiwan
            </span>
            <span className="mt-1 block text-xs font-medium text-slate-500">
              Pelayanan masyarakat
            </span>
          </div>
        </div>
      </div>

      <div className="relative mb-3 shrink-0 px-2 text-[11px] font-bold uppercase tracking-[0.22em] text-teal-100/65">
        Menu Utama
      </div>

      <nav className="relative min-h-0 flex-1 overflow-y-auto px-1 pb-4 pr-2">
        <div className="flex flex-col gap-2">
          <SidebarItem
            id="dashboard"
            icon="fa-solid fa-chart-pie"
            label="Dashboard"
            active={active}
            onNavigate={onNavigate}
          />

          <SidebarItem
            id="__master__"
            icon="fa-solid fa-database"
            label="Master Data"
            active={active}
            onClick={() => setMasterManuallyOpen((v) => !v)}
            onNavigate={onNavigate}
            showCaret
            masterOpen={masterOpen}
          />

          <div
            className={[
              "overflow-hidden transition-all duration-300",
              masterOpen ? "max-h-60 opacity-100" : "max-h-0 opacity-0",
            ].join(" ")}
          >
            <div className="ml-3 mt-1 space-y-2 border-l-2 border-white/20 pl-2">
              <SidebarItem
                id="master-jenis"
                icon="fa-solid fa-list"
                label="Jenis Pelayanan"
                active={active}
                onNavigate={onNavigate}
                indent
              />

              <SidebarItem
                id="master-identitas"
                icon="fa-solid fa-user"
                label="Identitas"
                active={active}
                onNavigate={onNavigate}
                indent
              />
            </div>
          </div>

          <SidebarItem
            id="pendaftaran"
            icon="fa-solid fa-id-card"
            label="Pendaftaran"
            active={active}
            onNavigate={onNavigate}
          />

          <SidebarItem
            id="antrian"
            icon="fa-solid fa-users"
            label="Antrian"
            active={active}
            onNavigate={onNavigate}
          />

          <SidebarItem
            id="laporan"
            icon="fa-solid fa-file-lines"
            label="Laporan"
            active={active}
            onNavigate={onNavigate}
          />

          {role === "kasi_pelayanan" && (
            <SidebarItem
              id="users"
              icon="fa-solid fa-user-gear"
              label="Kelola User"
              active={active}
              onNavigate={onNavigate}
            />
          )}
        </div>
      </nav>

      <div className="relative mt-4 shrink-0 rounded-3xl border border-white/10 bg-white/5 p-3 shadow-[0_10px_25px_rgba(0,0,0,0.14)]">
        <button
          type="button"
          onClick={confirmLogout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200/20 bg-white/10 px-4 py-3 font-bold text-red-500 shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:border-rose-200/40 hover:bg-rose-500/18 hover:text-white active:scale-[0.99]"
        >
          <i className="fa-solid fa-arrow-right-from-bracket" />
          Logout
        </button>
      </div>

      <ConfirmDialog />
    </aside>
  );
}