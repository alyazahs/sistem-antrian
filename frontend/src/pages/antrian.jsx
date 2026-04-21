import { useCallback, useEffect, useRef, useState } from "react";
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
import { Divider } from "primereact/divider";
import { Button } from "primereact/button";
import AntrianStats from "../components/antrian/antrianStats";
import AntrianNow from "../components/antrian/antrianNow";
import AntrianList from "../components/antrian/antrianList";
import { showAppToast } from "../utils/toast";

const API_URL = import.meta.env.VITE_API_URL;

export default function Antrian() {
  const toastRef = useRef(null);
  const eventSourceRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const isRefreshingRef = useRef(false);

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

  const refreshAll = useCallback(async (silent = false) => {
    if (isRefreshingRef.current) return;

    isRefreshingRef.current = true;
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
        showAppToast(toastRef, "error", "Gagal memuat data antrian.");
      }
    } finally {
      if (!silent) setLoading(false);
      isRefreshingRef.current = false;
    }
  }, []);

  const connectSSE = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource(`${API_URL}/api/antrian/stream`);
    eventSourceRef.current = es;

    es.onopen = () => {
      console.log("SSE antrian connected");
    };

    es.onmessage = async (event) => {
      try {
        JSON.parse(event.data);

        if (document.visibilityState === "visible") {
          await refreshAll(true);
        }
      } catch (e) {
        console.error("SSE parse error:", e);
      }
    };

    es.onerror = () => {
      console.error("SSE antrian disconnected");
      es.close();

      reconnectTimerRef.current = setTimeout(() => {
        connectSSE();
      }, 3000);
    };
  }, [refreshAll]);

  useEffect(() => {
    refreshAll(false);
    connectSSE();

    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [refreshAll, connectSSE]);

  const handleCallNext = async () => {
    if (busyAction) return;

    setBusyAction(true);
    try {
      const res = await panggilAntrianBerikutnya();
      showAppToast(
        toastRef,
        "success",
        res?.message || "Memanggil antrian berikutnya."
      );
      await refreshAll(true);
    } catch (e) {
      console.error(e);
      showAppToast(toastRef, "error", e?.response?.data?.message || "Gagal memanggil antrian berikutnya.");
    } finally {
      setBusyAction(false);
    }
  };

  const handleSelesai = async () => {
    if (!now?.id) return;

    setBusyAction(true);
    try {
      await selesaiAntrian(now.id);
      showAppToast(toastRef, "success", "Antrian selesai.");
      await refreshAll(true);
    } catch (e) {
      console.error(e);
      showAppToast(toastRef, "error", e?.response?.data?.message || "Gagal menyelesaikan antrian.");
    } finally {
      setBusyAction(false);
    }
  };

  const handleLewati = async () => {
    if (!now?.id) return;

    setBusyAction(true);
    try {
      await lewatiAntrian(now.id);
      showAppToast(toastRef, "warn", "Antrian dilewati.");
      await refreshAll(true);
    } catch (e) {
      console.error(e);
      showAppToast(toastRef, "error", e?.response?.data?.message || "Gagal melewati antrian.");
    } finally {
      setBusyAction(false);
    }
  };

  const handleRecall = async () => {
    if (!now?.id) return;

    setBusyAction(true);
    try {
      await panggilUlangAntrian(now.id);
      showAppToast(toastRef, "info", "Memanggil ulang antrian.");
    } catch (e) {
      console.error(e);
      showAppToast(toastRef, "error", e?.response?.data?.message || "Gagal memanggil ulang antrian.");
    } finally {
      setBusyAction(false);
    }
  };

  const openDisplay = () => {
    window.open("/displayAntrian", "_blank");
  };

  return (
    <div className="card">
      <Toast ref={toastRef} />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Antrian</h1>
          <p className="mt-1 text-sm text-slate-500">
            Pemanggilan antrian & monitoring status pelayanan.
          </p>
        </div>

        <Button
          type="button"
          label="Display Antrian"
          icon="pi pi-external-link"
          onClick={openDisplay}
        />
      </div>

      <div className="px-2">
        <div className="mb-3 text-sm font-semibold text-gray-700">
          Pemanggilan Antrian
        </div>

        <AntrianStats summary={summary} />

        <Divider />

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
    </div>
  );
}