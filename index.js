const express = require('express');
const path = require('path');
const { Configuration, OpenAIApi } = require("openai");
const fs = require('fs');
const app = express();
const port = 3000;

// Configuración de OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

app.use(express.json());
app.use(express.static('public'));

// Leer el contador del archivo
let globalPasswordCounter = 0;
try {
  const data = fs.readFileSync('counter.json', 'utf8');
  globalPasswordCounter = JSON.parse(data).count;
} catch (err) {
  console.error('Error al leer el contador:', err);
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/tematic', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'tematic.html'));
});

function getRandomSymbol() {
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    return symbols[Math.floor(Math.random() * symbols.length)];
}

app.post('/api/generate-tematic-password', async (req, res) => {
    try {
        const { tema } = req.body;
        const response = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [
                {role: "system", content: "Eres un asistente que genera palabras relacionadas con temas específicos."},
                {role: "user", content: `Genera 5 palabras relacionadas con ${tema}. Responde solo con las palabras separadas por comas, sin explicaciones adicionales.`}
            ],
            max_tokens: 60,
            temperature: 0.7
        });

        const words = response.data.choices[0].message.content
            .split(',')
            .map(word => word.trim().replace(/\s+/g, '')); // Elimina espacios dentro de las palabras

        const password = words.reduce((acc, word, index) => 
            index === 0 ? word : `${acc}${getRandomSymbol()}${word}`, '');

        res.json({ password });
    } catch (error) {
        console.error('Error al generar contraseña temática:', error);
        res.status(500).json({ error: 'Error al generar contraseña temática' });
    }
});

// Ruta para obtener el contador
app.get('/api/counter', (req, res) => {
    res.json({ count: globalPasswordCounter });
});

// Ruta para incrementar el contador
app.post('/api/counter/increment', (req, res) => {
    globalPasswordCounter++;
    // Guardar el contador actualizado en el archivo
    fs.writeFile('counter.json', JSON.stringify({ count: globalPasswordCounter }), (err) => {
        if (err) console.error('Error al guardar el contador:', err);
    });
    res.json({ count: globalPasswordCounter });
});

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});