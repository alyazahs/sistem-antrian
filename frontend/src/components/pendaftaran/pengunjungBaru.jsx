import { useEffect, useState } from "react";
import axios from "axios";
import { Dropdown } from "primereact/dropdown";
import { Dialog } from "primereact/dialog";
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
    jenis_pelayanan: null,
  });

  const [opsiJenis, setOpsiJenis] = useState([]);
  const [loadingJenis, setLoadingJenis] = useState(false);
  const [showDialogJenis, setShowDialogJenis] = useState(false);
  const [jenisBaru, setJenisBaru] = useState("");
  const [savingJenis, setSavingJenis] = useState(false);

  useEffect(() => {
    if (nikAwal && !form.nik) {
      setForm((p) => ({ ...p, nik: nikAwal }));
    }
  }, [nikAwal]);

  const loadJenis = async () => {
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
  };

  useEffect(() => {
    loadJenis();
  }, []);

  const handleTambahJenis = async () => {
    const nama = jenisBaru.trim();
    if (!nama) return;

    setSavingJenis(true);
    try {
      const res = await axios.post(API, { nama });

      const newItem = res?.data?.data || res?.data || { id: null, nama };

      await loadJenis();

      setForm((prev) => ({
        ...prev,
        jenis_pelayanan: {
          id: newItem.id,
          nama: newItem.nama || nama,
        },
      }));

      setJenisBaru("");
      setShowDialogJenis(false);
    } catch (e) {
      console.error("Gagal tambah jenis pelayanan:", e);
      alert(
        e?.response?.data?.message || "Gagal menambahkan jenis pelayanan."
      );
    } finally {
      setSavingJenis(false);
    }
  };

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
            <InputText
              value={form.nohp}
              onChange={(e) => setForm((p) => ({ ...p, nohp: e.target.value }))}
              className="mt-2 w-full"
              placeholder="08xxxxxxxxxx (opsional)"
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

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600">
              NIK
            </label>
            <InputText
              value={form.nik}
              onChange={(e) => setForm((p) => ({ ...p, nik: e.target.value }))}
              className="mt-2 w-full"
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

            <div className="mt-2 flex gap-2">
              <Dropdown
                value={form.jenis_pelayanan}
                options={opsiJenis}
                optionLabel="nama"
                placeholder={loadingJenis ? "Memuat..." : "Pilih jenis pelayanan"}
                onChange={(e) =>
                  setForm((p) => ({ ...p, jenis_pelayanan: e.value }))
                }
                className="w-full"
                disabled={disabledAll}
                showClear
                filter
                filterPlaceholder="Cari jenis..."
              />

              <Button
                type="button"
                icon="pi pi-plus"
                outlined
                tooltip="Tambah jenis pelayanan"
                onClick={() => setShowDialogJenis(true)}
                disabled={disabledAll}
              />
            </div>
          </div>
        </div>
      </div>

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

      <Dialog
        header="Tambah Jenis Pelayanan"
        visible={showDialogJenis}
        style={{ width: "28rem" }}
        onHide={() => {
          if (!savingJenis) {
            setShowDialogJenis(false);
            setJenisBaru("");
          }
        }}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Nama Jenis Pelayanan
            </label>
            <InputText
              value={jenisBaru}
              onChange={(e) => setJenisBaru(e.target.value)}
              className="mt-2 w-full"
              placeholder="Legalisasi Dokumen"
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              label="Batal"
              severity="secondary"
              outlined
              onClick={() => {
                setShowDialogJenis(false);
                setJenisBaru("");
              }}
              disabled={savingJenis}
            />
            <Button
              type="button"
              label={savingJenis ? "Menyimpan..." : "Simpan"}
              icon={savingJenis ? "pi pi-spin pi-spinner" : "pi pi-check"}
              onClick={handleTambahJenis}
              disabled={savingJenis || !jenisBaru.trim()}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}