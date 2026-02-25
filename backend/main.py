import os
import logging
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Depends, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import desc

from . import models, schemas
from .database import SessionLocal, engine
from .services.diploma_generator import generar_diploma

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Crear tablas
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Sistema de Gestión de Titulación",
    description="API para gestión de diplomas universitarios",
    version="2.0.0"
)

# CORS - En producción reemplaza "*" con tu dominio real
ALLOWED_ORIGINS = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Servir archivos estáticos (diplomas generados)
os.makedirs("diplomas_generados", exist_ok=True)
app.mount("/diplomas", StaticFiles(directory="diplomas_generados"), name="diplomas")


# ─── Dependency ───────────────────────────────────────────────────────────────

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ─── Manejador global de errores ──────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Error no manejado: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Error interno del servidor. Por favor contacta al administrador."}
    )


# ─── Endpoints Principales ────────────────────────────────────────────────────

@app.get("/", tags=["General"])
async def root():
    return {
        "sistema": "Sistema de Gestión de Titulación",
        "version": "2.0.0",
        "estado": "activo",
        "docs": "/docs"
    }


@app.post("/generar-diploma", response_model=dict, tags=["Diplomas"])
async def crear_diploma(data: schemas.TitulacionCreate, db: Session = Depends(get_db)):
    """
    Genera un diploma para un estudiante y lo guarda en la base de datos.
    """
    # Verificar si el DNI ya existe
    existente = db.query(models.Titulacion).filter(models.Titulacion.dni == data.dni).first()
    if existente:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Ya existe un diploma registrado para el DNI {data.dni}"
        )

    try:
        # Guardar en base de datos
        db_titulacion = models.Titulacion(
            nombre=data.nombre,
            apellidos=data.apellidos,
            dni=data.dni,
            carrera=data.carrera,
            modalidad=data.modalidad,
            titulo_trabajo=data.titulo_trabajo,
            asesor=data.asesor,
            fecha=data.fecha
        )
        db.add(db_titulacion)
        db.commit()
        db.refresh(db_titulacion)

        # Generar el diploma
        os.makedirs("diplomas_generados", exist_ok=True)
        output_path = f"diplomas_generados/diploma_{data.dni}.docx"
        generar_diploma(data.dict(), "templates/diploma_template.docx", output_path)

        # Actualizar ruta del documento
        db_titulacion.ruta_documento = output_path
        db.commit()

        logger.info(f"Diploma generado para DNI: {data.dni}")

        return {
            "mensaje": f"Diploma generado exitosamente para {data.nombre} {data.apellidos}",
            "dni": data.dni,
            "ruta_diploma": f"/diplomas/diploma_{data.dni}.docx",
            "id": db_titulacion.id
        }

    except FileNotFoundError as e:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        db.rollback()
        logger.error(f"Error generando diploma: {e}")
        raise HTTPException(status_code=500, detail=f"Error al generar el diploma: {str(e)}")


@app.get("/validar/{dni}", tags=["Validación"])
async def validar_diploma(dni: str, db: Session = Depends(get_db)):
    """
    Valida un diploma mediante el DNI. Este endpoint es escaneado por el código QR.
    """
    import re
    if not re.match(r"^\d{8}$", dni):
        raise HTTPException(status_code=400, detail="DNI inválido")

    titulacion = db.query(models.Titulacion).filter(models.Titulacion.dni == dni).first()

    if not titulacion:
        raise HTTPException(
            status_code=404,
            detail="No se encontró ningún diploma registrado para este DNI"
        )

    return {
        "valido": True,
        "nombre_completo": f"{titulacion.nombre} {titulacion.apellidos}",
        "dni": titulacion.dni,
        "carrera": titulacion.carrera,
        "modalidad": titulacion.modalidad,
        "titulo_trabajo": titulacion.titulo_trabajo,
        "asesor": titulacion.asesor,
        "fecha": str(titulacion.fecha),
        "fecha_registro": str(titulacion.created_at) if titulacion.created_at else None,
        "mensaje": "✅ Este diploma es AUTÉNTICO y ha sido verificado por el sistema."
    }


# ─── Endpoints Administrativos ────────────────────────────────────────────────

@app.get("/admin/diplomas", response_model=List[schemas.TitulacionResponse], tags=["Admin"])
async def listar_diplomas(
    skip: int = 0,
    limit: int = 50,
    buscar: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Lista todos los diplomas registrados. Soporta búsqueda por nombre, apellidos o DNI.
    """
    query = db.query(models.Titulacion)

    if buscar:
        buscar_lower = f"%{buscar.lower()}%"
        query = query.filter(
            models.Titulacion.nombre.ilike(buscar_lower) |
            models.Titulacion.apellidos.ilike(buscar_lower) |
            models.Titulacion.dni.ilike(buscar_lower) |
            models.Titulacion.carrera.ilike(buscar_lower)
        )

    diplomas = query.order_by(desc(models.Titulacion.created_at)).offset(skip).limit(limit).all()
    return diplomas


@app.get("/admin/diplomas/{id}", response_model=schemas.TitulacionResponse, tags=["Admin"])
async def obtener_diploma(id: int, db: Session = Depends(get_db)):
    """Obtiene los detalles de un diploma específico por ID."""
    diploma = db.query(models.Titulacion).filter(models.Titulacion.id == id).first()
    if not diploma:
        raise HTTPException(status_code=404, detail="Diploma no encontrado")
    return diploma


@app.delete("/admin/diplomas/{id}", tags=["Admin"])
async def eliminar_diploma(id: int, db: Session = Depends(get_db)):
    """Elimina un diploma de la base de datos y su archivo asociado."""
    diploma = db.query(models.Titulacion).filter(models.Titulacion.id == id).first()
    if not diploma:
        raise HTTPException(status_code=404, detail="Diploma no encontrado")

    # Eliminar archivo si existe
    if diploma.ruta_documento and os.path.exists(diploma.ruta_documento):
        os.remove(diploma.ruta_documento)

    db.delete(diploma)
    db.commit()

    return {"mensaje": f"Diploma de {diploma.nombre} {diploma.apellidos} eliminado correctamente"}


@app.get("/admin/estadisticas", tags=["Admin"])
async def obtener_estadisticas(db: Session = Depends(get_db)):
    """Retorna estadísticas generales del sistema."""
    total = db.query(models.Titulacion).count()
    tesis = db.query(models.Titulacion).filter(models.Titulacion.modalidad == "Tesis").count()
    tsp = db.query(models.Titulacion).filter(models.Titulacion.modalidad == "TSP").count()

    return {
        "total_diplomas": total,
        "por_modalidad": {
            "Tesis": tesis,
            "TSP": tsp
        }
    }


@app.get("/admin/descargar/{dni}", tags=["Admin"])
async def descargar_diploma(dni: str, db: Session = Depends(get_db)):
    """Descarga el archivo .docx de un diploma."""
    titulacion = db.query(models.Titulacion).filter(models.Titulacion.dni == dni).first()
    if not titulacion:
        raise HTTPException(status_code=404, detail="Diploma no encontrado")

    if not titulacion.ruta_documento or not os.path.exists(titulacion.ruta_documento):
        raise HTTPException(status_code=404, detail="Archivo del diploma no encontrado")

    return FileResponse(
        path=titulacion.ruta_documento,
        filename=f"diploma_{titulacion.nombre}_{titulacion.apellidos}.docx",
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )
