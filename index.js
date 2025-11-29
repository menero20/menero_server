// index.js
const cors = require('cors');
const express = require('express');
const path = require('path');
const fs = require('fs');

// Selenium
const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const isRender = process.env.RENDER === 'true';

// No Render: grava em /tmp (ephemeral, some quando o serviço reinicia)
// Local: continua usando um arquivo ao lado do index.js
const contatosFile = isRender
  ? path.join('/tmp', 'contatos.json')
  : path.join(__dirname, 'contatos.json');


// ==== FUNÇÕES AUXILIARES PRA ARQUIVO ====

function carregarContatos() {
  if (!fs.existsSync(contatosFile)) return [];
  try {
    const data = fs.readFileSync(contatosFile, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    console.error('Erro ao ler contatos.json:', e);
    return [];
  }
}

function salvarContatos(contatos) {
  fs.writeFileSync(contatosFile, JSON.stringify(contatos, null, 2), 'utf8');
}

// ==== ROTAS DE CONTATOS ====

app.get('/api/contatos', (req, res) => {
  const contatos = carregarContatos();
  res.json(contatos);
});

app.post('/api/contatos', (req, res) => {
  const { nome, telefone } = req.body;
  if (!nome || !telefone) {
    return res.status(400).json({ erro: 'Nome e telefone são obrigatórios' });
  }

  const contatos = carregarContatos();
  const novo = {
    id: Date.now(),
    nome,
    telefone
  };
  contatos.push(novo);
  salvarContatos(contatos);
  res.status(201).json(novo);
});

app.delete('/api/contatos/:id', (req, res) => {
  const id = Number(req.params.id);
  let contatos = carregarContatos();
  const antes = contatos.length;
  contatos = contatos.filter(c => c.id !== id);
  if (contatos.length === antes) {
    return res.status(404).json({ erro: 'Contato não encontrado' });
  }
  salvarContatos(contatos);
  res.json({ ok: true });
});

// ==== FUNÇÕES DE SELENIUM ====

async function abrirChatPorBusca(driver, textoBusca) {
  const barraPesquisa = await driver.wait(
    until.elementLocated(
      By.css('div[contenteditable="true"][data-tab="3"]')
    ),
    60 * 1000
  );

  await barraPesquisa.click();
  await barraPesquisa.sendKeys(Key.CONTROL, 'a');
  await barraPesquisa.sendKeys(Key.BACK_SPACE);
  await barraPesquisa.sendKeys(textoBusca);

  await driver.sleep(1500);
  await barraPesquisa.sendKeys(Key.ENTER);

  await driver.wait(
    until.elementLocated(
      By.css(
        'div[contenteditable="true"][data-tab="10"], div[contenteditable="true"][data-tab="6"]'
      )
    ),
    60 * 1000
  );
}

async function enviarMensagemNoChatAtual(driver, mensagem) {
  const inputMensagem = await driver.wait(
    until.elementLocated(
      By.css(
        'div[contenteditable="true"][data-tab="10"], div[contenteditable="true"][data-tab="6"]'
      )
    ),
    60 * 1000
  );

  await inputMensagem.click();
  await driver.sleep(500);
  await inputMensagem.sendKeys(mensagem, Key.ENTER);
  await driver.sleep(2000);
}

// Essa função abre o Whats, faz login (se precisar) e manda msg pra todos
async function dispararWhats(contatos, mensagem, { headless = true } = {}) {
  const userDataDir = path.join(__dirname, 'chrome-whatsapp-profile');

  const options = new chrome.Options();
  options
    .addArguments(`--user-data-dir=${userDataDir}`)
    .addArguments('--log-level=3');

  if (headless) {
    // Chrome invisível
    options
      .addArguments('--headless=new')
      .addArguments('--no-sandbox')
      .addArguments('--disable-dev-shm-usage')
      .addArguments('--disable-gpu')
      .addArguments('--window-size=1280,720');
  } else {
    // Chrome normal com janela
    options.addArguments('--start-maximized');
  }

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  try {
    await driver.get('https://web.whatsapp.com');

    console.log('✅ Chrome aberto em https://web.whatsapp.com');
    console.log(
    headless
    ? '👻 Modo headless (sem janela).'
    : '🪟 Modo com janela, se pedir QR leia normalmente.'
);
    await driver.wait(
      until.elementLocated(By.id('pane-side')),
      3 * 60 * 1000
    );

    console.log('✅ Login detectado! Enviando mensagens...');

    for (const contato of contatos) {
      try {
        console.log(`➡️ Enviando para ${contato.nome} (${contato.telefone})`);
        await abrirChatPorBusca(driver, contato.telefone);
        await enviarMensagemNoChatAtual(driver, mensagem);
      } catch (e) {
        console.error(`Erro ao enviar para ${contato.telefone}:`, e.message);
      }
    }

    console.log('✅ Disparo concluído.');
  } finally {
    await driver.quit();
  }
}

// ==== ROTA DE DISPARO ====

app.post('/api/disparar', async (req, res) => {
  const { mensagem } = req.body;
  if (!mensagem) {
    return res.status(400).json({ erro: 'Mensagem é obrigatória' });
  }

  const contatos = carregarContatos();
  if (!contatos.length) {
    return res.status(400).json({ erro: 'Não há contatos cadastrados' });
  }

  // aqui eu mando headless: true pra não abrir janela
  dispararWhats(contatos, mensagem, { headless: true })
    .then(() => console.log('Disparo terminado'))
    .catch(err => console.error('Erro no disparo:', err));

  res.json({ ok: true });
});

// ==== INICIA SERVIDOR ====

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
