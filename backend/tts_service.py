from gtts import gTTS
import os
import pygame
import threading
import queue
import time

class TTSService:
    def __init__(self):
        self.queue = queue.Queue()
        self.lang = 'id'
        # Initialize pygame mixer
        pygame.mixer.init()
        self.worker_thread = threading.Thread(target=self._worker, daemon=True)
        self.worker_thread.start()

    def _worker(self):
        while True:
            try:
                text = self.queue.get(timeout=1)
                if text:
                    # Generate TTS
                    tts = gTTS(text=text, lang=self.lang)
                    filename = "temp_call.mp3"
                    tts.save(filename)
                    
                    # Play TTS
                    pygame.mixer.music.load(filename)
                    pygame.mixer.music.play()
                    
                    # Wait for playback to finish
                    while pygame.mixer.music.get_busy():
                        time.sleep(0.1)
                    
                    # Clean up
                    pygame.mixer.music.unload()
                    try:
                        os.remove(filename)
                    except:
                        pass

                self.queue.task_done()
            except queue.Empty:
                continue
            except Exception as e:
                print(f"gTTS Worker Error: {e}")

    def speak(self, text):
        self.queue.put(text)

    def pengumuman(self, nama, nomor_antrian):
        text = f"Atas nama {nama}, nomor antrean {nomor_antrian}. Silakan menuju meja pelayanan."
        self.speak(text)

# Singleton instance
tts_service = TTSService()

if __name__ == "__main__":
    # Test
    tts_service.pengumuman("zahra", 5)
    time.sleep(10)  # Wait for TTS to finish before exiting
