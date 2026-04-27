const multer = require('multer');
const XLSX = require('xlsx');
const upload = multer({ storage: multer.memoryStorage() });

// server.js
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Configuración de la base de datos
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error('Error conectando a la base de datos:', err);
        return;
    }
    console.log('Conectado a la base de datos MySQL');
});

// --- Middleware de autenticación para el administrador ---
const authenticateAdmin = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado. No hay token.' });
    }
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.admin = verified;
        next();
    } catch (error) {
        res.status(400).json({ error: 'Token inválido' });
    }
};

// --- RUTAS DE LA API ---

// 1. Ruta para el login del administrador
app.post('/api/admin/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
    }

    // Buscar al admin en la base de datos
    const query = 'SELECT * FROM admins WHERE username = ?';
    db.query(query, [username], async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(401).json({ error: 'Credenciales inválidas' });

        const admin = results[0];
        // Comparar la contraseña ingresada con la almacenada (encriptada)
        const validPassword = await bcrypt.compare(password, admin.password);
        if (!validPassword) return res.status(401).json({ error: 'Credenciales inválidas' });

        // Generar un token JWT
        const token = jwt.sign({ id: admin.id, username: admin.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ message: 'Login exitoso', token });
    });
});

// 2. Ruta para verificar la cédula de un votante
app.post('/api/voters/verify', (req, res) => {
    const { cedula } = req.body;
    const query = 'SELECT id, nombre, has_voted FROM voters WHERE cedula = ?';
    db.query(query, [cedula], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'Cédula no registrada' });
        if (results[0].has_voted) return res.status(403).json({ error: 'Esta cédula ya ha votado' });

        res.json({ success: true, voter: results[0] });
    });
});

// 3. Ruta para obtener la lista de candidatos
app.get('/api/candidates', (req, res) => {
    const query = 'SELECT id, nombre, foto_url FROM candidates';
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 4. Ruta para registrar un voto
app.post('/api/votes', (req, res) => {
    const { voter_id, candidate_id } = req.body;
    if (!voter_id || !candidate_id) {
        return res.status(400).json({ error: 'ID de votante y candidato son requeridos' });
    }

    // Iniciar una transacción para asegurar que ambas operaciones se completen
    db.beginTransaction(err => {
        if (err) return res.status(500).json({ error: err.message });

        // 1. Incrementar el contador de votos del candidato
        const updateCandidateQuery = 'UPDATE candidates SET votes = votes + 1 WHERE id = ?';
        db.query(updateCandidateQuery, [candidate_id], (err) => {
            if (err) {
                return db.rollback(() => res.status(500).json({ error: err.message }));
            }

            // 2. Marcar al votante como que ya votó
            const updateVoterQuery = 'UPDATE voters SET has_voted = TRUE, voted_at = NOW() WHERE id = ?';
            db.query(updateVoterQuery, [voter_id], (err) => {
                if (err) {
                    return db.rollback(() => res.status(500).json({ error: err.message }));
                }
                db.commit((err) => {
                    if (err) {
                        return db.rollback(() => res.status(500).json({ error: err.message }));
                    }
                    res.json({ success: true, message: 'Voto registrado exitosamente' });
                });
            });
        });
    });
});

// 5. Ruta para obtener las estadísticas (protegida para el admin)
app.get('/api/admin/stats', authenticateAdmin, (req, res) => {
    // Obtener el total de votantes que han votado
    const totalVotersQuery = 'SELECT COUNT(*) as total_voters, SUM(has_voted) as voted FROM voters';
    // Obtener los votos por candidato
    const candidatesVotesQuery = 'SELECT id, nombre, votes FROM candidates';

    db.query(totalVotersQuery, (err, totalResults) => {
        if (err) return res.status(500).json({ error: err.message });
        db.query(candidatesVotesQuery, (err, candidatesResults) => {
            if (err) return res.status(500).json({ error: err.message });
            const totalVoters = totalResults[0].total_voters;
            const voted = totalResults[0].voted || 0;
            const participationPercentage = totalVoters > 0 ? ((voted / totalVoters) * 100).toFixed(2) : 0;
            res.json({
                total_voters: totalVoters,
                voted_count: voted,
                pending_voters: totalVoters - voted,
                participation_percentage: participationPercentage,
                candidates: candidatesResults
            });
        });
    });
});

// Ruta para obtener todos los votantes (admin)
app.get('/api/admin/voters', authenticateAdmin, (req, res) => {
    const query = 'SELECT id, cedula, nombre, has_voted, voted_at FROM voters ORDER BY id';
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// --- NUEVA RUTA: Importar votantes desde Excel (solo admin) ---
app.post('/api/admin/import-voters', authenticateAdmin, upload.single('file'), async (req, res) => {
    // 1. Validar que se haya subido un archivo
    if (!req.file) {
        return res.status(400).json({ error: 'No se ha subido ningún archivo.' });
    }

    // 2. Leer y parsear el archivo Excel
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    // 3. Validar que el archivo tenga datos
    if (data.length === 0) {
        return res.status(400).json({ error: 'El archivo Excel está vacío.' });
    }

    // 4. Validar que las columnas necesarias existan y mapear datos
    //    Esperamos columnas 'cedula' y 'nombre'. Ajusta los nombres si son diferentes.
    const votersToInsert = [];
    for (const row of data) {
        if (row.cedula && row.nombre) {
            votersToInsert.push([row.cedula, row.nombre]);
        } else {
            console.warn('Fila omitida por falta de cédula o nombre:', row);
        }
    }

    if (votersToInsert.length === 0) {
        return res.status(400).json({ error: 'No se encontraron datos válidos en el archivo. Asegúrate de que las columnas se llamen "cedula" y "nombre".' });
    }

    // 5. Insertar los votantes en la base de datos de forma masiva (bulk insert)
    const query = 'INSERT IGNORE INTO voters (cedula, nombre) VALUES ?';
    //    'INSERT IGNORE' evita que la consulta falle si se intenta insertar una cédula duplicada.
    db.query(query, [votersToInsert], (err, result) => {
        if (err) {
            console.error('Error al insertar votantes:', err);
            return res.status(500).json({ error: 'Error al guardar los votantes en la base de datos.' });
        }
        res.json({ message: `Importación completada. ${result.affectedRows} votantes nuevos agregados.` });
    });
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});