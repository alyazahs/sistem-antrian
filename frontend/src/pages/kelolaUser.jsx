import { useEffect, useMemo, useState } from "react";
import {
  createUser,
  deleteUser,
  getUser,
  listUsers,
  resetPasswordUser,
  updateUser,
} from "../api";

const ROLE_OPTIONS = [
  { value: "kasi_pelayanan", label: "Kasi Pelayanan" },
  { value: "admin_pelayanan", label: "Admin Pelayanan" },
];

const STATUS_OPTIONS = [
  { value: "aktif", label: "Aktif" },
  { value: "tidak_aktif", label: "Non-aktif" },
  { value: "cuti", label: "Cuti" },
];

const emptyForm = {
  nama: "",
  email: "",
  role: "admin_pelayanan",
  status: "aktif",
  password: "",
  reset_password: "",
};

function roleLabel(value) {
  return ROLE_OPTIONS.find((item) => item.value === value)?.label || value || "-";
}

function statusLabel(value) {
  return STATUS_OPTIONS.find((item) => item.value === value)?.label || value || "-";
}

function statusBadgeClass(value) {
  switch (value) {
    case "aktif":
      return "bg-emerald-50 text-emerald-600 border border-emerald-100";
    case "cuti":
      return "bg-amber-50 text-amber-600 border border-amber-100";
    default:
      return "bg-rose-50 text-rose-600 border border-rose-100";
  }
}

