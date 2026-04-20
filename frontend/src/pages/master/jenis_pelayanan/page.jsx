import { useEffect, useRef, useState } from "react";
import { Button } from "primereact/button";
import { confirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import { InputText } from "primereact/inputtext";
import TabelJenisPelayanan from "./components/tabelJenisPelayanan";
import FormDialogJenisPelayanan from "./components/formJenisPelayanan";
import { showAppToast } from "../../../utils/toast";
import {
  listJenisPelayanan,
  createJenisPelayanan,
  updateJenisPelayanan,
  deleteJenisPelayanan,
} from "../../../api";

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
      const res = await listJenisPelayanan();
      const rows = Array.isArray(res) ? res : res?.data || [];
      setData(rows);
      setOriginalData(rows);
    } catch (err) {
      console.error(err);
      showAppToast(toastRef, "error", "Gagal memuat data jenis pelayanan.");
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

    if (!String(form.nama || "").trim()) {
      newErrors.nama = "Nama wajib diisi";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const isEdit = !!form.id;

    try {
      if (isEdit) {
        await updateJenisPelayanan(form.id, { nama: form.nama });
        showAppToast(toastRef, "success", "Data berhasil diperbarui.");
      } else {
        await createJenisPelayanan({ nama: form.nama });
        showAppToast(toastRef, "success", "Data berhasil ditambahkan.");
      }

      setDialogVisible(false);
      setForm({ id: null, nama: "" });
      setErrors({});
      setKeyword("");
      fetchData();
    } catch (err) {
      console.error(err);
      showAppToast(
        toastRef,
        "error",
        err?.response?.data?.message || "Gagal menyimpan data."
      );
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
          await deleteJenisPelayanan(row.id);
          showAppToast(toastRef, "success", "Data berhasil dihapus.");
          setKeyword("");
          fetchData();
        } catch (err) {
          console.error(err);
          showAppToast(
            toastRef,
            "error",
            err?.response?.data?.message || "Gagal menghapus data"
          );
        }
      },
    });
  };

  return (
    <div className="card">
      <Toast ref={toastRef} />

      <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h3 className="min-w-0 text-xl font-semibold">
          Master Jenis Pelayanan
        </h3>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center lg:flex-shrink-0">
          <span className="p-input-icon-left w-full sm:w-[320px]">
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
            className="w-full sm:w-auto"
          />
        </div>
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