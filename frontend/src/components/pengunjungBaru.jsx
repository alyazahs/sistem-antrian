import { useEffect, useState } from "react";
import { Dropdown } from "primereact/dropdown";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL;
const API = `${API_BASE}/api/jenis-pelayanan`;


export default function FormPengunjungBaru({
  loading,
  onBatal,
  onSubmit,
  nikAwal = "",
}) {
  const [form, setForm] = useState({
    nik: "%B",
    nama: "",
    nohp: "",
    umur: "",
    alamat: "",
    kebutuhan: null, // simpan object {id,nama} atau id (sesuai kebutuhan)
  });

  const [opsiJenis, setOpsiJenis] = useState([]);
  const [loadingJenis, setLoadingJenis] = useState(false);

  useEffect(() => {
    if (nikAwal && !form.nik) {
      setForm((p) => ({ ...p, nik: nikAwal }));
    }
  }, [nikAwal]);

  useEffect(() => {
    (async () => {
      setLoadingJenis(true);
      try {
        const res = await axios.get(API);
        const arr = Array.isArray(res.data) ? res.data : res.data.data || [];
        // mapping untuk Dropdown
        setOpsiJenis(
          arr.map((x) => ({
            id: x.id,
            nama: x.nama,
          }))
        );
      } catch (e) {
        console.error("Gagal ambil jenis pelayanan:", e);
      } finally {
        setLoadingJenis(false);
      }
    })();
  }, []);

  const isi = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const submit = () => {
    onSubmit({
      ...form,
      jenis_pelayanan_id: form.kebutuhan?.id ?? null,
      jenis_pelayanan: form.kebutuhan?.nama ?? "",
    });
  };

  return (
    <div className="mt-5">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-[1.2fr_1fr]">
        <div>
          <label className="mt-2 block text-xs font-semibold text-slate-600">
            Nama
          </label>
          <input
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
            value={form.nama}
            onChange={isi("nama")}
            placeholder="Masukkan nama lengkap"
          />

          <label className="mt-4 block text-xs font-semibold text-slate-600">
            No. HP
          </label>
          <input
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
            value={form.nohp}
            onChange={isi("nohp")}
            placeholder="08xxxxxxxxxx (opsional)"
          />

          <label className="mt-4 block text-xs font-semibold text-slate-600">
            Alamat Lengkap
          </label>
          <textarea
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
            value={form.alamat}
            onChange={isi("alamat")}
            rows={7}
            placeholder="Masukkan alamat lengkap"
          />
        </div>

        <div>
          <label className="mt-2 block text-xs font-semibold text-slate-600">
            NIK
          </label>
          <input
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
            value={form.nik}
            onChange={isi("nik")}
            placeholder="Masukkan NIK (wajib jika RFID tidak ada)"
          />

          <label className="mt-4 block text-xs font-semibold text-slate-600">
            Umur
          </label>
          <input
            type="number"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
            value={form.umur}
            onChange={isi("umur")}
            placeholder="Masukkan umur"
          />

          <label className="mt-4 block text-xs font-semibold text-slate-600">
            Jenis Pelayanan
          </label>
            <Dropdown
              value={form.kebutuhan}
              options={opsiJenis}
              optionLabel="nama"
              placeholder={loadingJenis ? "Memuat..." : "Pilih jenis pelayanan"}
              onChange={(e) => setForm((p) => ({ ...p, kebutuhan: e.value }))}
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
          disabled={loading || !form.nama.trim() || !form.nik.trim() || !form.kebutuhan}
          className="w-40 rounded-xl border border-emerald-300 bg-emerald-200 px-4 py-3 text-sm font-extrabold text-emerald-800 hover:bg-emerald-300 disabled:opacity-70"
          type="button"
        >
          {loading ? "PROCESS..." : "DAFTAR"}
        </button>
      </div>
    </div>
  );
}