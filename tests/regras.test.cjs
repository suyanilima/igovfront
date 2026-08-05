const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const elementos = new Map();
function elemento(id = '') {
  if (!elementos.has(id)) {
    elementos.set(id, {
      id,
      value: '',
      textContent: '',
      innerHTML: '',
      className: '',
      style: {},
      classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
      setAttribute() {},
      toggleAttribute() {},
      addEventListener() {},
      focus() {},
      select() {},
      remove() {},
      insertAdjacentElement() {},
      checkValidity() { return true; },
      querySelector() { return null; },
      scrollIntoView() {}
    });
  }
  return elementos.get(id);
}

const armazenados = new Map();
const contexto = {
  console,
  Date,
  Math,
  JSON,
  String,
  Number,
  Array,
  Set,
  Promise,
  localStorage: {
    getItem(chave) { return armazenados.get(chave) ?? null; },
    setItem(chave, valor) { armazenados.set(chave, valor); }
  },
  document: {
    activeElement: null,
    getElementById: elemento,
    querySelector() { return null; },
    querySelectorAll() { return []; },
    addEventListener() {},
    createElement: elemento,
    body: { appendChild() {}, removeChild() {} }
  },
  setTimeout() { return 1; },
  clearTimeout() {},
  setInterval() { return 1; },
  requestAnimationFrame(fn) { fn(); },
  navigator: {},
  location: {},
  crypto: { randomUUID() { return 'uuid-teste'; } }
};
contexto.window = contexto;
contexto.globalThis = contexto;

const arquivosDaAplicacao = [
  'js/core.js',
  'js/tabs.js',
  'js/documentos/unidades.js',
  'js/documentos/cadastro.js',
  'js/documentos/controle.js',
  'js/documentos/modais.js',
  'js/reunioes/core.js',
  'js/reunioes/unidades.js',
  'js/reunioes/cadastro.js',
  'js/reunioes/listagem.js',
  'js/minutas/editor.js',
  'js/minutas/formatacao.js',
  'js/minutas/historico.js',
  'js/minutas/ia.js',
  'js/minutas/fluxo.js',
  'js/minutas/exportacao.js',
  'js/dashboard.js',
  'js/init.js'
];
const app = arquivosDaAplicacao
  .map(arquivo => fs.readFileSync(arquivo, 'utf8'))
  .join('\n');
const exportar = `
globalThis.__regras = {
  somarMeses, calcularVencimento, calcularStatus, obterAnosValidade, normalizarValidadeAnos, salvar, carregar, escapeHtml,
  formatarSomenteNumeros, formatarNumeroSei, normalizarNumeroSei, numeroSeiValido, limitarTexto, normalizarParticipantes,
  normalizarLinkReuniao, normalizarMembros, normalizarFormatoReuniao, rotuloFormatoReuniao, formatarConvidadoComSetor, resumirConvidadoParaExibicao, gerarTextoMinuta, gerarHtmlDocumentoAta, carregarReunioes, cadastrarReuniao,
  obterReunioesFiltradas, normalizarQuebrasTextoColado, localizarUnidadeDocumento, documentoPertenceUnidadeSelecionada, obterSituacaoReuniao,
  frequenciasReuniao: FREQUENCIAS_REUNIAO,
  getReunioes: () => reunioes,
  setParticipantesCadastro: valor => { participantesReuniaoCadastro = valor; },
  setMinutaReuniaoId: valor => { minutaReuniaoId = valor; }
};`;
vm.runInNewContext(app + exportar, contexto, { filename: 'aplicacao-concatenada.js' });

const regras = contexto.__regras;

