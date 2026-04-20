import { useEffect, useState } from "react";
import { InputText } from "primereact/inputtext";
import TabelIdentitas from "./components/tabelIdentitas";
import { listPengunjung } from "../../../api";

export default function IdentitasPage() {
  const [data, setData] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="card">
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

      <TabelIdentitas data={data} loading={loading} />
    </div>
  );
}