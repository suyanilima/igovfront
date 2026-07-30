/* ===== js/core.js ===== */
/* ===== NÚCLEO: estado, storage e utilitários compartilhados por todas as abas ===== */

let docs = [];
const STORAGE_KEY = 'igov:documentos';

const PAGINACAO_KEY = 'igov:itens-por-pagina';
const OPCOES_ITENS_POR_PAGINA = [10, 20, 50];
let ITENS_POR_PAGINA = (() => {
  try{
    const valor = Number(localStorage.getItem(PAGINACAO_KEY));
    return OPCOES_ITENS_POR_PAGINA.includes(valor) ? valor : 10;
  }catch(e){
    return 10;
  }
})();
let paginaAtual = 1;
let filtrosAnteriores = '';

const LIMITES_CAMPOS = Object.freeze({
  nome: 70,
  sei: 30,
  baseLegalNumero: 50,
  gestorNome: 50,
  gestorSetor: 50,
  gestorEmail: 50,
  gestorWhatsapp: 16,
  descricao: 300,
  motivo: 300
});

function limitarTexto(valor, limite){
  return String(valor ?? '').slice(0, limite);
}

function mostrarErroCampo(elemento, mensagem){
  if(!elemento) return;
  const idErro = `erro-${elemento.id || uid()}`;
  let erro = document.getElementById(idErro);
  if(!erro){
    erro = document.createElement('div');
    erro.id = idErro;
    erro.className = 'field-error';
    elemento.insertAdjacentElement('afterend', erro);
  }
  erro.textContent = mensagem;
  elemento.classList?.add('campo-invalido');
}

function limparErroCampo(elemento){
  if(!elemento) return;
  document.getElementById(`erro-${elemento.id}`)?.remove();
  elemento.classList?.remove('campo-invalido');
}

const TYPE_INITIALS = { Projeto:'PJ', Plano:'PL', Planilha:'PN', Processo:'PC', Normativo:'NR', 'Sem normativo':'--' };

// Prazos de validade disponíveis no cadastro e seus respectivos períodos de alerta
const VALIDADE_LABELS = new Proxy({ '6m':'6 meses' }, {
  get(alvo, validade){
    if(validade in alvo) return alvo[validade];
    const anos = obterAnosValidade(validade);
    return anos ? `${anos} ano${anos === 1 ? '' : 's'}` : '';
  }
});

function obterAnosValidade(validade){
  const correspondencia = String(validade || '').match(/^(\d{1,2})(?:a)?$/);
  const anos = correspondencia ? Number(correspondencia[1]) : 0;
  return Number.isInteger(anos) && anos >= 1 && anos <= 99 ? anos : 0;
}

function normalizarValidadeAnos(validade){
  const anos = obterAnosValidade(validade);
  return anos ? `${anos}a` : '';
}

// Rótulos exibidos para cada status (o token interno 'Alerta' aparece como "A vencer")
const STATUS_LABELS = { Vigente:'Vigente', Alerta:'A vencer', Vencido:'Vencido' };
function statusLabel(status){ return STATUS_LABELS[status] || status; }

