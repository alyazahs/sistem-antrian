import platform
import datetime
import traceback

try:
    import libusb_package
    import os
    lib = libusb_package.get_library_path()
    if lib:
        os.environ['PATH'] += os.pathsep + os.path.dirname(lib)
        print(f"Added to PATH: {os.path.dirname(lib)}")
except Exception as e:
    print(f"Note: Windows USB backend setup skipped: {e}")
    pass

try:
    from escpos.printer import Usb, Dummy, Network
except ImportError:
    print("Warning: python-escpos not installed or import failed. Mocking classes.")
    class Dummy:
        def __init__(self): self.output = b""
        def text(self, t): self.output += t.encode()
        def set(self, **kwargs): pass
        def cut(self): self.output += b"\n[CUT]\n"
        def ln(self, c=1): self.output += b"\n" * c
        def clear(self): self.output = b""
        def close(self): pass
    Usb = Dummy
    Network = Dummy

class PrinterService:
    def __init__(self):
        self.printer = None
        self.os_type = platform.system()
        self.usb_vendor_id = 0x0033  
        self.usb_product_id = 0x3107
        self.profile = 'default'

    def connect(self):
        """Connect to the printer."""
        try:
            print(f"Attempting to connect to USB printer (VID: {hex(self.usb_vendor_id)}, PID: {hex(self.usb_product_id)})...")
            self.printer = Usb(self.usb_vendor_id, self.usb_product_id, in_ep=0x83, out_ep=0x04, profile=self.profile)
            try:
                self.printer.device.clear_halt(0x04)
                print("Cleared halt on endpoint 0x04")
            except Exception as e:
                 print(f"Warning: Could not clear halt: {e}")
                 
            print("USB Printer connected successfully.")
        except Exception as e:
            print(f"Failed to connect to USB printer: {e}")
            print("Falling back to Dummy Printer (Console Output).")
            self.printer = Dummy()

    def print_ticket(self, nomor_antrian, nama, jenis_pelayanan, timestamp=None):
        """Print a queue ticket."""
        if not self.printer:
            self.connect()

        if not timestamp:
            timestamp = datetime.datetime.now()
        
        # Helper to strict types
        if isinstance(timestamp, str):
            try:
                timestamp = datetime.datetime.fromisoformat(timestamp)
            except:
                timestamp = datetime.datetime.now()

        # Format timestamp
        time_str = timestamp.strftime("%Y-%m-%d %H:%M:%S")

        try:
            # Check if printer is operational? With dummy it always is.
            # Reset connection if needed? (Simplification: just try printing)

            # --- Layout ---
            # Center alignment
            self.printer.set(align='center', bold=True, double_height=True, double_width=True)
            self.printer.text("ANTRIAN\n")
            self.printer.text("KANTOR KECEMATAN\n")
            self.printer.text("JIWAN\n")
            self.printer.ln(1)
            
            # Queue Number big
            self.printer.set(align='center', bold=True, width=3, height=3)
            self.printer.text(f"{nomor_antrian}\n")
            self.printer.ln(1)

            # Details
            # Use Font B for smaller text
            self.printer.set(align='left', font='b', bold=False, double_height=False, double_width=False, width=1, height=1)
            self.printer.text(f"Nama : {nama}\n")
            self.printer.text(f"Perlu : {jenis_pelayanan}\n")
            self.printer.text(f"Waktu:\n{time_str}\n")
            self.printer.ln(1)
            
            # Footer
            self.printer.set(align='center')
            self.printer.text("Mohon menunggu untuk\n")
            self.printer.text("dipanggil\n")
            self.printer.text("Terima Kasih\n")
            self.printer.cut()
            
            # If Dummy, print to console
            if isinstance(self.printer, Dummy):
                print("\n" + "="*32)
                print(" [VIRTUAL THERMAL PRINTER OUTPUT] ")
                try:
                    print(self.printer.output.decode('utf-8', errors='replace'))
                except:
                    print(self.printer.output)
                print("="*32 + "\n")
                self.printer.clear()
                
        except Exception as e:
            print(f"Error printing ticket: {e}")
            traceback.print_exc()
            self.printer = None

    def close(self):
        if self.printer and not isinstance(self.printer, Dummy):
            try:
                self.printer.close()
            except:
                pass

printer_service = PrinterService()