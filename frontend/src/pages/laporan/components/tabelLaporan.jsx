import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Tooltip } from "primereact/tooltip";

const TabelLaporan = ({ data, loading, onDetail, onDelete }) => {
    const formatTanggal = (row) => {
    if (!row.tanggal_kunjungan) return "-";
    return new Date(row.tanggal_kunjungan).toLocaleDateString("id-ID");
  };
  
  return (
    <>
      <Tooltip target=".lp-btn-detail" content="Detail" />
      <Tooltip target=".lp-btn-del" content="Hapus" />

      <DataTable
        value={data}
        loading={loading}
        size="small"
        paginator
        rows={10}
        rowsPerPageOptions={[10, 25, 50, 75, 100, 250, 500, 1000]}
        emptyMessage="Data laporan tidak ada"
      >
        <Column
          header="No"
          body={(_, options) => options.rowIndex + 1}
          style={{ width: "70px" }}
        />
        <Column field="tanggal_kunjungan" header="Tanggal" body={formatTanggal} />
        <Column field="nik" header="NIK" />
        <Column field="nama" header="Nama" />
        <Column field="umur" header="Umur" />
        <Column field="keperluan" header="Keperluan" />
        <Column field="alamat" header="Alamat" />
        <Column field="nohp" header="No HP" />
        <Column field="petugas_nama" header="Ditangani Oleh" />

        <Column
          header="Aksi"
          body={(row) => (
            <div className="flex gap-2">
              <Button
                icon="pi pi-search"
                severity="warning"
                size="small"
                rounded
                outlined
                className="lp-btn-detail"
                onClick={() => onDetail(row)}
              />
              <Button
                icon="pi pi-trash"
                severity="danger"
                size="small"
                rounded
                outlined
                className="lp-btn-del"
                onClick={() => onDelete(row)}
              />
            </div>
          )}
          style={{ width: "140px" }}
        />
      </DataTable>
    </>
  );
};

export default TabelLaporan;