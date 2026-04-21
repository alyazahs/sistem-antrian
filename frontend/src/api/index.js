import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

// AUTH STORAGE HELPERS
const TOKEN_KEY = "token";
const USER_KEY = "user";

const clearStorage = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
};

export const getToken = () =>
  sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);

export const getUser = () => {
  const raw =
    sessionStorage.getItem(USER_KEY) || localStorage.getItem(USER_KEY);

  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setAuth = ({ token, user, remember = true }) => {
  const storage = remember ? localStorage : sessionStorage;

  clearStorage();

  storage.setItem(TOKEN_KEY, token);
  storage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearAuth = () => {
  clearStorage();
};

// AXIOS INTERCEPTOR
api.interceptors.request.use(
  (config) => {
    const token = getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuth();

      // Hindari redirect loop kalau memang sedang di halaman login
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

// AUTH
export const login = async (payload, remember = true) => {
  const res = await api.post("/auth/login", payload);

  if (res.data?.token) {
    setAuth({
      token: res.data.token,
      user: res.data.user,
      remember,
    });
  }

  return res.data;
};

export const getMe = async () => (await api.get("/auth/me")).data;

export const logout = () => {
  clearAuth();
  window.location.href = "/login";
};

// MASTER JENIS
export const listJenisPelayanan = async () =>
  (await api.get("/jenis-pelayanan")).data;

export const createJenisPelayanan = async (payload) =>
  (await api.post("/jenis-pelayanan", payload)).data;

export const updateJenisPelayanan = async (id, payload) =>
  (await api.put(`/jenis-pelayanan/${id}`, payload)).data;

export const deleteJenisPelayanan = async (id) =>
  (await api.delete(`/jenis-pelayanan/${id}`)).data;

// USERS (ADMIN)
export const listUsers = async () => (await api.get("/users")).data;

export const createUser = async (payload) =>
  (await api.post("/users", payload)).data;

export const updateUser = async (id, payload) =>
  (await api.put(`/users/${id}`, payload)).data;

export const resetPasswordUser = async (id, payload) =>
  (await api.put(`/users/${id}/password`, payload)).data;

export const deleteUser = async (id) =>
  (await api.delete(`/users/${id}`)).data;

// PENGUNJUNG
export const scanRfid = async () => (await api.get("/scan-rfid")).data;

export const listPengunjung = async () =>
  (await api.get("/pengunjung")).data;

export const cariNIK = async (nik) =>
  (await api.get("/cari-nik", { params: { nik } })).data;

export const daftarPengunjung = async (payload) =>
  (await api.post("/daftar-pengunjung", payload)).data;

// AMBIL ANTRIAN
export const ambilAntrian = async (payload) =>
  (await api.post("/ambil-antrian", payload)).data;

// ANTRIAN DISPLAY (PUBLIC)
export const antrianSummary = async () =>
  (await api.get("/antrian/summary")).data;

export const antrianNow = async () => (await api.get("/antrian/now")).data;

export const antrianListMenunggu = async () =>
  (await api.get("/antrian/list", { params: { status: "menunggu" } })).data;

// ANTRIAN ACTION (LOGIN)
export const panggilAntrianBerikutnya = async () =>
  (await api.post("/antrian/call-next")).data;

export const selesaiAntrian = async (id) =>
  (await api.post(`/antrian/serve/${id}`)).data;

export const lewatiAntrian = async (id) =>
  (await api.post(`/antrian/skip/${id}`)).data;

export const panggilUlangAntrian = async (id) =>
  (await api.post(`/antrian/recall/${id}`)).data;

// LAPORAN
export const listRiwayatPelayanan = async (params={}) =>
  (await api.get("/laporan", { params })).data;

export const deleteRiwayatPelayanan = async (id) =>
  (await api.delete(`/laporan/${id}`)).data;

// DASHBOARD
export const dashboardSummary = async () =>
  (await api.get("/dashboard")).data;

export const dashboardChart = async (tahun) =>
  (await api.get("/dashboard/chart", { params: { tahun } })).data;

export const dashboardRecent = async (limit = 5) =>
  (await api.get("/dashboard/recent", { params: { limit } })).data;

export default api;