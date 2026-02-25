from pydantic import BaseModel, Field, validator
from datetime import date
from typing import Optional
import re


class TitulacionCreate(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=100, description="Nombre del estudiante")
    apellidos: str = Field(..., min_length=2, max_length=100, description="Apellidos del estudiante")
    dni: str = Field(..., description="DNI del estudiante (8 dígitos)")
    carrera: str = Field(..., min_length=3, max_length=100, description="Carrera universitaria")
    modalidad: str = Field(..., description="Modalidad de titulación")
    titulo_trabajo: str = Field(..., min_length=10, max_length=500, description="Título del trabajo")
    asesor: str = Field(..., min_length=5, max_length=100, description="Nombre del asesor")
    fecha: date = Field(..., description="Fecha de titulación")

    @validator("dni")
    def validar_dni(cls, v):
        if not re.match(r"^\d{8}$", v):
            raise ValueError("El DNI debe tener exactamente 8 dígitos numéricos")
        return v

    @validator("modalidad")
    def validar_modalidad(cls, v):
        opciones_validas = ["Tesis", "TSP"]
        if v not in opciones_validas:
            raise ValueError(f"La modalidad debe ser una de: {', '.join(opciones_validas)}")
        return v

    @validator("nombre", "apellidos", "asesor")
    def validar_solo_letras(cls, v):
        if not re.match(r"^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$", v):
            raise ValueError("Solo se permiten letras y espacios")
        return v.strip()

    class Config:
        json_schema_extra = {
            "example": {
                "nombre": "Juan Carlos",
                "apellidos": "García López",
                "dni": "12345678",
                "carrera": "Ingeniería de Sistemas",
                "modalidad": "Tesis",
                "titulo_trabajo": "Sistema de Gestión de Titulación con IA",
                "asesor": "Dr. María Pérez Torres",
                "fecha": "2025-06-15"
            }
        }


class TitulacionResponse(BaseModel):
    id: int
    nombre: str
    apellidos: str
    dni: str
    carrera: str
    modalidad: str
    titulo_trabajo: str
    asesor: str
    fecha: date
    ruta_documento: Optional[str] = None
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)
