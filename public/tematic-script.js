async function generateTematicPassword() {
    const tema = document.getElementById('tema').value;
    const resultInput = document.getElementById('result');

    if (!tema) {
        M.toast({html: 'Por favor, ingrese un tema.'});
        return;
    }

    try {
        const response = await fetch('/api/generate-tematic-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tema }),
        });

        if (!response.ok) {
            throw new Error('Error en la respuesta del servidor');
        }

        const data = await response.json();
        resultInput.value = data.password;
        M.textareaAutoResize(resultInput);
        M.updateTextFields();

        // Calcular y mostrar entropía y seguridad
        const entropia = calcularEntropia(data.password);
        mostrarEntropia(entropia);
        mostrarSeguridad(entropia);
    } catch (error) {
        console.error('Error:', error);
        M.toast({html: 'Error al generar la contraseña.'});
    }
}

function calcularEntropia(password) {
    const charset = new Set(password).size;
    return Math.log2(Math.pow(charset, password.length));
}

function mostrarEntropia(entropia) {
    document.getElementById('entropia-valor').textContent = entropia.toFixed(2) + " bits";
}

function mostrarSeguridad(entropia) {
    let seguridad;
    let clase;
    if (entropia < 28) {
        seguridad = "Muy Débil";
        clase = "seguridad-muy-debil";
    } else if (entropia < 36) {
        seguridad = "Débil";
        clase = "seguridad-debil";
    } else if (entropia < 60) {
        seguridad = "Razonable";
        clase = "seguridad-razonable";
    } else if (entropia < 128) {
        seguridad = "Fuerte";
        clase = "seguridad-fuerte";
    } else {
        seguridad = "Muy Fuerte";
        clase = "seguridad-muy-fuerte";
    }

    const seguridadElement = document.getElementById('seguridad-valor');
    seguridadElement.textContent = seguridad;
    seguridadElement.className = clase;
}

function copyPassword() {
    const password = document.getElementById('result').value;
    if (password) {
        navigator.clipboard.writeText(password).then(() => {
            showCopyMessage();
        });
    }
}

function showCopyMessage() {
    const message = document.getElementById('copyMessage');
    message.style.display = 'block';
    setTimeout(() => {
        message.style.display = 'none';
    }, 2000);
}

document.addEventListener('DOMContentLoaded', function() {
    M.AutoInit();
});