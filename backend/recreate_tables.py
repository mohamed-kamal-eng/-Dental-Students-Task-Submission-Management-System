from app.db import engine
from app.models import Base, Student, Assignment, Course, Announcement

def recreate_tables():
    try:
        print("Dropping existing tables...")
        
        # Drop existing tables
        Student.__table__.drop(engine, checkfirst=True)
        Assignment.__table__.drop(engine, checkfirst=True)
        Course.__table__.drop(engine, checkfirst=True)
        Announcement.__table__.drop(engine, checkfirst=True)
        
        print("Creating new tables...")
        
        # Create new tables with correct schema
        Student.__table__.create(engine, checkfirst=True)
        Assignment.__table__.create(engine, checkfirst=True)
        Course.__table__.create(engine, checkfirst=True)
        Announcement.__table__.create(engine, checkfirst=True)
        
        print("✓ All tables recreated successfully!")
        
    except Exception as e:
        print(f"Error recreating tables: {e}")

if __name__ == "__main__":
    recreate_tables()