function UserModal({ open, mode, form, onClose, onChange, onSubmit, saving }) {
  if (!open) return null;

  const isEdit = mode === "edit";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/35 p-4">
      <div className="w-full max-w-2xl rounded-[28px] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h3 className="text-2xl font-bold text-slate-800">
              {isEdit ? "Edit User" : "Tambah User"}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {isEdit
                ? "Perbarui data user dan atur status akun."
                : "Tambahkan akun baru untuk petugas pelayanan."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
          >
            <i className="pi pi-times" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-5 px-6 py-6">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Nama</label>
              <input
                value={form.nama}
                onChange={(e) => onChange("nama", e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#2BB0A6] focus:ring-4 focus:ring-[#2BB0A6]/10"
                placeholder="Masukkan nama lengkap"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Role</label>
              <select
                value={form.role}
                onChange={(e) => onChange("role", e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#2BB0A6] focus:ring-4 focus:ring-[#2BB0A6]/10"
              >
                {ROLE_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Status</label>
              <select
                value={form.status}
                onChange={(e) => onChange("status", e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#2BB0A6] focus:ring-4 focus:ring-[#2BB0A6]/10"
              >
                {STATUS_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
              <input
                value={form.email}
                onChange={(e) => onChange("email", e.target.value)}
                disabled={isEdit}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#2BB0A6] focus:ring-4 focus:ring-[#2BB0A6]/10 disabled:cursor-not-allowed disabled:bg-slate-100"
                placeholder="nama@email.com"
              />
            </div>

            {!isEdit ? (
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => onChange("password", e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#2BB0A6] focus:ring-4 focus:ring-[#2BB0A6]/10"
                  placeholder="Masukkan password awal"
                />
              </div>
            ) : (
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Reset Password Baru
                </label>
                <input
                  type="password"
                  value={form.reset_password}
                  onChange={(e) => onChange("reset_password", e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#2BB0A6] focus:ring-4 focus:ring-[#2BB0A6]/10"
                  placeholder="Kosongkan jika tidak ingin ganti password"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-200 px-5 py-3 font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-[#2BB0A6] px-5 py-3 font-semibold text-white shadow transition hover:bg-[#23968e] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Tambah User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function KelolaUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedUser, setSelectedUser] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [keyword, setKeyword] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });

  const currentUser = getUser();

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await listUsers();
      setUsers(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      setMessage({
        type: "error",
        text: err?.response?.data?.message || "Gagal memuat data user.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const key = keyword.trim().toLowerCase();
    if (!key) return users;
    return users.filter((item) =>
      [item.nama, item.email, roleLabel(item.role), statusLabel(item.status)]
        .join(" ")
        .toLowerCase()
        .includes(key)
    );
  }, [users, keyword]);

  const openCreateModal = () => {
    setModalMode("create");
    setSelectedUser(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEditModal = (user) => {
    setModalMode("edit");
    setSelectedUser(user);
    setForm({
      nama: user.nama || "",
      email: user.email || "",
      role: user.role || "admin_pelayanan",
      status: user.status || "aktif",
      password: "",
      reset_password: "",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setSelectedUser(null);
    setForm(emptyForm);
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    const payload = {
      nama: form.nama.trim(),
      email: form.email.trim(),
      role: form.role,
      status: form.status,
      password: form.password,
      reset_password: form.reset_password,
    };

    if (!payload.nama || !payload.role || !payload.status) {
      setMessage({ type: "error", text: "Nama, role, dan status wajib diisi." });
      return;
    }

    if (modalMode === "create") {
      if (!payload.email || !payload.password) {
        setMessage({ type: "error", text: "Email dan password wajib diisi." });
        return;
      }
    }

    setSaving(true);
    try {
      if (modalMode === "create") {
        await createUser({
          nama: payload.nama,
          email: payload.email,
          role: payload.role,
          status: payload.status,
          password: payload.password,
        });
        setMessage({ type: "success", text: "User berhasil ditambahkan." });
      } else {
        await updateUser(selectedUser.id, {
          nama: payload.nama,
          role: payload.role,
          status: payload.status,
        });

        if (payload.reset_password.trim()) {
          await resetPasswordUser(selectedUser.id, {
            password: payload.reset_password.trim(),
          });
        }
        setMessage({ type: "success", text: "Data user berhasil diperbarui." });
      }

      closeModal();
      await loadUsers();
    } catch (err) {
      setMessage({
        type: "error",
        text: err?.response?.data?.message || "Gagal menyimpan data user.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user) => {
    const confirmDelete = window.confirm(`Hapus user ${user.nama}?`);
    if (!confirmDelete) return;

    try {
      await deleteUser(user.id);
      setMessage({ type: "success", text: "User berhasil dihapus." });
      await loadUsers();
    } catch (err) {
      setMessage({
        type: "error",
        text: err?.response?.data?.message || "Gagal menghapus user.",
      });
    }
  };

  return (
    <div className="space-y-6">
      
      {message.text ? (
        <div
          className={[
            "rounded-2xl px-4 py-3 text-sm font-medium shadow-sm",
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-rose-50 text-rose-700",
          ].join(" ")}
        >
          {message.text}
        </div>
      ) : null}

      <section className="rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-slate-100 md:p-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-[28px] font-bold text-slate-800">Kelola User</h2>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative">
              <i className="pi pi-search pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Cari user"
                className="w-full min-w-[240px] rounded-2xl border border-slate-200 bg-slate-50 px-11 py-3 outline-none transition focus:border-[#2BB0A6] focus:bg-white focus:ring-4 focus:ring-[#2BB0A6]/10"
              />
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className="flex h-[54px] w-[78px] items-center justify-center rounded-2xl bg-slate-500 text-white shadow transition hover:bg-slate-600"
              aria-label="Tambah user"
            >
              <i className="pi pi-plus text-2xl font-bold" />
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-[24px] border border-slate-100">
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr className="bg-slate-100 text-left text-[15px] font-semibold text-slate-700">
                  <th className="px-6 py-4">Nama</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-16 text-center text-slate-400">
                      Memuat data user...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-16 text-center text-slate-400">
                      Tidak ada data user.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const isSelf = currentUser?.id === user.id;
                    return (
                      <tr key={user.id} className="text-[15px] text-slate-600">
                        <td className="border-t border-slate-100 px-6 py-7 font-medium text-slate-700">
                          {user.nama}
                        </td>
                        <td className="border-t border-slate-100 px-6 py-7">
                          {roleLabel(user.role)}
                        </td>
                        <td className="border-t border-slate-100 px-6 py-7">{user.email}</td>
                        <td className="border-t border-slate-100 px-6 py-7">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${statusBadgeClass(user.status)}`}
                          >
                            {statusLabel(user.status)}
                          </span>
                        </td>
                        <td className="border-t border-slate-100 px-6 py-7">
                          <div className="flex items-center justify-center gap-3">
                            <button
                              type="button"
                              onClick={() => openEditModal(user)}
                              className="grid h-11 w-11 place-items-center rounded-xl bg-amber-500 text-white transition hover:bg-amber-600"
                              title="Edit user"
                            >
                              <i className="pi pi-pencil text-sm" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(user)}
                              disabled={isSelf}
                              className="grid h-11 w-11 place-items-center rounded-xl bg-red-500 text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                              title={isSelf ? "Akun yang sedang login tidak bisa dihapus" : "Hapus user"}
                            >
                              <i className="pi pi-trash text-sm" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <UserModal
        open={modalOpen}
        mode={modalMode}
        form={form}
        onClose={closeModal}
        onChange={handleChange}
        onSubmit={handleSubmit}
        saving={saving}
      />
    </div>
  );
}