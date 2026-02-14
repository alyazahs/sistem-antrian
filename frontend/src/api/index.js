import axios from "axios";

const api = axios.create({ baseURL: "/api" });

export const scanRfid = async () => (await api.get("/scan-rfid")).data;

export const cariNIK = async (nik) =>
  (await api.get("/cari-nik", { params: { nik } })).data;

export const daftarPengunjung = async (payload) =>
  (await api.post("/daftar-pengunjung", payload)).data;

export const ambilAntrian = async (payload) =>
  (await api.post("/ambil-antrian", payload)).data;

export const antrianSummary = async () =>
  (await api.get("/antrian/summary")).data;

export const antrianNow = async () =>
  (await api.get("/antrian/now")).data;

export const antrianListMenunggu = async () =>
  (await api.get("/antrian/list", { params: { status: "menunggu" } })).data;

export const panggilAntrianBerikutnya = async () =>
  (await api.post("/antrian/call-next")).data;

export const selesaiAntrian = async (id) =>
  (await api.post(`/antrian/serve/${id}`)).data;

export const lewatiAntrian = async (id) =>
  (await api.post(`/antrian/skip/${id}`)).data;

export const panggilUlangAntrian = async (id) =>
  (await api.post(`/antrian/recall/${id}`)).data;

export default api;