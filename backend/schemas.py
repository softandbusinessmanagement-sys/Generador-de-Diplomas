from pydantic import BaseModel, Field, validator
from datetime import date, datetime
from typing import Optional
import re



class TitulacionCreate(BaseModel):
    numero_resolucion: Optional[str] = Field(None, max_length=100)
    nombre: str = Field(..., min_length=2, max_length=100)
    apellidos: str = Field(..., min_length=2, max_length=100)
    dni: str = Field(..., description="8 dígitos")
    carrera: str = Field(..., min_length=3, max_length=100)
    modalidad: str = Field(...)
    titulo_trabajo: str = Field(..., min_length=10, max_length=500)
    asesor: str = Field(..., min_length=3, max_length=150)
    fecha: date = Field(...)

    @validator("dni")
    def validar_dni(cls, v):
        if not re.match(r"^\d{8}$", v):
            raise ValueError("El DNI debe tener exactamente 8 dígitos")
        return v

    @validator("modalidad")
    def validar_modalidad(cls, v):
        if v not in ["Tesis", "TSP"]:
            raise ValueError("Modalidad debe ser Tesis o TSP")
        return v

    @validator("nombre", "apellidos")
    def validar_letras(cls, v):
        if not re.match(r"^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s']+$", v):
            raise ValueError("Solo letras y espacios")
        return v.strip()

    @validator("asesor")
    def validar_asesor(cls, v):
        # Permite Dr., Ma., Ing., Lic. y otros títulos con punto
        if not re.match(r"^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\.,]+$", v):
            raise ValueError("Solo letras, espacios y puntos")
        return v.strip()


class TitulacionUpdate(BaseModel):
    numero_resolucion: Optional[str] = Field(None, max_length=100)
    nombre: Optional[str] = Field(None, min_length=2, max_length=100)
    apellidos: Optional[str] = Field(None, min_length=2, max_length=100)
    carrera: Optional[str] = Field(None, min_length=3, max_length=100)
    modalidad: Optional[str] = None
    titulo_trabajo: Optional[str] = Field(None, min_length=10, max_length=500)
    asesor: Optional[str] = Field(None, min_length=3, max_length=150)
    fecha: Optional[date] = None

    @validator("asesor")
    def validar_asesor(cls, v):
        if v and not re.match(r"^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\.,]+$", v):
            raise ValueError("Solo letras, espacios y puntos")
        return v.strip() if v else v


class TitulacionResponse(BaseModel):
    id: int
    numero_resolucion: Optional[str] = None
    nombre: str
    apellidos: str
    dni: str
    carrera: str
    modalidad: str
    titulo_trabajo: str
    asesor: str
    fecha: date
    ruta_documento: Optional[str] = None
    ruta_pdf: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        json_encoders = {datetime: lambda v: v.isoformat() if v else None}