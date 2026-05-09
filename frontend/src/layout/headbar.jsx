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
      <span className="mb-1 inline-flex w-fit items-center rounded-full bg-[#2BB0A6]/10 px-3 py-1 text-xs font-semibold text-[#16877F]">
        Sistem Antrian Digital
      </span>
      <h1 className="m-0 text-2xl font-extrabold tracking-tight text-slate-800">
        {title}
      </h1>
      <span className="mt-1 text-sm text-slate-500">{dateStr}</span>
    </div>
  );

  const right = (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/70 px-3 py-2 shadow-sm backdrop-blur-sm">
        <Avatar
          label={initials}
          shape="circle"
          className="h-[46px] w-[46px] border-2 border-[#2BB0A6]/20 bg-[#2BB0A6] text-white shadow-sm"
        />
        <div className="text-right leading-tight">
          <strong className="block text-[15px] font-bold text-slate-800">
            {user?.nama || "Pengguna"}
          </strong>
          <small className="block text-xs font-medium text-[#16877F]">
            {roleLabel}
          </small>
          <small className="block text-xs text-slate-500">
            Kecamatan Jiwan
          </small>
        </div>
      </div>

      <button
        type="button"
        title="Edit profil"
        aria-label="Edit profil"
        onClick={() => navigate("/edit-profile")}
        className={[
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border shadow-sm transition",
          isEditProfile
            ? "border-[#2BB0A6] bg-[#2BB0A6] text-white"
            : "border-white/70 bg-white/80 text-slate-700 hover:-translate-y-[1px] hover:bg-white hover:text-[#16877F]",
        ].join(" ")}
      >
        <i className="pi pi-chevron-down text-xs" />
      </button>
    </div>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-white/40 bg-gradient-to-r from-[#D9F1ED] via-[#E9F8F5] to-[#F6FFFD] px-7 py-4 shadow-sm backdrop-blur-sm">
      <Toolbar
        left={left}
        right={right}
        className="w-full border-none bg-transparent p-0 shadow-none"
      />
    </header>
  );
}