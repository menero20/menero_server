const express = require('express');
const axios = require('axios'); // 👈 novo
const app = express();

const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// Rota: chama API pública e devolve pro front
app.get('/api/piada', async (req, res) => {
  try {
    const resposta = await axios.get('https://api.chucknorris.io/jokes/random');

    res.json({
      ok: true,
      piada: resposta.data.value, // texto da piada
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      ok: false,
      message: 'Erro ao buscar piada na API externa',
    });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${port}`);
});
