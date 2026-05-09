import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
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

const formatQueueNumber = (value) => {
  if (value === null || value === undefined || value === "-") return "-";

  const numberValue = Number(value);
  if (Number.isNaN(numberValue)) return String(value);

  return String(numberValue).padStart(2, "0");
};

export default function DisplayAntrian() {
  const toastRef = useRef(null);
  const eventSourceRef = useRef(null);
  const connectSSERef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const retryCountRef = useRef(0);
  const loadingRef = useRef(true);

  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());
  const [connected, setConnected] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [userHasInteracted, setUserHasInteracted] = useState(false);

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

  const cleanupSSE = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const connectSSE = useCallback(() => {
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
          connectSSERef.current?.();
        }, delay);
      };
    } catch (err) {
      console.error("SSE init error:", err);
      setConnected(false);

      const nextRetry = retryCountRef.current + 1;
      retryCountRef.current = nextRetry;

      const delay = Math.min(1000 * 2 ** (nextRetry - 1), 10000);

      reconnectTimerRef.current = setTimeout(() => {
        connectSSERef.current?.();
      }, delay);
    }
  }, [cleanupSSE]);

  useEffect(() => {
    connectSSERef.current = connectSSE;
  }, [connectSSE]);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    const connectTimer = setTimeout(() => {
      connectSSE();
    }, 0);

    const fallbackToastTimer = setTimeout(() => {
      if (loadingRef.current) {
        showAppToast(
          toastRef,
          "warn",
          "Koneksi realtime belum tersambung. Sistem sedang mencoba kembali."
        );
      }
    }, 5000);

    return () => {
      clearTimeout(connectTimer);
      clearTimeout(fallbackToastTimer);
      cleanupSSE();
    };
  }, [cleanupSSE, connectSSE]);

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
  const servedToday = displayData?.summary?.dilayani ?? 0;
  const skippedToday = displayData?.summary?.dilewati ?? 0;

  const currentNumberText = formatQueueNumber(currentNumber);
  const nextNumberText = formatQueueNumber(nextNumber);

  const stats = [
    {
      label: "Selanjutnya",
      value: nextNumberText,
      helper: "Nomor berikutnya",
      color: "#0f766e",
      background: "#dff5f1",
    },
    {
      label: "Menunggu",
      value: remaining,
      helper: "Belum dipanggil",
      color: "#b45309",
      background: "#fff1d8",
    },
    {
      label: "Dilayani",
      value: servedToday,
      helper: "Selesai hari ini",
      color: "#2563eb",
      background: "#e5efff",
    },
    {
      label: "Dilewati",
      value: skippedToday,
      helper: "Tidak hadir",
      color: "#be123c",
      background: "#ffe4ea",
    },
  ];

  if (loading) {
    return (
      <div
        style={{
          height: "100vh",
          background: "#eef5f2",
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

        <img
          src="/logo-kab.png"
          alt="Logo Kabupaten"
          style={{ width: 84, height: 84, objectFit: "contain" }}
        />

        <ProgressSpinner style={{ width: "60px", height: "60px" }} strokeWidth="4" />

        <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#12332f" }}>
          Memuat display antrian...
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        height: "100vh",
        background: "#edf4f2",
        overflow: "hidden",
        position: "relative",
        fontFamily: "Inter, Arial, sans-serif",
        display: "grid",
        gridTemplateRows: isFullScreen
          ? "118px 44px auto 150px"
          : "104px 40px auto 132px",
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
            background: "rgba(11, 35, 32, 0.66)",
            backdropFilter: "blur(3px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "520px",
              maxWidth: "92vw",
              borderRadius: 28,
              background: "#ffffff",
              padding: "2rem",
              textAlign: "center",
              boxShadow: "0 28px 80px rgba(8, 47, 43, 0.32)",
            }}
          >
            <img
              src="/logo-kab.png"
              alt="Logo Kabupaten"
              style={{ width: 76, height: 76, objectFit: "contain", marginBottom: 16 }}
            />

            <div style={{ color: "#12332f", fontSize: "1.45rem", fontWeight: 900 }}>
              Display Antrian Kecamatan Jiwan
            </div>

            <div style={{ color: "#64736f", fontSize: "0.95rem", marginTop: 8 }}>
              Layar layanan siap ditampilkan.
            </div>

            <Button
              label="Mulai Display"
              icon="pi pi-play"
              onClick={() => setUserHasInteracted(true)}
              style={{
                marginTop: 24,
                background: "#0f766e",
                borderColor: "#0f766e",
                fontWeight: 800,
                padding: "0.9rem 1.4rem",
              }}
            />
          </div>
        </div>
      )}

      <header
        style={{
          background: "#ffffff",
          borderBottom: "1px solid rgba(15, 118, 110, 0.16)",
          padding: isFullScreen ? "0 42px" : "0 42px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 10px 28px rgba(15, 118, 110, 0.08)",
          minWidth: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, minWidth: 0 }}>
          <img
            src="/logo-kab.png"
            alt="Logo Kecamatan"
            style={{
              width: isFullScreen ? 70 : 62,
              height: isFullScreen ? 78 : 70,
              objectFit: "contain",
            }}
          />

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                color: "#0f766e",
                fontWeight: 900,
                fontSize: isFullScreen ? "2.25rem" : "2rem",
                lineHeight: 1.1,
                textTransform: "uppercase",
                letterSpacing: 0,
                whiteSpace: "nowrap",
              }}
            >
              Kantor Kecamatan Jiwan
            </div>

            <div
              style={{
                color: "#7a5a13",
                fontWeight: 800,
                fontSize: isFullScreen ? "1.05rem" : "1rem",
                lineHeight: 1.35,
                whiteSpace: "nowrap",
              }}
            >
              Pelayanan Administrasi Terpadu - Kabupaten Madiun
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            color: "#12332f",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              borderRadius: 999,
              background: connected ? "#dff5f1" : "#fff1d8",
              color: connected ? "#0f766e" : "#9a5f0b",
              padding: "0.45rem 0.75rem",
              fontSize: "0.82rem",
              fontWeight: 900,
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: 999,
                background: connected ? "#0f766e" : "#f59e0b",
                boxShadow: connected
                  ? "0 0 0 4px rgba(15, 118, 110, 0.12)"
                  : "0 0 0 4px rgba(245, 158, 11, 0.14)",
              }}
            />
            {connected ? "Realtime" : "Menyambung"}
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "1rem", fontWeight: 700 }}>{formattedDate}</div>

            <div
              style={{
                fontSize: isFullScreen ? "3.25rem" : "2.9rem",
                fontWeight: 900,
                lineHeight: 1,
                color: "#0f766e",
              }}
            >
              {formattedTime}
            </div>
          </div>
        </div>
      </header>

      <div
        style={{
          background: "#0f766e",
          borderBottom: "1px solid rgba(0,0,0,0.08)",
          fontSize: isFullScreen ? "1.12rem" : "1rem",
          fontWeight: 800,
          color: "#ffffff",
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
            animation: "displayTickerMove 40s linear infinite",
          }}
        >
          Selamat datang di Kantor Kecamatan Jiwan &bull; Harap menunggu dengan tertib &bull;
          Nomor antrian akan dipanggil sesuai urutan &bull; Mohon siapkan dokumen yang diperlukan &bull;
          Terima kasih atas kesabaran Anda
        </div>
      </div>

      <main
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(360px, 0.96fr) minmax(420px, 1.04fr)",
          gap: isFullScreen ? 28 : 24,
          padding: isFullScreen ? "24px 42px 20px" : "18px 42px 16px",
          minHeight: 0,
          alignItems: "start",
        }}
      >
        <Card
          style={{
            height: isFullScreen ? 530 : 440,
            borderRadius: 22,
            overflow: "hidden",
            border: "1px solid rgba(15, 118, 110, 0.14)",
            boxShadow: "0 24px 50px rgba(15, 54, 49, 0.12)",
            background: "#ffffff",
          }}
          pt={{ body: { style: { height: "100%", padding: 0 } } }}
        >
          <div
            style={{
              background: "#0f766e",
              color: "#fff",
              textAlign: "center",
              fontWeight: 900,
              fontSize: "clamp(1.2rem, 1.8vw, 2rem)",
              borderRadius: 16,
              padding: "2rem 1rem",
              letterSpacing: 1,
              textTransform: "uppercase",
              transform: "translateY(-22px)",
            }}
          >
            Memanggil Antrian
          </div>

          <div
            style={{
              textAlign: "center",
              height: isFullScreen ? "calc(100% - 70px)" : "calc(100% - 62px)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: isFullScreen ? "flex-start" : "center",

              padding: isFullScreen ? "1.6rem 2rem 1rem" : "0.8rem 2rem",
            }}
          >
            <div
              style={{
                fontSize: isFullScreen ? "1.8rem" : "1.4rem",
                fontWeight: 800,
                color: "#66716f",
                marginBottom: isFullScreen ? "0.35rem" : "0.25rem",
                textTransform: "uppercase",
              }}
            >
              No Antrian
            </div>

            <div
              style={{
                fontSize: isFullScreen ? "8rem" : "7rem",
                fontWeight: 900,
                lineHeight: 0.9,
                color: "#10201e",
                letterSpacing: 0,
              }}
            >
              {currentNumberText}
            </div>

            <div
              style={{
                marginTop: isFullScreen ? "1.1rem" : "0.8rem",
                fontSize: isFullScreen ? "2.5rem" : "2.3rem",
                fontWeight: 900,
                color: "#12332f",
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
                marginTop: isFullScreen ? "0.75rem" : "0.6rem",
                display: "inline-block",
                background: "#fff3d6",
                color: "#805c10",
                padding: isFullScreen ? "0.62rem 1rem" : "0.5rem 0.9rem",
                borderRadius: 999,
                fontWeight: 900,
                fontSize: isFullScreen ? "1rem" : "0.92rem",
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
            height: isFullScreen ? 530 : 440,
            borderRadius: 22,
            overflow: "hidden",
            border: "1px solid rgba(15, 118, 110, 0.14)",
            boxShadow: "0 24px 50px rgba(15, 54, 49, 0.12)",
            background: "#ffffff",
          }}
          pt={{ body: { style: { height: "100%", padding: isFullScreen ? 12 : 10 } } }}
        >
          <div
            style={{
              height: "100%",
              borderRadius: 16,
              overflow: "hidden",
              background: "#e6f2ef",
              position: "relative",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: isFullScreen ? "2rem" : "1.55rem 1.5rem",
              transform: "translateY(-19px)",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: isFullScreen ? 16 : 14,
                  marginBottom: isFullScreen ? 26 : 16,
                }}
              >
                <div
                  style={{
                    width: isFullScreen ? 76 : 64,
                    height: isFullScreen ? 76 : 64,
                    borderRadius: 20,
                    background: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 14px 28px rgba(15, 54, 49, 0.10)",
                    flexShrink: 0,
                  }}
                >
                  <img
                    src="/logo-kab.png"
                    alt="Logo Kabupaten"
                    style={{
                      width: isFullScreen ? 54 : 46,
                      height: isFullScreen ? 54 : 46,
                      objectFit: "contain",
                    }}
                  />
                </div>

                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      color: "#12332f",
                      fontSize: isFullScreen ? "2rem" : "1.65rem",
                      fontWeight: 900,
                      lineHeight: 1.15,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    Informasi Pelayanan
                  </div>

                  <div
                    style={{
                      color: "#64736f",
                      fontSize: isFullScreen ? "1.05rem" : "0.95rem",
                      fontWeight: 700,
                      marginTop: 6,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    Harap perhatikan nomor antrian yang sedang dipanggil.
                  </div>
                </div>
              </div>

              {[
                "Siapkan dokumen persyaratan sebelum menuju loket.",
                "Dengarkan panggilan nomor antrian Anda.",
                "Datang ke petugas saat nomor Anda tampil di layar.",
              ].map((text, index) => (
                <div
                  key={text}
                  style={{
                    display: "grid",
                    gridTemplateColumns: isFullScreen ? "52px 1fr" : "46px 1fr",
                    alignItems: "center",
                    gap: isFullScreen ? 14 : 12,
                    borderRadius: 18,
                    background: "#ffffff",
                    padding: isFullScreen ? "0.95rem 1rem" : "0.72rem 0.9rem",
                    marginBottom: isFullScreen ? 12 : 10,
                    boxShadow: "0 10px 22px rgba(15, 54, 49, 0.08)",
                  }}
                >
                  <div
                    style={{
                      width: isFullScreen ? 52 : 46,
                      height: isFullScreen ? 52 : 46,
                      borderRadius: 16,
                      background: "#dff5f1",
                      color: "#0f766e",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 900,
                      fontSize: isFullScreen ? "1.35rem" : "1.15rem",
                    }}
                  >
                    {index + 1}
                  </div>

                  <div
                    style={{
                      color: "#12332f",
                      fontSize: isFullScreen ? "1.12rem" : "1rem",
                      fontWeight: 800,
                      lineHeight: 1.35,
                    }}
                  >
                    {text}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                borderRadius: 18,
                background: "#0f766e",
                color: "#ffffff",
                padding: isFullScreen ? "1rem 1.2rem" : "0.82rem 1rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 14,
                fontWeight: 900,
                fontSize: isFullScreen ? "1rem" : "0.92rem",
                boxShadow: "0 16px 30px rgba(15, 118, 110, 0.20)",
              }}
            >
              <span>Pelayanan Administrasi Terpadu</span>
            </div>
          </div>
        </Card>
      </main>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: isFullScreen ? 18 : 16,
          padding: isFullScreen ? "0 42px 24px" : "0 42px 16px",
          minHeight: 0,
        }}
      >
        {stats.map((item) => (
          <Card
            key={item.label}
            style={{
              height: "100%",
              borderRadius: 18,
              background: item.background,
              transform: "translateY(-28px)",
              border: "1px solid rgba(15, 54, 49, 0.08)",
              boxShadow: "0 14px 30px rgba(15, 54, 49, 0.08)",
            }}
            pt={{ body: { style: { height: "100%", padding: 0 } } }}
          >
            <div
              style={{
                height: "100%",
                display: "grid",
                gridTemplateColumns: isFullScreen ? "82px 1fr" : "70px 1fr",
                alignItems: "center",
                gap: isFullScreen ? 14 : 12,
                padding: isFullScreen ? "0.9rem 1.1rem" : "0.75rem 1rem",
              }}
            >
              <div
                style={{
                  width: isFullScreen ? 82 : 70,
                  height: isFullScreen ? 82 : 70,
                  borderRadius: 18,
                  background: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: item.color,
                  fontSize: isFullScreen ? "2.4rem" : "2rem",
                  fontWeight: 900,
                  boxShadow: "0 10px 22px rgba(15, 54, 49, 0.09)",
                }}
              >
                {item.value}
              </div>

              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    color: "#10201e",
                    fontWeight: 900,
                    fontSize: isFullScreen ? "1.18rem" : "1.05rem",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.label}
                </div>

                <div
                  style={{
                    color: "#66716f",
                    fontWeight: 700,
                    fontSize: isFullScreen ? "0.88rem" : "0.82rem",
                    marginTop: 4,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.helper}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}