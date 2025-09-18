import requests
import sqlite3
from pathlib import Path

# Get a submission ID from database
conn = sqlite3.connect('dentist.db')
cursor = conn.execute('SELECT submission_id, original_filename, file_path FROM Submission LIMIT 1')
row = cursor.fetchone()
conn.close()

if row:
    submission_id, original_filename, file_path = row
    print(f"Testing submission {submission_id}: {original_filename} -> {file_path}")
    
    # Test the endpoint directly
    url = f"http://localhost:8000/submissions/{submission_id}/file"
    print(f"Testing URL: {url}")
    
    try:
        # Test without auth first to see the error
        response = requests.get(url)
        print(f"Status: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        
        if response.status_code == 401:
            print("Need authentication - this is expected")
        elif response.status_code == 200:
            print(f"Content length: {len(response.content)}")
            print(f"First 20 bytes: {response.content[:20]}")
            
            # Save to file to test
            with open('test_download.pdf', 'wb') as f:
                f.write(response.content)
            print("Saved as test_download.pdf")
        else:
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"Request failed: {e}")
else:
    print("No submissions found in database")
