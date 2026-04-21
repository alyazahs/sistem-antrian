import { useEffect, useRef, useState } from "react";
import { Button } from "primereact/button";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import { InputText } from "primereact/inputtext";
import { Dialog } from "primereact/dialog";
import TabelLaporan from "./components/tabelLaporan";
import DetailLaporan from "./components/detailLaporan";
import AdjustPrintMarginLaporan from "./print/adjustPrintMarginLaporan";
import PDFViewer from "./print/PDFViewer";
import { deleteRiwayatPelayanan, listRiwayatPelayanan } from "../../api";

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

  const fetchData = async (filters = {}) => {
    setLoading(true);
    try {
      const res = await listRiwayatPelayanan(filters);
      const rows = Array.isArray(res?.data) ? res.data : [];
      setData(rows);
    } catch (err) {
      console.error(err);
      toastRef.current?.show({
        severity: "error",
        summary: "Gagal",
        detail: err?.response?.data?.message || "Gagal ambil data laporan",
        life: 2500,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData({
      keyword,
      tanggal_awal: tanggalAwal,
      tanggal_akhir: tanggalAkhir,
    });
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

          fetchData({
            keyword,
            tanggal_awal: tanggalAwal,
            tanggal_akhir: tanggalAkhir,
          });
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

  return (
    <div className="card">
      <Toast ref={toastRef} />
      <ConfirmDialog />

      <div className="mb-3">
        <h3 className="text-xl font-semibold">Laporan</h3>
      </div>

      <div className="card">
        <div className="mb-4">
          <h4 className="text-lg font-semibold">Filter dan Pencarian</h4>
        </div>

        <div className="grid formgrid mb-4">
          <div className="field col-12 md:col-6">
            <label className="mb-2 block font-medium text-700">Pencarian</label>
            <span className="p-input-icon-left w-full">
              <i className="pi pi-search ml-2" />
              <InputText
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Cari Nomor NIK, Nama, Layanan"
                className="w-full pl-8"
              />
            </span>
          </div>

          <div className="flex gap-3">
            <div className="w-full">
              <label className="mb-2 block font-medium text-700">Dari Tanggal</label>
              <InputText
                type="date"
                value={tanggalAwal}
                onChange={(e) => setTanggalAwal(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="w-full">
              <label className="mb-2 block font-medium text-700">Sampai Tanggal</label>
              <InputText
                type="date"
                value={tanggalAkhir}
                onChange={(e) => setTanggalAkhir(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </div>

        <div className="mb-3">
          <Button
            label="Export Excel"
            icon="pi pi-download"
            onClick={() => setAdjustDialog(true)}
          />
        </div>

        <TabelLaporan
          data={data}
          loading={loading}
          onDetail={handleDetail}
          onDelete={handleDelete}
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