import { Badge } from "primereact/badge";

export default function QueueRow({ item, active }) {
  return (
    <div
      className={[
        "flex items-center justify-between rounded-lg border p-3",
        active ? "border-blue-200 bg-blue-50" : "border-gray-200 bg-white",
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        <Badge value={item.nomor_antrian ?? "-"} />
        <div>
          <div className="font-semibold text-gray-800">{item.nama}</div>
          <div className="text-xs text-gray-500">{item.jenis_pelayanan}</div>
        </div>
      </div>
    </div>
  );
}