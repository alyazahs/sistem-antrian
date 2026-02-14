import { Card } from "primereact/card";
import { Button } from "primereact/button";

export default function AntrianNow({
  now,
  busyAction,
  onRecall,
  onSelesai,
  onLewati,
  onCallNext
}) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <div className="mb-2 font-semibold text-gray-700">
        Antrian Sedang Dipanggil
      </div>

      {now ? (
        <div className="text-center py-8">
          <div className="text-3xl font-bold">{now.nomor_antrian}</div>
          <div className="font-semibold">{now.nama}</div>
          <div className="text-xs text-gray-500">{now.jenis_pelayanan}</div>

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button label="Panggil Ulang" icon="pi pi-volume-up" onClick={onRecall} />
            <Button label="Selesai" icon="pi pi-check" severity="success" onClick={onSelesai} />
            <Button label="Lewati" icon="pi pi-forward" severity="warning" onClick={onLewati} />
          </div>
        </div>
      ) : (
        <div className="text-center py-10 text-gray-500">
          Tidak ada antrian dipanggil
        </div>
      )}

      <Button
        className="mt-4 w-full"
        label="Panggil Antrian Berikutnya"
        icon="pi pi-megaphone"
        disabled={busyAction}
        onClick={onCallNext}
      />
    </Card>
  );
}