function uid(){
  return globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,9)}`;
}

function todayStr(){
  const d = new Date();
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}

function diffDias(dataStr){
  const hoje = new Date(); hoje.setHours(0,0,0,0);
  const alvo = new Date(dataStr+'T00:00:00');
  return Math.round((alvo - hoje) / 86400000);
}

function formatarNomeProprio(valor){
  const palavrasMinusculas = [
    'da', 'das', 'de', 'do', 'dos', 'e'
  ];

  return valor
    .toLowerCase()
    .split(/\s+/)
    .map((palavra, indice) => {
      if(indice > 0 && palavrasMinusculas.includes(palavra)){
        return palavra;
      }

      return palavra.charAt(0).toUpperCase() + palavra.slice(1);
    })
    .join(' ');
}

function formatarMaiusculo(valor){
  return valor.toUpperCase();
}

function formatarEmail(valor){
  return valor.toLowerCase().replace(/\s/g, '');
}

function formatarSomenteNumeros(valor){
  return String(valor || '').replace(/\D/g, '').slice(0, LIMITES_CAMPOS.sei);
}

const SUFIXO_SEI = '6018000';
const TAMANHO_PARTE_VARIAVEL_SEI = 13;

function obterParteVariavelSei(valor){
  const numeros = formatarSomenteNumeros(valor);
  return numeros.slice(0, TAMANHO_PARTE_VARIAVEL_SEI);
}

function normalizarNumeroSei(valor){
  const parteVariavel = obterParteVariavelSei(valor);
  return parteVariavel.length === TAMANHO_PARTE_VARIAVEL_SEI
    ? parteVariavel + SUFIXO_SEI
    : parteVariavel;
}

function formatarNumeroSei(valor){
  const numeros = obterParteVariavelSei(valor);
  let resultado = numeros.slice(0, 7);
  if(numeros.length > 7) resultado += `-${numeros.slice(7, 9)}`;
  if(numeros.length > 9) resultado += `.${numeros.slice(9, 13)}`;
  if(numeros.length === TAMANHO_PARTE_VARIAVEL_SEI) resultado += '.6.01.8000';
  return resultado;
}

function numeroSeiValido(valor){
  return obterParteVariavelSei(valor).length === TAMANHO_PARTE_VARIAVEL_SEI;
}

function formatarTelefone(valor){
  const numeros = valor.replace(/\D/g, '').slice(0, 11);

  if(numeros.length <= 2){
    return numeros.length
      ? `(${numeros}`
      : '';
  }

  if(numeros.length <= 7){
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
  }

  return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
}

function primeiraLetraMaiuscula(valor){
  const texto = valor.trimStart();

  if(!texto) return '';

  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// Calcula a data de vencimento a partir da data de vigência (última renovação) + prazo de validade
function calcularVencimento(dataVigencia, validade){
  const meses = validade === '6m' ? 6 : (obterAnosValidade(validade) || 1) * 12;
  return somarMeses(dataVigencia, meses);
}

// "Prazo?" -> Vigente | Próximo do vencimento (Alerta) | Vencido
// Recebe o documento completo para poder calcular o início do alerta conforme seu prazo de validade
function calcularStatus(doc){
  if(doc && typeof doc === 'object' && (doc.semNormativo || doc.tipo === 'Sem normativo')) return null;
  const dataStr = (doc && typeof doc === 'object') ? doc.data : doc;
  const d = diffDias(dataStr);
  if(d < 0) return 'Vencido';

  // Documentos com prazo de validade definido: alerta calculado a partir do vencimento
  if(doc && typeof doc === 'object' && doc.validade){
    const mesesAlerta = doc.validade === '6m' ? 3 : 6;
    const inicioAlerta = somarMeses(dataStr, -mesesAlerta);
    if(diffDias(inicioAlerta) <= 0) return 'Alerta';
    return 'Vigente';
  }

  // Compatibilidade com documentos antigos (sem prazo de validade cadastrado)
  if(d <= 90) return 'Alerta';
  return 'Vigente';
}

function fmtData(dataStr){
  if(!dataStr) return '-';
  const [y,m,d] = dataStr.split('-');
  return `${d}/${m}/${y}`;
}

function fmtDias(dataStr){
  const d = diffDias(dataStr);
  if(d < 0) return `venceu há ${Math.abs(d)} dia${Math.abs(d)===1?'':'s'}`;
  if(d === 0) return 'vence hoje';
  return `em ${d} dia${d===1?'':'s'}`;
}

// Total de dias de validade do documento (da data de vigência até o vencimento calculado)
function fmtValidoPor(doc){
  if(!doc.dataVigencia && !doc.dataCriacao) return '';
  const inicio = doc.dataVigencia || doc.dataCriacao;
  const dias = Math.round((new Date(doc.data+'T00:00:00') - new Date(inicio+'T00:00:00')) / 86400000);
  if(dias <= 0) return '';
  return `Válido por ${dias} dia${dias===1?'':'s'}`;
}

async function salvar(){
  try{
    const conteudo = JSON.stringify(docs);
    if(window.storage?.set){
      await window.storage.set(STORAGE_KEY, conteudo, false);
    } else {
      localStorage.setItem(STORAGE_KEY, conteudo);
    }
    return true;
  }catch(e){ console.error('Erro ao salvar', e); }
  toast('Não foi possível salvar os dados neste navegador.', 'vencido');
  return false;
}

async function carregar(){
  try{
    const conteudo = window.storage?.get
      ? (await window.storage.get(STORAGE_KEY, false))?.value
      : localStorage.getItem(STORAGE_KEY);
    const dados = conteudo ? JSON.parse(conteudo) : [];
    docs = Array.isArray(dados) ? dados : [];
    docs.forEach(doc => {
      doc.nome = limitarTexto(doc.nome, LIMITES_CAMPOS.nome);
      doc.sei = normalizarNumeroSei(doc.sei);
      doc.baseLegalNumero = limitarTexto(doc.baseLegalNumero, LIMITES_CAMPOS.baseLegalNumero);
      doc.gestorNome = limitarTexto(doc.gestorNome, LIMITES_CAMPOS.gestorNome);
      doc.gestorSetor = limitarTexto(doc.gestorSetor, LIMITES_CAMPOS.gestorSetor);
      doc.unidade = typeof localizarUnidadeDocumento === 'function' ? (localizarUnidadeDocumento(doc.unidade)?.codigo || '') : limitarTexto(doc.unidade, 30);
      doc.gestorEmail = limitarTexto(doc.gestorEmail, LIMITES_CAMPOS.gestorEmail);
      doc.gestorWhatsapp = limitarTexto(doc.gestorWhatsapp, LIMITES_CAMPOS.gestorWhatsapp);
      doc.descricao = limitarTexto(doc.descricao, LIMITES_CAMPOS.descricao);
      if(doc.semNormativo || doc.tipo === 'Sem normativo'){
        doc.semNormativo = true;
        doc.tipo = 'Sem normativo';
        doc.sei = '';
        doc.dataVigencia = '';
        doc.validade = '';
        doc.data = '';
        doc.baseLegal = 'Sem normativo';
        doc.baseLegalNumero = '';
      }
    });
  }catch(e){
    console.error('Erro ao carregar', e);
    docs = [];
  }
  render();
}

function toast(html, kind){
  const t = document.getElementById('toast');
  t.innerHTML = html;
  t.className = kind || '';
  t.style.display = 'block';
  clearTimeout(t._timer);
  t._timer = setTimeout(()=> t.style.display='none', 4200);
}

let focoAntesDoModal = null;

function abrirModalElemento(id){
  const overlay = document.getElementById(id);
  if(!overlay) return;
  inicializarContadoresCaracteres(overlay);
  focoAntesDoModal = document.activeElement;
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  if(typeof sincronizarSeletoresPersonalizados === 'function') sincronizarSeletoresPersonalizados();
  requestAnimationFrame(() => overlay.querySelector('.modal')?.focus());
}

function fecharModalElemento(id){
  const overlay = document.getElementById(id);
  if(!overlay) return;
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  focoAntesDoModal?.focus?.();
  focoAntesDoModal = null;
}

document.addEventListener('keydown', event => {
  if(event.key !== 'Escape') return;
  const aberto = document.querySelector('[id$="modal-overlay"].open');
  if(!aberto) return;
  const fechadores = {
    'modal-overlay': fecharModal,
    'delete-modal-overlay': fecharModalExcluir,
    'delete-reuniao-modal-overlay': fecharModalExcluirReuniao,
    'delete-minuta-modal-overlay': fecharModalExcluirMinuta,
    'exportar-ata-modal-overlay': fecharModalExportarAta,
    'edit-reuniao-modal-overlay': fecharModalEditarReuniao,
    'resumo-reuniao-modal-overlay': fecharResumoReuniao,
    'edit-modal-overlay': fecharModalEditar,
    'resumo-modal-overlay': fecharModalResumo,
    'notificar-modal-overlay': fecharModalNotificar,
    'historico-modal-overlay': fecharModalHistorico
  };
  fechadores[aberto.id]?.();
});

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('input, select, textarea').forEach(campo => {
    campo.addEventListener('input', () => limparErroCampo(campo));
    campo.addEventListener('change', () => limparErroCampo(campo));
  });
});

function escapeHtml(s){
  return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function atualizarContadorCampo(campo){
  if(!campo || campo.readOnly || campo.disabled || campo.type === 'hidden') return;
  const limite = Number(campo.maxLength);
  if(!Number.isFinite(limite) || limite <= 0) return;
  let contador = campo.nextElementSibling;
  if(!contador?.classList?.contains('contador-caracteres') && !contador?.classList?.contains('contador-caracteres-campo')){
    contador = document.createElement('div');
    contador.className = 'contador-caracteres-campo';
    contador.setAttribute('aria-live', 'polite');
    campo.insertAdjacentElement('afterend', contador);
  }
  const quantidade = String(campo.value || '').length;
  contador.textContent = `${quantidade}/${limite}`;
  contador.classList.toggle('proximo-limite', quantidade >= Math.ceil(limite * .9));
  campo.dataset.contadorCaracteres = 'ativo';
}

function inicializarContadoresCaracteres(raiz = document){
  raiz.querySelectorAll?.('textarea[maxlength]').forEach(atualizarContadorCampo);
}

document.addEventListener('input', evento => {
  if(evento.target?.matches?.('textarea[maxlength]')) atualizarContadorCampo(evento.target);
});

document.addEventListener('focusin', evento => {
  if(evento.target?.matches?.('textarea[maxlength]')) atualizarContadorCampo(evento.target);
});

document.addEventListener('DOMContentLoaded', () => {
  inicializarContadoresCaracteres();
  if(typeof MutationObserver === 'function'){
    new MutationObserver(mudancas => mudancas.forEach(mudanca => mudanca.addedNodes.forEach(no => {
      if(no.nodeType !== 1) return;
      if(no.matches?.('textarea[maxlength]')) atualizarContadorCampo(no);
      inicializarContadoresCaracteres(no);
    }))).observe(document.body, {childList:true, subtree:true});
  }
});

// Adiciona uma entrada ao histórico de edições de um documento
function addHistorico(doc, tipo, texto, responsavel){
  if(!Array.isArray(doc.historico)) doc.historico = [];
  doc.historico.push({
    dataHora: new Date().toISOString(),
    tipo,
    texto,
    responsavel: responsavel || ''
  });
}

function fmtDataHora(isoStr){
  const d = new Date(isoStr);
  const data = d.toLocaleDateString('pt-BR');
  const hora = d.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
  return `${data} às ${hora}`;
}

// Soma meses a uma data (YYYY-MM-DD) preservando o dia quando possível
function somarMeses(dataStr, meses){
  const [y,m,d] = dataStr.split('-').map(Number);
  if(!y || !m || !d || !Number.isFinite(meses)) return dataStr;
  const base = new Date(y, m-1 + meses, 1);
  const ultimoDia = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
  base.setDate(Math.min(d, ultimoDia));
  return base.getFullYear()+'-'+String(base.getMonth()+1).padStart(2,'0')+'-'+String(base.getDate()).padStart(2,'0');
}
