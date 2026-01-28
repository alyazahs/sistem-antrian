import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

const TabelIdentitas = ({ data, loading }) => {
  return (
    <DataTable
      value={data}
      paginator
      rows={10}
      rowsPerPageOptions={[10, 25, 50, 100]}
      loading={loading}
      size="small"
      stripedRows
      showGridlines
      emptyMessage="Data tidak ada"
    >
      <Column field="id" header="ID" style={{ width: "90px" }} />
      <Column field="nama" header="Nama" />
      <Column field="nik" header="NIK" />
      <Column field="nohp" header="No HP" />
      <Column field="umur" header="Umur" style={{ width: "90px" }} />
      <Column field="alamat" header="Alamat" />
      <Column field="created_at" header="Terdaftar" />
    </DataTable>
  );
};

export default TabelIdentitas;