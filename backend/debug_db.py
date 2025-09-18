import sqlite3
import os
from pathlib import Path

# Connect to the database
conn = sqlite3.connect('dentist.db')

# Check submissions table
print("=== SUBMISSIONS TABLE ===")
cursor = conn.execute("SELECT submission_id, original_filename, file_path, file_type FROM Submission ORDER BY submission_id DESC LIMIT 10")
submissions = cursor.fetchall()

for sub in submissions:
    print(f"ID: {sub[0]}, Original: {sub[1]}, Path: {sub[2]}, Type: {sub[3]}")
    
    # Check if file exists on disk
    if sub[2]:  # file_path
        file_name = Path(sub[2]).name
        disk_path = Path("uploads") / file_name
        exists = disk_path.is_file()
        print(f"  -> Disk path: {disk_path}, Exists: {exists}")
        if exists:
            size = disk_path.stat().st_size
            print(f"  -> File size: {size} bytes")
    print()

# List actual files in uploads directory
print("=== FILES IN UPLOADS DIRECTORY ===")
uploads_dir = Path("uploads")
if uploads_dir.exists():
    for file_path in uploads_dir.iterdir():
        if file_path.is_file():
            print(f"File: {file_path.name}, Size: {file_path.stat().st_size} bytes")
else:
    print("Uploads directory does not exist")

conn.close()
