import { useEffect, useState } from "react";

export default function Headbar({ title = "Pendaftaran Pengunjung" }) {
  const [dateText, setDateText] = useState("–");

  useEffect(() => {
    const format = () =>
      new Intl.DateTimeFormat("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date());

    setDateText(format());
    const t = setInterval(() => setDateText(format()), 60_000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-8 py-5">
      <div className="min-w-0">
        <h3 className="truncate text-lg font-extrabold text-slate-800">
          {title}
        </h3>
        <span className="mt-1 inline-block text-sm font-semibold text-slate-500">
          {dateText}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-3">
          <img
            className="h-10 w-10 rounded-full"
            src="https://i.pravatar.cc/40?img=12"
            alt="Admin"
          />
          <div className="leading-tight">
            <strong className="block text-[15px] text-slate-800">
              Admin Pelayanan
            </strong>
            <small className="block text-sm font-semibold text-slate-500">
              Kecamatan Jiwan
            </small>
          </div>
        </div>
      </div>
    </header>
  );
}