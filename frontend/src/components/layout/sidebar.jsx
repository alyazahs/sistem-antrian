// src/components/layout/sidebar.jsx
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
            ? "bg-blue-50 text-blue-600"
            : "text-slate-500 hover:bg-blue-50/60 hover:text-slate-800",
        ].join(" ")}
      >
        {icon ? (
          <i
            className={[
              icon,
              "w-[18px]",
              isActive ? "text-blue-600" : "text-slate-500",
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

  return (
    <aside className="sticky top-0 flex h-screen flex-col overflow-auto border-r border-slate-200 bg-white px-4 py-5">
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
        <Item id="dashboard" icon="fa-solid fa-gauge" label="Dashboard" />

        {/* MASTER (parent) */}
        <Item id="master-jenis" icon="fa-solid fa-database" label="Master" />

        {/* submenu master */}
        {isMasterOpen && (
          <div className="mt-1 space-y-1 rounded-xl bg-slate-50 p-1">
            <Item id="master-jenis" label="Jenis Pelayanan" indent />
            <Item id="master-identitas" label="Identitas" indent />
          </div>
        )}

        <Item id="pendaftaran" icon="fa-solid fa-id-card" label="Pendaftaran" />
        <Item id="antrian" icon="fa-solid fa-users" label="Antrian" />
        <Item id="laporan" icon="fa-solid fa-file-lines" label="Laporan" />
      </nav>

      <div className="mt-auto flex items-center gap-2 border-t border-slate-200 px-2 pt-4 text-slate-500">
        <i className="fa-solid fa-arrow-right-from-bracket" />
        <button
          type="button"
          onClick={onLogout}
          className="rounded-xl px-2 py-2 font-bold transition hover:bg-red-50 hover:text-red-500"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}