#!/usr/bin/env python3
"""
Script to download intfloat/multilingual-e5-small ONNX int8 quantized model files.
Uses Xenova/multilingual-e5-small which provides pre-built ONNX files.

Model: Xenova/multilingual-e5-small (intfloat/multilingual-e5-small ONNX export)
Embedding dimension: 384
License: MIT
Source: https://huggingface.co/Xenova/multilingual-e5-small
"""

import os
import sys
import urllib.request
import hashlib

# Files to download from Xenova/multilingual-e5-small
# Using onnx/model_quantized.onnx (int8 quantized, ~130MB)
BASE_URL = "https://huggingface.co/Xenova/multilingual-e5-small/resolve/main"

TARGET_DIR = os.path.join(os.path.dirname(__file__), "multilingual-e5-small-onnx-int8")
os.makedirs(TARGET_DIR, exist_ok=True)

FILES_TO_DOWNLOAD = [
    ("onnx/model_quantized.onnx", "model.onnx"),
    ("tokenizer.json", "tokenizer.json"),
    ("tokenizer_config.json", "tokenizer_config.json"),
    ("special_tokens_map.json", "special_tokens_map.json"),
    ("sentencepiece.bpe.model", "sentencepiece.bpe.model"),
    ("config.json", "config.json"),
]

def download_file(url, dest_path):
    if os.path.exists(dest_path):
        print(f"  [SKIP] Already exists: {os.path.basename(dest_path)}")
        return True
    print(f"  [DOWNLOAD] {os.path.basename(dest_path)} from {url}")
    try:
        headers = {"User-Agent": "Mozilla/5.0"}
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as response, open(dest_path, "wb") as out_file:
            total = int(response.headers.get("Content-Length", 0))
            downloaded = 0
            chunk = 1024 * 1024
            while True:
                data = response.read(chunk)
                if not data:
                    break
                out_file.write(data)
                downloaded += len(data)
                if total > 0:
                    pct = downloaded * 100 // total
                    print(f"\r  {pct}% ({downloaded // (1024*1024)} MB / {total // (1024*1024)} MB)", end="", flush=True)
        print()
        return True
    except Exception as e:
        print(f"\n  [ERROR] Failed to download {url}: {e}")
        if os.path.exists(dest_path):
            os.remove(dest_path)
        return False

def main():
    print("=== EDMS Phase 12: Download multilingual-e5-small ONNX int8 model ===")
    print(f"Target dir: {TARGET_DIR}")
    print()
    
    success = True
    for src_name, dst_name in FILES_TO_DOWNLOAD:
        url = f"{BASE_URL}/{src_name}"
        dest = os.path.join(TARGET_DIR, dst_name)
        if not download_file(url, dest):
            success = False
    
    if success:
        model_path = os.path.join(TARGET_DIR, "model.onnx")
        size_mb = os.path.getsize(model_path) / (1024 * 1024)
        print(f"\n[OK] Download complete. model.onnx size: {size_mb:.1f} MB")
        
        # Write model info
        info_path = os.path.join(TARGET_DIR, "MODEL_INFO.txt")
        with open(info_path, "w") as f:
            f.write("EDMS Phase 12 - Local Embedding Model\n")
            f.write("=====================================\n")
            f.write("Source: Xenova/multilingual-e5-small (HuggingFace)\n")
            f.write("Base model: intfloat/multilingual-e5-small\n")
            f.write("Format: ONNX int8 quantized\n")
            f.write("Embedding dimension: 384\n")
            f.write("Languages: 100 (including Vietnamese and English)\n")
            f.write("License: MIT\n")
            f.write(f"model.onnx size: {size_mb:.1f} MB\n")
            f.write("Input prefix: 'query: ' for queries, 'passage: ' for documents\n")
            f.write("Model ID: multilingual-e5-small-onnx-int8-v1\n")
        print(f"[OK] Model info written to {info_path}")
    else:
        print("\n[FAIL] Some downloads failed. Check internet connection and retry.")
        sys.exit(1)

if __name__ == "__main__":
    main()
