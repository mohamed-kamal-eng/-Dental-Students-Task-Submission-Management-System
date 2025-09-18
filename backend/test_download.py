import requests
import sqlite3
from pathlib import Path

# First, let's check what's in the database
print("=== DATABASE INSPECTION ===")
conn = sqlite3.connect('dentist.db')
cursor = conn.execute("""
    SELECT submission_id, original_filename, file_path, file_type 
    FROM Submission 
    ORDER BY submission_id DESC 
    LIMIT 5
""")
submissions = cursor.fetchall()

for sub in submissions:
    print(f"ID: {sub[0]}")
    print(f"  Original filename: {sub[1]}")
    print(f"  File path: {sub[2]}")
    print(f"  File type: {sub[3]}")
    
    # Check if file exists on disk
    if sub[2]:
        # Try different path resolutions
        file_name = Path(sub[2]).name
        disk_path = Path("uploads") / file_name
        print(f"  Resolved disk path: {disk_path}")
        print(f"  File exists: {disk_path.exists()}")
        
        if disk_path.exists():
            size = disk_path.stat().st_size
            print(f"  File size: {size} bytes")
            
            # Check file content type by reading first few bytes
            with open(disk_path, 'rb') as f:
                first_bytes = f.read(10)
                print(f"  First 10 bytes: {first_bytes}")
                
                # Check if it's a PDF
                f.seek(0)
                header = f.read(4)
                if header == b'%PDF':
                    print("  -> This is a PDF file")
                elif header.startswith(b'\x89PNG'):
                    print("  -> This is a PNG file")
                elif header.startswith(b'\xff\xd8\xff'):
                    print("  -> This is a JPEG file")
                else:
                    print(f"  -> Unknown file type, header: {header}")
    print()

conn.close()

# Now test the API endpoint directly
print("=== API ENDPOINT TEST ===")
if submissions:
    test_id = submissions[0][0]  # Use first submission ID
    print(f"Testing download for submission ID: {test_id}")
    
    try:
        # Test without authentication first
        response = requests.get(f"http://localhost:8000/submissions/{test_id}/file")
        print(f"Response status: {response.status_code}")
        print(f"Response headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            print(f"Content length: {len(response.content)} bytes")
            print(f"First 20 bytes: {response.content[:20]}")
        else:
            print(f"Error response: {response.text}")
            
    except Exception as e:
        print(f"Request failed: {e}")
