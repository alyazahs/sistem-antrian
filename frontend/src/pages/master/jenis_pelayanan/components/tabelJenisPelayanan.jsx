import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Tooltip } from "primereact/tooltip";

const TabelJenisPelayanan = ({ data, loading, onEdit, onDelete }) => {
  return (
    <>
      <Tooltip target=".jp-btn-edit" />
      <Tooltip target=".jp-btn-del" />

      <DataTable
        value={data}
        loading={loading}
        size="small"
        paginator
        rows={10}
        rowsPerPageOptions={[10, 25, 50, 75, 100, 250, 500, 1000]}
        emptyMessage="Data tidak ada"
      >
        <Column header="No" body={(_, options) => options.rowIndex + 1}/>
        <Column field="nama" header="Nama Jenis Pelayanan" sortable />

        <Column
          header="Aksi"
          body={(row) => (
            <div className="flex gap-2">
              <Button
                icon="pi pi-pencil"
                severity="warning"
                size="small"
                rounded
                outlined
                className="jp-btn-edit"
                onClick={() => onEdit(row)}
              />
              <Button
                icon="pi pi-trash"
                severity="danger"
                size="small"
                rounded
                outlined
                className="jp-btn-del"
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

export default TabelJenisPelayanan;