import { useCallback, useEffect, useRef, useState } from "react";
import { scanRfid, daftarPengunjung, ambilAntrian, cariNIK } from "../api";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Message } from "primereact/message";
import { Divider } from "primereact/divider";
import { ProgressSpinner } from "primereact/progressspinner";
import FormPengunjungBaru from "../components/pendaftaran/pengunjungBaru";
import FormPengunjungDitemukan from "../components/pendaftaran/pengunjungDitemukan";
import { showAppToast } from "../utils/toast";

const STATUS_LABELS = {
  idle: "Menunggu",
  scanning: "Sedang Memindai",
  terdaftar: "Pengunjung Ditemukan",
  belum_terdaftar: "Belum Terdaftar",
  error: "Terjadi Kesalahan",
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

    if (!nama) return showAppToast(toastRef, "warn", "Nama wajib diisi.");
    if (!jenis) return showAppToast(toastRef, "warn", "Jenis pelayanan wajib diisi.");
    if (!rfidUid && !nik) return showAppToast(toastRef, "warn", "RFID belum ada. Isi NIK untuk daftar manual.");

    setLoading(true);
    try {
      const reg = await daftarPengunjung({
        rfid_uid: rfidUid || null,
        nik: nik || null,
        nama,
        nohp: (form.nohp || "").trim() || null,
        tanggal_lahir: form.tanggal_lahir || null,
        alamat: (form.alamat || "").trim() || null,
      });

      const dataPengunjung = reg?.pengunjung;
      setPengunjung(dataPengunjung || null);

      const payloadAntrian = rfidUid
        ? { rfid_uid: rfidUid, jenis_pelayanan: jenis }
        : { nik, jenis_pelayanan: jenis };

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
      const payload = rfidUid
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

  const tampilBaru = statusScan === "belum_terdaftar";
  const tampilDitemukan = statusScan === "terdaftar" && (pengunjung || rfidUid);

  return (
    <div className="card">
      <Toast ref={toastRef} />

        <div className="mb-5">
          <h1 className="text-3xl font-bold">Pendaftaran</h1>
          <p className="mt-1 text-sm text-slate-500">
            Scan e-KTP atau cari NIK untuk pendaftaran & pengambilan antrian.
          </p>
        </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="text-lg font-bold text-slate-900">Data Pengunjung</div>
                <div className="text-sm text-slate-500">
                  Status: <span className="font-semibold">{STATUS_LABELS[statusScan]}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <span className="p-input-icon-left w-full md:flex-1">
                <i className="pi pi-search ml-2" />
                <InputText
                  value={nikCari}
                  onChange={(e) => setNikCari(e.target.value)}
                  placeholder="Cari Nomor NIK (jika kartu tidak terbaca)"
                  className="w-full pl-8"
                />
              </span>

              <Button
                onClick={handleCariNIK}
                disabled={loadingCari}
                icon="pi pi-search"
                label="Cari"
              />
            </div>

            <Divider className="my-1" />
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                {statusScan === "scanning" ? (
                  <ProgressSpinner style={{ width: "22px", height: "22px" }} strokeWidth="6" />
                ) : (
                  <i className="pi pi-id-card text-slate-500" />
                )}

                <div className="text-sm text-slate-700">{pesanScan}</div>
              </div>

              <div className="flex items-center gap-2">
                {statusScan === "idle" && (
                  <Button label="Mulai Scan" icon="pi pi-spinner" onClick={mulaiScan} />
                )}
              </div>
            </div>

            {tampilBaru && (
              <Message
                severity="warn"
                text="Data pengunjung tidak ditemukan. Silakan masukkan data pengunjung baru."
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