"""
Bu script hem backend hem de frontend sunucularını aynı anda başlatır.
Kullanım: python start_app.py
"""

import subprocess
import threading
import os
import time

def run_backend():
    """Backend API sunucusunu başlatır."""
    print("Backend API sunucusu başlatılıyor (8005 portu)...")
    try:
        # Aynı dizinde modified_main.py olduğunu varsayıyoruz
        # İşletim sistemine göre farklı komutlar kullanıyoruz
        if os.name == 'nt':  # Windows
            subprocess.run(["python", "modified_main.py"], check=True)
        else:  # Linux/Mac
            subprocess.run(["python3", "modified_main.py"], check=True)
    except Exception as e:
        print(f"Backend sunucusu başlatılırken hata: {e}")

def run_frontend():
    """Frontend HTTP sunucusunu başlatır."""
    print("Frontend HTTP sunucusu başlatılıyor (8000 portu)...")
    try:
        # İşletim sistemine göre farklı komutlar kullanıyoruz
        if os.name == 'nt':  # Windows
            subprocess.run(["python", "-m", "http.server", "8000"], check=True)
        else:  # Linux/Mac
            subprocess.run(["python3", "-m", "http.server", "8000"], check=True)
    except Exception as e:
        print(f"Frontend sunucusu başlatılırken hata: {e}")

def main():
    """Backend ve frontend sunucularını ayrı thread'lerde başlatır."""
    print("Intelligent Patient Helper uygulaması başlatılıyor...")
    
    # Backend thread'ini başlat
    backend_thread = threading.Thread(target=run_backend)
    backend_thread.daemon = True  # Ana program sonlandığında bu thread de sonlanır
    backend_thread.start()
    
    # Backend'in başlaması için biraz bekle
    time.sleep(2)
    
    # Frontend thread'ini başlat
    frontend_thread = threading.Thread(target=run_frontend)
    frontend_thread.daemon = True  # Ana program sonlandığında bu thread de sonlanır
    frontend_thread.start()
    
    print("\nSunucular başlatıldı!")
    print("Backend API: http://localhost:8005")
    print("Frontend: http://localhost:8000")
    print("\nUygulamayı kullanmak için tarayıcınızda http://localhost:8000/index.html adresini açın")
    print("\nUygulamayı durdurmak için Ctrl+C tuşlarına basın.\n")
    
    try:
        # Ana thread'i canlı tut
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nUygulama kapatılıyor...")

if __name__ == "__main__":
    main() 