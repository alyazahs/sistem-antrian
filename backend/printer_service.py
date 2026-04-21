import datetime
import platform
import traceback

try:
    import libusb_package
    import os
    lib_path = libusb_package.get_library_path()
    if lib_path:
        os.environ["PATH"] += os.pathsep + os.path.dirname(lib_path)
except Exception:
    pass 

try:
    from escpos.printer import Usb, Dummy
    _ESCPOS_OK = True
except ImportError:
    print("[PRINTER] python-escpos tidak terinstall. Menggunakan mode dummy.")
    _ESCPOS_OK = False

    class Dummy:
        """Fallback printer yang hanya mencetak ke console."""
        def __init__(self):
            self.output = b""
        def text(self, t):
            self.output += t.encode(errors="replace")
        def set(self, **kwargs):
            pass
        def cut(self):
            self.output += b"\n[---- CUT ----]\n"
        def ln(self, count=1):
            self.output += b"\n" * count
        def clear(self):
            self.output = b""
        def close(self):
            pass

    Usb = Dummy

class PrinterService:
    # Sesuaikan VID/PID dengan printer thermal 
    USB_VENDOR_ID  = 0x0033
    USB_PRODUCT_ID = 0x3107
    PROFILE        = "default"

    def __init__(self):
        self._printer = None
        self._os = platform.system()

    def _connect(self) -> None:
        if not _ESCPOS_OK:
            self._printer = Dummy()
            return

        try:
            print(
                f"[PRINTER] Menghubungkan ke USB "
                f"(VID={hex(self.USB_VENDOR_ID)}, PID={hex(self.USB_PRODUCT_ID)})..."
            )
            self._printer = Usb(
                self.USB_VENDOR_ID,
                self.USB_PRODUCT_ID,
                in_ep=0x83,
                out_ep=0x04,
                profile=self.PROFILE,
            )
            try:
                self._printer.device.clear_halt(0x04)
            except Exception:
                pass 
            print("[PRINTER] Terhubung.")
        except Exception as e:
            print(f"[PRINTER] Gagal connect: {e}. Beralih ke mode dummy.")
            self._printer = Dummy()

    def _get_printer(self):
        if self._printer is None:
            self._connect()
        return self._printer

    def print_ticket(
        self,
        nomor_antrian: int,
        nama: str,
        jenis_pelayanan: str,
        timestamp: datetime.datetime | str | None = None,
    ) -> None:
        """Cetak tiket antrian ke printer thermal."""
        printer = self._get_printer()

        if timestamp is None:
            timestamp = datetime.datetime.now()
        elif isinstance(timestamp, str):
            try:
                timestamp = datetime.datetime.fromisoformat(timestamp)
            except ValueError:
                timestamp = datetime.datetime.now()

        time_str  = timestamp.strftime("%d-%m-%Y %H:%M")

        try:
            printer.set(align="center", bold=True, double_height=True, double_width=True)
            printer.text("NOMOR ANTRIAN\n")
            printer.text("KANTOR KECAMATAN\n")  
            printer.text("JIWAN\n")
            printer.ln(1)

            printer.set(align="center", bold=True, width=4, height=4)
            printer.text(f"{nomor_antrian}\n")
            printer.ln(1)

            printer.set(align="left", font="b", bold=False,
                        double_height=False, double_width=False, width=1, height=1)
            printer.text(f"Nama    : {nama}\n")
            printer.text(f"Layanan : {jenis_pelayanan}\n")
            printer.text(f"Waktu   : {time_str}\n")
            printer.ln(1)
            
            printer.set(align="center")
            printer.text("Mohon menunggu hingga\n")
            printer.text("nomor Anda dipanggil.\n")
            printer.text("Terima Kasih\n")
            printer.cut()

            if isinstance(printer, Dummy):
                print("\n" + "=" * 36)
                print("   [VIRTUAL THERMAL PRINTER OUTPUT]   ")
                print(printer.output.decode("utf-8", errors="replace"))
                print("=" * 36 + "\n")
                printer.clear()

        except Exception as e:
            print(f"[PRINTER] Gagal cetak tiket: {e}")
            traceback.print_exc()
            self._printer = None

    def close(self) -> None:
        if self._printer and not isinstance(self._printer, Dummy):
            try:
                self._printer.close()
            except Exception:
                pass
        self._printer = None

printer_service = PrinterService()