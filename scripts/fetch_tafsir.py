#!/usr/bin/env python3
"""
Script untuk mengunduh dan mengkonversi data Tafsir ke format JSON
yang kompatibel dengan Al-Quran Suite

Sumber Data:
- Tafsir Ibn Katsir: https://github.com/pfrfrn/tafsir-ibn-katsir-id
- Tafsir Jalalayn: https://tanzil.net/trans/

Lisensi:
- Ibn Katsir: CC BY-NC-SA
- Jalalayn: CC BY-NC-ND 3.0
"""

import json
import os
import urllib.request
from pathlib import Path

# Direktori output
OUTPUT_DIR = Path(__file__).parent.parent / "public" / "data" / "tafsir"

# Metadata Surah (1-114)
SURAH_NAMES = {
    1: ("Al-Fatihah", "الفاتحة"),
    2: ("Al-Baqarah", "البقرة"),
    3: ("Ali 'Imran", "آل عمران"),
    4: ("An-Nisa", "النساء"),
    5: ("Al-Ma'idah", "المائدة"),
    # ... dst (akan di-populate dari API)
}


def fetch_tafsir_ibn_katsir():
    """
    Mengunduh Tafsir Ibn Katsir dari GitHub
    """
    print("[INFO] Mengunduh Tafsir Ibn Katsir...")
    
    # URL repositori
    base_url = "https://raw.githubusercontent.com/pfrfrn/tafsir-ibn-katsir-id/main"
    
    all_tafsir = []
    
    # Coba unduh per surah (1-114)
    for surah in range(1, 115):
        url = f"{base_url}/data/{surah}.json"
        try:
            with urllib.request.urlopen(url, timeout=30) as response:
                data = json.loads(response.read().decode('utf-8'))
                
                # Konversi ke format yang dibutuhkan
                if isinstance(data, list):
                    for item in data:
                        all_tafsir.append({
                            "surah": surah,
                            "ayah": item.get("ayat", item.get("verse", 1)),
                            "source": "ibn_katsir",
                            "text": item.get("tafsir", item.get("text", ""))
                        })
                elif isinstance(data, dict):
                    for ayah, tafsir_text in data.items():
                        all_tafsir.append({
                            "surah": surah,
                            "ayah": int(ayah),
                            "source": "ibn_katsir",
                            "text": tafsir_text
                        })
                
                print(f"  ✓ Surah {surah}")
        except Exception as e:
            print(f"  ✗ Surah {surah}: {e}")
    
    # Simpan ke file
    output_file = OUTPUT_DIR / "ibn-katsir.json"
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_tafsir, f, ensure_ascii=False, indent=2)
    
    print(f"[OK] Tersimpan: {output_file} ({len(all_tafsir)} entries)")
    return all_tafsir


def fetch_tafsir_jalalayn():
    """
    Mengunduh Tafsir Jalalayn dari Tanzil atau GitHub mirror
    """
    print("[INFO] Mengunduh Tafsir Jalalayn...")
    
    # Coba dari GitHub mirror yang sudah dalam format JSON
    urls = [
        "https://raw.githubusercontent.com/AhmedAt19/Quran-Tafsir-API/master/tafsir/id.jalalayn.json",
        "https://raw.githubusercontent.com/rioastamal/quran-json/master/tafsir/id/jalalayn/index.json"
    ]
    
    all_tafsir = []
    
    for url in urls:
        try:
            print(f"  Mencoba: {url}")
            with urllib.request.urlopen(url, timeout=30) as response:
                data = json.loads(response.read().decode('utf-8'))
                
                # Parse berdasarkan struktur data
                if isinstance(data, dict):
                    for surah_num, ayahs in data.items():
                        if isinstance(ayahs, dict):
                            for ayah_num, text in ayahs.items():
                                all_tafsir.append({
                                    "surah": int(surah_num),
                                    "ayah": int(ayah_num),
                                    "source": "jalalayn",
                                    "text": text
                                })
                elif isinstance(data, list):
                    for item in data:
                        all_tafsir.append({
                            "surah": item.get("surah", item.get("sura", 1)),
                            "ayah": item.get("ayah", item.get("aya", 1)),
                            "source": "jalalayn",
                            "text": item.get("text", item.get("tafsir", ""))
                        })
                
                print(f"  ✓ Berhasil mengunduh {len(all_tafsir)} entries")
                break
        except Exception as e:
            print(f"  ✗ Gagal: {e}")
            continue
    
    # Simpan ke file
    if all_tafsir:
        output_file = OUTPUT_DIR / "jalalayn.json"
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(all_tafsir, f, ensure_ascii=False, indent=2)
        
        print(f"[OK] Tersimpan: {output_file}")
    else:
        print("[ERROR] Tidak ada data yang berhasil diunduh")
    
    return all_tafsir


def main():
    print("=" * 50)
    print("SCRIPT DOWNLOAD TAFSIR DATA")
    print("=" * 50)
    print()
    
    # Download Ibn Katsir
    fetch_tafsir_ibn_katsir()
    print()
    
    # Download Jalalayn
    fetch_tafsir_jalalayn()
    print()
    
    print("=" * 50)
    print("SELESAI")
    print("=" * 50)


if __name__ == "__main__":
    main()
