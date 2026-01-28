import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";

const FormDialogJenisPelayanan = ({
  visible,
  onHide,
  onSubmit,
  form,
  setForm,
  errors,
}) => {
  const inputClass = (field) =>
    errors[field] ? "p-invalid w-full mt-2" : "w-full mt-2";

  return (
    <Dialog
      header={form.id ? "Edit Jenis Pelayanan" : "Tambah Jenis Pelayanan"}
      visible={visible}
      onHide={onHide}
      style={{ width: "30vw" }}
      breakpoints={{ "960px": "90vw", "640px": "95vw" }}
      modal
    >
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <div>
          <label>Nama Jenis Pelayanan</label>
          <InputText
            className={inputClass("nama")}
            value={form.nama || ""}
            onChange={(e) => setForm({ ...form, nama: e.target.value })}
          />
          {errors.nama && <small className="text-red-500">{errors.nama}</small>}
        </div>

        <div className="text-right pt-3">
          <Button type="submit" label="Simpan" icon="pi pi-save" />
        </div>
      </form>
    </Dialog>
  );
};

export default FormDialogJenisPelayanan;