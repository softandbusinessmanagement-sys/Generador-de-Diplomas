# Plan de acción y correcciones

## Implementado

1. Corregir la guía de instalación y uso para que coincida con Next.js 16 e incluya configuración de Supabase, creación del administrador, importación Excel y despliegue.
2. Ordenar archivos de soporte: plantilla DOCX en `templates/` y documentación de referencia en `docs/referencias/`.
3. Añadir plantilla Excel descargable con columnas y una fila de ejemplo.
4. Sustituir el tope fijo de 250 resultados por búsqueda de servidor y paginación de 25 resultados. Requiere aplicar la migración `20261012_admin_diplomas_search_pagination.sql`.
5. Mostrar los errores de filas que devuelve la carga masiva.
6. Quitar la opción de minificación antigua `swcMinify`; Next.js realiza la minificación de producción por defecto.
7. Fijar la ubicación de la plantilla DOCX en `templates/` para que el trazador de Next.js incluya solo ese recurso en las funciones.

## Para completar antes de desplegar

1. Aplicar las migraciones SQL pendientes en el proyecto Supabase y confirmar el bucket privado y sus políticas.
2. Configurar las variables de entorno de producción y verificar que la plantilla DOCX esté incluida en el despliegue.
3. Hacer una carga de prueba con una copia pequeña del Excel y revisar diplomas, archivos y verificación pública.

## Mejoras posteriores

- Añadir auditoría de cambios administrativos y una política de copias de seguridad.
- Considerar paginación por cursor si el volumen de datos crece mucho.
- Añadir límites de tamaño y cantidad de filas en carga masiva para proteger memoria y duración de funciones serverless.
