import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Tooltip } from "primereact/tooltip";
import { Tag } from "primereact/tag";

const ROLE_LABEL = {
  admin_pelayanan: "Admin Pelayanan",
  kasi_pelayanan: "Kasi Pelayanan",
};

const STATUS_LABEL = {
  aktif: "Aktif",
  tidak_aktif: "Non-aktif",
  cuti: "Cuti",
};

const getSeverity = (status) => {
  switch (status) {
    case "aktif":
      return "success";
    case "cuti":
      return "warning";
    case "tidak_aktif":
      return "danger";
    default:
      return null;
  }
};

const TabelKelolaUser = ({ data, loading, onEdit, onDelete, currentUser }) => {
  return (
    <>
      <Tooltip target=".ku-btn-edit" content="Edit user" position="top" />
      <Tooltip target=".ku-btn-del" content="Hapus user" position="top" />

      <DataTable
        value={data}
        loading={loading}
        size="small"
        paginator
        rows={10}
        rowsPerPageOptions={[10, 25, 50, 75, 100, 250, 500, 1000]}
        emptyMessage="Data user tidak ada"
      >
        <Column header="No" body={(_, options) => options.rowIndex + 1} style={{ width: "70px" }} />
        <Column field="nama" header="Nama" />
        <Column
          field="role"
          header="Role"
          body={(row) => ROLE_LABEL[row.role] || row.role}
        />
        <Column field="email" header="Email" />
        <Column
          field="status"
          header="Status"
          body={(row) => (
            <Tag
              value={STATUS_LABEL[row.status] || row.status}
              severity={getSeverity(row.status)}
            />
          )}
        />

        <Column
          header="Aksi"
          body={(row) => {
            const isSelf = Number(currentUser?.id) === Number(row.id);

            return (
              <div className="flex gap-2">
                <Button
                  icon="pi pi-pencil"
                  severity="warning"
                  size="small"
                  rounded
                  outlined
                  className="ku-btn-edit"
                  onClick={() => onEdit(row)}
                />
                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  size="small"
                  rounded
                  outlined
                  className="ku-btn-del"
                  onClick={() => onDelete(row)}
                  disabled={isSelf}
                />
              </div>
            );
          }}
          style={{ width: "140px" }}
        />
      </DataTable>
    </>
  );
};

export default TabelKelolaUser;