from pathlib import Path
import shutil

# Simple fix: rename the problematic txt file to pdf
uploads_dir = Path("uploads")

# Find the txt file that contains PDF content
txt_file = uploads_dir / "cca54779f24d4cc4b781cf73fff02a2a_submission-1 (1).txt"

if txt_file.exists():
    # Check if it's actually PDF content
    with open(txt_file, 'rb') as f:
        header = f.read(4)
        if header == b'%PDF':
            # Rename to PDF
            pdf_file = txt_file.with_suffix('.pdf')
            shutil.move(str(txt_file), str(pdf_file))
            print(f"Renamed {txt_file.name} to {pdf_file.name}")
        else:
            print(f"File {txt_file.name} is not PDF content")
else:
    print("File not found")

# List all files after fix
print("\nFiles in uploads after fix:")
for f in uploads_dir.iterdir():
    if f.is_file():
        print(f"{f.name}: {f.stat().st_size} bytes")
