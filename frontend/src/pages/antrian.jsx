import { useEffect, useRef, useState } from "react";
import {
  antrianSummary,
  antrianNow,
  antrianListMenunggu,
  panggilAntrianBerikutnya,
  lewatiAntrian,
  selesaiAntrian,
  panggilUlangAntrian,
} from "../api";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { Divider } from "primereact/divider";
import AntrianStats from "../components/antrian/antrianStats";
import AntrianNow from "../components/antrian/antrianNow";
import AntrianList from "../components/antrian/antrianList";

export default function Antrian() {
  const toastRef = useRef(null);

  const showToast = (severity, detail) => {
    toastRef.current?.show({
      severity,
      summary:
        severity === "success"
          ? "Berhasil"
          : severity === "error"
          ? "Gagal"
          : severity === "warn"
          ? "Peringatan"
          : "Info",
      detail,
      life: 2200,
    });
  };

  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState(false);

  const [summary, setSummary] = useState({
    total_hari_ini: 0,
    menunggu: 0,
    dilayani: 0,
    dilewati: 0,
  });

  const [now, setNow] = useState(null);
  const [list, setList] = useState([]);

  // REFRESH DATA
  const refreshAll = async (silent = false) => {
    if (!silent) setLoading(true);

    try {
      const [s, n, l] = await Promise.all([
        antrianSummary(),
        antrianNow(),
        antrianListMenunggu(),
      ]);

      setSummary({
        total_hari_ini: s?.total_hari_ini ?? 0,
        menunggu: s?.menunggu ?? 0,
        dilayani: s?.dilayani ?? 0,
        dilewati: s?.dilewati ?? 0,
      });

      setNow(n || null);
      setList(Array.isArray(l) ? l : []);
    } catch (e) {
      console.error(e);
      if (!silent) {
        showToast("error", "Gagal memuat data antrian (cek backend).");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // polling setiap 2 detik
  useEffect(() => {
    refreshAll(false);
    const interval = setInterval(() => refreshAll(true), 2000);
    return () => clearInterval(interval);
  }, []);

  const handleCallNext = async () => {
    if (busyAction) return;

    setBusyAction(true);
    try {
      const res = await panggilAntrianBerikutnya();
      showToast(
        "success",
        `Memanggil antrian: ${res?.nomor_antrian ?? "-"}`
      );
      await refreshAll(true);
    } catch (e) {
      console.error(e);
      showToast(
        "error",
        e?.response?.data?.message ||
          "Gagal memanggil antrian berikutnya."
      );
    } finally {
      setBusyAction(false);
    }
  };

  const handleSelesai = async () => {
    if (!now?.id) return;

    setBusyAction(true);
    try {
      await selesaiAntrian(now.id);
      showToast("success", "Antrian ditandai selesai.");
      await refreshAll(true);
    } catch (e) {
      console.error(e);
      showToast("error", "Gagal menyelesaikan antrian.");
    } finally {
      setBusyAction(false);
    }
  };

  const handleLewati = async () => {
    if (!now?.id) return;

    setBusyAction(true);
    try {
      await lewatiAntrian(now.id);
      showToast("warn", "Antrian dikembalikan ke daftar tunggu.");
      await refreshAll(true);
    } catch (e) {
      console.error(e);
      showToast("error", "Gagal melewati antrian.");
    } finally {
      setBusyAction(false);
    }
  };

  const handleRecall = async () => {
    if (!now?.id) return;

    setBusyAction(true);
    try {
      await panggilUlangAntrian(now.id);
      showToast("info", "Memanggil ulang antrian.");
    } catch (e) {
      console.error(e);
      showToast("error", "Gagal panggil ulang.");
    } finally {
      setBusyAction(false);
    }
  };

  const openDisplay = () => {
    window.open("/display-antrian", "_blank");
  };

  return (
    <div className="card">
      <Toast ref={toastRef} />

      <div className="mx-auto w-full max-w-6xl px-6 py-7">
        <div className="mb-5">
          <h1 className="text-3xl font-bold">Antrian</h1>
          <p className="mt-1 text-sm text-slate-500">
            Pemanggilan antrian & monitoring status pelayanan.
          </p>
        </div>

        <Card className="shadow-md rounded-2xl">
          <div className="px-2">
            <div className="mb-3 text-sm font-semibold text-gray-700">
              Pemanggilan Antrian
            </div>

            {/* STATISTIK */}
            <AntrianStats summary={summary} />

            <Divider />

            {/* GRID */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <AntrianNow
                now={now}
                busyAction={busyAction}
                onRecall={handleRecall}
                onSelesai={handleSelesai}
                onLewati={handleLewati}
                onCallNext={handleCallNext}
                loading={loading}
                onOpenDisplay={openDisplay}
              />

              <AntrianList
                list={list}
                loading={loading}
                busyAction={busyAction}
                onCallNext={handleCallNext}
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}