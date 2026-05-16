import { useEffect, useRef, useState } from "react";
import { Button } from "primereact/button";
import { confirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import { InputText } from "primereact/inputtext";
import {
  createUser,
  deleteUser,
  getUser,
  listUsers,
  updateUser,
} from "../../api";
import TabelKelolaUser from "./components/tabelKelolaUser";
import FormDialogKelolaUser from "./components/formKelolaUser";

const initialForm = {
  id: null,
  nama: "",
  email: "",
  role: "admin_pelayanan",
  status: "aktif",
  password: "",
};

export default function KelolaUserPage() {
  const [data, setData] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});

  const toastRef = useRef(null);
  const currentUser = getUser();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await listUsers();
      const rows = Array.isArray(res?.data) ? res.data : [];
      setData(rows);
      setOriginalData(rows);
    } catch (err) {
      toastRef.current?.show({
        severity: "error",
        summary: "Gagal",
        detail: err?.response?.data?.message || "Gagal ambil data user",
        life: 2500,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    const q = (value || "").toLowerCase().trim();
    setKeyword(value);

    if (!q) {
      setData(originalData);
      return;
    }

    const filtered = originalData.filter((item) =>
      [
        item?.nama || "",
        item?.email || "",
        item?.role || "",
        item?.status || "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );

    setData(filtered);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!String(form.nama || "").trim()) newErrors.nama = "Nama wajib diisi";
    if (!String(form.email || "").trim() && !form.id) newErrors.email = "Email wajib diisi";
    if (!String(form.role || "").trim()) newErrors.role = "Role wajib dipilih";
    if (!String(form.status || "").trim()) newErrors.status = "Status wajib dipilih";
    if (!String(form.password || "").trim() && !form.id) newErrors.password = "Password wajib diisi";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getEditedUser = () =>
    originalData.find((item) => Number(item.id) === Number(form.id));

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (form.id) {
        const editedUser = getEditedUser();
        const userPayload = {
          nama: String(form.nama || "").trim(),
          role: form.role,
          status: form.status,
        };
        const hasUserChanges =
          !editedUser ||
          userPayload.nama !== String(editedUser.nama || "").trim() ||
          userPayload.role !== editedUser.role ||
          userPayload.status !== editedUser.status;

        if (!hasUserChanges) {
          toastRef.current?.show({
            severity: "info",
            summary: "Tidak ada perubahan",
            detail: "Tidak ada data yang diubah",
            life: 2000,
          });
          setDialogVisible(false);
          setForm(initialForm);
          setErrors({});
          return;
        }

        if (hasUserChanges) {
          await updateUser(form.id, userPayload);
        }

        toastRef.current?.show({
          severity: "success",
          summary: "Berhasil",
          detail: "Data user berhasil diperbarui",
          life: 2000,
        });
      } else {
        await createUser({
          nama: form.nama,
          email: form.email,
          role: form.role,
          status: form.status,
          password: form.password,
        });

        toastRef.current?.show({
          severity: "success",
          summary: "Berhasil",
          detail: "User berhasil ditambahkan",
          life: 2000,
        });
      }

      setDialogVisible(false);
      setForm(initialForm);
      setErrors({});
      setKeyword("");
      fetchData();
    } catch (err) {
      toastRef.current?.show({
        severity: "error",
        summary: "Gagal",
        detail: err?.response?.data?.message || "Gagal menyimpan data user",
        life: 2500,
      });
    }
  };

  const handleEdit = (row) => {
    setForm({
      id: row.id,
      nama: row.nama || "",
      email: row.email || "",
      role: row.role || "admin_pelayanan",
      status: row.status || "aktif",
      password: "",
    });
    setErrors({});
    setDialogVisible(true);
  };

  const handleDelete = (row) => {
    const isSelf = Number(currentUser?.id) === Number(row.id);
    if (isSelf) {
      toastRef.current?.show({
        severity: "warn",
        summary: "Tidak bisa",
        detail: "Akun yang sedang login tidak bisa dihapus",
        life: 2500,
      });
      return;
    }

    confirmDialog({
      message: `Yakin hapus user '${row.nama}'?`,
      header: "Konfirmasi Hapus",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Ya",
      rejectLabel: "Batal",
      accept: async () => {
        try {
          await deleteUser(row.id);
          toastRef.current?.show({
            severity: "success",
            summary: "Berhasil",
            detail: "User berhasil dihapus",
            life: 2000,
          });
          setKeyword("");
          fetchData();
        } catch (err) {
          toastRef.current?.show({
            severity: "error",
            summary: "Gagal",
            detail: err?.response?.data?.message || "Gagal menghapus user",
            life: 2500,
          });
        }
      },
    });
  };

  return (
    <div className="card">
      <Toast ref={toastRef} />

      <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h3 className="text-xl font-semibold">Kelola User</h3>

        <div className="flex w-full items-center gap-2 md:w-auto">
          <span className="p-input-icon-left w-full md:w-[320px]">
            <i className="pi pi-search ml-2" />
            <InputText
              value={keyword}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Cari user..."
              className="w-full pl-8"
            />
          </span>

          <Button
            label="Tambah"
            icon="pi pi-plus"
            onClick={() => {
              setForm(initialForm);
              setErrors({});
              setDialogVisible(true);
            }}
          />
        </div>
      </div>

      <TabelKelolaUser
        data={data}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        currentUser={currentUser}
      />

      <FormDialogKelolaUser
        visible={dialogVisible}
        onHide={() => {
          setDialogVisible(false);
          setForm(initialForm);
          setErrors({});
        }}
        onSubmit={handleSubmit}
        form={form}
        setForm={setForm}
        errors={errors}
      />
    </div>
  );
}