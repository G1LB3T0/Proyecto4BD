const express = require('express');
const cors = require('cors');
const app = express();

// Middleware para CORS
app.use(cors());

// Middleware para parsear JSON
app.use(express.json());

// Importar rutas
const bookRoutes = require('./routes/bookRoutes');
const userRoutes = require('./routes/userRoutes');
const loanRoutes = require('./routes/loanRoutes');

// Usar rutas
app.use('/api/books', bookRoutes);
app.use('/api/users', userRoutes);
app.use('/api/loans', loanRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
    res.send('API de Biblioteca funcionando correctamente');
});

// Manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Error interno del servidor',
        details: err.message
    });
});

// Puerto donde correrá el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
