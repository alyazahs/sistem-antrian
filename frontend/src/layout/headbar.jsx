import { useEffect, useMemo, useState } from "react";
import { Toolbar } from "primereact/toolbar";
import { Avatar } from "primereact/avatar";

export default function Headbar({ title, user = null }) {
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    const now = new Date();
    const options = {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    };
    setDateStr(now.toLocaleDateString("id-ID", options));
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