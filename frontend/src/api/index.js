import axios from "axios";

const api = axios.create({ baseURL: "/api" });

export const scanRfid = async () => (await api.get("/scan-rfid")).data;

export const cariNIK = async (nik) =>
  (await api.get("/cari-nik", { params: { nik } })).data;

export const daftarPengunjung = async (payload) =>
  (await api.post("/daftar-pengunjung", payload)).data;

export const ambilAntrian = async (payload) =>
  (await api.post("/ambil-antrian", payload)).data;

export default api;