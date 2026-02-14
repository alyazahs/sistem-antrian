import MiniStat from "./miniStat";

export default function AntrianStats({ summary }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
      <MiniStat label="Total Hari ini" value={summary.total_hari_ini} icon="pi-users" tone="blue" />
      <MiniStat label="Menunggu" value={summary.menunggu} icon="pi-phone" tone="orange" />
      <MiniStat label="Dilayani" value={summary.dilayani} icon="pi-check-circle" tone="green" />
      <MiniStat label="Dilewati" value={summary.dilewati} icon="pi-forward" tone="red" />
    </div>
  );
}
