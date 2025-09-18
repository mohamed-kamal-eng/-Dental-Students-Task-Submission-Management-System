import sqlite3

# Connect to the database
conn = sqlite3.connect('../database/dentist.db')

# Check users table
print("=== USERS TABLE ===")
cursor = conn.execute("SELECT id, username, email, role, full_name FROM users WHERE id = 456")
user_data = cursor.fetchone()
if user_data:
    print(f"User ID 456: {user_data}")
else:
    print("No user with ID 456 found")

# Check doctors table
print("\n=== DOCTORS TABLE ===")
cursor = conn.execute("SELECT * FROM doctors WHERE user_id = 456")
doctor_data = cursor.fetchone()
if doctor_data:
    print(f"Doctor record for user 456: {doctor_data}")
else:
    print("No doctor record for user 456")

# Show all doctors
print("\n=== ALL DOCTORS ===")
cursor = conn.execute("SELECT user_id, full_name, email FROM doctors")
all_doctors = cursor.fetchall()
for doc in all_doctors:
    print(f"Doctor: {doc}")

# If no doctor record exists for user 456, create one
if not doctor_data and user_data:
    print(f"\n=== CREATING DOCTOR RECORD ===")
    username = user_data[1]  # username from users table
    email = user_data[2]     # email from users table
    full_name = f"Dr. {username}"
    
    cursor = conn.execute("""
        INSERT INTO doctors (user_id, full_name, email, role, department_id) 
        VALUES (?, ?, ?, 'Doctor', 1)
    """, (456, full_name, email))
    conn.commit()
    print(f"Created doctor record: user_id=456, full_name='{full_name}', email='{email}'")

conn.close()
