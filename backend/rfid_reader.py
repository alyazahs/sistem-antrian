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
        self.buzzer_pin = 17

        if IS_PI:
            GPIO.setmode(GPIO.BCM)
            GPIO.setup(self.buzzer_pin, GPIO.OUT)
            GPIO.output(self.buzzer_pin, GPIO.LOW)

            self.reader = SimpleMFRC522()

            t = threading.Thread(target=self._loop_pi, daemon=True)
            t.start()
        else:
            print("RFID / GPIO tidak ditemukan, jalan di mode dummy.")
            t = threading.Thread(target=self._loop_dummy, daemon=True)
            t.start()

    def beep(self, duration=0.1):
        """Menyalakan buzzer sebentar."""
        if IS_PI:
            try:
                GPIO.output(self.buzzer_pin, GPIO.HIGH)
                time.sleep(duration)
                GPIO.output(self.buzzer_pin, GPIO.LOW)
            except Exception as e:
                print("Buzzer error:", e)

    def _loop_pi(self):
        global _last_uid
        while True:
            try:
                uid, _ = self.reader.read() 
                if uid:
                    with _lock:
                        _last_uid = str(uid)

                    self.beep(0.1)  
                    time.sleep(1)   
            except Exception as e:
                print("RFID error:", e)
                time.sleep(1)

    def _loop_dummy(self):
        global _last_uid
        while True:
            dummy_uid = os.getenv("DUMMY_RFID", "DUMMY-RFID-123456")
            with _lock:
                _last_uid = dummy_uid
            time.sleep(5)

    def read_id(self):
        global _last_uid
        with _lock:
            uid = _last_uid
            _last_uid = None
        return uid

    def cleanup(self):
        if IS_PI:
            try:
                GPIO.output(self.buzzer_pin, GPIO.LOW)
                GPIO.cleanup()
            except Exception as e:
                print("Cleanup error:", e)


rfid_reader = RFIDReader()