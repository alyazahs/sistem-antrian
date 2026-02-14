import { Card } from "primereact/card";
import { Button } from "primereact/button";
import QueueRow from "./queueRow";

export default function AntrianList({ list, loading, busyAction, onCallNext }) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <div className="font-semibold text-gray-700">Daftar Antrian</div>
        <Button
          label="Panggil Antrian"
          icon="pi pi-phone"
          size="small"
          disabled={busyAction || list.length === 0}
          onClick={onCallNext}
        />
      </div>

      {list.length === 0 ? (
        <div className="py-10 text-center text-sm text-gray-500">
          Tidak ada antrian menunggu.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {list.map((it) => (
            <QueueRow key={it.id} item={it} />
          ))}
        </div>
      )}
    </Card>
  );
}
