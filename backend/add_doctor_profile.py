import sqlite3
from datetime import datetime

DB_PATH = "backend/database/dentist.db"

# Update these values as needed
USER_ID = None  # Will be auto-detected
DEPARTMENT_ID = 1  # Change if needed
FULL_NAME = "Doctor Name"  # Change if needed
EMAIL = "doctor@example.com"  # Change if needed
ROLE = "Lecturer"

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Find the first doctor user
cursor.execute("SELECT id, username, email FROM users WHERE role='doctor' LIMIT 1;")
user = cursor.fetchone()
if not user:
    print("No doctor user found in users table.")
    exit(1)
USER_ID = user[0]
FULL_NAME = user[1]
EMAIL = user[2]

# Check if doctor profile already exists
cursor.execute("SELECT doctor_id FROM Doctor WHERE user_id=?;", (USER_ID,))
if cursor.fetchone():
    print("Doctor profile already exists for user_id", USER_ID)
    exit(0)

# Insert doctor profile
now = datetime.now().isoformat(sep=' ', timespec='seconds')
cursor.execute("""
INSERT INTO Doctor (full_name, email, role, department_id, created_at, user_id)
VALUES (?, ?, ?, ?, ?, ?)
""", (FULL_NAME, EMAIL, ROLE, DEPARTMENT_ID, now, USER_ID))
conn.commit()
print(f"Doctor profile created for user_id {USER_ID} ({FULL_NAME})")
conn.close()
