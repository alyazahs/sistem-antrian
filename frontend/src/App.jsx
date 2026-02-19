import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./layout/layout";
import Login from "./pages/login";
import Dashboard from "./pages/dashboard"; 
import Pendaftaran from "./pages/pendaftaran";
import Antrian from "./pages/antrian";
import JenisPelayananPage from "./pages/master/jenis_pelayanan/page";
import IdentitasPage from "./pages/master/identitas/page";
import Laporan from "./pages/laporan"; 

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/dashboard"
        element={
          <AppLayout
            titles={{
              "master-jenis": "Master • Jenis Pelayanan",
              "master-identitas": "Master • Identitas",
              users: "Manajemen Users",
            }}
          >
            <Dashboard />
          </AppLayout>
        }
      />

      <Route
        path="/pendaftaran"
        element={
          <AppLayout>
            <Pendaftaran />
          </AppLayout>
        }
      />

      <Route
        path="/antrian"
        element={
          <AppLayout>
            <Antrian />
          </AppLayout>
        }
      />

      <Route
        path="/master/jenis"
        element={
          <AppLayout
            titles={{ "master-jenis": "Master • Jenis Pelayanan" }}
          >
            <JenisPelayananPage />
          </AppLayout>
        }
      />

      <Route
        path="/master/identitas"
        element={
          <AppLayout
            titles={{ "master-identitas": "Master • Identitas" }}
          >
            <IdentitasPage />
          </AppLayout>
        }
      />

      <Route
        path="/laporan"
        element={
          <AppLayout>
            <Laporan />
          </AppLayout>
        }
      />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}