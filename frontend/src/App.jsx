// src/App.jsx
import { useState } from "react";
import AppLayout from "./components/layout/layout";

import Pendaftaran from "./pages/pendaftaran/pendaftaran";
// import Antrian from "./pages/antrian/antrian";
// import Laporan from "./pages/laporan/laporan";

import JenisPelayananPage from "./pages/master/jenis_pelayanan/page";
import IdentitasPage from "./pages/master/identitas/page";

export default function App() {
  const [page, setPage] = useState("pendaftaran");

  const renderPage = () => {
    switch (page) {
      case "master-jenis":
        return <JenisPelayananPage />;
      case "master-identitas":
        return <IdentitasPage />;
      case "antrian":
        return <Pendaftaran />;
      case "laporan":
        return <Pendaftaran />;
      case "pendaftaran":
      default:
        return <Pendaftaran />;
    }
  };

  return (
    <AppLayout
      initialActive={page}
      onNavigate={(id) => setPage(id)}
      onLogout={() => alert("Logout")}
      titles={{
        "master-jenis": "Master • Jenis Pelayanan",
        "master-identitas": "Master • Identitas",
      }}
    >
      {renderPage()}
    </AppLayout>
  );
}