import { useEffect, useRef, useState } from "react";
import { Dropdown } from "primereact/dropdown";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Calendar } from "primereact/calendar";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { showAppToast } from "../../utils/toast";
import {
  listJenisPelayanan,
  createJenisPelayanan,
} from "../../api";

export default function FormPengunjungBaru({
  loading,
  onBatal,
  onSubmit,
  nikAwal = "",
  tanpaKtp = false,
  wajibNik = true,
}) {
  const toastRef = useRef(null);

  const [form, setForm] = useState({
    nik: "",
    nama: "",
    nohp: "",
    tanggal_lahir: null,
    alamat: "",
    jenis_pelayanan: null,
  });

  const [opsiJenis, setOpsiJenis] = useState([]);
  const [loadingJenis, setLoadingJenis] = useState(false);
  const [showDialogJenis, setShowDialogJenis] = useState(false);
  const [jenisBaru, setJenisBaru] = useState("");
  const [savingJenis, setSavingJenis] = useState(false);

  useEffect(() => {
    if (tanpaKtp && form.nik) {
      setForm((prev) => ({ ...prev, nik: "" }));
      return;
    }

    if (nikAwal && !form.nik) {
      setForm((prev) => ({ ...prev, nik: nikAwal }));
    }
  }, [nikAwal, form.nik, tanpaKtp]);

  const loadJenis = async () => {
    setLoadingJenis(true);
    try {
      const res = await listJenisPelayanan();
      const arr = Array.isArray(res) ? res : res?.data || [];
      setOpsiJenis(arr.map((x) => ({ id: x.id, nama: x.nama })));
    } catch (e) {
      console.error("Gagal ambil jenis pelayanan:", e);
      showAppToast(toastRef, "error", "Gagal memuat jenis pelayanan.");
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
      const res = await createJenisPelayanan({ nama });
      const newItem = res?.data || res || { id: null, nama };

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

      showAppToast(toastRef, "success", "Jenis pelayanan berhasil ditambahkan.");
    } catch (e) {
      console.error("Gagal tambah jenis pelayanan:", e);
      showAppToast(
        toastRef,
        "error",
        e?.response?.data?.message || "Gagal menambahkan jenis pelayanan."
      );
    } finally {
      setSavingJenis(false);
    }
  };

  const submit = () => {
    onSubmit({
      ...form,
      tanpa_ktp: tanpaKtp,
      nik: tanpaKtp ? "" : form.nik,
      jenis_pelayanan_id: form.jenis_pelayanan?.id ?? null,
      jenis_pelayanan: form.jenis_pelayanan?.nama ?? "",
    });
  };

  const disabledAll = loading || loadingJenis;

  return (
    <div>
      <Toast ref={toastRef} />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-[1.2fr_1fr]">
        <div className="space-y-4">
          <div>
            <div className="text-base font-bold text-slate-900">
              Identitas Pengunjung
            </div>
            <div className="mt-1 text-sm text-slate-500">
              Lengkapi data dasar warga yang akan mengambil antrian.
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600">
              Nama
            </label>
            <InputText
              value={form.nama}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, nama: e.target.value }))
              }
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
              onChange={(e) =>
                setForm((prev) => ({ ...prev, nohp: e.target.value }))
              }
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
              onChange={(e) =>
                setForm((prev) => ({ ...prev, alamat: e.target.value }))
              }
              rows={7}
              className="mt-2 w-full"
              placeholder="Masukkan alamat lengkap"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="text-base font-bold text-slate-900">
              Kebutuhan Pelayanan
            </div>
            <div className="mt-1 text-sm text-slate-500">
              Pilih jenis layanan sebelum mencetak nomor antrian.
            </div>
          </div>

          {!tanpaKtp ? (
            <div>
              <label className="block text-xs font-semibold text-slate-600">
                NIK
              </label>
              <InputText
                value={form.nik}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, nik: e.target.value }))
                }
                className="mt-2 w-full"
                placeholder="Masukkan NIK"
              />
              <div className="mt-2 text-xs text-slate-500">
                NIK dipakai untuk mencegah data ganda saat kartu/UID terbaca di lain waktu.
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Pendaftaran ini tidak memakai NIK atau UID. Gunakan hanya untuk warga yang belum memiliki KTP/NIK.
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600">
              Tanggal Lahir
            </label>
            <Calendar
              value={form.tanggal_lahir}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, tanggal_lahir: e.value }))
              }
              dateFormat="yy-mm-dd"
              showIcon
              className="mt-2 w-full"
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
                  setForm((prev) => ({ ...prev, jenis_pelayanan: e.value }))
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

      <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-center">
        <Button
          label="Batal"
          icon="pi pi-times"
          severity="secondary"
          outlined
          className="w-full sm:w-44"
          onClick={onBatal}
          disabled={loading}
        />

        <Button
          label={loading ? "Memproses..." : "Daftar"}
          icon={loading ? "pi pi-spin pi-spinner" : "pi pi-check"}
          className="w-full sm:w-44"
          onClick={submit}
          disabled={
            loading ||
            !form.nama.trim() ||
            (wajibNik && !form.nik.trim()) ||
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
