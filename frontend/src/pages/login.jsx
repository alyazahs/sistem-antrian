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

  return (
    <div className="h-screen w-screen overflow-hidden bg-white">
      <div className="grid h-full grid-cols-1 md:grid-cols-2">
        <div className="relative hidden md:block">
          <img
            src="/paten.png"
            alt="PATEN"
            className="absolute inset-0 h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <div className="absolute inset-0 bg-black/30" />
        </div>

        <div className="flex h-full items-center justify-center bg-white p-6 md:p-12">
          <div className="w-full max-w-md">
            <div className="flex items-start justify-between gap-4">
              <img
                src="/logo-kab.png"
                alt="Logo Kabupaten"
                className="h-14 w-14 object-contain"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />

              <div className="flex-1 text-center">
                <div className="text-5xl font-extrabold tracking-wide text-gray-800">
                  PATEN
                </div>
                <div className="mt-1 text-sm text-gray-500">
                  Pelayanan Administrasi Terpadu Kecamatan
                </div>
              </div>

              <img
                src="/pesilat.png"
                alt="Logo PATEN"
                className="h-14 w-14 object-contain"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            </div>

            {errMsg ? (
              <div className="mt-6">
                <Message severity="error" text={errMsg} />
              </div>
            ) : null}

            <form onSubmit={onSubmit} className="mt-10 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Email
                </label>
                <InputText
                  value={form.email}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, email: e.target.value }))
                  }
                  className="w-full"
                  placeholder="Masukkan email"
                  autoComplete="username"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
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

              <div className="flex items-center gap-3">
                <Checkbox
                  inputId="remember"
                  checked={form.remember}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, remember: e.checked }))
                  }
                />
                <label
                  htmlFor="remember"
                  className="cursor-pointer text-sm text-gray-600"
                >
                  Remember Me
                </label>
              </div>

              <Button
                type="submit"
                label={loading ? "Memproses..." : "LOGIN"}
                disabled={!canSubmit}
                className="w-full !py-3 !font-semibold"
                severity="success"
                style={{ background: "#2f8f84", borderColor: "#2f8f84" }}
              />
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}