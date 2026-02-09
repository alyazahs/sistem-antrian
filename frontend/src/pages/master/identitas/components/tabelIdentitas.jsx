import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

const TabelIdentitas = ({ data, loading }) => {
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
      <Column field="umur" header="Umur" sortable style={{ width: "90px" }} />
      <Column field="alamat" header="Alamat" />
      <Column field="created_at" header="Terdaftar" />
    </DataTable>
  );
};

export default TabelIdentitas;