import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Toolbar } from "primereact/toolbar";
import { Avatar } from "primereact/avatar";

export default function Headbar({ title, user = null }) {
  const navigate = useNavigate();
  const location = useLocation();

  const dateStr = useMemo(() => {
    const now = new Date();
    const options = {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    };
    return now.toLocaleDateString("id-ID", options);
  }, []);

  const initials = useMemo(() => {
    const nama = user?.nama?.trim();
    if (!nama) return "P";

    const words = nama.split(/\s+/).filter(Boolean);
    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }

    return (words[0][0] + words[1][0]).toUpperCase();
  }, [user]);

  const roleLabel = useMemo(() => {
    switch (user?.role) {
      case "kasi_pelayanan":
        return "Kasi Pelayanan";
      case "admin_pelayanan":
        return "Admin Pelayanan";
      default:
        return "Pengguna";
    }
  }, [user]);

  const isEditProfile = location.pathname.startsWith("/edit-profile");

  const left = (
    <div className="flex flex-col">
      <span className="mb-2 inline-flex w-fit items-center gap-2 rounded-full border border-teal-100/70 bg-white/12 px-3 py-1 text-xs font-bold text-teal-50 shadow-sm backdrop-blur">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.9)]" />
        Sistem Antrian Digital
      </span>

      <h1 className="m-0 text-2xl font-extrabold tracking-tight text-white">
        {title}
      </h1>

      <span className="mt-1 text-sm font-medium text-teal-50/75">
        {dateStr}
      </span>
    </div>
  );

  const right = (
    <div className="flex items-center gap-3">
      <div className="hidden items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-sm font-semibold text-teal-50 shadow-sm backdrop-blur sm:flex">
        <i className="pi pi-map-marker text-xs text-emerald-300" />
        Kecamatan Jiwan
      </div>

      <div className="flex items-center gap-3 rounded-3xl border border-white/15 bg-white/95 px-3 py-2 shadow-[0_12px_34px_rgba(0,0,0,0.18)]">
        <Avatar
          label={initials}
          shape="circle"
          className="h-[48px] w-[48px] border-2 border-teal-100 bg-[#0f766e] text-white shadow-sm"
        />

        <div className="hidden text-right leading-tight sm:block">
          <strong className="block text-[15px] font-extrabold text-slate-900">
            {user?.nama || "Pengguna"}
          </strong>
          <small className="block text-xs font-bold text-[#0f766e]">
            {roleLabel}
          </small>
        </div>
      </div>

      <button
        type="button"
        title="Edit profil"
        aria-label="Edit profil"
        onClick={() => navigate("/edit-profile")}
        className={[
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border shadow-sm transition-all duration-200",
          isEditProfile
            ? "border-white bg-white text-[#073b3a] shadow-lg shadow-black/20"
            : "border-white/20 bg-white/10 text-white backdrop-blur hover:-translate-y-[1px] hover:bg-white hover:text-[#073b3a] hover:shadow-lg hover:shadow-black/20",
        ].join(" ")}
      >
        <i className="pi pi-user-edit text-sm" />
      </button>
    </div>
  );

  return (
    <header className="sticky top-0 z-40 overflow-hidden border-b border-teal-950/40 bg-[#073b3a] px-7 py-4 shadow-[0_10px_32px_rgba(2,6,23,0.22)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(45,212,191,0.24),transparent_32%),linear-gradient(90deg,rgba(6,78,75,1),rgba(6,47,51,1))]" />

      <Toolbar
        left={left}
        right={right}
        className="relative z-10 w-full border-none bg-transparent p-0 shadow-none"
      />
    </header>
  );
}