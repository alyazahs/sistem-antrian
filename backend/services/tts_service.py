from gtts import gTTS
import logging
import os
import queue
import threading
import time
os.environ.setdefault("PYGAME_HIDE_SUPPORT_PROMPT", "1")
import pygame

logger = logging.getLogger(__name__)

class TTSService:
    def __init__(self):
        self.queue = queue.Queue()
        self.lang = "id"
        try:
            pygame.mixer.init()
        except Exception as e:
            logger.warning("Gagal inisialisasi pygame mixer: %s", e)

        self.worker_thread = threading.Thread(target=self._worker, daemon=True)
        self.worker_thread.start()

    def _worker(self):
        while True:
            try:
                text = self.queue.get(timeout=1)
                if text:
                    tts = gTTS(text=text, lang=self.lang)
                    filename = "temp_call.mp3"
                    tts.save(filename)

                    pygame.mixer.music.load(filename)
                    pygame.mixer.music.play()

                    while pygame.mixer.music.get_busy():
                        time.sleep(0.1)

                    pygame.mixer.music.unload()
                    try:
                        os.remove(filename)
                    except Exception:
                        pass

                self.queue.task_done()
            except queue.Empty:
                continue
            except Exception as e:
                logger.error("gTTS worker error: %s", e)

    def speak(self, text):
        self.queue.put(text)

    def pengumuman(self, nama, nomor_antrian):
        text = f"Atas nama {nama}, nomor antrean {nomor_antrian}. Silakan menuju meja pelayanan."
        self.speak(text)

tts_service = TTSService()

if __name__ == "__main__":
    tts_service.pengumuman("zahra", 5)
    time.sleep(10)