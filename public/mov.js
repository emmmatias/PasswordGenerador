// mov.js

let passwordCounter = 0;

function incrementCounter() {
    passwordCounter++;
    updateCounterDisplay();
    saveCounterToStorage();
}

function updateCounterDisplay() {
    document.getElementById('password-counter').textContent = passwordCounter;
}

function saveCounterToStorage() {
    localStorage.setItem('passwordCounter', passwordCounter);
}

function loadCounterFromStorage() {
    const storedCounter = localStorage.getItem('passwordCounter');
    if (storedCounter !== null) {
        passwordCounter = parseInt(storedCounter);
        updateCounterDisplay();
    }
}

function exportCounterToFile() {
    const blob = new Blob([`Contraseñas generadas: ${passwordCounter}`], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'contador_contraseñas.txt';
    a.click();
}

document.addEventListener('DOMContentLoaded', function() {
    loadCounterFromStorage();
    
    // Añadir botón de exportación
    const exportButton = document.createElement('button');
    exportButton.textContent = 'Exportar contador';
    exportButton.classList.add('btn', 'blue', 'darken-2');
    exportButton.onclick = exportCounterToFile;
    document.getElementById('counter-container').appendChild(exportButton);
});