assert.equal(regras.somarMeses('2026-01-31', 1), '2026-02-28');
assert.equal(regras.somarMeses('2024-01-31', 1), '2024-02-29');
assert.equal(regras.somarMeses('2026-03-31', -1), '2026-02-28');
assert.equal(regras.calcularVencimento('2026-07-18', '6m'), '2027-01-18');
assert.equal(regras.calcularVencimento('2026-07-18', '3a'), '2029-07-18');
assert.equal(regras.normalizarValidadeAnos('12'), '12a');
assert.equal(regras.obterAnosValidade('12a'), 12);
assert.equal(regras.escapeHtml('<img onerror="x">'), '&lt;img onerror=&quot;x&quot;&gt;');
assert.equal(regras.formatarSomenteNumeros('00000.000000/2026-00'), '00000000000202600');
assert.equal(regras.formatarSomenteNumeros('1'.repeat(40)).length, 30);
assert.equal(regras.formatarNumeroSei('0000864872025'), '0000864-87.2025.6.01.8000');
assert.equal(regras.formatarNumeroSei('0000864-87.2025.6.01.8000'), '0000864-87.2025.6.01.8000');
assert.equal(regras.normalizarNumeroSei('0000864-87.2025.6.01.8000'), '00008648720256018000');
assert.equal(regras.numeroSeiValido('0000864872025'), true);
assert.equal(regras.numeroSeiValido('000086487202'), false);
assert.equal(regras.limitarTexto('abcdef', 3), 'abc');
assert.equal(
  regras.normalizarQuebrasTextoColado('Primeira linha sem ponto\r\ncontinuação\r\n\r\n- Item 1\r\n- Item 2'),
  'Primeira linha sem ponto continuação\n\n- Item 1\n- Item 2'
);

assert.equal(regras.calcularStatus({ data: '2000-01-01', validade: '1a' }), 'Vencido');
assert.equal(regras.calcularStatus({ tipo: 'Sem normativo', semNormativo: true, data: '' }), null);

// Reuniões: tipos, participantes, links e limites.
assert.equal(regras.frequenciasReuniao.CGOVTIC, 'Bimestral');
assert.equal(regras.frequenciasReuniao.CGTIC, 'Quinzenal');
assert.deepEqual(Array.from(regras.normalizarParticipantes('Ana; Bruno\nCarla')), ['Ana', 'Bruno', 'Carla']);
assert.equal(regras.formatarConvidadoComSetor('maria silva (sti)'), 'Maria Silva (STI)');
assert.equal(regras.formatarConvidadoComSetor('maria silva', 'STI'), 'Maria Silva (STI)');
assert.equal(regras.resumirConvidadoParaExibicao('Rose (3ª ZE — 3ª ZONA ELEITORAL)'), 'Rose (3ª ZE)');
assert.equal(regras.normalizarParticipantes(Array(35).fill('Participante')).length, 30);
assert.equal(regras.normalizarParticipantes(['x'.repeat(200)])[0].length, 180);
assert.equal(regras.normalizarLinkReuniao('https://teams.microsoft.com/reuniao'), 'https://teams.microsoft.com/reuniao');
assert.equal(regras.normalizarLinkReuniao('javascript:alert(1)'), '');
assert.equal(regras.normalizarFormatoReuniao('Presencial'), 'Presencial');
assert.equal(regras.normalizarFormatoReuniao('valor antigo'), 'Online');
assert.equal(regras.rotuloFormatoReuniao('Online'), 'On-line');
assert.equal(regras.obterSituacaoReuniao({ situacao: 'Reagendada', data: '2099-01-01', horario: '10:00' }), 'Reagendada');
assert.equal(regras.obterSituacaoReuniao({ data: '2099-01-01', horario: '10:00' }), 'Agendada');
assert.equal(regras.obterSituacaoReuniao({ situacao: 'Reagendada', data: '2000-01-01', horario: '10:00' }), 'Concluída');
assert.equal(regras.obterSituacaoReuniao({ situacao: 'Cancelada', data: '2000-01-01', horario: '10:00' }), 'Cancelada');
assert.equal(regras.normalizarLinkReuniao('ftp://servidor/reuniao'), '');
assert.equal(regras.normalizarMembros([], 'CGTIC').length, 3);
assert.equal(regras.normalizarMembros([], 'CGTIC')[0].nome, 'Edcley da Silva Firmino');
assert.equal(regras.normalizarMembros([{ cargo: 'STI', nome: 'Ana' }], 'CGTIC')[0].nome, 'Ana');
assert.equal(regras.normalizarMembros([], 'CGTIC')[0].cargo, 'Secretaria de Tecnologia da Informação');
assert.equal(regras.normalizarMembros([], 'CGOVTIC').length, 5);
assert.equal(regras.localizarUnidadeDocumento('STI').setor.codigo, 'STI');
assert.equal(regras.localizarUnidadeDocumento('ASPGOVTI').setor.codigo, 'STI');
assert.equal(regras.localizarUnidadeDocumento('GSTI').codigo, 'GSTI');
assert.equal(regras.localizarUnidadeDocumento('SDBD').setor.codigo, 'STI');
assert.equal(regras.localizarUnidadeDocumento('ASJUR').setor.codigo, 'PRES');
assert.equal(regras.localizarUnidadeDocumento('INEXISTENTE'), null);

