import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Button } from "primereact/button";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import { InputText } from "primereact/inputtext";
import TabelJenisPelayanan from "./components/tabelJenisPelayanan";
import FormDialogJenisPelayanan from "./components/formJenisPelayanan";

const API_BASE = import.meta.env.VITE_API_URL;
const API = `${API_BASE}/api/jenis-pelayanan`;

export default function JenisPelayananPage() {
  const [data, setData] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [keyword, setKeyword] = useState("");
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
      const rows = Array.isArray(res.data) ? res.data : res.data.data || [];
      setData(rows);
      setOriginalData(rows);
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

  const handleSearch = (value) => {
    const q = (value || "").toLowerCase().trim();
    setKeyword(value);

    if (!q) {
      setData(originalData);
      return;
    }

    const filtered = originalData.filter((item) =>
      String(item?.nama || "").toLowerCase().includes(q)
    );
    setData(filtered);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!String(form.nama || "").trim()) newErrors.nama = "Nama wajib diisi";
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
      setKeyword("");
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
          setKeyword("");
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

      <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h3 className="text-xl font-semibold">Master Jenis Pelayanan</h3>

        <div className="flex w-full items-center gap-2 md:w-auto">
          <span className="p-input-icon-left w-full md:w-[320px]">
            <i className="pi pi-search ml-2" />
            <InputText
              value={keyword}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Cari jenis pelayanan..."
              className="w-full pl-8"
            />
          </span>

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
      </div>

      <TabelJenisPelayanan data={data} loading={loading} onEdit={handleEdit} onDelete={handleDelete} />

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