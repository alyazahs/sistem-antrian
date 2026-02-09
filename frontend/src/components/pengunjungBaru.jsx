import { useEffect, useState } from "react";
import axios from "axios";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";

const API_BASE = import.meta.env.VITE_API_URL;
const API = `${API_BASE}/api/jenis-pelayanan`;

export default function FormPengunjungBaru({
  loading,
  onBatal,
  onSubmit,
  nikAwal = "",
}) {
  const [form, setForm] = useState({
    nik: "",
    nama: "",
    nohp: "",
    umur: null,
    alamat: "",
    jenis_pelayanan: null, // {id,nama}
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
        const arr = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setOpsiJenis(arr.map((x) => ({ id: x.id, nama: x.nama })));
      } catch (e) {
        console.error("Gagal ambil jenis pelayanan:", e);
      } finally {
        setLoadingJenis(false);
      }
    })();
  }, []);

  const submit = () => {
    onSubmit({
      ...form,
      jenis_pelayanan_id: form.jenis_pelayanan?.id ?? null,
      jenis_pelayanan: form.jenis_pelayanan?.nama ?? "",
    });
  };

  const disabledAll = loading || loadingJenis;

  return (
    <div className="mt-5">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-[1.2fr_1fr]">
        {/* KIRI */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600">
              Nama
            </label>
            <InputText
              value={form.nama}
              onChange={(e) => setForm((p) => ({ ...p, nama: e.target.value }))}
              className="mt-2 w-full"
              placeholder="Masukkan nama lengkap"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600">
              No. HP
            </label>
            <InputNumber
              value={form.nohp}
              onValueChange={(e) => setForm((p) => ({ ...p, nohp: e.value }))}
              className="mt-2 w-full"
              useGrouping={false}
              placeholder="08xxxxxxxxxx"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600">
              Alamat Lengkap
            </label>
            <InputTextarea
              value={form.alamat}
              onChange={(e) => setForm((p) => ({ ...p, alamat: e.target.value }))}
              rows={7}
              className="mt-2 w-full"
              placeholder="Masukkan alamat lengkap"
            />
          </div>
        </div>

        {/* KANAN */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600">
              NIK
            </label>
            <InputNumber
              value={form.nik}
              onValueChange={(e) => setForm((p) => ({ ...p, nik: e.value }))}
              className="mt-2 w-full"
              useGrouping={false}
              placeholder="Masukkan NIK (wajib jika RFID tidak ada)"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600">
              Umur
            </label>
            <InputNumber
              value={form.umur}
              onValueChange={(e) =>
                setForm((p) => ({ ...p, umur: e.value }))
              }
              className="mt-2 w-full"
              inputClassName="w-full"
              useGrouping={false}
              placeholder="Masukkan umur"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600">
              Jenis Pelayanan
            </label>
            <Dropdown
              value={form.jenis_pelayanan}
              options={opsiJenis}
              optionLabel="nama"
              placeholder={loadingJenis ? "Memuat..." : "Pilih jenis pelayanan"}
              onChange={(e) =>
                setForm((p) => ({ ...p, jenis_pelayanan: e.value }))
              }
              className="mt-2 w-full"
              disabled={disabledAll}
              showClear
              filter
            />
          </div>
        </div>
      </div>

      {/* AKSI */}
      <div className="mt-6 flex justify-center gap-5">
        <Button
          label="Batal"
          severity="secondary"
          outlined
          className="w-40"
          onClick={onBatal}
          disabled={loading}
        />

        <Button
          label={loading ? "PROCESS..." : "DAFTAR"}
          className="w-40"
          onClick={submit}
          disabled={
            loading ||
            !form.nama.trim() ||
            !form.nik.trim() ||
            !form.jenis_pelayanan
          }
        />
      </div>
    </div>
  );
}