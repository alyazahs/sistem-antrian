import React, { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "primereact/button";

import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

function PDFViewer({ pdfUrl, fileName }) {
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setCurrentPage(1);
  };

  const handleFirstPage = () => {
    if (currentPage !== 1) setCurrentPage(1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < numPages) setCurrentPage(currentPage + 1);
  };

  const handleLastPage = () => {
    if (currentPage !== numPages) setCurrentPage(numPages);
  };

  const handleZoomIn = () => {
    if (scale < 2) setScale((prev) => prev + 0.1);
  };

  const handleZoomOut = () => {
    if (scale > 0.5) setScale((prev) => prev - 0.1);
  };

  const handleDownloadPDF = () => {
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = `${fileName}.pdf`;
    link.click();
  };

  const handlePrint = () => {
    if (!pdfUrl) return;
    window.open(pdfUrl, "_blank");
  };

  return (
    <div>
      {pdfUrl && (
        <div>
          <div
            style={{
              backgroundColor: "#f0f0f0",
              padding: "10px",
              borderRadius: "5px",
              boxShadow: "0px 0px 5px rgba(0, 0, 0, 0.3)",
              position: "sticky",
              top: "0",
              zIndex: "1000",
              width: "100%",
            }}
          >
            <Button icon="pi pi-angle-double-left" style={{ margin: "5px" }} onClick={handleFirstPage} disabled={currentPage === 1} />
            <Button icon="pi pi-angle-left" style={{ margin: "5px" }} onClick={handlePrevPage} disabled={currentPage === 1} />
            <Button icon="pi pi-search-plus" style={{ margin: "5px" }} onClick={handleZoomIn} disabled={scale >= 2} />
            <Button icon="pi pi-search-minus" style={{ margin: "5px" }} onClick={handleZoomOut} disabled={scale <= 0.5} />
            <Button icon="pi pi-angle-right" style={{ margin: "5px" }} onClick={handleNextPage} disabled={currentPage === numPages} />
            <Button icon="pi pi-angle-double-right" style={{ margin: "5px" }} onClick={handleLastPage} disabled={currentPage === numPages} />
            <Button icon="pi pi-download" style={{ margin: "5px" }} onClick={handleDownloadPDF} />
            <Button icon="pi pi-print" style={{ margin: "5px" }} onClick={handlePrint} />
          </div>

          <div
            style={{
              overflow: "auto",
              height: "70vh",
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-start",
              padding: "20px",
              background: "#f5f5f5",
            }}
          >
            <Document file={pdfUrl} onLoadSuccess={onDocumentLoadSuccess}>
              <Page pageNumber={currentPage} width={800} scale={scale} />
            </Document>
          </div>

          {numPages && (
            <div
              style={{
                textAlign: "center",
                marginTop: "10px",
                color: "gray",
                fontSize: "12px",
              }}
            >
              Page {currentPage} of {numPages}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PDFViewer;