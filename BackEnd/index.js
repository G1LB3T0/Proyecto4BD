const express = require('express');
const app = express();

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('¡Hola Mundo desde Express!');
});

// Puerto donde correrá el servidor
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
