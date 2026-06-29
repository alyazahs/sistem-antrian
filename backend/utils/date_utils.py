from datetime import datetime

def format_tanggal_indo(dt_str):
    try:
        dt = datetime.strptime(dt_str, "%Y-%m-%d %H:%M:%S")
        bulan = [
            "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
            "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
        ]
        return f"{dt.day:02d} {bulan[dt.month - 1]} {dt.year}"
    except Exception:
        return dt_str

def hitung_umur(tanggal_lahir):
    if not tanggal_lahir:
        return None

    try:
        tanggal_only = str(tanggal_lahir)[:10]
        lahir = datetime.strptime(tanggal_only, "%Y-%m-%d")

        today = datetime.today()
        umur = today.year - lahir.year
        if (today.month, today.day) < (lahir.month, lahir.day):
            umur -= 1

        return umur
    except Exception:
        return None