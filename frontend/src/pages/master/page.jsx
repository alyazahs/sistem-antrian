import { useState } from "react";
import JenisPelayananPage from "./jenis_pelayanan/page";
import IdentitasPage from "./identitas/page";

export default function MasterPage() {
  const [tab, setTab] = useState("jenis");

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h1 className="text-xl font-extrabold text-slate-800">Master Data</h1>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Pengelolaan data master sistem
        </p>

        <div className="mt-4 inline-flex rounded-xl bg-slate-100 p-1">
          <button
            onClick={() => setTab("jenis")}
            className={`px-4 py-2 text-sm font-bold rounded-xl ${
              tab === "jenis"
                ? "bg-white text-blue-600 shadow"
                : "text-slate-600"
            }`}
          >
            Jenis Pelayanan
          </button>
          <button
            onClick={() => setTab("identitas")}
            className={`px-4 py-2 text-sm font-bold rounded-xl ${
              tab === "identitas"
                ? "bg-white text-blue-600 shadow"
                : "text-slate-600"
            }`}
          >
            Identitas
          </button>
        </div>
      </div>

      {tab === "jenis" ? <JenisPelayananPage /> : <IdentitasPage />}
    </div>
  );
}