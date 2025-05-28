// src/index.js
import http from 'http';
import app from './app.js';
import db from './config/mongo.js';
import 'dotenv/config';

const PORT = process.env.PORT || 3001;
const server = http.createServer(app);

db()
    .then(() => {
        console.log("Conexion DB Ready");
        server.listen(PORT, () => {
            console.log(`Server listening on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error("DB Connection Error:", err);
    });
