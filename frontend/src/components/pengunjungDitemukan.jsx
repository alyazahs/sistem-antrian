import { useEffect, useState } from "react";
import { Dropdown } from "primereact/dropdown";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL;
const API_JENIS = `${API_BASE}/master/jenis-pelayanan`;

export default function FormPengunjungDitemukan({
  loading,
  onBatal,
  onSubmit,
  data,
}) {
  const [kebutuhan, setKebutuhan] = useState(null); // {id,nama}
  const [opsiJenis, setOpsiJenis] = useState([]);
  const [loadingJenis, setLoadingJenis] = useState(false);

  useEffect(() => {
    setKebutuhan(null);
  }, [data?.id, data?.nik, data?.rfid_uid]);

  useEffect(() => {
    (async () => {
      setLoadingJenis(true);
      try {
        const res = await axios.get(API_JENIS);
        const arr = Array.isArray(res.data) ? res.data : res.data.data || [];
        setOpsiJenis(arr.map((x) => ({ id: x.id, nama: x.nama })));
      } catch (e) {
        console.error("Gagal ambil jenis pelayanan:", e);
      } finally {
        setLoadingJenis(false);
      }
    })();
  }, []);

  const submit = () => {
    // kirim format yang enak dipakai parent:
    onSubmit({
      jenis_pelayanan_id: kebutuhan?.id ?? null,
      jenis_pelayanan: kebutuhan?.nama ?? "",
    });
  };

  return (
    <div className="mt-5">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-[1.2fr_1fr]">
        <div>
          <label className="mt-2 block text-xs font-semibold text-slate-600">
            Nama Lengkap
          </label>
          <input
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900"
            value={data?.nama || ""}
            readOnly
          />

          <label className="mt-4 block text-xs font-semibold text-slate-600">
            No. HP
          </label>
          <input
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900"
            value={data?.nohp || ""}
            readOnly
          />

          <label className="mt-4 block text-xs font-semibold text-slate-600">
            Alamat Lengkap
          </label>
          <textarea
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900"
            value={data?.alamat || ""}
            readOnly
            rows={7}
          />
        </div>

        <div>
          <label className="mt-2 block text-xs font-semibold text-slate-600">
            NIK
          </label>
          <input
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900"
            value={data?.nik || ""}
            readOnly
          />

          <label className="mt-4 block text-xs font-semibold text-slate-600">
            Umur
          </label>
          <input
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900"
            value={data?.umur ?? ""}
            readOnly
          />

          <label className="mt-4 block text-xs font-semibold text-slate-600">
            Jenis Pelayanan
          </label>
            <Dropdown
              value={kebutuhan}
              options={opsiJenis}
              optionLabel="nama"
              placeholder={loadingJenis ? "Memuat..." : "Pilih jenis pelayanan"}
              onChange={(e) => setKebutuhan(e.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
              disabled={loading || loadingJenis}
              showClear
              filter
            />
          </div>
        </div>

      {/* Aksi */}
      <div className="mt-6 flex justify-center gap-5">
        <button
          onClick={onBatal}
          disabled={loading}
          className="w-40 rounded-xl border border-rose-300 bg-rose-200 px-4 py-3 text-sm font-extrabold text-rose-700 hover:bg-rose-300 disabled:opacity-70"
          type="button"
        >
          BATAL
        </button>

        <button
          onClick={submit}
          disabled={loading}
          className="w-40 rounded-xl border border-emerald-300 bg-emerald-200 px-4 py-3 text-sm font-extrabold text-emerald-800 hover:bg-emerald-300 disabled:opacity-70"
          type="button"
        >
          {loading ? "PROCESS..." : "DAFTAR"}
        </button>
      </div>
    </div>
  );
}