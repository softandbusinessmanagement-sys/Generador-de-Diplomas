from sqlalchemy import Column, Integer, String, Date, Text, DateTime
from sqlalchemy.sql import func
from .database import Base


class Titulacion(Base):
    __tablename__ = "titulaciones"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    apellidos = Column(String(100), nullable=False)
    dni = Column(String(15), unique=True, nullable=False, index=True)
    carrera = Column(String(100), nullable=False)
    modalidad = Column(String(50), nullable=False)
    titulo_trabajo = Column(Text, nullable=False)
    asesor = Column(String(100), nullable=False)
    fecha = Column(Date, nullable=False, index=True)
    ruta_documento = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    rol = Column(String(20), default="admin")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
