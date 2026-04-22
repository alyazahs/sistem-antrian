import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import { ProgressSpinner } from "primereact/progressspinner";
import { showAppToast } from "../utils/toast";

const STREAM_URL = "/api/antrian/stream";

const tickerKeyframes = `
@keyframes displayTickerMove {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-100%);
  }
}
`;

export default function DisplayAntrian() {
  const toastRef = useRef(null);
  const eventSourceRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const retryCountRef = useRef(0);

  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());
  const [connected, setConnected] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [userHasInteracted, setUserHasInteracted] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const [displayData, setDisplayData] = useState({
    current: null,
    next: null,
    summary: {
      total_hari_ini: 0,
      menunggu: 0,
      dipanggil: 0,
      dilayani: 0,
      dilewati: 0,
    },
  });

  const cleanupSSE = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  };

  const connectSSE = () => {
    cleanupSSE();

    try {
      const es = new EventSource(STREAM_URL);
      eventSourceRef.current = es;

      es.onopen = () => {
        setConnected(true);
        retryCountRef.current = 0;
      };

      es.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          setDisplayData(payload);
          setLoading(false);
          setConnected(true);
        } catch (err) {
          console.error("SSE parse error:", err);
        }
      };

      es.onerror = () => {
        setConnected(false);

        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }

        const nextRetry = retryCountRef.current + 1;
        retryCountRef.current = nextRetry;

        const delay = Math.min(1000 * 2 ** (nextRetry - 1), 10000);

        reconnectTimerRef.current = setTimeout(() => {
          connectSSE();
        }, delay);
      };
    } catch (err) {
      console.error("SSE init error:", err);
      setConnected(false);

      const nextRetry = retryCountRef.current + 1;
      retryCountRef.current = nextRetry;

      const delay = Math.min(1000 * 2 ** (nextRetry - 1), 10000);

      reconnectTimerRef.current = setTimeout(() => {
        connectSSE();
      }, delay);
    }
  };

  useEffect(() => {
    connectSSE();

    const fallbackToastTimer = setTimeout(() => {
      if (loading) {
        showAppToast(
          toastRef,
          "warn",
          "Koneksi realtime belum tersambung. Sistem sedang mencoba kembali."
        );
      }
    }, 5000);

    return () => {
      clearTimeout(fallbackToastTimer);
      cleanupSSE();
    };
  }, [loading]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleFs = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFs);
    return () => document.removeEventListener("fullscreenchange", handleFs);
  }, []);

  const toggleFullScreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error(err);
      showAppToast(toastRef, "error", "Gagal mengubah mode fullscreen.");
    }
  };

  const formattedDate = useMemo(() => {
    return time.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }, [time]);

  const formattedTime = useMemo(() => {
    return time.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [time]);

  const currentNumber = displayData?.current?.nomor_antrian ?? "-";
  const currentName = displayData?.current?.nama ?? "-";
  const currentJenis = displayData?.current?.jenis_pelayanan ?? "-";
  const nextNumber = displayData?.next?.nomor_antrian ?? "-";
  const remaining = displayData?.summary?.menunggu ?? 0;
  const totalToday = displayData?.summary?.total_hari_ini ?? 0;

  if (loading) {
    return (
      <div
        style={{
          height: "100vh",
          background: "#eef1f4",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          overflow: "hidden",
        }}
      >
        <Toast ref={toastRef} position="top-right" />
        <style>{tickerKeyframes}</style>
        <ProgressSpinner style={{ width: "60px", height: "60px" }} strokeWidth="4" />
        <div style={{ fontSize: "1.1rem", fontWeight: 700 }}>
          Memuat display antrian...
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        height: "100vh",
        background: "#eceef1",
        overflow: "hidden",
        position: "relative",
        fontFamily: "Arial, sans-serif",
        display: "grid",
        gridTemplateRows: "15vh 6vh 5vh 43vh 19vh",
      }}
    >
      <Toast ref={toastRef} position="top-right" />
      <style>{tickerKeyframes}</style>

      {!isFullScreen && (
        <div style={{ position: "fixed", right: 18, bottom: 18, zIndex: 50 }}>
          <Button
            icon="pi pi-window-maximize"
            onClick={toggleFullScreen}
            rounded
            text
            severity="secondary"
            tooltip="Tampilkan Fullscreen"
            tooltipOptions={{ position: "left" }}
          />
        </div>
      )}

      {!userHasInteracted && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 60,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Button
            label="Mulai Tampilkan Display"
            icon="pi pi-play"
            className="p-button-warning"
            onClick={() => setUserHasInteracted(true)}
          />
        </div>
      )}

      <div
        style={{
          background: "linear-gradient(135deg, #69b7ad 0%, #66a99f 100%)",
          padding: "0 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 280,
            height: 280,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.15)",
            right: -60,
            top: -140,
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 220,
            height: 220,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.10)",
            right: 170,
            top: -110,
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 16, zIndex: 2 }}>
          <img
            src="/logo-kab.png"
            alt="Logo Kecamatan"
            style={{ width: 64, height: 76, objectFit: "contain" }}
          />

          <div>
            <div
              style={{
                color: "#f2c94c",
                fontWeight: 800,
                fontSize: "clamp(1.4rem, 2vw, 2rem)",
                lineHeight: 1.1,
                textTransform: "uppercase",
              }}
            >
              Kantor Kecamatan Jiwan
            </div>
            <div
              style={{
                color: "#0c5f4a",
                fontWeight: 900,
                fontSize: "clamp(1.4rem, 2vw, 2rem)",
                lineHeight: 1.1,
                textTransform: "uppercase",
              }}
            >
              Kabupaten Madiun
            </div>
          </div>
        </div>

        <div style={{ textAlign: "right", color: "#fff", zIndex: 2 }}>
          <div style={{ fontSize: "clamp(0.9rem, 1vw, 1.1rem)", fontWeight: 600 }}>
            {formattedDate}
          </div>
          <div
            style={{
              fontSize: "clamp(2.2rem, 3.6vw, 3.8rem)",
              fontWeight: 900,
              lineHeight: 1,
            }}
          >
            {formattedTime}
          </div>
        </div>
      </div>

      <div
        style={{
          background: "#fff",
          borderTop: "1px solid rgba(0,0,0,0.05)",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          fontSize: "clamp(1rem, 1.3vw, 1.35rem)",
          fontWeight: 800,
          color: "#111827",
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
          whiteSpace: "nowrap",
        }}
      >
        <div
          style={{
            display: "inline-block",
            paddingLeft: "100%",
            animation: "displayTickerMove 22s linear infinite",
          }}
        >
          Selamat datang di Kantor Kecamatan Jiwan • Harap menunggu dengan tertib •
          Nomor antrian akan dipanggil sesuai urutan • Mohon siapkan dokumen yang diperlukan •
          Terima kasih atas kesabaran Anda
        </div>
      </div>

      <div
        style={{
          padding: "0 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Tag
          value={connected ? "Realtime Aktif" : "Mencoba Menyambung..."}
          severity={connected ? "success" : "warning"}
          rounded
          style={{ fontWeight: 700, fontSize: "0.85rem" }}
        />

        <div style={{ fontWeight: 700, color: "#0b766e", fontSize: "0.95rem" }}>
          Pelayanan Administrasi
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.05fr 1.2fr",
          gap: 20,
          padding: "0 24px 12px",
          minHeight: 0,
        }}
      >
        <Card
          style={{
            height: "100%",
            borderRadius: 24,
            overflow: "hidden",
            border: "1px solid rgba(0,0,0,0.08)",
            boxShadow: "0 10px 24px rgba(0,0,0,0.08)",
            background: "#f7f7f8",
          }}
        >
          <div
            style={{
              background: "#0b8775",
              color: "#fff",
              textAlign: "center",
              fontWeight: 900,
              fontSize: "clamp(1.2rem, 1.8vw, 2rem)",
              borderRadius: 18,
              padding: "0.9rem 0.8rem",
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            Memanggil Antrian
          </div>

          <div
            style={{
              textAlign: "center",
              height: "calc(100% - 68px)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "0.75rem 1rem 1rem",
            }}
          >
            <div
              style={{
                fontSize: "clamp(1.2rem, 1.8vw, 2rem)",
                fontWeight: 800,
                color: "#111827",
                marginBottom: "0.5rem",
              }}
            >
              No Antrian
            </div>

            <div
              style={{
                fontSize: "clamp(4.5rem, 8vw, 7rem)",
                fontWeight: 900,
                lineHeight: 1,
                color: "#111111",
              }}
            >
              {currentNumber}
            </div>

            <div
              style={{
                marginTop: "0.8rem",
                fontSize: "clamp(0.95rem, 1.2vw, 1.2rem)",
                fontWeight: 700,
                color: "#334155",
                textAlign: "center",
                maxWidth: "95%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {currentName}
            </div>

            <div
              style={{
                marginTop: "0.65rem",
                display: "inline-block",
                background: "#e6f4f1",
                color: "#0b766e",
                padding: "0.5rem 0.9rem",
                borderRadius: 999,
                fontWeight: 700,
                fontSize: "clamp(0.85rem, 1vw, 1rem)",
                maxWidth: "90%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {currentJenis}
            </div>
          </div>
        </Card>

        <Card
          style={{
            height: "100%",
            borderRadius: 24,
            overflow: "hidden",
            border: "1px solid rgba(0,0,0,0.08)",
            boxShadow: "0 10px 24px rgba(0,0,0,0.08)",
            background: "#ffffff",
          }}
        >
          <div
            style={{
              height: "100%",
              borderRadius: 18,
              overflow: "hidden",
              background: "#dfe7ea",
            }}
          >
            {!videoError ? (
              <video
                src="/videos/profil-kecamatan.mp4"
                autoPlay
                muted
                loop
                playsInline
                onError={() => setVideoError(true)}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#475569",
                  background: "linear-gradient(135deg, #e2e8f0, #cbd5e1)",
                  textAlign: "center",
                  padding: "1.5rem",
                }}
              >
                <div style={{ fontSize: "1.25rem", fontWeight: 800 }}>
                  Profil Kecamatan Jiwan
                </div>
                <div style={{ marginTop: "0.5rem", fontSize: "0.95rem" }}>
                  Video belum tersedia.
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 20,
          padding: "0 24px 16px",
          minHeight: 0,
        }}
      >
        <Card
          style={{
            height: "100%",
            borderRadius: 20,
            background: "#a9cbc6",
            border: "1px solid rgba(0,0,0,0.1)",
            boxShadow: "0 8px 18px rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{
              height: "100%",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "0.6rem 0.4rem",
            }}
          >
            <div
              style={{
                fontSize: "clamp(2.8rem, 5vw, 5rem)",
                fontWeight: 900,
                lineHeight: 1,
                color: "#111",
              }}
            >
              {nextNumber}
            </div>
            <div
              style={{
                marginTop: "0.6rem",
                fontSize: "clamp(0.95rem, 1.2vw, 1.2rem)",
                fontWeight: 700,
                color: "#111827",
              }}
            >
              Antrian Selanjutnya
            </div>
          </div>
        </Card>

        <Card
          style={{
            height: "100%",
            borderRadius: 20,
            background: "#a9cbc6",
            border: "1px solid rgba(0,0,0,0.1)",
            boxShadow: "0 8px 18px rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{
              height: "100%",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "0.6rem 0.4rem",
            }}
          >
            <div
              style={{
                fontSize: "clamp(2.8rem, 5vw, 5rem)",
                fontWeight: 900,
                lineHeight: 1,
                color: "#111",
              }}
            >
              {remaining}
            </div>
            <div
              style={{
                marginTop: "0.6rem",
                fontSize: "clamp(0.95rem, 1.2vw, 1.2rem)",
                fontWeight: 700,
                color: "#111827",
              }}
            >
              Antrian yang Belum Dipanggil
            </div>
          </div>
        </Card>

        <Card
          style={{
            height: "100%",
            borderRadius: 20,
            background: "#a9cbc6",
            border: "1px solid rgba(0,0,0,0.1)",
            boxShadow: "0 8px 18px rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{
              height: "100%",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "0.6rem 0.4rem",
            }}
          >
            <div
              style={{
                fontSize: "clamp(2.8rem, 5vw, 5rem)",
                fontWeight: 900,
                lineHeight: 1,
                color: "#111",
              }}
            >
              {totalToday}
            </div>
            <div
              style={{
                marginTop: "0.6rem",
                fontSize: "clamp(0.95rem, 1.2vw, 1.2rem)",
                fontWeight: 700,
                color: "#111827",
              }}
            >
              Total Antrian Hari Ini
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}