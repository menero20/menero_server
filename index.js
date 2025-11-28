const express = require('express');
const app = express();

const port = process.env.PORT || 3000;

// Aceitar JSON (se você quiser usar depois em APIs)
app.use(express.json());

// ✅ Servir arquivos estáticos da pasta "public"
app.use(express.static('public'));

// (Opcional) rota de API só pra teste
app.get('/api/status', (req, res) => {
  res.json({
    ok: true,
    message: 'API está no ar junto com a página HTML!',
  });
});

// MUITO IMPORTANTE: ouvir em 0.0.0.0 e na porta do process.env.PORT
app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${port}`);
});
