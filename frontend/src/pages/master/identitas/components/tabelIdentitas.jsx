import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

const TabelIdentitas = ({ data, loading }) => {
  const formatTanggal = (row) => {
    if (!row.tanggal_lahir) return "-";
    return new Date(row.tanggal_lahir).toLocaleDateString("id-ID");
  };

  const formatCreatedAt = (row) => {
    if (!row.created_at) return "-";
    return new Date(row.created_at).toLocaleDateString("id-ID");
  };

  return (
    <DataTable
      value={data}
      loading={loading}
      size="small"
      paginator
      rows={10}
      rowsPerPageOptions={[10, 25, 50, 75, 100, 250, 500, 1000]}
      emptyMessage="Data tidak ada"
    >
      <Column header="No" body={(_, options) => options.rowIndex + 1} style={{ width: "80px" }} />
      <Column field="nama" header="Nama" sortable />
      <Column field="nik" header="NIK" />
      <Column field="nohp" header="No HP" />
      <Column header="Tanggal Lahir" body={formatTanggal} sortable style={{ width: "120px" }} />
      <Column field="umur" header="Umur" />
      <Column field="alamat" header="Alamat" />
      <Column header="Terdaftar" body={formatCreatedAt} />
    </DataTable>
  );
};

export default TabelIdentitas;