const API_URL = "http://127.0.0.1:8000";

const validaciones = {
    nombre:        (v) => /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s']{2,100}$/.test(v.trim()) || "Solo letras, mínimo 2 caracteres",
    apellidos:     (v) => /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s']{2,100}$/.test(v.trim()) || "Solo letras, mínimo 2 caracteres",
    dni:           (v) => /^\d{8}$/.test(v) || "El DNI debe tener exactamente 8 dígitos",
    carrera:       (v) => v.trim().length >= 3 || "Mínimo 3 caracteres",
    modalidad:     (v) => ["Tesis","TSP"].includes(v) || "Selecciona una modalidad válida",
    titulo_trabajo:(v) => v.trim().length >= 10 || "El título debe tener al menos 10 caracteres",
    asesor:        (v) => /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\.,]{3,150}$/.test(v.trim()) || "Solo letras, espacios y puntos (Dr., Ma., Ing.)",
    fecha:         (v) => v !== "" || "Selecciona una fecha"
};

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
        const error = validaciones[campo](data[campo] || "");
        if (error !== true) { mostrarError(campo, error); valido = false; }
        else limpiarError(campo);
    });
    return valido;
}

// Validación en tiempo real
document.querySelectorAll("input, select").forEach((el) => {
    el.addEventListener("blur", () => {
        if (el.name && validaciones[el.name]) {
            const error = validaciones[el.name](el.value);
            if (error !== true) mostrarError(el.name, error);
            else limpiarError(el.name);
        }
    });
    el.addEventListener("input", () => {
        if (el.classList.contains("invalid") && el.name && validaciones[el.name]) {
            if (validaciones[el.name](el.value) === true) limpiarError(el.name);
        }
    });
});

function mostrarAlerta(tipo, html) {
    const box = document.getElementById("alertBox");
    box.className = `alert-box ${tipo}`;
    box.innerHTML = html;
    box.style.display = "block";
    box.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

document.getElementById("formTitulacion").addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());

    if (!validarFormulario(data)) {
        mostrarAlerta("error", "⚠️ Corrige los errores marcados en el formulario.");
        return;
    }

    const btn = document.getElementById("btnSubmit");
    btn.disabled = true;
    btn.querySelector(".btn-text").textContent = "Generando...";
    btn.querySelector(".btn-icon").style.display = "none";
    btn.querySelector(".btn-spinner").style.display = "inline";
    document.getElementById("alertBox").style.display = "none";

    try {
        const response = await fetch(`${API_URL}/generar-diploma`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (response.ok) {
            let botones = `<div style="display:flex;gap:10px;margin-top:12px;flex-wrap:wrap">
                <a href="${API_URL}/admin/descargar/${result.dni}/docx"
                   class="download-link" download>
                   📄 Descargar Word (.docx)
                </a>`;

            if (result.tiene_pdf) {
                botones += `<a href="${API_URL}/admin/descargar/${result.dni}/pdf"
                   class="download-link download-link-pdf" download>
                   📕 Descargar PDF
                </a>`;
            } else {
                botones += `<span class="pdf-nota">ℹ️ PDF no disponible — instala LibreOffice para activarlo</span>`;
            }
            botones += `</div>`;

            mostrarAlerta("success", `
                ✅ <strong>${result.mensaje}</strong><br>
                ${result.tiene_pdf ? "Se generaron Word y PDF." : "Se generó el archivo Word."}<br>
                ${botones}
            `);
            e.target.reset();
            Object.keys(validaciones).forEach(limpiarError);

        } else {
            const msg = response.status === 409
                ? `⚠️ ${result.detail}`
                : `❌ ${result.detail || "Error al generar el diploma"}`;
            mostrarAlerta("error", msg);
        }

    } catch (error) {
        mostrarAlerta("error", "❌ No se pudo conectar con el servidor. Verifica que el backend esté corriendo en <strong>http://127.0.0.1:8000</strong>");
    } finally {
        btn.disabled = false;
        btn.querySelector(".btn-text").textContent = "Generar Diploma";
        btn.querySelector(".btn-icon").style.display = "inline";
        btn.querySelector(".btn-spinner").style.display = "none";
    }
});