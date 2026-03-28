import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Dropdown } from "primereact/dropdown";

const roleOptions = [
  { label: "Admin Pelayanan", value: "admin_pelayanan" },
  { label: "Kasi Pelayanan", value: "kasi_pelayanan" },
];

const statusOptions = [
  { label: "Aktif", value: "aktif" },
  { label: "Non-aktif", value: "tidak_aktif" },
  { label: "Cuti", value: "cuti" },
];

const FormDialogKelolaUser = ({
  visible,
  onHide,
  onSubmit,
  form,
  setForm,
  errors,
}) => {
  const isEdit = !!form.id;

  const inputClass = (field) =>
    errors[field] ? "p-invalid w-full mt-2" : "w-full mt-2";

  return (
    <Dialog
      header={isEdit ? "Edit User" : "Tambah User"}
      visible={visible}
      onHide={onHide}
      style={{ width: "35vw" }}
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
          <label>Nama</label>
          <InputText
            className={inputClass("nama")}
            value={form.nama || ""}
            onChange={(e) => setForm({ ...form, nama: e.target.value })}
          />
          {errors.nama && <small className="text-red-500">{errors.nama}</small>}
        </div>

        <div>
          <label>Email</label>
          <InputText
            className={inputClass("email")}
            value={form.email || ""}
            disabled={isEdit}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          {errors.email && <small className="text-red-500">{errors.email}</small>}
        </div>

        <div>
          <label>Role</label>
          <Dropdown
            className={inputClass("role")}
            value={form.role || ""}
            options={roleOptions}
            onChange={(e) => setForm({ ...form, role: e.value })}
            placeholder="Pilih role"
          />
          {errors.role && <small className="text-red-500">{errors.role}</small>}
        </div>

        <div>
          <label>Status</label>
          <Dropdown
            className={inputClass("status")}
            value={form.status || ""}
            options={statusOptions}
            onChange={(e) => setForm({ ...form, status: e.value })}
            placeholder="Pilih status"
          />
          {errors.status && <small className="text-red-500">{errors.status}</small>}
        </div>

        {!isEdit ? (
          <div>
            <label>Password</label>
            <Password
              toggleMask
              feedback={false}
              className="w-full mt-2"
              inputClassName={errors.password ? "p-invalid w-full" : "w-full"}
              value={form.password || ""}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            {errors.password && <small className="text-red-500">{errors.password}</small>}
          </div>
        ) : (
          <div>
            <label>Reset Password</label>
            <Password
              toggleMask
              feedback={false}
              className="w-full mt-2"
              inputClassName="w-full"
              value={form.reset_password || ""}
              onChange={(e) => setForm({ ...form, reset_password: e.target.value })}
              placeholder="Kosongkan jika tidak diubah"
            />
          </div>
        )}

        <div className="text-right pt-3">
          <Button type="submit" label="Simpan" icon="pi pi-save" />
        </div>
      </form>
    </Dialog>
  );
};

export default FormDialogKelolaUser;