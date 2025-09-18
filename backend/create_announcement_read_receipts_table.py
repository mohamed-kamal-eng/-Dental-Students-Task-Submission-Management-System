#!/usr/bin/env python3
"""
Migration script to create AnnouncementReadReceipt table
Run this script to add the read tracking functionality for announcements
"""

import sqlite3
import os
from pathlib import Path

def create_announcement_read_receipts_table():
    # Get the database path
    db_path = Path(__file__).parent.parent / "database" / "dentist.db"
    
    if not db_path.exists():
        print(f"Database not found at {db_path}")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Create the AnnouncementReadReceipt table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS AnnouncementReadReceipt (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                announcement_id INTEGER NOT NULL,
                student_id INTEGER NOT NULL,
                read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (announcement_id) REFERENCES Announcement (id) ON DELETE CASCADE,
                FOREIGN KEY (student_id) REFERENCES Student (student_id) ON DELETE CASCADE,
                UNIQUE(announcement_id, student_id)
            )
        """)
        
        # Create indexes for better performance
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_announcement_read_receipt_announcement_id 
            ON AnnouncementReadReceipt(announcement_id)
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_announcement_read_receipt_student_id 
            ON AnnouncementReadReceipt(student_id)
        """)
        
        conn.commit()
        print("✅ AnnouncementReadReceipt table created successfully!")
        print("✅ Indexes created successfully!")
        
        # Verify the table was created
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='AnnouncementReadReceipt'")
        if cursor.fetchone():
            print("✅ Table verification passed!")
        else:
            print("❌ Table verification failed!")
            return False
            
        return True
        
    except sqlite3.Error as e:
        print(f"❌ Database error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    print("Creating AnnouncementReadReceipt table...")
    success = create_announcement_read_receipts_table()
    if success:
        print("\n🎉 Migration completed successfully!")
        print("The notification read tracking system is now ready to use.")
    else:
        print("\n💥 Migration failed!")
        print("Please check the error messages above and try again.")
