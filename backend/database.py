import os
import urllib.parse #
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

DB_USER     = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
# ESCAPAR la contraseña para que el '#' no rompa la URL
password_escapada = urllib.parse.quote_plus(DB_PASSWORD)
DB_HOST     = os.getenv("DB_HOST", "localhost")
DB_PORT     = os.getenv("DB_PORT", "6543") # Cambiado a 6543
DB_NAME     = os.getenv("DB_NAME", "postgres")


# Usar la contraseña escapada aquí
SQLALCHEMY_DATABASE_URL = (
    f"postgresql://{DB_USER}:{password_escapada}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

es_remoto = "supabase.com" in DB_HOST or "supabase.co" in DB_HOST

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,
    pool_size=3,
    max_overflow=5,
    # El SSL es obligatorio para Supabase desde fuera
    connect_args={"sslmode": "require"} if es_remoto else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()