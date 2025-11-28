const express = require('express');
const app = express();

// Render vai passar a porta na variável de ambiente PORT
const port = process.env.PORT || 3000;

// Middleware simples pra aceitar JSON (se quiser usar)
app.use(express.json());

// Rota básica pra testar
app.get('/', (req, res) => {
  res.json({
    ok: true,
    message: 'Servidor no Render está no ar!',
  });
});

// MUITO IMPORTANTE: ouvir em 0.0.0.0 e na porta do process.env.PORT
app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${port}`);
});
