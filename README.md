# 🎓 DiplomasWeb — Sistema de Gestión de Titulación v2.0

Sistema web para automatizar el proceso de titulación universitaria: registro de estudiantes, generación de diplomas en Word con código QR y panel de administración.

---

## 📁 Estructura del Proyecto

```
DiplomasWeb/
├── backend/
│   ├── __init__.py
│   ├── main.py              # FastAPI: todos los endpoints
│   ├── database.py          # Conexión a PostgreSQL (variables de entorno)
│   ├── models.py            # Modelos SQLAlchemy
│   ├── schemas.py           # Validaciones Pydantic estrictas
│   └── services/
│       ├── __init__.py
│       └── diploma_generator.py  # Generación de diplomas + QR
│
├── frontend/
│   ├── index.html           # Formulario de registro
│   ├── admin.html           # Panel administrativo ← NUEVO
│   ├── css/
│   │   └── styles.css       # Estilos modernos
│   └── js/
│       └── script.js        # Validación + llamadas al API
│
├── templates/
│   └── diploma_template.docx  # Plantilla Word con marcadores {{campo}}
│
├── diplomas_generados/      # Carpeta donde se guardan los diplomas (auto-creada)
├── .env                     # Variables de entorno (NO subir al repo)
├── .env.example             # Ejemplo de configuración
├── requirements.txt
└── README.md
```

---

## ⚙️ Instalación

### 1. Clonar y configurar el entorno

```bash
cd DiplomasWeb
python -m venv venv

# Windows
venv\Scripts\activate

# Linux / macOS
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Configurar variables de entorno

```bash
# Copia el archivo de ejemplo
copy .env.example .env      # Windows
cp .env.example .env        # Linux/macOS

# Edita .env con tus datos de PostgreSQL
```

Contenido del `.env`:
```env
DB_USER=postgres
DB_PASSWORD=tu_contraseña_real
DB_HOST=localhost
DB_PORT=5432
DB_NAME=diplomas
ALLOWED_ORIGINS=http://localhost:5500,http://127.0.0.1:5500
```

### 3. Crear la base de datos en PostgreSQL

```sql
CREATE DATABASE diplomas;
```

Las tablas se crean automáticamente al iniciar el servidor.

### 4. Iniciar el servidor

```bash
# Desde la raíz del proyecto
uvicorn backend.main:app --reload
```

El servidor estará en: `http://127.0.0.1:8000`  
Documentación automática: `http://127.0.0.1:8000/docs`

### 5. Abrir el frontend

Abre `frontend/index.html` en tu navegador (o usa Live Server en VS Code).

---

## 🌐 Endpoints del API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/` | Estado del servidor |
| POST | `/generar-diploma` | Registra y genera un diploma |
| GET | `/validar/{dni}` | Valida un diploma por DNI (usado por QR) |
| GET | `/admin/diplomas` | Lista todos los diplomas (con búsqueda) |
| GET | `/admin/diplomas/{id}` | Obtiene un diploma por ID |
| DELETE | `/admin/diplomas/{id}` | Elimina un diploma |
| GET | `/admin/estadisticas` | Estadísticas generales |
| GET | `/admin/descargar/{dni}` | Descarga el archivo .docx |

---

## 📄 Plantilla del Diploma

La plantilla `templates/diploma_template.docx` usa los siguientes marcadores:

| Marcador | Descripción |
|----------|-------------|
| `{{nombre}}` | Nombre(s) del estudiante |
| `{{apellidos}}` | Apellidos del estudiante |
| `{{dni}}` | DNI del estudiante |
| `{{carrera}}` | Carrera profesional |
| `{{modalidad}}` | Tesis o TSP |
| `{{titulo_trabajo}}` | Título del trabajo de titulación |
| `{{asesor}}` | Nombre del asesor |
| `{{fecha}}` | Fecha en formato original |
| `{{fecha_formato}}` | Fecha formateada en español (ej: 15 de junio de 2025) |

---

## ✅ Mejoras en v2.0

- **Seguridad:** Credenciales DB via variables de entorno, CORS configurable
- **Validación estricta:** DNI de 8 dígitos, solo letras en nombres, modalidad verificada
- **Manejo de errores:** Respuestas claras para duplicados (409), validación (422) y errores internos (500)
- **Panel Admin:** Listar, buscar, descargar y eliminar diplomas
- **Validación QR:** Endpoint `/validar/{dni}` para escaneo de código QR
- **Generación mejorada:** Reemplaza marcadores en runs individuales (respeta formato Word)
- **Fecha en español:** Marcador `{{fecha_formato}}` disponible en plantilla
- **Descarga directa:** Botón de descarga del diploma desde el frontend
- **Frontend profesional:** Validación en tiempo real, diseño moderno, feedback visual

---

## 🔮 Próximos Pasos

- [ ] Autenticación JWT para el panel administrativo
- [ ] Subir diplomas a Supabase Storage (nube)
- [ ] Generación masiva desde Excel
- [ ] Exportar listado de diplomas a Excel/PDF
