import { useEffect, useState } from "react";
import axios from "axios";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";

const API_BASE = import.meta.env.VITE_API_URL;
const API_JENIS = `${API_BASE}/api/jenis-pelayanan`;

export default function FormPengunjungDitemukan({
  loading,
  onBatal,
  onSubmit,
  data,
}) {
  const [kebutuhan, setKebutuhan] = useState(null);
  const [opsiJenis, setOpsiJenis] = useState([]);
  const [loadingJenis, setLoadingJenis] = useState(false);

  const [showDialogJenis, setShowDialogJenis] = useState(false);
  const [jenisBaru, setJenisBaru] = useState("");
  const [savingJenis, setSavingJenis] = useState(false);

  useEffect(() => {
    setKebutuhan(null);
  }, [data?.id, data?.nik, data?.rfid_uid]);

  const loadJenis = async () => {
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
  };

  useEffect(() => {
    loadJenis();
  }, []);

  const submit = () => {
    onSubmit({
      jenis_pelayanan: kebutuhan?.nama,
      jenis_pelayanan_id: kebutuhan?.id ?? null,
    });
  };

  const handleTambahJenis = async () => {
    const nama = jenisBaru.trim();
    if (!nama) return;

    setSavingJenis(true);
    try {
      const res = await axios.post(API_JENIS, { nama });

      const newItem =
        res?.data?.data ||
        res?.data || {
          id: null,
          nama,
        };

      await loadJenis();

      setKebutuhan({
        id: newItem.id,
        nama: newItem.nama || nama,
      });

      setJenisBaru("");
      setShowDialogJenis(false);
      alert("Jenis pelayanan berhasil ditambahkan.");
    } catch (e) {
      console.error("Gagal tambah jenis pelayanan:", e);
      alert(
        e?.response?.data?.message || "Gagal menambahkan jenis pelayanan."
      );
    } finally {
      setSavingJenis(false);
    }
  };

  return (
    <div className="mt-5">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-[1.2fr_1fr]">
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
              Tanggal Lahir
            </label>
            <InputNumber
              value={typeof data?.tanggal_lahir === "string" ? data.tanggal_lahir : null}
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

            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <div className="min-w-0 flex-1">
                <Dropdown
                  value={kebutuhan}
                  options={opsiJenis}
                  optionLabel="nama"
                  placeholder={loadingJenis ? "Memuat..." : "Pilih jenis pelayanan"}
                  onChange={(e) => setKebutuhan(e.value)}
                  className="w-full"
                  disabled={loading || loadingJenis}
                  showClear
                  filter
                  filterPlaceholder="Cari jenis..."
                />
              </div>

              <Button
                type="button"
                icon="pi pi-plus"
                outlined
                tooltip="Tambah jenis pelayanan"
                onClick={() => setShowDialogJenis(true)}
                disabled={loading || loadingJenis}
                className="w-full sm:w-auto sm:flex-shrink-0"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button
          type="button"
          label="Batal"
          icon="pi pi-times"
          severity="danger"
          outlined
          className="w-full sm:w-44"
          onClick={onBatal}
          disabled={loading}
        />

        <Button
          type="button"
          label={loading ? "Process..." : "Daftar"}
          icon={loading ? "pi pi-spin pi-spinner" : "pi pi-check"}
          className="w-full sm:w-44"
          onClick={submit}
          disabled={loading || !kebutuhan}
        />
      </div>

      {!kebutuhan && (
        <div className="mt-3 text-center text-xs text-slate-500">
          Pilih <span className="font-semibold">Jenis Pelayanan</span> dulu untuk melanjutkan.
        </div>
      )}

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