import { useEffect, useState } from "react";
import axios from "axios";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";

const API_BASE = import.meta.env.VITE_API_URL;
const API_JENIS = `${API_BASE}/api/jenis-pelayanan`;

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
    onSubmit({
      jenis_pelayanan: kebutuhan?.nama,
    });
  };

  return (
    <div className="mt-5">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-[1.2fr_1fr]">
        {/* Kiri */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600">
              Nama Lengkap
            </label>
            <InputText
              value={data?.nama || ""}
              readOnly
              className="mt-2 w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600">
              No. HP
            </label>
            <InputNumber
              value={data?.nohp || ""}
              readOnly
              className="mt-2 w-full"
              useGrouping={false}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600">
              Alamat Lengkap
            </label>
            <InputTextarea
              value={data?.alamat || ""}
              readOnly
              rows={7}
              autoResize={false}
              className="mt-2 w-full"
            />
          </div>
        </div>

        {/* Kanan */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600">
              NIK
            </label>
            <InputText
              value={data?.nik || ""}
              readOnly
              className="mt-2 w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600">
              Umur
            </label>
            <InputNumber
              value={typeof data?.umur === "number" ? data.umur : null}
              readOnly
              disabled
              className="mt-2 w-full"
              inputClassName="w-full"
              useGrouping={false}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600">
              Jenis Pelayanan
            </label>

            <Dropdown
              value={kebutuhan}
              options={opsiJenis}
              optionLabel="nama"
              placeholder={loadingJenis ? "Memuat..." : "Pilih jenis pelayanan"}
              onChange={(e) => setKebutuhan(e.value)}
              className="mt-2 w-full"
              disabled={loading || loadingJenis}
              showClear
              filter
              filterPlaceholder="Cari jenis..."
            />
          </div>
        </div>
      </div>

      {/* Aksi */}
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
        <Button
          type="button"
          label="Batal"
          icon="pi pi-times"
          severity="danger"
          outlined
          className="sm:w-44"
          onClick={onBatal}
          disabled={loading}
        />

        <Button
          type="button"
          label={loading ? "Process..." : "Daftar"}
          icon={loading ? "pi pi-spin pi-spinner" : "pi pi-check"}
          className="sm:w-44"
          onClick={submit}
          disabled={loading || !kebutuhan}
        />
      </div>

      {/* Hint kecil */}
      {!kebutuhan && (
        <div className="mt-3 text-center text-xs text-slate-500">
          Pilih <span className="font-semibold">Jenis Pelayanan</span> dulu untuk melanjutkan.
        </div>
      )}
    </div>
  );
}
