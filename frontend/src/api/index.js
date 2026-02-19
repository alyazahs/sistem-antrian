import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

// TOKEN HANDLING
export const getToken = () =>
  sessionStorage.getItem("token") || localStorage.getItem("token");

export const setAuth = ({ token, user, remember = true }) => {
  const store = remember ? localStorage : sessionStorage;

  localStorage.removeItem("token");
  localStorage.removeItem("user");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");

  store.setItem("token", token);
  store.setItem("user", JSON.stringify(user));
};

export const getUser = () => {
  const raw =
    sessionStorage.getItem("user") || localStorage.getItem("user");
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const clearAuth = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");
};

// AXIOS INTERCEPTOR
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      clearAuth();
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// AUTH
export const login = async (payload) => {
  const res = await api.post("/auth/login", payload);

  if (res.data?.token) {
    setAuth({ token: res.data.token, user: res.data.user });
  }

  return res.data;
};

export const getMe = async () =>
  (await api.get("/auth/me")).data;

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
export const listUsers = async () =>
  (await api.get("/users")).data;

export const createUser = async (payload) =>
  (await api.post("/users", payload)).data;

export const updateUser = async (id, payload) =>
  (await api.put(`/users/${id}`, payload)).data;

export const resetPasswordUser = async (id, payload) =>
  (await api.put(`/users/${id}/password`, payload)).data;

// PENGUNJUNG
export const scanRfid = async () =>
  (await api.get("/scan-rfid")).data;

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

export const antrianNow = async () =>
  (await api.get("/antrian/now")).data;

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

export default api;