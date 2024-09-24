// Función asíncrona para obtener palabras aleatorias de una API
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

// Función para generar palabras localmente en caso de fallo de la API
function generarPalabrasLocales(numPalabras) {
  const palabrasEjemplo = ['seguridad', 'contraseña', 'generador', 'aleatorio', 'entropia', 'cifrado', 'proteccion', 'clave'];
  let resultado = [];
  for (let i = 0; i < numPalabras; i++) {
    resultado.push(palabrasEjemplo[Math.floor(Math.random() * palabrasEjemplo.length)]);
  }
  return resultado;
}