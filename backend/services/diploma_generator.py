from docx import Document
from docx.shared import Inches, Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH
import qrcode
import os
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


def reemplazar_en_runs(paragraph, marcador: str, valor: str):
    """Reemplaza marcadores dentro de runs individuales para mantener formato."""
    texto_completo = "".join(run.text for run in paragraph.runs)
    if marcador in texto_completo:
        # Limpiar todos los runs y poner el texto en el primero
        texto_nuevo = texto_completo.replace(marcador, valor)
        for i, run in enumerate(paragraph.runs):
            run.text = texto_nuevo if i == 0 else ""
        return True
    return False


def generar_diploma(data: dict, template_path: str, output_path: str) -> str:
    """
    Genera un diploma en formato Word a partir de una plantilla.
    
    Args:
        data: Diccionario con los datos del estudiante
        template_path: Ruta a la plantilla .docx
        output_path: Ruta donde se guardará el diploma generado
    
    Returns:
        Ruta del archivo generado
    
    Raises:
        FileNotFoundError: Si la plantilla no existe
        Exception: Si hay un error durante la generación
    """
    if not os.path.exists(template_path):
        raise FileNotFoundError(f"Plantilla no encontrada: {template_path}")

    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    qr_path = None

    try:
        doc = Document(template_path)

        # Formatear fecha en español
        meses = {
            1: "enero", 2: "febrero", 3: "marzo", 4: "abril",
            5: "mayo", 6: "junio", 7: "julio", 8: "agosto",
            9: "septiembre", 10: "octubre", 11: "noviembre", 12: "diciembre"
        }
        fecha = data.get("fecha")
        if hasattr(fecha, "day"):
            data["fecha_formato"] = f"{fecha.day} de {meses[fecha.month]} de {fecha.year}"
        else:
            data["fecha_formato"] = str(fecha)

        # Reemplazar marcadores en párrafos
        for paragraph in doc.paragraphs:
            for key, value in data.items():
                marcador = f"{{{{{key}}}}}"
                reemplazar_en_runs(paragraph, marcador, str(value))

        # Reemplazar marcadores en tablas (si las hay)
        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    for paragraph in cell.paragraphs:
                        for key, value in data.items():
                            marcador = f"{{{{{key}}}}}"
                            reemplazar_en_runs(paragraph, marcador, str(value))

        # Generar código QR
        qr_url = f"http://127.0.0.1:8000/validar/{data['dni']}"
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=10,
            border=4,
        )
        qr.add_data(qr_url)
        qr.make(fit=True)
        qr_img = qr.make_image(fill_color="black", back_color="white")

        qr_path = f"templates/qr_{data['dni']}.png"
        os.makedirs("templates", exist_ok=True)
        qr_img.save(qr_path)

        # Insertar QR al final del documento
        doc.add_paragraph()  # Espacio
        qr_paragraph = doc.add_paragraph()
        qr_paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = qr_paragraph.add_run()
        run.add_picture(qr_path, width=Inches(1.5))

        # Agregar texto bajo el QR
        caption = doc.add_paragraph("Escanea el código QR para validar este diploma")
        caption.alignment = WD_ALIGN_PARAGRAPH.CENTER
        caption.runs[0].font.size = Pt(8)

        doc.save(output_path)
        logger.info(f"Diploma generado: {output_path}")
        return output_path

    except Exception as e:
        logger.error(f"Error generando diploma para DNI {data.get('dni')}: {e}")
        raise

    finally:
        # Limpiar archivo temporal del QR
        if qr_path and os.path.exists(qr_path):
            os.remove(qr_path)
