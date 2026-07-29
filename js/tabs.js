/* ===== js/tabs.js ===== */
/* ===== ABAS: alternância entre Controle, Cadastro e Sobre ===== */

const TABS_PRINCIPAIS = ['dashboard', 'acompanhamento', 'reunioes', 'minutas', 'cadastro', 'sobre'];

function setTab(tab, opcoes = {}){
  if(!TABS_PRINCIPAIS.includes(tab)) tab = 'dashboard';
  TABS_PRINCIPAIS.forEach(nome => {
    const ativo = tab === nome;
    const botao = document.getElementById(`tab-${nome}`);
    const painel = document.getElementById(`view-${nome}`);
    botao?.classList.toggle('active', ativo);
    painel?.classList.toggle('active', ativo);
    botao?.setAttribute('aria-selected', String(ativo));
    botao?.setAttribute('tabindex', ativo ? '0' : '-1');
    painel?.setAttribute('aria-hidden', String(!ativo));
  });
  const hash = `#${tab}`;
  if(!opcoes.semHistorico && window.location?.hash !== hash && typeof window.history?.pushState === 'function'){
    window.history.pushState({ tab }, '', hash);
  }
  if(tab === 'dashboard' && typeof renderDashboard === 'function') renderDashboard();
}

function inicializarNavbar(){
  const tabInicial = window.location?.hash?.slice(1) || '';
  setTab(TABS_PRINCIPAIS.includes(tabInicial) ? tabInicial : 'dashboard', { semHistorico:true });
  if(typeof window.addEventListener === 'function'){
    const sincronizarComUrl = () => setTab(window.location?.hash?.slice(1), { semHistorico:true });
    window.addEventListener('popstate', sincronizarComUrl);
    window.addEventListener('hashchange', sincronizarComUrl);
  }
  TABS_PRINCIPAIS.forEach(nome => {
    const painel = document.getElementById(`view-${nome}`);
    painel?.setAttribute('role', 'tabpanel');
    painel?.setAttribute('aria-labelledby', `tab-${nome}`);
  });
  document.querySelector('.navbar')?.addEventListener('keydown', evento => {
    if(!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(evento.key)) return;
    evento.preventDefault();
    const atual = TABS_PRINCIPAIS.indexOf(document.activeElement?.id?.replace('tab-', ''));
    let proximo = atual < 0 ? 0 : atual;
    if(evento.key === 'Home') proximo = 0;
    if(evento.key === 'End') proximo = TABS_PRINCIPAIS.length - 1;
    if(evento.key === 'ArrowLeft') proximo = (proximo - 1 + TABS_PRINCIPAIS.length) % TABS_PRINCIPAIS.length;
    if(evento.key === 'ArrowRight') proximo = (proximo + 1) % TABS_PRINCIPAIS.length;
    setTab(TABS_PRINCIPAIS[proximo]);
    document.getElementById(`tab-${TABS_PRINCIPAIS[proximo]}`)?.focus();
  });
}