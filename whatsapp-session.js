// whatsapp-session.js
const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const path = require('path');

async function abrirChatPorBusca(driver, textoBusca) {
  // Barra de pesquisa de conversas (lado esquerdo)
  const barraPesquisa = await driver.wait(
    until.elementLocated(
      By.css('div[contenteditable="true"][data-tab="3"]')
    ),
    60 * 1000
  );

  // Clica na barra
  await barraPesquisa.click();

  // Limpa o que tiver lá (Ctrl+A, Backspace)
  await barraPesquisa.sendKeys(Key.CONTROL, 'a');
  await barraPesquisa.sendKeys(Key.BACK_SPACE);

  // Digita o texto da busca (pode ser número ou nome do contato)
  await barraPesquisa.sendKeys(textoBusca);

  // Dá um tempinho pra lista de resultados atualizar
  await driver.sleep(1500);

  // Pressiona Enter pra abrir o primeiro resultado
  await barraPesquisa.sendKeys(Key.ENTER);

  // Espera o chat abrir (caixa de mensagem embaixo)
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
  console.log(`📤 Mensagem enviada: "${mensagem}"`);

  // Espera um pouco antes de ir pro próximo contato
  await driver.sleep(2000);
}

async function iniciarWhatsapp() {
  // pasta do perfil (sessão)
  const userDataDir = path.join(__dirname, 'chrome-whatsapp-profile');

  const options = new chrome.Options();
  options
    .addArguments(`--user-data-dir=${userDataDir}`)
    .addArguments('--start-maximized')
    .addArguments('--log-level=3');

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  try {
    // 1) Abre o WhatsApp Web uma vez só
    await driver.get('https://web.whatsapp.com');

    console.log('✅ Chrome aberto em https://web.whatsapp.com');
    console.log('📱 Se pedir, leia o QR code com o celular.');
    console.log('⌛ Aguardando você ficar logado...');

    // Espera aparecer a lista de conversas (pane-side)
    await driver.wait(
      until.elementLocated(By.id('pane-side')),
      3 * 60 * 1000
    );

    console.log('✅ Login detectado! Vamos enviar as mensagens...');

    // Aqui você escolhe como quer BUSCAR cada contato.
    // Pode usar o número como aparece no Whats (com espaços) ou o NOME do contato.
    const contatos = [
      '55 19 99660-4876', // sua mãe (ou o nome dela: "Mãe")
      '55 19 98945-3535',
      '55 19 99718-3006'
    ];

    const mensagem = 'Oi';

    for (const contato of contatos) {
      try {
        console.log(`➡️ Abrindo chat de: ${contato}`);
        await abrirChatPorBusca(driver, contato);
        await enviarMensagemNoChatAtual(driver, mensagem);
      } catch (err) {
        console.error(`❌ Erro ao enviar para ${contato}:`, err.message);
      }
    }

    console.log('✅ Processo de envio finalizado.');
    console.log('⚠️ Deixe essa janela do Chrome aberta enquanto quiser ficar online.');
    console.log('🧹 Para encerrar, aperte CTRL + C no terminal (o script vai tentar fechar o navegador).');

    // Mantém o navegador aberto até CTRL+C
    process.on('SIGINT', async () => {
      console.log('\nEncerrando sessão e fechando navegador...');
      try {
        await driver.quit();
      } catch (e) {
        console.error('Erro ao fechar o navegador (talvez já tenha sido fechado).');
      }
      process.exit();
    });
  } catch (err) {
    console.error('❌ Erro na automação:', err);
    try {
      await driver.quit();
    } catch (e) {}
  }
}

iniciarWhatsapp().catch((err) => {
  console.error('Erro ao iniciar WhatsApp Web:', err);
});
