// Variables globales
let entropy = 0;
const requiredEntropy = 100;
let lastGenerationTime = 0;
const GENERATION_INTERVAL = 50;
let globalPasswordCounter = 0;

function calculateRealEntropy(password) {
    const charSet = new Set(password);
    return Math.log2(Math.pow(charSet.size, password.length));
}

function generateRandomEntropy() {
    return Math.floor(Math.random() * 1000) + 100; // Genera un número entre 100 y 1099
}

function updateLengthValue(value) {
    const length = parseInt(value);
    const warningElement = document.getElementById('length-warning');
    const inputElement = document.getElementById('length');

    if (length < 14) {
        warningElement.textContent = "La longitud mínima de la contraseña es 14 caracteres.";
        warningElement.style.display = 'block';
        inputElement.value = 14;
    } else {
        warningElement.style.display = 'none';
    }
}

function ensureSelectedOptionsIncluded(password, options) {
    const charsets = {
        useLowercase: 'abcdefghijklmnopqrstuvwxyz',
        useUppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        useNumbers: '0123456789',
        useSymbols: '!@#$%^&*',
        useBrackets: '[]{}()',
        useHighAnsi: '±¥µç'
    };

    for (let option in options) {
        if (options[option] && !new RegExp(`[${charsets[option]}]`).test(password)) {
            let randomChar = charsets[option][Math.floor(Math.random() * charsets[option].length)];
            let randomPosition = Math.floor(Math.random() * password.length);
            password = password.substring(0, randomPosition) + randomChar + password.substring(randomPosition + 1);
        }
    }

    return password;
}

function generateProportionalChars(charset, count) {
    let result = '';
    for (let i = 0; i < count; i++) {
        result += charset[Math.floor(Math.random() * charset.length)];
    }
    return result;
}

async function obtenerPalabras(numPalabras, idioma = 'en') {
    const apiUrl = `https://random-word-api.herokuapp.com/word?number=${numPalabras}&lang=${idioma}`;
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) {
            throw new Error("No se obtuvieron palabras de la API");
        }
        return data;
    } catch (error) {
        console.error('Error al obtener palabras:', error);
        // En caso de error, generamos palabras localmente
        return generarPalabrasLocales(numPalabras);
    }
}

function generarPalabrasLocales(numPalabras) {
    const palabrasEjemplo = ['seguridad', 'contraseña', 'generador', 'aleatorio', 'entropia', 'cifrado', 'proteccion', 'clave'];
    let resultado = [];
    for (let i = 0; i < numPalabras; i++) {
        resultado.push(palabrasEjemplo[Math.floor(Math.random() * palabrasEjemplo.length)]);
    }
    return resultado;
}

async function generatePassword() {
    const length = Math.max(14, parseInt(document.getElementById('length').value));
    const useLowercase = document.getElementById('lowercase').checked;
    const useUppercase = document.getElementById('uppercase').checked;
    const useNumbers = document.getElementById('numbers').checked;
    const useSymbols = document.getElementById('symbols').checked;
    const useBrackets = document.getElementById('brackets').checked;
    const useHighAnsi = document.getElementById('high-ansi').checked;
    const useWords = document.getElementById('words').checked;
    const numWords = parseInt(document.getElementById('word-count').value);
    const selectedLanguage = document.getElementById('language-select').value;

    let charset = '';
    if (useLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (useUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (useNumbers) charset += '0123456789';
    if (useSymbols) charset += '!@#$%^&*';
    if (useBrackets) charset += '[]{}()';
    if (useHighAnsi) charset += '±¥µç|~¬<>¿?';

    if (charset === '' && !useWords) {
        document.getElementById('generated-password').textContent = 'SIN CONTRASEÑA GENERADA';
        actualizarInterfaz('', {}, false);
        return;
    }

    let password = '';

    if (useWords) {
        try {
            console.log("Intentando obtener palabras...");
            console.log("Número de palabras solicitadas:", numWords);
            console.log("Idioma seleccionado:", selectedLanguage);
            const words = await obtenerPalabras(numWords, selectedLanguage);
            console.log("Palabras obtenidas:", words);
            password = words.join('-=-');
            while (password.length < length) {
                password += generateProportionalChars(charset, 1);
            }
        } catch (error) {
            console.error('Error detallado al generar contraseña basada en palabras:', error);
            // En caso de error, generamos una contraseña basada en caracteres
            password = generateProportionalChars(charset, length);
        }
    } else {
        password = generateProportionalChars(charset, length);
    }

    const options = {
        useLowercase,
        useUppercase,
        useNumbers,
        useSymbols,
        useBrackets,
        useHighAnsi
    };

    password = ensureSelectedOptionsIncluded(password, options);

    document.getElementById('generated-password').textContent = password;
    actualizarInterfaz(password, options, useWords);

    await incrementGlobalCounter();
}

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
        M.updateTextFields(); // Actualiza los campos de Materialize

        // Mostrar las palabras individuales
        const words = data.password.slice(1, -1).split('.|.');
        const wordList = document.getElementById('wordList');
        wordList.innerHTML = '<h5>Palabras generadas:</h5>';
        words.forEach(word => {
            const li = document.createElement('li');
            li.textContent = word;
            wordList.appendChild(li);
        });

        actualizarInterfaz(data.password, {}, true);
    } catch (error) {
        console.error('Error:', error);
        M.toast({html: 'Error al generar la contraseña.'});
    }
}

function copyPasswordToClipboard() {
    const password = document.getElementById('generated-password').textContent;
    if (password !== 'SIN CONTRASEÑA GENERADA' && password !== 'Error al generar la contraseña') {
        navigator.clipboard.writeText(password).then(() => {
            showCopiedNotification();
        });
    }
}

