/* ===== Estados globais: erros, falta de conexão e carregamento lento ===== */

const ESTADOS_ERRO = {
  403:{icone:'×', titulo:'Acesso não autorizado', mensagem:'Você não possui permissão para acessar este conteúdo.'},
  404:{icone:'?', titulo:'Página não encontrada', mensagem:'O conteúdo pode ter sido removido ou o endereço está incorreto.'},
  500:{icone:'!', titulo:'Erro interno do sistema', mensagem:'Não foi possível concluir a solicitação. Tente novamente em alguns instantes.'},
  offline:{icone:'↯', codigo:'Sem conexão', titulo:'Você está sem internet', mensagem:'Verifique sua conexão e tente novamente.'}
};

let estadoSistemaAtual = null;

function mostrarTelaErro(tipo=500, opcoes={}){
  const chave = String(tipo);
  const configuracao = {...(ESTADOS_ERRO[chave] || ESTADOS_ERRO[500]), ...opcoes};
  const tela = document.getElementById('estado-sistema');
  if(!tela) return;
  estadoSistemaAtual = chave;
  tela.dataset.tipo = chave;
  document.getElementById('estado-ilustracao').textContent = configuracao.icone;
  document.getElementById('estado-codigo').textContent = configuracao.codigo || `Erro ${chave}`;
  document.getElementById('estado-titulo').textContent = configuracao.titulo;
  document.getElementById('estado-mensagem').textContent = configuracao.mensagem;
  const tentar = document.getElementById('estado-tentar');
  tentar.textContent = configuracao.textoBotao || 'Tentar novamente';
  tentar.onclick = configuracao.aoTentar || (()=>window.location.reload());
  document.getElementById('estado-voltar').onclick = configuracao.aoVoltar || (()=>{
    if(history.length > 1) history.back(); else ocultarTelaErro();
  });
  tela.hidden = false;
  tela.setAttribute('aria-hidden','false');
  tentar.focus();
}

function ocultarTelaErro(){
  const tela = document.getElementById('estado-sistema');
  if(!tela) return;
  tela.hidden = true;
  tela.setAttribute('aria-hidden','true');
  estadoSistemaAtual = null;
}

function htmlEsqueleto(){
  return `<div class="esqueleto-resumo" aria-hidden="true">
    ${'<div class="esqueleto-card"></div>'.repeat(4)}
  </div>
  <div class="esqueleto-filtros" aria-hidden="true">
    ${'<div class="esqueleto-linha"></div>'.repeat(4)}
  </div>
  <div class="esqueleto-tabela" aria-hidden="true">
    ${'<div class="esqueleto-linha"></div>'.repeat(7)}
  </div>`;
}

function mostrarEsqueleto(alvo=document.querySelector('.view.active')){
  if(!alvo || alvo.querySelector(':scope > .carregamento-esqueleto')) return;
  alvo.classList.add('carregando');
  alvo.setAttribute('aria-busy','true');
  const esqueleto = document.createElement('div');
  esqueleto.className = 'carregamento-esqueleto';
  esqueleto.innerHTML = htmlEsqueleto();
  alvo.appendChild(esqueleto);
}

function ocultarEsqueleto(alvo=document.querySelector('.view.active')){
  if(!alvo) return;
  alvo.querySelector(':scope > .carregamento-esqueleto')?.remove();
  alvo.classList.remove('carregando');
  alvo.removeAttribute('aria-busy');
}

async function executarComCarregamento(operacao, opcoes={}){
  const alvo = opcoes.alvo || document.querySelector('.view.active');
  const atraso = Number.isFinite(opcoes.atraso) ? opcoes.atraso : 350;
  const temporizador = setTimeout(()=>mostrarEsqueleto(alvo), atraso);
  try{
    return await operacao();
  }catch(erro){
    mostrarTelaErro(erro?.status === 403 ? 403 : erro?.status === 404 ? 404 : 500);
    throw erro;
  }finally{
    clearTimeout(temporizador);
    ocultarEsqueleto(alvo);
  }
}

window.addEventListener('offline',()=>mostrarTelaErro('offline'));
window.addEventListener('online',()=>{
  if(estadoSistemaAtual === 'offline') ocultarTelaErro();
});
document.addEventListener('DOMContentLoaded',()=>{
  if(!navigator.onLine) mostrarTelaErro('offline');
});