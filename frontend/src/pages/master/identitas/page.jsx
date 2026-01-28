import { useEffect, useState } from "react";
import axios from "axios";
import TabelIdentitas from "./components/tabelIdentitas";

const API_BASE = import.meta.env.VITE_API_URL;
const API = `${API_BASE}/api/pengunjung`;

export default function IdentitasPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h3 className="text-xl font-semibold mb-3">Data Pengunjung Terdaftar</h3>
      <TabelIdentitas data={data} loading={loading} />
    </div>
  );
}
