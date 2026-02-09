import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";

export default function Sidebar({
  active = "pendaftaran",
  onNavigate = () => {},
  onLogout = () => {},
}) {
  const Item = ({ id, icon, label, indent = false }) => {
    const isActive = id === active;

    return (
      <button
        type="button"
        onClick={() => onNavigate(id)}
        className={[
          "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left font-semibold transition",
          indent ? "pl-10 text-[14px]" : "",
          isActive
            ? "bg-[#2BB0A6] text-white shadow-md"
            : "text-slate-500 hover:bg-blue-50/60 hover:text-slate-800",
        ].join(" ")}
      >
        {icon ? (
          <i
            className={[
              icon,
              "w-[18px]",
              isActive ? "text-white" : "text-slate-500",
            ].join(" ")}
          />
        ) : (
          <span className="w-[18px]" />
        )}
        {label}
      </button>
    );
  };

  const isMasterOpen = active.startsWith("master");

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
    <aside className="sticky top-0 flex h-screen flex-col overflow-auto border-r border-slate-200 bg-[#D9F1ED] px-4 py-5">
      <div className="mb-4 flex items-center gap-4 border-b border-slate-200 px-2 pb-4">
        <img
          src="/image.png"
          alt="Jiwan Logo"
          className="h-11 w-11 object-contain"
        />
        <div className="leading-tight">
          <span className="block text-sm font-semibold tracking-tight text-slate-500">
            Kecamatan
          </span>
          <span className="block text-xl font-extrabold text-slate-800">
            Jiwan
          </span>
        </div>
      </div>

      <nav className="flex flex-col gap-1 px-1">
        <Item id="dashboard" icon="fa-solid fa-chart-pie" label="Dashboard" />
        <Item id="master-jenis" icon="fa-solid fa-database" label="Master" />

        {isMasterOpen && (
          <div className="mt-1 space-y-1 rounded-xl bg-slate-50 p-1">
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
        )}

        <Item id="pendaftaran" icon="fa-solid fa-id-card" label="Pendaftaran" />
        <Item id="antrian" icon="fa-solid fa-users" label="Antrian" />
        <Item id="laporan" icon="fa-solid fa-file-lines" label="Laporan" />
      </nav>

      <div className="mt-auto border-t border-slate-200 px-2 pt-4">
        <button
          type="button"
          onClick={confirmLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/70 px-4 py-3 font-extrabold text-slate-700 shadow-sm transition hover:bg-red-50 hover:text-red-600 hover:shadow-md active:scale-[0.99]"
        >
          <i className="fa-solid fa-arrow-right-from-bracket" />
          Logout
        </button>
        <ConfirmDialog />
      </div>
    </aside>
  );
}