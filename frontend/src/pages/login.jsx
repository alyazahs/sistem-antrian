import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Checkbox } from "primereact/checkbox";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import { login as apiLogin, clearAuth, getToken } from "../api";

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const [form, setForm] = useState({
    email: "",
    password: "",
    remember: true,
  });

  useEffect(() => {
    const token = getToken();
    if (token) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const canSubmit = useMemo(() => {
    return (
      form.email.trim().length > 0 &&
      form.password.trim().length > 0 &&
      !loading
    );
  }, [form.email, form.password, loading]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setErrMsg("");
    setLoading(true);

    try {
      const res = await apiLogin(
        {
          email: form.email.trim(),
          password: form.password,
        },
        !!form.remember
      );

      if (!res?.success || !res?.token) {
        setErrMsg(res?.message || "Login gagal.");
        clearAuth();
        return;
      }

      navigate("/dashboard", { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Terjadi kesalahan saat login.";
      setErrMsg(msg);
      clearAuth();
    } finally {
      setLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <main className="h-screen overflow-hidden bg-[#f3f7f6]">
      <div className="grid h-full grid-cols-1 lg:grid-cols-[1.08fr_0.92fr]">
        {/* Bagian Foto */}
       <section className="relative hidden h-screen overflow-hidden bg-white lg:block">
  <div className="relative h-full overflow-hidden rounded-r-[54px] bg-white">
            <img
              src="/pelayanan.png"
              alt="Pelayanan Kecamatan Jiwan"
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />

            <div className="absolute left-8 top-8 rounded-full border border-white/70 bg-white/85 px-5 py-2 text-sm font-semibold text-[#126d63] shadow-sm backdrop-blur">
              Sistem Antrian Digital
            </div>

            <div className="absolute bottom-8 left-8 right-8">
              <div className="w-fit rounded-3xl border border-white/70 bg-white/90 px-7 py-5 shadow-xl backdrop-blur">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#126d63]">
                  Kecamatan Jiwan
                </p>
                <h1 className="mt-2 max-w-[520px] text-3xl font-extrabold leading-tight text-slate-950">
                  Pelayanan Administrasi Lebih Tertib dan Efisien
                </h1>
              </div>
            </div>
          </div>
        </section>

        {/* Bagian Form */}
        <section className="flex h-screen items-center justify-center overflow-hidden bg-white px-5 py-5 sm:px-8 lg:px-12">
          <div className="w-full max-w-[500px]">
            <div className="mb-6 text-center">
              <div className="mb-5 flex items-center justify-center">
                <div className="flex items-center gap-5 rounded-full border border-slate-200 bg-white px-6 py-3 shadow-[0_12px_35px_rgba(15,23,42,0.08)]">
                  <img
                    src="/logo-kab.png"
                    alt="Logo Kabupaten"
                    className="h-12 w-12 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />

                  <div className="h-9 w-px bg-slate-200" />

                  <img
                    src="/pesilat.png"
                    alt="Logo PATEN"
                    className="h-12 w-12 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              </div>

              <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#126d63]">
                Login Petugas
              </p>

              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                Selamat Datang
              </h2>

              <p className="mt-3 text-sm font-medium leading-6 text-slate-500 sm:text-base">
                Pelayanan Administrasi Terpadu Kecamatan Jiwan
              </p>
            </div>

            {errMsg && (
              <div className="mb-4">
                <Message severity="error" text={errMsg} className="w-full" />
              </div>
            )}

            <form
              onSubmit={onSubmit}
              className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] sm:p-7"
            >
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-slate-950">
                  Masuk Sistem
                </h3>
                <p className="mt-1.5 text-sm leading-6 text-slate-500">
                  Gunakan akun petugas yang sudah terdaftar.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Email
                </label>

                <span className="p-input-icon-left w-full">
                  <i className="pi pi-envelope ml-2 text-slate-400" />
                  <InputText
                    value={form.email}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className="w-full rounded-xl pl-9 !py-3 !text-sm"
                    placeholder="Masukkan email"
                    autoComplete="username"
                    autoFocus
                  />
                </span>
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Password
                </label>

                <Password
                  value={form.password}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  toggleMask
                  feedback={false}
                  className="w-full"
                  inputClassName="w-full rounded-xl !py-3 !text-sm"
                  placeholder="Masukkan password"
                  autoComplete="current-password"
                />
              </div>

              <div className="mt-4 flex items-center gap-3">
                <Checkbox
                  inputId="remember"
                  checked={form.remember}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      remember: e.checked,
                    }))
                  }
                />

                <label
                  htmlFor="remember"
                  className="cursor-pointer text-sm font-medium text-slate-600"
                >
                  Ingat saya
                </label>
              </div>

              <Button
                type="submit"
                label={loading ? "Memproses..." : "Masuk"}
                icon={loading ? "pi pi-spin pi-spinner" : "pi pi-sign-in"}
                disabled={!canSubmit}
                className="mt-6 w-full rounded-xl !border-0 !py-3 !text-sm !font-bold shadow-[0_14px_35px_rgba(18,109,99,0.28)]"
                style={{
                  background: canSubmit ? "#126d63" : "#94a3b8",
                }}
              />
            </form>

            <p className="mt-5 text-center text-xs font-medium text-slate-400">
              &copy; {currentYear} Kecamatan Jiwan. Semua hak dilindungi.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}