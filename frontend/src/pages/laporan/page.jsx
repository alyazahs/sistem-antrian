import { useEffect, useRef, useState } from "react";
import { Button } from "primereact/button";
import { confirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import { InputText } from "primereact/inputtext";
import { Dialog } from "primereact/dialog";
import TabelLaporan from "./components/tabelLaporan";
import DetailLaporan from "./components/detailLaporan";
import AdjustPrintMarginLaporan from "./print/adjustPrintMarginLaporan";
import PDFViewer from "./print/PDFViewer";
import {
  deleteLogLaporan,
  deleteRiwayatPelayanan,
  getUser,
  listRiwayatPelayanan,
} from "../../api";

export default function LaporanPage() {
  const [data, setData] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [tanggalAwal, setTanggalAwal] = useState("");
  const [tanggalAkhir, setTanggalAkhir] = useState("");
  const [loading, setLoading] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [adjustDialog, setAdjustDialog] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [jsPdfPreviewOpen, setJsPdfPreviewOpen] = useState(false);

  const toastRef = useRef(null);
  const requestSeqRef = useRef(0);
  const currentUser = getUser();
  const canDeleteLog = currentUser?.role === "kasi_pelayanan";

  const buildFilters = () => ({
    keyword,
    tanggal_awal: tanggalAwal,
    tanggal_akhir: tanggalAkhir,
  });

  const fetchData = async (filters = {}) => {
    const requestId = requestSeqRef.current + 1;
    requestSeqRef.current = requestId;
    setLoading(true);

    try {
      const res = await listRiwayatPelayanan(filters);
      const rows = Array.isArray(res?.data) ? res.data : [];

      if (requestId !== requestSeqRef.current) return;
      setData(rows);
    } catch (err) {
      if (requestId !== requestSeqRef.current) return;

      console.error(err);
      toastRef.current?.show({
        severity: "error",
        summary: "Gagal",
        detail: err?.response?.data?.message || "Gagal ambil data laporan",
        life: 2500,
      });
    } finally {
      if (requestId === requestSeqRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData({
        keyword,
        tanggal_awal: tanggalAwal,
        tanggal_akhir: tanggalAkhir,
      });
    }, 350);

    return () => clearTimeout(timer);
  }, [keyword, tanggalAwal, tanggalAkhir]);

  const handleDelete = (row) => {
    confirmDialog({
      message: `Yakin hapus data '${row.nama}'?`,
      header: "Konfirmasi Hapus",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Ya",
      rejectLabel: "Batal",
      accept: async () => {
        try {
          await deleteRiwayatPelayanan(row.id);
          toastRef.current?.show({
            severity: "success",
            summary: "Berhasil",
            detail: "Data berhasil dihapus",
            life: 2000,
          });

          fetchData(buildFilters());
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

  const handleDetail = (row) => {
    setSelectedDetail(row);
    setDetailVisible(true);
  };

  const filterAktif = Boolean(keyword || tanggalAwal || tanggalAkhir);

  const handleDeleteLog = () => {
    if (!canDeleteLog) {
      toastRef.current?.show({
        severity: "warn",
        summary: "Tidak bisa",
        detail: "Hanya Kasi Pelayanan yang bisa menghapus log laporan",
        life: 2500,
      });
      return;
    }

    if (data.length === 0) {
      toastRef.current?.show({
        severity: "info",
        summary: "Info",
        detail: "Tidak ada log laporan untuk dihapus",
        life: 2200,
      });
      return;
    }

    const targetText = filterAktif
      ? `${data.length} log sesuai filter aktif`
      : `${data.length} log laporan`;

    confirmDialog({
      message: `Yakin hapus ${targetText}? Data yang dihapus tidak bisa dikembalikan.`,
      header: "Konfirmasi Hapus Log",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Ya",
      rejectLabel: "Batal",
      acceptClassName: "p-button-danger",
      accept: async () => {
        setLoading(true);
        try {
          const res = await deleteLogLaporan(buildFilters());
          toastRef.current?.show({
            severity: "success",
            summary: "Berhasil",
            detail: res?.message || "Log laporan berhasil dihapus",
            life: 2200,
          });

          fetchData(buildFilters());
        } catch (err) {
          console.error(err);
          setLoading(false);
          toastRef.current?.show({
            severity: "error",
            summary: "Gagal",
            detail: err?.response?.data?.message || "Gagal menghapus log laporan",
            life: 2500,
          });
        }
      },
    });
  };

  const resetFilter = () => {
    setKeyword("");
    setTanggalAwal("");
    setTanggalAkhir("");
  };

  return (
    <div className="card">
      <Toast ref={toastRef} />

      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Laporan</h1>
          <p className="mt-1 text-sm text-slate-500">
            Riwayat pelayanan, detail pengunjung, dan export data laporan.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            label="Export Excel"
            icon="pi pi-download"
            onClick={() => setAdjustDialog(true)}
            disabled={loading || data.length === 0}
            className="w-full sm:w-auto"
          />

          {canDeleteLog && (
            <Button
              type="button"
              label="Hapus Log"
              icon="pi pi-trash"
              severity="danger"
              outlined
              onClick={handleDeleteLog}
              disabled={loading || data.length === 0}
              className="w-full sm:w-auto"
            />
          )}
        </div>
      </div>

      <div className="-mx-2 mb-5 border-y border-slate-200 bg-slate-50 px-8 py-5 rounded-lg">
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-base font-bold text-slate-900">
              Filter dan Pencarian
            </div>
            <div className="text-sm text-slate-500">
              {data.length} data tampil
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(180px,0.7fr)_minmax(180px,0.7fr)_auto]">
          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-600">
              Pencarian
            </label>
            <span className="p-input-icon-left w-full">
              <i className="pi pi-search ml-2" />
              <InputText
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Cari NIK, nama, atau layanan"
                className="w-full pl-8"
              />
            </span>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-600">
              Dari Tanggal
            </label>
            <InputText
              type="date"
              value={tanggalAwal}
              onChange={(e) => setTanggalAwal(e.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-600">
              Sampai Tanggal
            </label>
            <InputText
              type="date"
              value={tanggalAkhir}
              onChange={(e) => setTanggalAkhir(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="flex items-end">
            <Button
              type="button"
              label="Reset"
              icon="pi pi-refresh"
              severity="secondary"
              outlined
              onClick={resetFilter}
              disabled={loading || !filterAktif}
              className="w-full lg:w-auto"
            />
          </div>
        </div>
      </div>

      <div>
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-base font-bold text-slate-900">
            Riwayat Pelayanan
          </div>
        </div>

        <TabelLaporan
          data={data}
          loading={loading}
          onDetail={handleDetail}
          onDelete={handleDelete}
          canDelete={canDeleteLog}
        />
      </div>

      <DetailLaporan
        visible={detailVisible}
        onHide={() => {
          setDetailVisible(false);
          setSelectedDetail(null);
        }}
        detail={selectedDetail}
      />

      <AdjustPrintMarginLaporan
        adjustDialog={adjustDialog}
        setAdjustDialog={setAdjustDialog}
        dataLaporan={data}
        setPdfUrl={setPdfUrl}
        setFileName={setFileName}
        setJsPdfPreviewOpen={setJsPdfPreviewOpen}
      />

      <Dialog
        visible={jsPdfPreviewOpen}
        onHide={() => setJsPdfPreviewOpen(false)}
        modal
        style={{ width: "90vw", height: "90vh" }}
        header="Preview PDF"
      >
        <PDFViewer pdfUrl={pdfUrl} fileName={fileName} paperSize="A4" />
      </Dialog>
    </div>
  );
}