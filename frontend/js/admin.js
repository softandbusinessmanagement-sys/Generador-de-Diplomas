let timerBusqueda;
let idEliminando = null;

function formatearFecha(fechaStr) {
    const fecha = new Date(fechaStr + 'T00:00:00');
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${fecha.getDate()} ${meses[fecha.getMonth()]} ${fecha.getFullYear()}`;
}

async function cargarEstadisticas() {
    try {
        const response = await fetch('http://127.0.0.1:8000/admin/estadisticas');
        if (response.ok) {
            const data = await response.json();
            document.getElementById('stat-total').textContent = data.total;
            document.getElementById('stat-tesis').textContent = data.tesis;
            document.getElementById('stat-tsp').textContent = data.tsp;
        }
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
    }
}

async function cargarDiplomas(busqueda = '') {
    try {
        const url = busqueda 
            ? `http://127.0.0.1:8000/admin/diplomas?buscar=${encodeURIComponent(busqueda)}`
            : 'http://127.0.0.1:8000/admin/diplomas';
        
        const response = await fetch(url);
        if (response.ok) {
            const diplomas = await response.json();
            renderizarTabla(diplomas);
        }
    } catch (error) {
        console.error('Error al cargar diplomas:', error);
    }
}

function renderizarTabla(diplomas) {
    const tbody = document.getElementById('tablaDiplomas');
    
    if (diplomas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem;">No se encontraron diplomas</td></tr>';
        return;
    }
    
    tbody.innerHTML = diplomas.map((diploma, index) => `
        <tr>
            <td>${index + 1}</td>
            <td><strong>${diploma.nombre} ${diploma.apellidos}</strong></td>
            <td>${diploma.dni}</td>
            <td>${diploma.carrera}</td>
            <td><span class="badge ${diploma.modalidad === 'Tesis' ? 'tesis' : 'tsp'}">${diploma.modalidad === 'Tesis' ? 'Tesis' : 'TSP'}</span></td>
            <td>${diploma.asesor}</td>
            <td>${formatearFecha(diploma.fecha)}</td>
            <td style="display: flex; gap: 0.5rem;">
                <a href="http://127.0.0.1:8000/admin/descargar/${diploma.dni}" class="btn-sm download" download style="text-decoration: none; display: inline-block;">↓ Descargar</a>
                <button class="btn-sm delete" onclick="confirmarEliminar(${diploma.id}, '${diploma.nombre} ${diploma.apellidos}')">🗑 Eliminar</button>
            </td>
        </tr>
    `).join('');
}

function confirmarEliminar(id, nombre) {
    idEliminando = id;
    document.getElementById('modalTexto').textContent = `¿Desea eliminar el diploma de ${nombre}? Esta acción no se puede deshacer.`;
    document.getElementById('modalEliminar').classList.add('active');
}

async function eliminarDiploma(id) {
    try {
        const response = await fetch(`http://127.0.0.1:8000/admin/diplomas/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            document.getElementById('modalEliminar').classList.remove('active');
            cargarDiplomas();
            cargarEstadisticas();
        } else {
            alert('Error al eliminar el diploma');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar el diploma');
    }
}

async function validarDiploma() {
    const dni = document.getElementById('inputValidarDNI').value.trim();
    const resultadoDiv = document.getElementById('resultadoValidacion');
    
    if (!/^\d{8}$/.test(dni)) {
        resultadoDiv.innerHTML = '<p style="color: #d32f2f;">Ingrese un DNI válido (8 dígitos)</p>';
        return;
    }
    
    try {
        const response = await fetch(`http://127.0.0.1:8000/validar/${dni}`);
        
        if (response.ok) {
            const diploma = await response.json();
            resultadoDiv.innerHTML = `
                <div style="background: #e8f5e9; padding: 1rem; border-radius: 8px; border-left: 4px solid #4caf50;">
                    <p><strong>✓ Diploma encontrado</strong></p>
                    <p><strong>Estudiante:</strong> ${diploma.nombre} ${diploma.apellidos}</p>
                    <p><strong>Carrera:</strong> ${diploma.carrera}</p>
                    <p><strong>Modalidad:</strong> ${diploma.modalidad}</p>
                    <p><strong>Asesor:</strong> ${diploma.asesor}</p>
                </div>
            `;
        } else if (response.status === 404) {
            resultadoDiv.innerHTML = '<p style="color: #d32f2f;">No se encontró diploma para este DNI</p>';
        }
    } catch (error) {
        resultadoDiv.innerHTML = '<p style="color: #d32f2f;">Error al validar el diploma</p>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    cargarEstadisticas();
    cargarDiplomas();
    
    // Búsqueda con debounce
    document.getElementById('inputBusqueda').addEventListener('input', (e) => {
        clearTimeout(timerBusqueda);
        timerBusqueda = setTimeout(() => {
            cargarDiplomas(e.target.value);
        }, 400);
    });
    
    // Validar diploma
    document.getElementById('btnValidarDNI').addEventListener('click', validarDiploma);
    document.getElementById('inputValidarDNI').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') validarDiploma();
    });
    
    // Modal
    document.getElementById('btnConfirmarEliminar').addEventListener('click', () => {
        if (idEliminando) eliminarDiploma(idEliminando);
    });
    
    document.getElementById('btnCancelarEliminar').addEventListener('click', () => {
        document.getElementById('modalEliminar').classList.remove('active');
        idEliminando = null;
    });
});