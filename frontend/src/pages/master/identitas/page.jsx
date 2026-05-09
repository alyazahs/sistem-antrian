import { useEffect, useRef, useState } from "react";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import TabelIdentitas from "./components/tabelIdentitas";
import { deletePengunjung, getUser, listPengunjung } from "../../../api";
import { showAppToast } from "../../../utils/toast";

export default function IdentitasPage() {
  const [data, setData] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const toastRef = useRef(null);
  const currentUser = getUser();
  const canDelete = currentUser?.role === "kasi_pelayanan";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await listPengunjung();
      const rows = Array.isArray(res) ? res : res?.data || [];
      setData(rows);
      setOriginalData(rows);
    } catch (err) {
      console.error(err);
      showAppToast(toastRef, "error", "Gagal memuat data identitas.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setKeyword(value);
    const q = (value || "").toLowerCase().trim();

    if (!q) {
      setData(originalData);
      return;
    }

    setData(
      originalData.filter((item) => {
        const nama = String(item?.nama || "").toLowerCase();
        const nik = String(item?.nik || "").toLowerCase();
        return nama.includes(q) || nik.includes(q);
      })
    );
  };

  const handleDelete = (row) => {
    if (!canDelete) {
      showAppToast(toastRef, "warn", "Hanya Kasi Pelayanan yang bisa menghapus data identitas.");
      return;
    }

    confirmDialog({
      message: `Yakin hapus identitas '${row.nama}'? Riwayat antrian terkait ikut terhapus.`,
      header: "Konfirmasi Hapus",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Ya",
      rejectLabel: "Batal",
      accept: async () => {
        try {
          await deletePengunjung(row.id);
          showAppToast(toastRef, "success", "Data identitas berhasil dihapus.");
          setKeyword("");
          fetchData();
        } catch (err) {
          console.error(err);
          showAppToast(
            toastRef,
            "error",
            err?.response?.data?.message || "Gagal menghapus data identitas."
          );
        }
      },
    });
  };

  return (
    <div className="card">
      <Toast ref={toastRef} />
      <ConfirmDialog />

      <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h3 className="text-xl font-semibold">Data Pengunjung Terdaftar</h3>

        <span className="p-input-icon-left w-full md:w-[360px] pl-2">
          <i className="pi pi-search ml-2" />
          <InputText
            value={keyword}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Cari nama / NIK..."
            className="w-full pl-8"
          />
        </span>
      </div>

      <TabelIdentitas
        data={data}
        loading={loading}
        canDelete={canDelete}
        onDelete={handleDelete}
      />
    </div>
  );
}