function initializePasswordGenerator() {
    const passwordGeneratorArea = document.getElementById('password-generator-area');

    passwordGeneratorArea.addEventListener('mousemove', function(e) {
        entropy += Math.abs(e.movementX) + Math.abs(e.movementY);

        const now = Date.now();
        if (entropy >= requiredEntropy && now - lastGenerationTime > GENERATION_INTERVAL) {
            generatePassword();
            lastGenerationTime = now;
            entropy = 0;
        }
    });

    passwordGeneratorArea.addEventListener('click', copyPasswordToClipboard);

    document.getElementById('generated-password').addEventListener('click', copyPasswordToClipboard);
}

async function incrementGlobalCounter() {
    try {
        const response = await fetch('/api/counter/increment', { method: 'POST' });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        globalPasswordCounter = data.count;
        updateCounterDisplay();
    } catch (error) {
        console.error('Error incrementing counter:', error);
    }
}

async function getGlobalCounter() {
    try {
        const response = await fetch('/api/counter');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        globalPasswordCounter = data.count;
        updateCounterDisplay();
    } catch (error) {
        console.error('Error fetching counter:', error);
    }
}

function updateCounterDisplay() {
    document.getElementById('password-counter').textContent = globalPasswordCounter;
}

document.addEventListener('DOMContentLoaded', function() {
    initializePasswordGenerator();

    document.getElementById('generate-button').addEventListener('click', function() {
        entropy = generateRandomEntropy();
        generatePassword();
    });

    document.getElementById('copy-button').addEventListener('click', copyPasswordToClipboard);

    document.getElementById('words').addEventListener('change', toggleWordCount);
    document.getElementById('word-count').addEventListener('change', generatePassword);
    document.getElementById('language-select').addEventListener('change', generatePassword);

    document.getElementById('length').value = 14;
    updateLengthValue(document.getElementById('length').value);

    var elems = document.querySelectorAll('select');
    M.FormSelect.init(elems);

    M.updateTextFields();

    getGlobalCounter();

    generatePassword();

    // Añadir evento para generar contraseña temática
    const tematicButton = document.getElementById('generate-tematic-button');
    if (tematicButton) {
        tematicButton.addEventListener('click', generateTematicPassword);
    }
});

function toggleOtherOptions(selectedId) {
    const isSelected = document.getElementById(selectedId).checked;
    if (isSelected) {
        document.getElementById('words').checked = false;
        document.getElementById('word-options-row').style.display = 'none';
        ['lowercase', 'uppercase', 'numbers', 'symbols', 'brackets', 'high-ansi'].forEach(option => {
            document.getElementById(option).disabled = false; 
        });
    } else {
        document.getElementById(selectedId).checked = false;
    }
    generatePassword();
}

function toggleWordCount() {
    const useWords = document.getElementById('words').checked;
    const wordOptionsRow = document.getElementById('word-options-row');
    wordOptionsRow.style.display = useWords ? 'block' : 'none';

    ['lowercase', 'uppercase', 'numbers', 'symbols', 'brackets', 'high-ansi'].forEach(option => {
        document.getElementById(option).disabled = useWords;
        if (useWords) {
            document.getElementById(option).checked = false;
        }
    });

    if (useWords) {
        var elems = document.querySelectorAll('select');
        M.FormSelect.init(elems);
    }

    console.log("Generando nueva contraseña después de toggle words");
    generatePassword();
}

function showCopiedNotification() {
    const notification = document.getElementById('notification');
    notification.style.display = 'block';
    setTimeout(() => {
        notification.style.display = 'none';
    }, 2000);
}

function toggleMenu() {
    document.querySelector('.menu-icon').classList.toggle('change');
    document.getElementById('sideMenu').classList.toggle('open');
}

window.onclick = function(event) {
    if (!event.target.matches('.menu-icon') && !event.target.matches('.bar1') && !event.target.matches('.bar2') && !event.target.matches('.bar3')) {
        var menu = document.getElementById('sideMenu');
        if (menu.classList.contains('open')) {
            menu.classList.remove('open');
            document.querySelector('.menu-icon').classList.remove('change');
        }
    }
}

function actualizarInterfaz(password, options, esBasadaEnPalabras) {
    const entropia = calculateRealEntropy(password);
    const fortaleza = evaluarFortaleza(entropia);
    const tiempoCraqueo = estimarTiempoCraqueo(entropia);

    document.getElementById('entropia-valor').textContent = entropia.toFixed(2) + " bits";
    document.getElementById('fortaleza-valor').textContent = fortaleza;
    document.getElementById('tiempo-craqueo').textContent = tiempoCraqueo;

    const fortalezaElement = document.getElementById('fortaleza-valor');
    fortalezaElement.className = 'fortaleza-' + fortaleza.split(' ')[1].toLowerCase().replace(' ', '-');
}

function evaluarFortaleza(entropia) {
    if (entropia < 28) return "Muy Débil";
    if (entropia < 36) return "Débil";
    if (entropia < 60) return "Razonable";
    if (entropia < 128) return "Fuerte";
    return "Muy Fuerte";
}

function estimarTiempoCraqueo(entropia) {
    const tiemposPorEntropia = [
        { entropia: 28, tiempo: "Instantáneo" },
        { entropia: 36, tiempo: "6 horas" },
        { entropia: 60, tiempo: "3 mil años" },
        { entropia: 128, tiempo: "Imposible en la práctica" }
    ];

    for (let i = 0; i < tiemposPorEntropia.length; i++) {
        if (entropia < tiemposPorEntropia[i].entropia) {
            return tiemposPorEntropia[i].tiempo;
        }
    }
    return "Imposible en la práctica";
}