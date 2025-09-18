
from app.db import Base, engine
from app.models import Doctor  # Ensure Doctor model is registered
import app.models  # register all models
Base.metadata.create_all(bind=engine)
print("DB initialized:", engine.url)
