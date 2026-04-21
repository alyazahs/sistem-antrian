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
    USB_VENDOR_ID = 0x0033
    USB_PRODUCT_ID = 0x3107
    PROFILE = "default"

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

    def _raw_or_text(self, printer, raw_bytes: bytes, fallback_text: str = ""):
        if isinstance(printer, Dummy):
            if fallback_text:
                printer.text(fallback_text)
            return

        try:
            printer._raw(raw_bytes)
        except Exception:
            if fallback_text:
                printer.text(fallback_text)

    def _set_align(self, printer, align: str):
        align_map = {
            "left": b"\x1B\x61\x00",
            "center": b"\x1B\x61\x01",
            "right": b"\x1B\x61\x02",
        }
        self._raw_or_text(printer, align_map.get(align, b"\x1B\x61\x00"))

    def _set_mode(self, printer, mode: int):
        """
        ESC ! n
        0x00 = normal
        0x08 = emphasis/bold-ish mode
        0x10 = double height
        0x20 = double width
        0x30 = double height + double width
        0x38 = emphasis + double height + double width
        """
        self._raw_or_text(printer, b"\x1B\x21" + bytes([mode]))

    def _init_printer(self, printer):
        self._raw_or_text(printer, b"\x1B\x40")  # initialize

    def _cut(self, printer):
        if isinstance(printer, Dummy):
            printer.cut()
        else:
            self._raw_or_text(printer, b"\x1D\x56\x01")

    def print_ticket(
        self,
        nomor_antrian: int | str,
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

        time_str = timestamp.strftime("%d-%m-%Y %H:%M")

        try:
            self._init_printer(printer)

            # Header tengah
            self._set_align(printer, "center")
            self._set_mode(printer, 0x18)  # emphasis + double height
            printer.text("NOMOR ANTRIAN\n")
            printer.text("KANTOR KECAMATAN\n")
            printer.text("JIWAN\n")
            printer.text("\n")

            # Nomor antrian besar
            self._set_mode(printer, 0x30)  # double height + double width
            printer.text(f"{str(nomor_antrian).upper()}\n")
            printer.text("\n")

            # Body kecil / normal
            self._set_mode(printer, 0x00)  # normal
            self._set_align(printer, "left")
            printer.text(f"Nama    : {nama}\n")
            printer.text(f"Layanan : {jenis_pelayanan}\n")
            printer.text(f"Waktu   : {time_str}\n")
            printer.text("\n")

            # Footer tengah
            self._set_align(printer, "center")
            self._set_mode(printer, 0x00)  # normal
            printer.text("Mohon menunggu hingga\n")
            printer.text("nomor Anda dipanggil.\n")
            printer.text("Terima Kasih\n")
            printer.text("\n")

            self._cut(printer)

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