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
    <div className="min-h-screen bg-slate-50">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="relative hidden overflow-hidden lg:block">
          <img
            src="/paten.png"
            alt="PELAYANAN KECAMATAN JIWAN"
            className="absolute inset-0 h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>

        <div className="flex min-h-screen items-center justify-center bg-white px-5 py-8 sm:px-8 lg:px-12">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <div className="mb-6 flex items-center justify-center gap-4">
                <img
                  src="/logo-kab.png"
                  alt="Logo Kabupaten"
                  className="h-14 w-14 object-contain"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />

                <div className="h-10 w-px bg-slate-200" />

                <img
                  src="/pesilat.png"
                  alt="Logo PATEN"
                  className="h-14 w-14 object-contain"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              </div>

              <div className="text-center">
                <div className="text-2xl font-extrabold leading-tight text-slate-900 sm:text-3xl">
                  Pelayanan Kecamatan Jiwan
                </div>
                <div className="mt-2 text-sm text-slate-500">
                  Pelayanan Administrasi Terpadu Kecamatan
                </div>
              </div>
            </div>

            {errMsg ? (
              <div className="mt-6">
                <Message severity="error" text={errMsg} />
              </div>
            ) : null}

            <form
              onSubmit={onSubmit}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
            >
              <div className="mb-6">
                <div className="text-lg font-bold text-slate-900">
                  Masuk Sistem
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  Gunakan akun petugas yang sudah terdaftar.
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Email
                </label>
                <span className="p-input-icon-left w-full">
                  <i className="pi pi-envelope ml-2 text-slate-400" />
                  <InputText
                    value={form.email}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, email: e.target.value }))
                    }
                    className="w-full pl-8"
                    placeholder="Masukkan email"
                    autoComplete="username"
                    autoFocus
                  />
                </span>
              </div>

              <div className="mt-5 space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Password
                </label>

                <Password
                  value={form.password}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, password: e.target.value }))
                  }
                  toggleMask
                  feedback={false}
                  className="w-full"
                  inputClassName="w-full"
                  placeholder="Masukkan password"
                  autoComplete="current-password"
                />
              </div>

              <div className="mt-5 flex items-center gap-3">
                <Checkbox
                  inputId="remember"
                  checked={form.remember}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, remember: e.checked }))
                  }
                />
                <label
                  htmlFor="remember"
                  className="cursor-pointer text-sm text-slate-600"
                >
                  Ingat saya
                </label>
              </div>

              <Button
                type="submit"
                label={loading ? "Memproses..." : "Masuk"}
                icon={loading ? "pi pi-spin pi-spinner" : "pi pi-sign-in"}
                disabled={!canSubmit}
                className="mt-6 w-full !py-3 !font-semibold"
                severity="success"
                style={{ background: "#2f8f84", borderColor: "#2f8f84" }}
              />
            </form>

            <div className="mt-6 text-center text-xs text-slate-400">
              {currentYear} Kecamatan Jiwan
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
