#!/usr/bin/env python3
"""
Script untuk mengunduh data Hadith dari hadith-api.gading.dev
dan menyimpannya ke format JSON lokal

Koleksi yang tersedia:
- Sahih Bukhari (7008 hadits)
- Sahih Muslim (5362 hadits)
- Musnad Ahmad (4305 hadits)
- Jami' at-Tirmidzi (3625 hadits)

Lisensi: MIT (hadith-api)
"""

import json
import os
import urllib.request
import time
from pathlib import Path

# Direktori output
OUTPUT_DIR = Path(__file__).parent.parent / "public" / "data" / "hadith"

# API Base URL
API_BASE = "https://api.hadith.gading.dev"

# Koleksi hadith dengan jumlah total
COLLECTIONS = {
    "bukhari": 7008,
    "muslim": 5362,
    "ahmad": 4305,
    "tirmidzi": 3625
}


def fetch_hadith_collection(collection: str, limit: int = 500):
    """
    Mengunduh koleksi hadith dari API
    
    Args:
        collection: nama koleksi (bukhari, muslim, ahmad, tirmidzi)
        limit: jumlah maksimum hadith yang diunduh (untuk testing, set lebih kecil)
    """
    print(f"[INFO] Mengunduh {collection.capitalize()}...")
    
    all_hadith = []
    batch_size = 100  # API limit per request
    
    total = min(limit, COLLECTIONS.get(collection, 100))
    
    for start in range(1, total + 1, batch_size):
        end = min(start + batch_size - 1, total)
        url = f"{API_BASE}/books/{collection}?range={start}-{end}"
        
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'QuranSuite/1.0'})
            with urllib.request.urlopen(req, timeout=30) as response:
                data = json.loads(response.read().decode('utf-8'))
                
                if "data" in data and "hadiths" in data["data"]:
                    hadiths = data["data"]["hadiths"]
                elif "hadiths" in data:
                    hadiths = data["hadiths"]
                else:
                    print(f"  ⚠ Struktur data tidak dikenal untuk {collection}")
                    continue
                
                for h in hadiths:
                    all_hadith.append({
                        "id": f"{collection}-{h['number']}",
                        "collection": collection,
                        "number": h["number"],
                        "narrators": [],  # API tidak menyediakan ini
                        "arabic": h.get("arab", ""),
                        "indonesian": h.get("id", "")
                    })
                
                print(f"  ✓ {start}-{end} ({len(hadiths)} hadits)")
                
        except Exception as e:
            print(f"  ✗ {start}-{end}: {e}")
        
        # Rate limiting
        time.sleep(0.5)
    
    # Simpan ke file
    output_file = OUTPUT_DIR / f"{collection}.json"
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_hadith, f, ensure_ascii=False, indent=2)
    
    print(f"[OK] Tersimpan: {output_file} ({len(all_hadith)} entries)")
    return all_hadith


def main():
    print("=" * 50)
    print("SCRIPT DOWNLOAD HADITH DATA")
    print("=" * 50)
    print()
    print("⚠ CATATAN: Untuk testing, script ini hanya mengunduh 500 hadits")
    print("   per koleksi. Untuk data lengkap, ubah parameter 'limit'.")
    print()
    
    for collection in COLLECTIONS:
        fetch_hadith_collection(collection, limit=500)
        print()
    
    print("=" * 50)
    print("SELESAI")
    print("=" * 50)


if __name__ == "__main__":
    main()
