import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Toast } from "primereact/toast";
import { getMe, getUser, updateProfile, updateStoredAuth } from "../api";

const initialForm = {
  nama: "",
  email: "",
  password_before: "",
  new_password: "",
  confirm_password: "",
};

function PasswordField({
  id,
  label,
  value,
  error,
  autoComplete,
  onChange,
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-3">
      <label
        htmlFor={id}
        className="block text-sm font-bold text-slate-900"
      >
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className={[
            "h-14 w-full rounded-[10px] border bg-white px-5 pr-14 text-sm text-slate-800 outline-none transition",
            "focus:border-[#2BB0A6] focus:ring-4 focus:ring-[#2BB0A6]/10",
            error ? "border-red-400" : "border-slate-300",
          ].join(" ")}
        />

        <button
          type="button"
          aria-label={visible ? "Sembunyikan password" : "Tampilkan password"}
          onClick={() => setVisible((current) => !current)}
          className="absolute right-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-slate-900 transition hover:bg-slate-100"
        >
          <i className={visible ? "pi pi-eye-slash" : "pi pi-eye"} />
        </button>
      </div>

      {error ? <small className="text-red-500">{error}</small> : null}
    </div>
  );
}

export default function EditProfile() {
  const navigate = useNavigate();
  const toastRef = useRef(null);

  const [form, setForm] = useState(() => ({
    ...initialForm,
    nama: getUser()?.nama || "",
    email: getUser()?.email || "",
  }));
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    getMe()
      .then((res) => {
        if (!active || !res?.user) return;

        setForm((current) => ({
          ...current,
          nama: res.user.nama || "",
          email: res.user.email || "",
        }));
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const canSubmit = useMemo(() => {
    return (
      form.nama.trim().length > 0 &&
      form.email.trim().length > 0 &&
      form.password_before.trim().length > 0 &&
      !loading
    );
  }, [form.email, form.nama, form.password_before, loading]);

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const validateForm = () => {
    const nextErrors = {};
    const wantsPasswordChange =
      form.new_password.trim() || form.confirm_password.trim();

    if (!form.nama.trim()) nextErrors.nama = "Nama wajib diisi";
    if (!form.email.trim()) nextErrors.email = "Email wajib diisi";
    if (!form.password_before.trim()) {
      nextErrors.password_before = "Password lama wajib diisi";
    }

    if (wantsPasswordChange) {
      if (form.new_password.trim().length < 6) {
        nextErrors.new_password = "Password baru minimal 6 karakter";
      }

      if (form.new_password !== form.confirm_password) {
        nextErrors.confirm_password = "Konfirmasi password tidak sesuai";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleCancel = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/dashboard");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      const res = await updateProfile({
        nama: form.nama.trim(),
        email: form.email.trim(),
        password_before: form.password_before,
        new_password: form.new_password,
        confirm_password: form.confirm_password,
      });

      if (res?.user) {
        updateStoredAuth({
          token: res.token,
          user: res.user,
        });
      }

      setForm((current) => ({
        ...current,
        password_before: "",
        new_password: "",
        confirm_password: "",
      }));

      toastRef.current?.show({
        severity: "success",
        summary: "Berhasil",
        detail: "Profil berhasil diperbarui",
        life: 2200,
      });
    } catch (err) {
      toastRef.current?.show({
        severity: "error",
        summary: "Gagal",
        detail: err?.response?.data?.message || "Gagal menyimpan profil",
        life: 2600,
      });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field) =>
    [
      "h-14 w-full rounded-[10px] border bg-white px-5 text-sm text-slate-800 outline-none transition",
      "focus:border-[#2BB0A6] focus:ring-4 focus:ring-[#2BB0A6]/10",
      errors[field] ? "border-red-400" : "border-slate-300",
    ].join(" ");

  return (
    <div className="mx-auto w-full max-w-[1280px]">
      <Toast ref={toastRef} />

      <h1 className="mb-5 text-[28px] font-extrabold leading-tight text-slate-900 md:text-[32px]">
        Edit Profil
      </h1>

      <form
        onSubmit={handleSubmit}
        className="rounded-[18px] bg-white p-6 shadow-sm md:p-10 lg:p-12"
      >
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-7">
            <div className="space-y-3">
              <label
                htmlFor="nama"
                className="block text-sm font-bold text-slate-900"
              >
                Nama
              </label>
              <input
                id="nama"
                value={form.nama}
                onChange={(e) => setField("nama", e.target.value)}
                autoComplete="name"
                className={inputClass("nama")}
              />
              {errors.nama ? (
                <small className="text-red-500">{errors.nama}</small>
              ) : null}
            </div>

            <div className="space-y-3">
              <label
                htmlFor="email"
                className="block text-sm font-bold text-slate-900"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                autoComplete="email"
                className={inputClass("email")}
              />
              {errors.email ? (
                <small className="text-red-500">{errors.email}</small>
              ) : null}
            </div>
          </div>

          <div className="space-y-7">
            <PasswordField
              id="password_before"
              label="Password Before"
              value={form.password_before}
              error={errors.password_before}
              autoComplete="current-password"
              onChange={(value) => setField("password_before", value)}
            />

            <PasswordField
              id="new_password"
              label="New Password"
              value={form.new_password}
              error={errors.new_password}
              autoComplete="new-password"
              onChange={(value) => setField("new_password", value)}
            />

            <PasswordField
              id="confirm_password"
              label="Konfirmasi Password"
              value={form.confirm_password}
              error={errors.confirm_password}
              autoComplete="new-password"
              onChange={(value) => setField("confirm_password", value)}
            />
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <button
            type="button"
            onClick={handleCancel}
            className="h-14 rounded-[10px] border border-slate-300 bg-white text-sm font-bold text-slate-900 transition hover:bg-slate-50"
          >
            Batal
          </button>

          <button
            type="submit"
            disabled={!canSubmit}
            className="h-14 rounded-[10px] bg-[#5b5b5b] text-sm font-bold text-white transition hover:bg-[#4b4b4b] disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {loading ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>
    </div>
  );
}