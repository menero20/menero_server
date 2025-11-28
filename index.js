const express = require('express');
const axios = require('axios');
const app = express();

const port = process.env.PORT || 3000;

// aceitar JSON se precisar depois
app.use(express.json());

// servir a pasta "public" (onde ficará o index.html)
app.use(express.static('public'));

// Cidades brasileiras
const cities = [
  { name: 'São Paulo', lat: -23.55, lon: -46.63 },
  { name: 'Rio de Janeiro', lat: -22.90, lon: -43.20 },
  { name: 'Brasília', lat: -15.78, lon: -47.93 },
  { name: 'Salvador', lat: -12.97, lon: -38.50 },
  { name: 'Belo Horizonte', lat: -19.92, lon: -43.94 },
  { name: 'Curitiba', lat: -25.42, lon: -49.27 },
  { name: 'Porto Alegre', lat: -30.03, lon: -51.23 },
  { name: 'Recife', lat: -8.05, lon: -34.90 },
  { name: 'Fortaleza', lat: -3.72, lon: -38.54 },
  { name: 'Manaus', lat: -3.10, lon: -60.02 }
];

// texto pro código do tempo
const weatherCodeMap = {
  0: 'Céu limpo',
  1: 'Principalmente limpo',
  2: 'Parcialmente nublado',
  3: 'Nublado',
  45: 'Nevoeiro',
  48: 'Nevoeiro com gelo',
  51: 'Garoa fraca',
  53: 'Garoa moderada',
  55: 'Garoa intensa',
  61: 'Chuva fraca',
  63: 'Chuva moderada',
  65: 'Chuva forte',
  71: 'Neve fraca',
  73: 'Neve moderada',
  75: 'Neve forte',
  80: 'Aguaceiros fracos',
  81: 'Aguaceiros moderados',
  82: 'Aguaceiros fortes',
  95: 'Trovoadas',
  96: 'Trovoadas com granizo leve',
  99: 'Trovoadas com granizo forte'
};

function mapWeatherCode(code) {
  return weatherCodeMap[code] || 'Condição desconhecida';
}

// define se é noite (a partir do horário que a API manda)
function isNight(timeIso) {
  const h = new Date(timeIso).getHours();
  return h < 6 || h >= 18;
}

// escolhe um "tipo" de ícone pra usar no front
function getIconType(code, night) {
  if (code === 0 || code === 1) {
    return night ? 'moon' : 'sun';
  }
  if (code === 2 || code === 3) {
    return 'clouds';
  }
  if ((code >= 51 && code <= 65) || (code >= 80 && code <= 82)) {
    return 'rain';
  }
  if (code === 45 || code === 48) {
    return 'fog';
  }
  if (code >= 95) {
    return 'storm';
  }
  return 'clouds';
}

// Rota de API que busca o clima em várias cidades (Open-Meteo)
app.get('/api/clima-brasil', async (req, res) => {
  try {
    const requests = cities.map(async (city) => {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current_weather=true&timezone=America%2FSao_Paulo`;

      const { data } = await axios.get(url);
      const cw = data.current_weather;

      const night = isNight(cw.time);
      const icon = getIconType(cw.weathercode, night);

      return {
        nome: city.name,
        temperatura: cw.temperature,
        vento: cw.windspeed,
        codigo: cw.weathercode,
        descricao: mapWeatherCode(cw.weathercode),
        horario: cw.time,
        night,
        icon
      };
    });

    const resultados = await Promise.all(requests);

    res.json({
      ok: true,
      cidades: resultados
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      ok: false,
      message: 'Erro ao buscar clima nas cidades'
    });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${port}`);
});
