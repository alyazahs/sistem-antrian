import { useEffect, useMemo, useState } from "react";
import { dashboardSummary, dashboardChart, dashboardRecent } from "../api";
import { Card } from "primereact/card";
import { Dropdown } from "primereact/dropdown";
import { Chart } from "primereact/chart";
import { ProgressSpinner } from "primereact/progressspinner";
import { Tag } from "primereact/tag";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [tahun, setTahun] = useState(new Date().getFullYear().toString());

  const [summary, setSummary] = useState({
    cards: {
      total_pengunjung: 0,
      total_antrian: 0,
      total_layanan: 0,
      total_pengunjung_bulan_ini: 0,
    },
  });

  const [chartDataRaw, setChartDataRaw] = useState({
    labels: [],
    values: [],
  });

  const [recent, setRecent] = useState([]);

  const tahunOptions = Array.from({ length: 5 }, (_, i) => {
    const y = (new Date().getFullYear() - i).toString();
    return { label: y, value: y };
  });

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const [sumRes, chartRes, recentRes] = await Promise.all([
        dashboardSummary(),
        dashboardChart(tahun),
        dashboardRecent(6),
      ]);

      setSummary({
        cards: {
          total_pengunjung: sumRes?.cards?.total_pengunjung ?? 0,
          total_antrian: sumRes?.cards?.total_antrian ?? 0,
          total_layanan: sumRes?.cards?.total_layanan ?? 0,
          total_pengunjung_bulan_ini: sumRes?.cards?.total_pengunjung_bulan_ini ?? 0,
        },
      });

      setChartDataRaw({
        labels: chartRes?.labels || [],
        values: chartRes?.values || [],
      });

      setRecent(recentRes?.data || []);
    } catch (err) {
      console.error("Gagal load dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [tahun]);

  const chartData = useMemo(() => {
    return {
      labels: chartDataRaw.labels,
      datasets: [
        {
          label: "Jumlah Pengunjung",
          data: chartDataRaw.values,
          fill: true,
          tension: 0.4,
          borderColor: "#4f83ff",
          backgroundColor: "rgba(79,131,255,0.12)",
          pointBackgroundColor: "#4f83ff",
          pointBorderColor: "#4f83ff",
          pointRadius: 4,
          pointHoverRadius: 5,
        },
      ],
    };
  }, [chartDataRaw]);

  const chartOptions = useMemo(() => {
    return {
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: "#94a3b8",
          },
        },
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0,
            color: "#94a3b8",
          },
          grid: {
            color: "rgba(148,163,184,0.15)",
          },
        },
      },
    };
  }, []);

  const cards = [
    {
      title: "Total Data Pengunjung",
      value: summary.cards.total_pengunjung,
      icon: "pi pi-users",
      bg: "#ede9fe",
      color: "#8b7cf6",
    },
    {
      title: "Total Antrian",
      value: summary.cards.total_antrian,
      icon: "pi pi-ticket",
      bg: "#fef3c7",
      color: "#eab308",
    },
    {
      title: "Total Layanan",
      value: summary.cards.total_layanan,
      icon: "pi pi-briefcase",
      bg: "#dcfce7",
      color: "#22c55e",
    },
    {
      title: "Total Pengunjung Bulan Ini",
      value: summary.cards.total_pengunjung_bulan_ini,
      icon: "pi pi-calendar",
      bg: "#ffe4d6",
      color: "#f97316",
    },
  ];

  const getStatusSeverity = (status) => {
    if (status === "selesai") return "success";
    if (status === "dipanggil") return "info";
    if (status === "menunggu") return "warning";
    if (status === "dilewati") return "danger";
    return null;
  };

  const getStatusLabel = (status) => {
    if (status === "selesai") return "Selesai";
    if (status === "dipanggil") return "Dipanggil";
    if (status === "menunggu") return "Menunggu";
    if (status === "dilewati") return "Dilewati";
    return status || "-";
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <ProgressSpinner />
      </div>
    );
  }

  return (
    <div className="px-2">
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-slate-800">Dashboard</h1>
        <p className="mt-2 text-sm text-slate-500">
          Ringkasan data pengunjung, antrian, layanan, dan aktivitas terbaru.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((item, idx) => (
          <Card
            key={idx}
            className="rounded-3xl border-0 shadow-sm"
            pt={{ body: { className: "p-0" } }}
          >
            <div className="flex items-center justify-between p-5">
              <div>
                <div className="max-w-[180px] text-[15px] font-medium leading-6 text-slate-500">
                  {item.title}
                </div>
                <div className="mt-2 text-3xl font-bold text-slate-800">
                  {item.value}
                </div>
              </div>

              <div
                className="flex h-16 w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: item.bg }}
              >
                <i
                  className={`${item.icon} text-2xl`}
                  style={{ color: item.color }}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mb-6 rounded-3xl shadow-sm">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold text-slate-800">Jumlah Pengunjung</h2>

          <Dropdown
            value={tahun}
            options={tahunOptions}
            onChange={(e) => setTahun(e.value)}
            className="w-full sm:w-36"
          />
        </div>

        <div style={{ height: "360px" }}>
          <Chart type="line" data={chartData} options={chartOptions} />
        </div>
      </Card>

      <Card className="rounded-3xl shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">Aktivitas Terbaru</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-y-3">
            <thead>
              <tr className="bg-slate-100 text-left text-sm text-slate-600">
                <th className="rounded-l-2xl px-4 py-4">No Antrian</th>
                <th className="px-4 py-4">Nama</th>
                <th className="px-4 py-4">Layanan</th>
                <th className="px-4 py-4">Tanggal</th>
                <th className="rounded-r-2xl px-4 py-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-6 text-center text-slate-500">
                    Belum ada data aktivitas.
                  </td>
                </tr>
              ) : (
                recent.map((item) => (
                  <tr key={item.id}>
                    <td className="rounded-l-2xl bg-white px-4 py-4 font-semibold text-slate-800 shadow-sm">
                      {item.nomor_antrian}
                    </td>
                    <td className="bg-white px-4 py-4 text-slate-700 shadow-sm">{item.nama}</td>
                    <td className="bg-white px-4 py-4 text-slate-700 shadow-sm">{item.jenis_pelayanan}</td>
                    <td className="bg-white px-4 py-4 text-slate-500 shadow-sm">{item.tanggal_format}</td>
                    <td className="rounded-r-2xl bg-white px-4 py-4 shadow-sm">
                      <Tag
                        value={getStatusLabel(item.status)}
                        severity={getStatusSeverity(item.status)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}