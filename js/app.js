/* ===== PONTO DE ENTRADA DA APLICAÇÃO ===== */
/* ===== INICIALIZAÇÃO: roda por último, depois que todas as funções acima já existem ===== */

function tickClock(){
  const relogio = document.getElementById('clock');
  if(!relogio) return;
  const now = new Date();
  const data = now.toLocaleDateString('pt-BR', {weekday:'long', day:'2-digit', month:'long', year:'numeric'});
  relogio.textContent = data.charAt(0).toUpperCase() + data.slice(1);
}

function ajustarNumeroInvertido(id, direcao){
  const campo = document.getElementById(id);
  if(!campo) return;
  const minimo = Number.isFinite(Number(campo.min)) && campo.min !== '' ? Number(campo.min) : -Infinity;
  const maximo = Number.isFinite(Number(campo.max)) && campo.max !== '' ? Number(campo.max) : Infinity;
  const passo = Number(campo.step) || 1;
  const atual = Number(campo.value) || (Number.isFinite(minimo) ? minimo : 0);
  campo.value = String(Math.min(maximo,Math.max(minimo,atual+(direcao*passo))));
  campo.dispatchEvent(new Event('input',{bubbles:true}));
  campo.dispatchEvent(new Event('change',{bubbles:true}));
  campo.focus();
}

function fecharSeletoresToolbar(exceto=null){
  document.querySelectorAll('.toolbar-select-personalizado').forEach(componente=>{
    if(componente===exceto) return;
    componente.querySelector('.toolbar-select-opcoes').hidden=true;
    componente.querySelector('.toolbar-select-botao').setAttribute('aria-expanded','false');
  });
}

function atualizarSeletorToolbar(select, botao, lista){
  const opcoes=[...select.options];
  const selecionada=opcoes.find(opcao=>opcao.value===select.value) || opcoes[0];
  botao.textContent=selecionada?.textContent || 'Selecione...';
  lista.replaceChildren(...opcoes.map(opcao=>{
    const item=document.createElement('button');
    item.type='button';
    item.textContent=opcao.textContent;
    item.className=opcao===selecionada?'selecionada':'';
    item.setAttribute('role','option');
    item.setAttribute('aria-selected',String(opcao===selecionada));
    item.addEventListener('click',()=>{
      select.value=opcao.value;
      select.dispatchEvent(new Event('change',{bubbles:true}));
      atualizarSeletorToolbar(select,botao,lista);
      lista.hidden=true;
      botao.setAttribute('aria-expanded','false');
      botao.focus();
    });
    return item;
  }));
}

function inicializarSeletoresToolbar(){
  document.querySelectorAll('.toolbar select, #f-tipo, #f-baselegal, #edit-tipo, #edit-baselegal, #r-formato, #edit-r-formato').forEach(select=>{
    if(select.closest('.toolbar-select-personalizado')) return;
    const componente=document.createElement('div');
    componente.className='toolbar-select-personalizado';
    const botao=document.createElement('button');
    botao.type='button';
    botao.className='toolbar-select-botao';
    botao.setAttribute('aria-haspopup','listbox');
    botao.setAttribute('aria-expanded','false');
    botao.setAttribute('aria-label',select.getAttribute('aria-label') || select.previousElementSibling?.textContent || 'Selecionar opção');
    const lista=document.createElement('div');
    lista.className='toolbar-select-opcoes';
    lista.setAttribute('role','listbox');
    lista.hidden=true;
    select.parentNode.insertBefore(componente,select);
    componente.append(select,botao,lista);
    atualizarSeletorToolbar(select,botao,lista);
    select._sincronizarSeletorPersonalizado=()=>atualizarSeletorToolbar(select,botao,lista);
    botao.addEventListener('click',()=>{
      const abrir=lista.hidden;
      fecharSeletoresToolbar(abrir?componente:null);
      lista.hidden=!abrir;
      botao.setAttribute('aria-expanded',String(abrir));
    });
    botao.addEventListener('keydown',evento=>{
      if(evento.key==='Escape'){ lista.hidden=true; botao.setAttribute('aria-expanded','false'); }
      if(['ArrowDown','Enter',' '].includes(evento.key) && lista.hidden){ evento.preventDefault(); botao.click(); lista.querySelector('button')?.focus(); }
    });
    select.addEventListener('change',()=>atualizarSeletorToolbar(select,botao,lista));
    if(typeof MutationObserver!=='undefined') new MutationObserver(()=>atualizarSeletorToolbar(select,botao,lista)).observe(select,{childList:true,subtree:true});
  });
}

function sincronizarSeletoresPersonalizados(){
  document.querySelectorAll('select').forEach(select=>select._sincronizarSeletorPersonalizado?.());
}

inicializarNavbar();
inicializarInterfaceCompartilhada();
tickClock();
setInterval(tickClock, 60000);

popularSetoresConvidados();
carregar();
inicializarSeletoresToolbar();
document.addEventListener('click',evento=>{
  if(!evento.target.closest?.('.toolbar-select-personalizado')) fecharSeletoresToolbar();
});
