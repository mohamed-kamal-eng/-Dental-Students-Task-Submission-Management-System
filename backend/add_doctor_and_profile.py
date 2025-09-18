import sqlite3
from datetime import datetime
import hashlib

DB_PATH = "backend/database/dentist.db"

USERNAME = "doctor1"
EMAIL = "doctor1@example.com"
PASSWORD = "password123"
ROLE = "doctor"
DEPARTMENT_ID = 1  # Change if needed
FULL_NAME = "Doctor One"

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Check if user already exists
cursor.execute("SELECT id FROM users WHERE username=?;", (USERNAME,))
user = cursor.fetchone()
if user:
    user_id = user[0]
    print(f"User '{USERNAME}' already exists with id {user_id}.")
else:
    # Create user
    password_hash = hashlib.sha256(PASSWORD.encode()).hexdigest()
    now = datetime.now().isoformat(sep=' ', timespec='seconds')
    cursor.execute("""
    INSERT INTO users (username, email, password_hash, role, created_at)
    VALUES (?, ?, ?, ?, ?)
    """, (USERNAME, EMAIL, password_hash, ROLE, now))
    conn.commit()
    user_id = cursor.lastrowid
    print(f"User '{USERNAME}' created with id {user_id}.")

# Check if doctor profile already exists
cursor.execute("SELECT doctor_id FROM Doctor WHERE user_id=?;", (user_id,))
doctor = cursor.fetchone()
if doctor:
    print(f"Doctor profile already exists for user_id {user_id}.")
else:
    now = datetime.now().isoformat(sep=' ', timespec='seconds')
    cursor.execute("""
    INSERT INTO Doctor (full_name, email, role, department_id, created_at, user_id)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (FULL_NAME, EMAIL, "Lecturer", DEPARTMENT_ID, now, user_id))
    conn.commit()
    print(f"Doctor profile created for user_id {user_id} ({FULL_NAME})")

conn.close()
