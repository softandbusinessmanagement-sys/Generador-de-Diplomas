const API_URL = "http://127.0.0.1:8000";

// ─── Validaciones del lado cliente ────────────────────────────────────────────

const validaciones = {
    nombre:        (v) => /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,100}$/.test(v.trim()) || "Solo letras, mínimo 2 caracteres",
    apellidos:     (v) => /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,100}$/.test(v.trim()) || "Solo letras, mínimo 2 caracteres",
    dni:           (v) => /^\d{8}$/.test(v)                                   || "El DNI debe tener exactamente 8 dígitos",
    carrera:       (v) => v.trim().length >= 3                                 || "La carrera debe tener al menos 3 caracteres",
    modalidad:     (v) => ["Tesis", "TSP"].includes(v)                         || "Selecciona una modalidad válida",
    titulo_trabajo:(v) => v.trim().length >= 10                                || "El título debe tener al menos 10 caracteres",
    asesor:        (v) => /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\.]{5,100}$/.test(v.trim()) || "Solo letras, mínimo 5 caracteres",
    fecha:         (v) => v !== ""                                             || "Selecciona una fecha"
};

function validarCampo(nombre, valor) {
    const resultado = validaciones[nombre](valor);
    return resultado === true ? null : resultado;
}

function mostrarError(campo, mensaje) {
    const input = document.getElementById(campo);
    const errEl = document.getElementById(`err-${campo}`);
    if (input) input.classList.add("invalid");
    if (errEl) errEl.textContent = mensaje;
}

function limpiarError(campo) {
    const input = document.getElementById(campo);
    const errEl = document.getElementById(`err-${campo}`);
    if (input) input.classList.remove("invalid");
    if (errEl) errEl.textContent = "";
}

function validarFormulario(data) {
    let valido = true;
    Object.keys(validaciones).forEach((campo) => {
        const error = validarCampo(campo, data[campo] || "");
        if (error) {
            mostrarError(campo, error);
            valido = false;
        } else {
            limpiarError(campo);
        }
    });
    return valido;
}

// ─── Validación en tiempo real ────────────────────────────────────────────────

document.querySelectorAll("input, select").forEach((el) => {
    el.addEventListener("blur", () => {
        if (el.name && validaciones[el.name]) {
            const error = validarCampo(el.name, el.value);
            if (error) mostrarError(el.name, error);
            else limpiarError(el.name);
        }
    });

    el.addEventListener("input", () => {
        if (el.classList.contains("invalid")) {
            const error = validarCampo(el.name, el.value);
            if (!error) limpiarError(el.name);
        }
    });
});

// ─── Mostrar alertas ──────────────────────────────────────────────────────────

function mostrarAlerta(tipo, html) {
    const box = document.getElementById("alertBox");
    box.className = `alert-box ${tipo}`;
    box.innerHTML = html;
    box.style.display = "block";
    box.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function ocultarAlerta() {
    const box = document.getElementById("alertBox");
    box.style.display = "none";
}

// ─── Submit del formulario ────────────────────────────────────────────────────

document.getElementById("formTitulacion").addEventListener("submit", async (e) => {
    e.preventDefault();
    ocultarAlerta();

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    // Validar antes de enviar
    if (!validarFormulario(data)) {
        mostrarAlerta("error", "⚠️ Por favor corrige los errores señalados en el formulario.");
        return;
    }

    const btn = document.getElementById("btnSubmit");
    const btnText = btn.querySelector(".btn-text");
    const btnIcon = btn.querySelector(".btn-icon");
    const btnSpinner = btn.querySelector(".btn-spinner");

    // Estado de carga
    btn.disabled = true;
    btnText.textContent = "Generando diploma...";
    btnIcon.style.display = "none";
    btnSpinner.style.display = "inline";

    try {
        const response = await fetch(`${API_URL}/generar-diploma`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (response.ok) {
            mostrarAlerta("success", `
                ✅ <strong>${result.mensaje}</strong><br>
                El diploma ha sido generado con éxito.<br>
                <a href="${API_URL}/admin/descargar/${result.dni}" 
                   class="download-link" 
                   target="_blank">
                    📄 Descargar Diploma (.docx)
                </a>
            `);
            e.target.reset();
            Object.keys(validaciones).forEach(limpiarError);

        } else {
            // Error del servidor (409 = duplicado, 422 = validación, 500 = interno)
            let mensajeError = result.detail || "Error al generar el diploma";
            if (response.status === 409) {
                mensajeError = `⚠️ ${mensajeError}`;
            } else if (response.status === 422) {
                // Errores de validación de Pydantic
                const errores = Array.isArray(result.detail)
                    ? result.detail.map(e => e.msg).join(", ")
                    : mensajeError;
                mensajeError = `❌ Error de validación: ${errores}`;
            } else {
                mensajeError = `❌ ${mensajeError}`;
            }
            mostrarAlerta("error", mensajeError);
        }

    } catch (error) {
        console.error("Error de red:", error);
        mostrarAlerta("error", "❌ No se pudo conectar con el servidor. Verifica que el backend esté corriendo en <strong>http://127.0.0.1:8000</strong>");
    } finally {
        btn.disabled = false;
        btnText.textContent = "Generar Diploma";
        btnIcon.style.display = "inline";
        btnSpinner.style.display = "none";
    }
});
