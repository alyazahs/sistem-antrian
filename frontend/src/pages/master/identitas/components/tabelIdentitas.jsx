import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Tooltip } from "primereact/tooltip";

const TabelIdentitas = ({ data, loading, canDelete = false, onDelete }) => {
  const formatTanggal = (row) => {
    if (!row.tanggal_lahir) return "-";
    return new Date(row.tanggal_lahir).toLocaleDateString("id-ID");
  };

  const formatCreatedAt = (row) => {
    if (!row.created_at) return "-";
    return new Date(row.created_at).toLocaleDateString("id-ID");
  };

  return (
    <>
      {canDelete && <Tooltip target=".id-btn-del" content="Hapus identitas" position="top" />}

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

        {canDelete && (
          <Column
            header="Aksi"
            body={(row) => (
              <Button
                icon="pi pi-trash"
                severity="danger"
                size="small"
                rounded
                outlined
                className="id-btn-del"
                onClick={() => onDelete?.(row)}
              />
            )}
            style={{ width: "90px" }}
          />
        )}
      </DataTable>
    </>
  );
};

export default TabelIdentitas;