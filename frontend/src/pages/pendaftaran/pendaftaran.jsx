import { useEffect, useRef, useState } from "react";
import { scanRfid, daftarPengunjung, ambilAntrian, cariNIK } from "../../api";
import FormPengunjungBaru from "../../components/pengunjungBaru";
import FormPengunjungDitemukan from "../../components/pengunjungDitemukan";

export default function Pendaftaran() {
  const [toast, setToast] = useState({ show: false, type: "info", text: "" });
  const toastRef = useRef(null);

// Show toast notification
  const showToast = (type, text) => {
    setToast({ show: true, type, text });
    if (toastRef.current) clearTimeout(toastRef.current);
    toastRef.current = setTimeout(
      () => setToast({ show: false, type: "info", text: "" }),
      2200
    );
  };

// State utama proses scan & data pengunjung
  const [statusScan, setStatusScan] = useState("idle");
  const [pesanScan, setPesanScan] = useState("Menunggu tap e-KTP...");
  const [rfidUid, setRfidUid] = useState("");
  const [pengunjung, setPengunjung] = useState(null);
// State untuk pencarian NIK manual
  const [nikCari, setNikCari] = useState("");
  const [loadingCari, setLoadingCari] = useState(false);
// State loading umum
  const [loading, setLoading] = useState(false);
// Mulai scan RFID
  const mulaiScan = () => {
    setStatusScan("scanning");
    setPesanScan("Memindai...");
    setRfidUid("");
    setPengunjung(null);
  };
// Reset semua state
  const reset = () => {
    setStatusScan("idle");
    setPesanScan("Menunggu tap e-KTP...");
    setRfidUid("");
    setPengunjung(null);
    setNikCari("");
    setLoading(false);
  };
  // Polling scan RFID
  useEffect(() => {
    if (statusScan !== "scanning") return;
// Mulai polling scan RFID
    let stop = false;
    const t = setInterval(async () => {
      if (stop) return;
// Lakukan scan RFID
      try {
        const res = await scanRfid();
// Tanggapi hasil scan
        if (res?.status === "no_card") {
          setPesanScan("Menunggu tap e-KTP...");
          return;
        }
// Jika kartu sudah terdaftar
        if (res?.status === "registered") {
          stop = true;
          clearInterval(t);
// Dapatkan data pengunjung
          const data = res.pengunjung; 
          setPengunjung(data || null);
          setRfidUid(data?.rfid_uid || "");
          setStatusScan("terdaftar");
          setPesanScan(
            `Kartu terdeteksi: ${data?.rfid_uid || "-"} (sudah terdaftar)`
          );
          showToast("success", "Data pengunjung ditemukan.");
          return;
        }
// Jika kartu belum terdaftar
        if (res?.status === "not_registered") {
          stop = true;
          clearInterval(t);
// Minta isi data pengunjung baru
          setPengunjung(null);
          setRfidUid(res.rfid_uid || "");
          setStatusScan("belum_terdaftar");
          setPesanScan(
            `Kartu terdeteksi: ${res.rfid_uid || "-"} (belum terdaftar)`
          );
          showToast("error", "Data pengunjung tidak ditemukan. Silakan isi data baru.");
          return;
        }
// Jika terjadi error saat scan
        setPesanScan("Menunggu tap e-KTP...");
      } catch (e) {
        console.error(e);
        setStatusScan("error");
        setPesanScan("Terjadi error saat scan. Coba lagi.");
        showToast("error", "Gagal memindai RFID (cek backend).");
      }
    }, 900);
// Bersihkan interval saat komponen di-unmount atau statusScan berubah
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [statusScan]);

  // Cari NIK manual (fallback)
  const handleCariNIK = async () => {
    const nik = nikCari.trim();
    if (!nik) return showToast("error", "Masukkan NIK dulu.");
// Mulai cari NIK
    setLoadingCari(true);
    try {
      const res = await cariNIK(nik);
// Tanggapi hasil pencarian
      if (!res?.success) {
        showToast("error", res?.message || "Gagal cari NIK");
        return;
      }
// Jika data ditemukan
      if (res.found) {
        const data = res.pengunjung;
        setPengunjung(data);
        setRfidUid(data?.rfid_uid || ""); // bisa kosong kalau data dulu daftar manual
        setStatusScan("terdaftar");
        setPesanScan("Data ditemukan melalui pencarian NIK.");
        showToast("success", "Data pengunjung ditemukan (NIK).");
      } else {
        setPengunjung(null);
        setStatusScan("belum_terdaftar");
        setPesanScan("NIK tidak ditemukan. Silakan isi data pengunjung baru.");
        showToast("error", "NIK tidak ditemukan. Silakan daftar.");
      }
    } catch (e) {
      console.error(e);
      showToast("error", "Error cari NIK (cek endpoint /api/cari-nik).");
    } finally {
      setLoadingCari(false);
    }
  };

  // daftar pengunjung baru + ambil antrian
  const submitPengunjungBaru = async (form) => {
    const nama = (form.nama || "").trim();
    const nik = (form.nik || "").trim();

    // dropdown: object -> ambil nama
    const jenis =
      typeof form.kebutuhan === "string"
        ? form.kebutuhan.trim()
        : (form.kebutuhan?.nama || "").trim();

    if (!nama) return showToast("error", "Nama wajib diisi.");
    if (!jenis) return showToast("error", "Jenis pelayanan wajib diisi.");
    if (!rfidUid && !nik) {
      return showToast("error", "RFID belum ada. Isi NIK untuk daftar manual.");
    }

    setLoading(true);
    try {
      const reg = await daftarPengunjung({
        rfid_uid: rfidUid || null,
        nik: nik || null,
        nama: nama,
        nohp: (form.nohp || "").trim() || null,
        umur: form.umur ? Number(form.umur) : null,
        alamat: (form.alamat || "").trim() || null,
      });

      const dataPengunjung = reg?.pengunjung;
      setPengunjung(dataPengunjung || null);

      const payloadAntrian = rfidUid
        ? { rfid_uid: rfidUid, jenis_pelayanan: jenis }
        : { nik: nik, jenis_pelayanan: jenis };

      const q = await ambilAntrian(payloadAntrian);

      showToast("success", `Berhasil! Nomor antrian: ${q.nomor_antrian ?? "-"}`);
      reset();
    } catch (e) {
      console.error(e);
      showToast("error", e?.response?.data?.message || "Gagal daftar/ambil antrian.");
    } finally {
      setLoading(false);
    }
  };

  // pengunjung ditemukan: ambil antrian saja
  const submitPengunjungDitemukan = async (kebutuhan) => {
    if (!kebutuhan?.trim()) return showToast("error", "Jenis pelayanan wajib diisi.");
    // ambil antrian
    setLoading(true);
    try {
      const payload = rfidUid
        ? { rfid_uid: rfidUid, jenis_pelayanan: kebutuhan }
        : { nik: pengunjung?.nik, jenis_pelayanan: kebutuhan };

      const q = await ambilAntrian(payload);
//   tampilkan nomor antrian
      showToast("success", `Berhasil! Nomor antrian: ${q.nomor_antrian ?? "-"}`);
      reset();
    } catch (e) {
      console.error(e);
      showToast("error", e?.response?.data?.message || "Gagal ambil nomor antrian.");
    } finally {
      setLoading(false);
    }
  };

  const tampilBaru = statusScan === "belum_terdaftar";
  const tampilDitemukan = statusScan === "terdaftar" && (pengunjung || rfidUid);

  const toastClass =
    toast.type === "success"
      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
      : toast.type === "error"
      ? "bg-rose-100 text-rose-800 border-rose-200"
      : "bg-slate-200 text-slate-800 border-slate-300";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Toast */}
      <div
        className={[
          "fixed left-1/2 top-5 z-50 w-[360px] -translate-x-1/2 rounded-xl border px-4 py-3 text-sm shadow-lg transition",
          toastClass,
          toast.show ? "opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
      >
        {toast.text}
      </div>

      <div className="mx-auto w-full max-w-6xl px-6 py-7">
        <h1 className="text-3xl font-bold text-slate-900">Pendaftaran</h1>
        
        <div className="mt-5 rounded-2xl bg-white p-6 shadow-xl shadow-slate-200/60">
          <h2 className="text-lg font-bold text-slate-900">Data Pengunjung</h2>

          {/* ✅ Cari NIK manual */}
          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <span className="text-slate-400">🔎</span>
              <input
                value={nikCari}
                onChange={(e) => setNikCari(e.target.value)}
                placeholder="Cari Nomor NIK (jika kartu tidak terbaca)"
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
            {/* Cari NIK button */}
            <button
              onClick={handleCariNIK}
              disabled={loadingCari}
              className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-extrabold text-white hover:bg-indigo-700 disabled:opacity-70 md:w-28"
              type="button"
            >
              {loadingCari ? "..." : "CARI"}
            </button>
          </div>

          {/* Bar Scan */}
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-30" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
            </span>
            {/* Status Scan */}
            <div className="flex-1 text-sm text-slate-700">{pesanScan}</div>
            {/* Mulai Scan button */}
            {statusScan === "idle" && (
              <button
                onClick={mulaiScan}
                className="rounded-xl bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-700 hover:bg-indigo-100"
                type="button"
              >
                Mulai Scan
              </button>
            )}
            {/* Reset button */}
            {(statusScan === "terdaftar" ||
              statusScan === "belum_terdaftar" ||
              statusScan === "error") && (
              <button
                onClick={reset}
                className="rounded-xl bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-700 hover:bg-indigo-100"
                type="button"
              >
                Batal
              </button>
            )}
          </div>

          {/* Alert */}
          {tampilBaru && (
            <div className="mt-4 w-full max-w-md rounded-xl border border-rose-200 bg-rose-100 px-4 py-3 text-rose-800">
              <div className="text-sm font-extrabold">Data Pengunjung Tidak Ditemukan</div>
              <div className="text-xs opacity-90">Silakan Masukkan Data Pengunjung Baru</div>
            </div>
          )}
          {/* Form untuk pengunjung ditemukan */}
          {tampilDitemukan && (
            <div className="mt-4 w-full max-w-md rounded-xl border border-emerald-200 bg-emerald-100 px-4 py-3 text-emerald-800">
              <div className="text-sm font-extrabold">Data Pengunjung Ditemukan</div>
              <div className="text-xs opacity-90">RFID : {rfidUid || "-"} | NIK : {pengunjung?.nik || "-"}</div>
            </div>
          )}

          {/* Form */}
          {tampilBaru && (
            <FormPengunjungBaru
              loading={loading}
              onBatal={reset}
              onSubmit={submitPengunjungBaru}
              nikAwal={nikCari}
            />
          )}
          {/* Form untuk pengunjung ditemukan */}
          {tampilDitemukan && (
            <FormPengunjungDitemukan
              loading={loading}
              onBatal={reset}
              onSubmit={submitPengunjungDitemukan}
              data={{
                nik: pengunjung?.nik || "",
                nama: pengunjung?.nama || "",
                nohp: pengunjung?.nohp || "",
                umur: pengunjung?.umur ?? "",
                alamat: pengunjung?.alamat || "",
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}