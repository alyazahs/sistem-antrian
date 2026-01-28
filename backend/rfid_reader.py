import threading
import time
import os

_last_uid = None
_lock = threading.Lock()

IS_PI = False

try:
    from mfrc522 import SimpleMFRC522
    import RPi.GPIO as GPIO

    GPIO.setwarnings(False)
    IS_PI = True
except Exception:
    IS_PI = False


class RFIDReader:
    def __init__(self):
        if IS_PI:
            self.reader = SimpleMFRC522()   
            t = threading.Thread(target=self._loop_pi, daemon=True)
            t.start()
        else:
            # dummy mode (Windows / tanpa hardware)
            t = threading.Thread(target=self._loop_dummy, daemon=True)
            t.start()

    def _loop_pi(self):
        global _last_uid
        while True:
            try:
                uid, _ = self.reader.read()  # BLOCKING & STABIL
                with _lock:
                    _last_uid = str(uid)
                time.sleep(1)  # debounce
            except Exception as e:
                print("RFID error:", e)
                time.sleep(1)

    def _loop_dummy(self):
        global _last_uid
        while True:
            # simulasi kartu RFID
            dummy_uid = os.getenv("DUMMY_RFID", "DUMMY-RFID-123456")
            with _lock:
                _last_uid = dummy_uid
            time.sleep(5)  # tiap 5 detik muncul "scan"

    def read_id(self):
        global _last_uid
        with _lock:
            uid = _last_uid
            _last_uid = None
        return uid

    def cleanup(self):
        if IS_PI:
            GPIO.cleanup()


rfid_reader = RFIDReader()