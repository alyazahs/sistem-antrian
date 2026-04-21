export const showAppToast = (toastRef, severity, detail, life = 2200) => {
  const summaryMap = {
    success: "Berhasil",
    error: "Gagal",
    warn: "Peringatan",
    info: "Info",
  };

  toastRef.current?.show({
    severity,
    summary: summaryMap[severity] || "Info",
    detail,
    life,
  });
};