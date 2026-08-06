/* ===== APRESENTAÇÃO INICIAL DO NORMA ===== */
const APRESENTACAO_NORMA_KEY='norma:apresentacao-concluida';
const APRESENTACAO_NORMA_ETAPAS=[
  {
    numero:'01',
    kicker:'Documentos',
    titulo:'Gerencie documentos e prazos',
    texto:'Cadastre documentos, acompanhe a vigência e identifique rapidamente os itens vencidos ou que exigem atenção.'
  },
  {
    numero:'02',
    kicker:'Reuniões',
    titulo:'Organize a governança',
    texto:'Registre reuniões por unidade, participantes, pautas, formatos e situações em um fluxo centralizado e fácil de consultar.'
  },
  {
    numero:'03',
    kicker:'Atas',
    titulo:'Transforme reuniões em resultados',
    texto:'Crie, revise e exporte atas a partir de transcrições, anotações ou resumos, com acompanhamento por unidade.'
  }
];

let apresentacaoNormaEtapa=0;
let apresentacaoNormaAberturaManual=false;

function renderizarApresentacaoNorma(){
  const etapa=APRESENTACAO_NORMA_ETAPAS[apresentacaoNormaEtapa];
  if(!etapa) return;
  document.getElementById('apresentacao-norma-icone').textContent=etapa.numero;
  document.getElementById('apresentacao-norma-kicker').textContent=etapa.kicker;
  document.getElementById('apresentacao-norma-titulo').textContent=etapa.titulo;
  document.getElementById('apresentacao-norma-texto').textContent=etapa.texto;
  document.querySelectorAll('.apresentacao-etapas span').forEach((item,indice)=>item.classList.toggle('ativo',indice===apresentacaoNormaEtapa));
  document.getElementById('apresentacao-voltar').disabled=apresentacaoNormaEtapa===0;
  document.getElementById('apresentacao-avancar').textContent=apresentacaoNormaEtapa===APRESENTACAO_NORMA_ETAPAS.length-1?'Começar':'Próximo';
}

function abrirApresentacaoNorma(manual=false){
  const overlay=document.getElementById('apresentacao-norma-overlay');
  if(!overlay) return;
  apresentacaoNormaEtapa=0;
  apresentacaoNormaAberturaManual=manual;
  document.getElementById('apresentacao-nao-mostrar').checked=!manual;
  renderizarApresentacaoNorma();
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';
  requestAnimationFrame(()=>overlay.querySelector('.apresentacao-norma')?.focus());
}

function concluirApresentacaoNorma(){
  const overlay=document.getElementById('apresentacao-norma-overlay');
  if(!overlay) return;
  const naoMostrar=document.getElementById('apresentacao-nao-mostrar')?.checked;
  try{
    if(naoMostrar) localStorage.setItem(APRESENTACAO_NORMA_KEY,'sim');
    else if(!apresentacaoNormaAberturaManual) localStorage.removeItem(APRESENTACAO_NORMA_KEY);
  }catch(e){}
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden','true');
  document.body.style.overflow='';
}

function avancarApresentacaoNorma(){
  if(apresentacaoNormaEtapa<APRESENTACAO_NORMA_ETAPAS.length-1){
    apresentacaoNormaEtapa++;
    renderizarApresentacaoNorma();
    return;
  }
  concluirApresentacaoNorma();
}

function voltarApresentacaoNorma(){
  if(apresentacaoNormaEtapa>0){
    apresentacaoNormaEtapa--;
    renderizarApresentacaoNorma();
  }
}

function pularApresentacaoNorma(){
  concluirApresentacaoNorma();
}

document.addEventListener('keydown',evento=>{
  const aberto=document.getElementById('apresentacao-norma-overlay')?.classList.contains('open');
  if(!aberto) return;
  if(evento.key==='Escape') pularApresentacaoNorma();
  if(evento.key==='ArrowRight') avancarApresentacaoNorma();
  if(evento.key==='ArrowLeft') voltarApresentacaoNorma();
});

document.addEventListener('DOMContentLoaded',()=>{
  let concluida=false;
  try{ concluida=localStorage.getItem(APRESENTACAO_NORMA_KEY)==='sim'; }catch(e){}
  if(!concluida) setTimeout(()=>abrirApresentacaoNorma(false),350);
});
