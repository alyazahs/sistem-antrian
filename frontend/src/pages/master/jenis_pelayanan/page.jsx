import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Button } from "primereact/button";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import TabelJenisPelayanan from "./components/tabelJenisPelayanan";
import FormDialogJenisPelayanan from "./components/formJenisPelayanan";

const API_BASE = import.meta.env.VITE_API_URL;
const API = `${API_BASE}/api/jenis-pelayanan`;

export default function JenisPelayananPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [form, setForm] = useState({ id: null, nama: "" });
  const [errors, setErrors] = useState({});

  const toastRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API);
      setData(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (err) {
      console.error(err);
      toastRef.current?.show({
        severity: "error",
        summary: "Gagal",
        detail: "Gagal ambil data jenis pelayanan",
        life: 2500,
      });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!String(form.nama || "").trim()) {
      newErrors.nama = "Nama wajib diisi";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const isEdit = !!form.id;
    const url = isEdit ? `${API}/${form.id}` : API;

    try {
      if (isEdit) {
        await axios.put(url, { nama: form.nama });
        toastRef.current?.show({
          severity: "success",
          summary: "Berhasil",
          detail: "Data berhasil diperbarui",
          life: 2000,
        });
      } else {
        await axios.post(url, { nama: form.nama });
        toastRef.current?.show({
          severity: "success",
          summary: "Berhasil",
          detail: "Data berhasil ditambahkan",
          life: 2000,
        });
      }

      setDialogVisible(false);
      setForm({ id: null, nama: "" });
      setErrors({});
      fetchData();
    } catch (err) {
      console.error(err);
      toastRef.current?.show({
        severity: "error",
        summary: "Gagal",
        detail: err?.response?.data?.message || "Gagal menyimpan data",
        life: 2500,
      });
    }
  };

  const handleEdit = (row) => {
    setForm({ id: row.id, nama: row.nama });
    setErrors({});
    setDialogVisible(true);
  };

  const handleDelete = (row) => {
    confirmDialog({
      message: `Yakin hapus '${row.nama}'?`,
      header: "Konfirmasi Hapus",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Ya",
      rejectLabel: "Batal",
      accept: async () => {
        try {
          await axios.delete(`${API}/${row.id}`);
          toastRef.current?.show({
            severity: "success",
            summary: "Berhasil",
            detail: "Data berhasil dihapus",
            life: 2000,
          });
          fetchData();
        } catch (err) {
          console.error(err);
          toastRef.current?.show({
            severity: "error",
            summary: "Gagal",
            detail: err?.response?.data?.message || "Gagal menghapus data",
            life: 2500,
          });
        }
      },
    });
  };

  return (
    <div className="card">
      <Toast ref={toastRef} />
      <ConfirmDialog />

      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-xl font-semibold">Master Jenis Pelayanan</h3>

        <Button
          label="Tambah"
          icon="pi pi-plus"
          onClick={() => {
            setForm({ id: null, nama: "" });
            setErrors({});
            setDialogVisible(true);
          }}
        />
      </div>

      <TabelJenisPelayanan
        data={data}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <FormDialogJenisPelayanan
        visible={dialogVisible}
        onHide={() => {
          setDialogVisible(false);
          setForm({ id: null, nama: "" });
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