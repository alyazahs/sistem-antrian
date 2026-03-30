import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";

const DetailItem = ({ label, value }) => (
  <div className="mb-3">
    <label className="block text-sm font-semibold mb-1">{label}</label>
    <div className="p-2 border rounded-md bg-gray-50">{value || "-"}</div>
  </div>
);

const DetailLaporan = ({ visible, onHide, detail }) => {
  return (
    <Dialog
      header="Detail Laporan"
      visible={visible}
      onHide={onHide}
      style={{ width: "40vw" }}
      breakpoints={{ "960px": "90vw", "640px": "95vw" }}
      modal
    >
      {detail ? (
        <div className="grid">
          <div className="col-12 md:col-6">
            <DetailItem label="Tanggal Kunjungan" value={detail.tanggal_kunjungan} />
          </div>
          <div className="col-12 md:col-6">
            <DetailItem label="NIK" value={detail.nik} />
          </div>
          <div className="col-12 md:col-6">
            <DetailItem label="Nama" value={detail.nama} />
          </div>
          <div className="col-12 md:col-6">
            <DetailItem label="Nomor HP" value={detail.nohp} />
          </div>
          <div className="col-12 md:col-6">
            <DetailItem label="Umur" value={detail.umur} />
          </div>
          <div className="col-12 md:col-6">
            <DetailItem label="Keperluan" value={detail.keperluan} />
          </div>
          <div className="col-12">
            <DetailItem label="Alamat" value={detail.alamat} />
          </div>

          <div className="col-12 text-right pt-2">
            <Button label="Tutup" icon="pi pi-times" onClick={onHide} />
          </div>
        </div>
      ) : null}
    </Dialog>
  );
};

export default DetailLaporan;