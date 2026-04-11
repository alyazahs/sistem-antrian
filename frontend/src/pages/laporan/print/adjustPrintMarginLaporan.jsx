'use client'

import React, { useState } from 'react'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { Dropdown } from 'primereact/dropdown'
import { InputNumber } from 'primereact/inputnumber'
import { Toolbar } from 'primereact/toolbar'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

export default function AdjustPrintMarginLaporan({
  adjustDialog,
  setAdjustDialog,
  dataLaporan = [],
  setPdfUrl,
  setFileName,
  setJsPdfPreviewOpen,
}) {
  const [loadingExport, setLoadingExport] = useState(false);
  const [dataAdjust, setDataAdjust] = useState({
    marginTop: 10,
    marginBottom: 10,
    marginRight: 10,
    marginLeft: 10,
    paperSize: 'A4',
    orientation: 'portrait',
  });

  const paperSizes = [
    { name: 'A4', value: 'A4' },
    { name: 'Letter', value: 'Letter' },
    { name: 'Legal', value: 'Legal' },
  ];
  const orientationOptions = [
    { label: 'Potrait', value: 'portrait' },
    { label: 'Lanskap', value: 'landscape' },
  ];

  const onInputChangeNumber = (e, name) => {
    setDataAdjust((prev) => ({ ...prev, [name]: e.value || 0 }));
  };

  const onInputChange = (e, name) => {
    setDataAdjust((prev) => ({ ...prev, [name]: e.value }));
  };

  const addHeader = (doc, title, marginLeft, marginTop, marginRight) => {
    const pageWidth = doc.internal.pageSize.width;

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(41, 128, 185);
    doc.text('LAPORAN DATA PELAYANAN', pageWidth / 2, marginTop + 5, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text('Jl. Marsma TNI Anumerta R. Iswahjudi No.56, Jiwan Utara, Jiwan, Kec. Jiwan, Kabupaten Madiun, Jawa Timur 63161', pageWidth / 2, marginTop + 12, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text('Telp: (0351) 462075', pageWidth / 2, marginTop + 17, { align: 'center' });

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(marginLeft, marginTop + 22, pageWidth - marginRight, marginTop + 22);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(title, pageWidth / 2, marginTop + 29, { align: 'center' });

    const today = new Date().toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text(`Dicetak: ${today}`, marginLeft, marginTop + 37, { align: 'left' });

    return marginTop + 43;
  };

  async function exportPDF(adjustConfig) {
    const doc = new jsPDF({
      orientation: adjustConfig.orientation,
      unit: 'mm',
      format: adjustConfig.paperSize,
    });

    const marginLeft = parseFloat(adjustConfig.marginLeft);
    const marginTop = parseFloat(adjustConfig.marginTop);
    const marginRight = parseFloat(adjustConfig.marginRight);

    const startY = addHeader(doc, 'Laporan Pelayanan', marginLeft, marginTop, marginRight);

    autoTable(doc, {
      startY,
      head: [['No', 'Tanggal', 'NIK', 'Nama', 'Umur', 'Keperluan', 'Alamat', 'No HP', 'Petugas']],
      body: dataLaporan.map((item, index) => [
        index + 1,
        item.tanggal_kunjungan || "",
        item.nik || "",
        item.nama || "",
        item.umur || "",
        item.keperluan || "",
        item.alamat || "",
        item.nohp || "",
        item.petugas_nama || "",
      ]),
      margin: { left: marginLeft, right: marginRight },
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      alternateRowStyles: { fillColor: [248, 249, 250] },
    });

    return doc.output('datauristring');
  }

  const exportExcel = () => {
    const excelData = dataLaporan.map((item, index) => ({
      No: index + 1,
      Tanggal: item.tanggal_kunjungan || "",
      NIK: item.nik || "",
      NoHP: item.nohp || "",
      Nama: item.nama || "",
      Umur: item.umur != null ? `${item.umur} th` : "",
      Keperluan: item.keperluan || "",
      Alamat: item.alamat || "",
      Petugas: item.petugas_nama || "",
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);

    const headers = Object.keys(excelData[0] || {});
    ws["!cols"] = headers.map((header) => {
      const maxLength = Math.max(
        header.length,
        ...excelData.map((row) => String(row[header] ?? "").length)
      );
      return { wch: Math.min(Math.max(maxLength + 2, 10), 35) };
    });
    
    ws["!freeze"] = { xSplit: 0, ySplit: 1 };

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan_Pelayanan");
    XLSX.writeFile(wb, "Laporan_Pelayanan.xlsx");
  };

  const handleExportPdf = async () => {
    try {
      setLoadingExport(true);
      const pdfDataUrl = await exportPDF(dataAdjust);
      setPdfUrl(pdfDataUrl);
      setFileName('Laporan_Pelayanan');
      setAdjustDialog(false);
      setJsPdfPreviewOpen(true);
    } finally {
      setLoadingExport(false);
    }
  };

  const footer = () => (
    <div className="flex flex-row gap-2">
      <Button
        label="Export Excel"
        icon="pi pi-file-excel"
        severity="success"
        onClick={exportExcel}
      />
      <Button
        label="Export PDF"
        icon="pi pi-file-pdf"
        severity="danger"
        onClick={handleExportPdf}
        loading={loadingExport}
      />
    </div>
  );

  return (
    <Dialog
      visible={adjustDialog}
      onHide={() => setAdjustDialog(false)}
      header="Pengaturan Cetak"
      style={{ width: '50vw' }}
    >
      <div className="grid p-fluid">
        <div className="col-12 md:col-6">
          <div className="grid formgrid">
            <h5 className="col-12 mb-2">Pengaturan Margin (mm)</h5>
            {['Top', 'Bottom', 'Right', 'Left'].map((label) => (
              <div className="col-6 field" key={label}>
                <label>Margin {label}</label>
                <InputNumber
                  value={dataAdjust[`margin${label}`]}
                  onChange={(e) => onInputChangeNumber(e, `margin${label}`)}
                  min={0}
                  suffix=" mm"
                  showButtons
                  className="w-full"
                  inputStyle={{ padding: '0.3rem' }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="col-12 md:col-6">
          <div className="grid formgrid">
            <h5 className="col-12 mb-2">Pengaturan Kertas</h5>
            <div className="col-12 field">
              <label>Ukuran Kertas</label>
              <Dropdown
                value={dataAdjust.paperSize}
                options={paperSizes}
                onChange={(e) => onInputChange(e, 'paperSize')}
                optionLabel="name"
                className="w-full"
              />
            </div>
            <div className="col-12 field">
              <label>Orientasi</label>
              <Dropdown
                value={dataAdjust.orientation}
                options={orientationOptions}
                onChange={(e) => onInputChange(e, 'orientation')}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
      <Toolbar className="py-2 justify-content-end" end={footer} />
    </Dialog>
  );
}
