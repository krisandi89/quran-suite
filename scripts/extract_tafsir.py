#!/usr/bin/env python3
"""
Script untuk mengekstrak dan mengkonversi Tafsir dari repository quran-json
ke format yang digunakan oleh Al-Quran Suite

Sumber: https://github.com/rioastamal/quran-json
Struktur: surah/N.json -> {"N": {..., "tafsir": {"id": {"kemenag": {"text": {"1": "...", "2": "..."}}}}}}
"""

import json
import os
from pathlib import Path

# Paths
SOURCE_DIR = Path(__file__).parent.parent / "temp-quran-data" / "surah"
OUTPUT_DIR = Path(__file__).parent.parent / "public" / "data" / "tafsir"

def extract_tafsir():
    """
    Mengekstrak tafsir dari struktur surah JSON
    """
    print("[INFO] Mengekstrak Tafsir dari repository quran-json...")
    
    all_tafsir = []
    
    # Proses setiap surah (1-114)
    for surah_num in range(1, 115):
        surah_file = SOURCE_DIR / f"{surah_num}.json"
        
        if not surah_file.exists():
            print(f"  ⚠ Surah {surah_num}: file tidak ditemukan")
            continue
        
        try:
            with open(surah_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Navigasi ke struktur tafsir yang benar
            # Struktur: {"N": {..., "tafsir": {"id": {"kemenag": {"text": {"1": "...", "2": "..."}}}}}}
            surah_key = str(surah_num)
            surah_data = data.get(surah_key, {})
            
            # Ambil tafsir Kemenag
            tafsir_section = surah_data.get("tafsir", {})
            id_tafsir = tafsir_section.get("id", {})
            kemenag = id_tafsir.get("kemenag", {})
            tafsir_texts = kemenag.get("text", {})
            
            for ayah_num, tafsir_text in tafsir_texts.items():
                if tafsir_text and isinstance(tafsir_text, str):
                    all_tafsir.append({
                        "surah": int(surah_num),
                        "ayah": int(ayah_num),
                        "source": "kemenag",
                        "text": tafsir_text
                    })
            
            print(f"  ✓ Surah {surah_num} ({len(tafsir_texts)} ayat)")
        
        except Exception as e:
            print(f"  ✗ Surah {surah_num}: {e}")
    
    # Simpan ke file
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    output_file = OUTPUT_DIR / "kemenag.json"
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_tafsir, f, ensure_ascii=False, indent=2)
    
    print(f"\n[OK] Tersimpan: {output_file} ({len(all_tafsir)} entries)")
    return all_tafsir


def main():
    print("=" * 50)
    print("EKSTRAKSI TAFSIR DARI QURAN-JSON")
    print("=" * 50)
    print()
    
    if not SOURCE_DIR.exists():
        print("[ERROR] Folder temp-quran-data/surah tidak ditemukan!")
        print("        Jalankan: git clone https://github.com/rioastamal/quran-json.git temp-quran-data")
        return
    
    extract_tafsir()
    
    print()
    print("=" * 50)
    print("SELESAI")
    print("=" * 50)


if __name__ == "__main__":
    main()