// Migração automática de GOVTIC para CGOVTIC e corte de dados antigos.
armazenados.set('igov:reunioes', JSON.stringify([{
  id: 'reuniao-antiga', data: '2026-07-20', horario: '10:00', frequencia: 'GOVTIC',
  pauta: 'P'.repeat(250), participantes: 'Ana, Bruno', resumo: 'R'.repeat(150)
}]));
regras.carregarReunioes();
let reuniaoMigrada = regras.getReunioes()[0];
assert.equal(reuniaoMigrada.frequencia, 'CGOVTIC');
assert.equal(reuniaoMigrada.pauta.length, 200);
assert.equal(reuniaoMigrada.resumo.length, 100);
assert.deepEqual(Array.from(reuniaoMigrada.participantes), ['Ana', 'Bruno']);

// Cadastro e persistência de uma reunião válida.
armazenados.set('igov:reunioes', '[]');
regras.carregarReunioes();
elemento('r-data').value = '2026-08-10';
elemento('r-horario').value = '14:30';
elemento('r-frequencia').value = 'CGTIC';
elemento('r-formato').value = 'Presencial';
elemento('r-link').value = 'https://meet.example/reuniao';
elemento('r-pauta').value = 'Acompanhamento mensal';
elemento('r-resumo').value = 'Encaminhamentos aprovados';
regras.setParticipantesCadastro(['Ana', 'Bruno']);
regras.cadastrarReuniao();
assert.equal(regras.getReunioes().length, 1);
assert.equal(regras.getReunioes()[0].frequencia, 'CGTIC');
assert.equal(regras.getReunioes()[0].formato, 'Presencial');
assert.equal(regras.getReunioes()[0].link, '');
assert.deepEqual(Array.from(regras.getReunioes()[0].participantes), ['Ana', 'Bruno']);
assert.equal(JSON.parse(armazenados.get('igov:reunioes')).length, 1);

const textoMinuta = regras.gerarTextoMinuta(regras.getReunioes()[0], 'Discussões registradas.');
assert.match(textoMinuta, /ATA - PRESI\/CGTIC/);
assert.match(textoMinuta, /Formato: Presencial/);
assert.match(textoMinuta, /Local: Reunião presencial/);
assert.match(textoMinuta, /DESCRIÇÃO DOS PROBLEMAS \/ SOLICITAÇÕES \/ DELIBERAÇÕES/);
assert.match(textoMinuta, /PROVIDÊNCIAS/);
assert.match(textoMinuta, /Discussões registradas\./);
regras.setMinutaReuniaoId(regras.getReunioes()[0].id);
elemento('minuta-reuniao-descricao').innerText = 'Discussões registradas.';
elemento('minuta-reuniao-providencias').innerText = 'Providência registrada.';
elemento('minuta-reuniao-texto').innerText = 'ATA - PRESI/CGTIC\nProvidência registrada.';
const htmlAta = regras.gerarHtmlDocumentoAta();
assert.match(htmlAta, /ATA - PRESI\/CGTIC/);
assert.doesNotMatch(htmlAta, /MINUTA SEM ASSINATURA/);
assert.match(htmlAta, /Providência registrada\./);

// Busca por pauta e participante.
elemento('reuniao-busca').value = 'bruno';
assert.equal(regras.obterReunioesFiltradas().length, 1);
elemento('reuniao-busca').value = 'inexistente';
assert.equal(regras.obterReunioesFiltradas().length, 0);
elemento('reuniao-busca').value = '';

regras.salvar().then(resultado => {
  assert.equal(resultado, true);
  assert.equal(armazenados.has('igov:documentos'), true);
  console.log('Testes das regras concluídos com sucesso.');
}).catch(erro => {
  console.error(erro);
  process.exitCode = 1;
});
