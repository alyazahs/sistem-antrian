import { useCallback, useEffect, useRef, useState } from "react";
import { scanRfid, daftarPengunjung, ambilAntrian, cariNIK } from "../api";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Message } from "primereact/message";
import { ProgressSpinner } from "primereact/progressspinner";
import FormPengunjungBaru from "../components/pendaftaran/pengunjungBaru";
import FormPengunjungDitemukan from "../components/pendaftaran/pengunjungDitemukan";
import { showAppToast } from "../utils/toast";

const STATUS_LABELS = {
  idle: "Menunggu",
  scanning: "Sedang Memindai",
  terdaftar: "Pengunjung Ditemukan",
  belum_terdaftar: "Belum Terdaftar",
  tanpa_ktp: "Antrian Tanpa KTP",
  error: "Terjadi Kesalahan",
};

const STATUS_BADGES = {
  idle: "bg-slate-100 text-slate-700 ring-slate-200",
  scanning: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  terdaftar: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  belum_terdaftar: "bg-amber-50 text-amber-700 ring-amber-200",
  tanpa_ktp: "bg-blue-50 text-blue-700 ring-blue-200",
  error: "bg-red-50 text-red-700 ring-red-200",
};

export default function Pendaftaran() {
  const toastRef = useRef(null);

  const [statusScan, setStatusScan] = useState("idle"); 
  const [pesanScan, setPesanScan] = useState("Menunggu tap e-KTP...");
  const [rfidUid, setRfidUid] = useState("");
  const [pengunjung, setPengunjung] = useState(null);
  const [nikCari, setNikCari] = useState("");
  const [loadingCari, setLoadingCari] = useState(false);
  const [loading, setLoading] = useState(false);

  const mulaiScan = useCallback(() => {
    setStatusScan("scanning");
    setPesanScan("Memindai...");
    setRfidUid("");
    setPengunjung(null);
  }, []);

  const reset = useCallback(() => {
    setStatusScan("idle");
    setPesanScan("Menunggu tap e-KTP...");
    setRfidUid("");
    setPengunjung(null);
    setNikCari("");
    setLoading(false);
    setLoadingCari(false);
  }, []);

  const mulaiTanpaKtp = useCallback(() => {
    setStatusScan("tanpa_ktp");
    setPesanScan("Mode antrian tanpa KTP. Isi data pengunjung secara manual.");
    setRfidUid("");
    setPengunjung(null);
    setNikCari("");
  }, []);

  // polling scan rfid
  useEffect(() => {
    if (statusScan !== "scanning") return;

    let stop = false;

    const t = setInterval(async () => {
      if (stop) return;

      try {
        const res = await scanRfid();

        if (res?.status === "no_card") {
          setPesanScan("Menunggu tap e-KTP...");
          return;
        }

        if (res?.status === "registered") {
          stop = true;
          clearInterval(t);

          const data = res.pengunjung;
          setPengunjung(data || null);
          setRfidUid(data?.rfid_uid || "");
          setStatusScan("terdaftar");
          setPesanScan(`Kartu terdeteksi: ${data?.rfid_uid || "-"} (sudah terdaftar)`);
          showAppToast(toastRef, "success", "Data pengunjung ditemukan.");
          return;
        }

        if (res?.status === "not_registered") {
          stop = true;
          clearInterval(t);

          setPengunjung(null);
          setRfidUid(res.rfid_uid || "");
          setStatusScan("belum_terdaftar");
          setPesanScan(`Kartu terdeteksi: ${res.rfid_uid || "-"} (belum terdaftar)`);
          showAppToast(toastRef, "warn", "Kartu terdeteksi tapi belum terdaftar.");
          return;
        }

        setPesanScan("Menunggu tap e-KTP...");
      } catch (e) {
        console.error(e);
        setStatusScan("error");
        setPesanScan("Terjadi error saat scan. Coba lagi.");
        showAppToast(toastRef, "error", "Error saat memindai e-KTP.");
      }
    }, 900);

    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [statusScan]);

  // cari nik manual
  const handleCariNIK = async () => {
    const nik = nikCari.trim();
    if (!nik) return showAppToast(toastRef, "warn", "Masukkan NIK untuk mencari.");

    setLoadingCari(true);
    try {
      const res = await cariNIK(nik);

      if (!res?.success) {
        showAppToast(toastRef, "error", res?.message || "Gagal mencari NIK.");
        return;
      }

      if (res.found) {
        const data = res.pengunjung;
        setPengunjung(data);
        setRfidUid(data?.rfid_uid || "");
        setStatusScan("terdaftar");
        setPesanScan("Data ditemukan melalui pencarian NIK.");
        showAppToast(toastRef, "success", "Data pengunjung ditemukan.");
      } else {
        setPengunjung(null);
        setStatusScan("belum_terdaftar");
        setPesanScan("NIK tidak ditemukan. Silakan isi data pengunjung baru.");
        showAppToast(toastRef, "warn", "NIK tidak ditemukan. Silakan daftar.");
      }
    } catch (e) {
      console.error(e);
      showAppToast(toastRef, "error", "Error cari NIK (cek endpoint /api/cari-nik).");
    } finally {
      setLoadingCari(false);
    }
  };

  // daftar baru + ambil antrian
  const submitPengunjungBaru = async (form) => {
    const nama = (form.nama || "").trim();
    const nik = (form.nik || "").trim();

    const jenis =
      typeof form.jenis_pelayanan === "string"
        ? form.jenis_pelayanan.trim()
        : form.jenis_pelayanan?.nama || "";
    const tanpaKtp = !!form.tanpa_ktp;

    if (!nama) return showAppToast(toastRef, "warn", "Nama wajib diisi.");
    if (!jenis) return showAppToast(toastRef, "warn", "Jenis pelayanan wajib diisi.");
    if (!tanpaKtp && !nik) {
      return showAppToast(
        toastRef,
        "warn",
        "NIK wajib untuk pendaftaran KTP. Gunakan Antrian Tanpa KTP jika belum punya NIK."
      );
    }

    setLoading(true);
    try {
      const reg = await daftarPengunjung({
        rfid_uid: tanpaKtp ? null : rfidUid || null,
        nik: tanpaKtp ? null : nik || null,
        tanpa_ktp: tanpaKtp,
        nama,
        nohp: (form.nohp || "").trim() || null,
        tanggal_lahir: form.tanggal_lahir || null,
        alamat: (form.alamat || "").trim() || null,
      });

      const dataPengunjung = reg?.pengunjung;
      setPengunjung(dataPengunjung || null);

      if (!dataPengunjung?.id) {
        throw new Error("Data pengunjung belum berhasil dibuat.");
      }

      const payloadAntrian = {
        pengunjung_id: dataPengunjung.id,
        jenis_pelayanan: jenis,
      };

      const q = await ambilAntrian(payloadAntrian);

      showAppToast(toastRef, "success", `Berhasil! Nomor antrian: ${q.nomor_antrian ?? "-"}`);
      reset();
    } catch (e) {
      console.error(e);
      showAppToast(toastRef, "error", e?.response?.data?.message || "Gagal daftar/ambil antrian.");
    } finally {
      setLoading(false);
    }
  };

  // pengunjung ditemukan: ambil antrian
  const submitPengunjungDitemukan = async (form) => {
    const jenis =
      typeof form.jenis_pelayanan === "string"
        ? form.jenis_pelayanan.trim()
        : form.jenis_pelayanan?.nama || "";

    if (!jenis) return showAppToast(toastRef, "warn", "Jenis pelayanan wajib diisi.");

    setLoading(true);
    try {
      const payload = pengunjung?.id
        ? { pengunjung_id: pengunjung.id, jenis_pelayanan: jenis }
        : rfidUid
        ? { rfid_uid: rfidUid, jenis_pelayanan: jenis }
        : { nik: (pengunjung?.nik || "").trim(), jenis_pelayanan: jenis };

      const q = await ambilAntrian(payload);

      showAppToast(toastRef, "success", `Berhasil! Nomor antrian: ${q.nomor_antrian ?? "-"}`);
      reset();
    } catch (e) {
      console.error(e);
      showAppToast(toastRef, "error", e?.response?.data?.message || "Gagal ambil nomor antrian.");
    } finally {
      setLoading(false);
    }
  };

  const tanpaKtp = statusScan === "tanpa_ktp";
  const tampilBaru = statusScan === "belum_terdaftar" || tanpaKtp;
  const tampilDitemukan = statusScan === "terdaftar" && (pengunjung || rfidUid);
  const statusBadgeClass = STATUS_BADGES[statusScan] || STATUS_BADGES.idle;
  const canReset = statusScan !== "idle" || Boolean(nikCari || rfidUid || pengunjung);

  return (
    <div className="card">
      <Toast ref={toastRef} />

      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Pendaftaran</h1>
          <p className="mt-1 text-sm text-slate-500">
            Identifikasi pengunjung, lengkapi data, lalu ambil nomor antrian.
          </p>
        </div>

        <span
          className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ring-1 ${statusBadgeClass}`}
        >
          <span className="h-2 w-2 rounded-full bg-current" />
          {STATUS_LABELS[statusScan]}
        </span>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between"></div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="text-lg font-bold text-slate-900">
                Identifikasi Pengunjung
              </div>
              <div className="mt-1 text-sm text-slate-500">
                Gunakan scan e-KTP, cari NIK manual, atau mode tanpa KTP.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
            <span className="p-input-icon-left min-w-0">
              <i className="pi pi-search ml-2" />
              <InputText
                value={nikCari}
                onChange={(e) => setNikCari(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCariNIK();
                }}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={16}
                placeholder="Cari nomor NIK jika kartu tidak terbaca"
                className="w-full pl-8"
                disabled={loading || statusScan === "scanning"}
              />
            </span>

            <Button
              type="button"
              onClick={handleCariNIK}
              disabled={loadingCari || loading || statusScan === "scanning"}
              icon={loadingCari ? "pi pi-spin pi-spinner" : "pi pi-search"}
              label={loadingCari ? "Mencari..." : "Cari"}
              className="w-full lg:w-auto"
            />

            <Button
              type="button"
              onClick={mulaiTanpaKtp}
              disabled={loading || loadingCari || statusScan === "scanning"}
              icon="pi pi-user-plus"
              label="Tanpa KTP"
              severity="secondary"
              outlined
              className="w-full lg:w-auto"
            />
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white text-slate-600 ring-1 ring-slate-200">
                {statusScan === "scanning" ? (
                  <ProgressSpinner style={{ width: "22px", height: "22px" }} strokeWidth="6" />
                ) : (
                  <i className="pi pi-id-card" />
                )}
              </div>

              <div className="min-w-0">
                <div className="break-words text-sm font-medium text-slate-800">
                  {pesanScan}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  RFID: <span className="font-semibold">{rfidUid || "-"}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {canReset && (
                <Button
                  type="button"
                  label="Reset"
                  icon="pi pi-refresh"
                  severity="secondary"
                  outlined
                  onClick={reset}
                  disabled={loading || loadingCari}
                  className="w-full sm:w-auto"
                />
              )}

              <Button
                type="button"
                label={statusScan === "scanning" ? "Scanning..." : "Mulai Scan"}
                icon={statusScan === "scanning" ? "pi pi-spin pi-spinner" : "pi pi-id-card"}
                onClick={mulaiScan}
                disabled={statusScan === "scanning" || loading}
                className="w-full sm:w-auto"
              />
            </div>
          </div>
        </div>

      <div className="mt-5 space-y-4">
        {statusScan === "belum_terdaftar" && (
          <Message
            severity="warn"
            text="Data pengunjung tidak ditemukan. Isi NIK agar data lama bisa terhubung jika kartu pernah didaftarkan manual."
          />
        )}

        {tanpaKtp && (
          <Message
            severity="info"
            text="Mode tanpa KTP digunakan untuk warga yang belum punya NIK/KTP. Data dibuat manual dan antrian tetap bisa diambil."
          />
        )}

        {tampilDitemukan && (
          <Message
            severity="success"
            text={`Data pengunjung ditemukan. RFID: ${rfidUid || "-"} | NIK: ${pengunjung?.nik || "-"}`}
          />
        )}

        {tampilBaru && (
          <FormPengunjungBaru
            loading={loading}
            onBatal={reset}
            onSubmit={submitPengunjungBaru}
            nikAwal={nikCari}
            tanpaKtp={tanpaKtp}
            wajibNik={!tanpaKtp}
          />
        )}

        {tampilDitemukan && (
          <FormPengunjungDitemukan
            loading={loading}
            onBatal={reset}
            onSubmit={submitPengunjungDitemukan}
            data={{
              nik: pengunjung?.nik || "",
              nama: pengunjung?.nama || "",
              nohp: pengunjung?.nohp || "",
              tanggal_lahir: pengunjung?.tanggal_lahir || "",
              alamat: pengunjung?.alamat || "",
            }}
          />
        )}
      </div>
    </div>
  );
}