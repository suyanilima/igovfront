/* ===== ATAS LISTAGEM ===== */

function obterSituacaoAtaListagem(reuniao){
  const registroAta = minutasHistorico.find(registro => registro.reuniao?.id === reuniao.id);
  const situacaoReuniao = typeof obterSituacaoReuniao === 'function' ? obterSituacaoReuniao(reuniao) : (reuniao.situacao || 'Agendada');
  if(registroAta) return {rotulo:'Gerada', classe:'gerada', registro:registroAta};
  if(situacaoReuniao === 'Concluída') return {rotulo:'Não concluída', classe:'nao-concluida', registro:null};
  return {rotulo:'Pendente', classe:'pendente', registro:null};
}

function renderEscolhaReuniaoMinuta(){
  const lista = document.getElementById('minuta-reunioes-disponiveis');
  const totalAtas = document.getElementById('atas-total');
  if(!lista) return;
  popularFiltrosEscolhaMinuta();
  const busca = (document.getElementById('minuta-busca-reuniao')?.value || '').trim().toLowerCase();
  const ano = document.getElementById('minuta-filtro-ano')?.value || '';
  const unidade = document.getElementById('minuta-filtro-unidade')?.value || '';
  const situacaoAtaFiltro = document.getElementById('ata-filtro-situacao')?.value || '';
  const disponiveis = [...reunioes]
    .filter(item => !ano || (item.data || '').slice(0,4) === ano)
    .filter(item => !unidade || item.frequencia === unidade)
    .filter(item => !situacaoAtaFiltro || obterSituacaoAtaListagem(item).classe === situacaoAtaFiltro)
    .filter(item => !busca || [item.frequencia, nomeUnidadeFiltroMinuta(item.frequencia), item.pauta, fmtData(item.data)].join(' ').toLowerCase().includes(busca))
    .sort((a,b) => `${b.data}T${b.horario}`.localeCompare(`${a.data}T${a.horario}`));

  if(totalAtas) totalAtas.textContent=`${disponiveis.length} ${disponiveis.length===1?'ata':'atas'}`;
  if(!reunioes.length){
    lista.innerHTML = '<div class="minuta-escolha-vazia">Nenhuma reunião cadastrada.<button type="button" onclick="setTab(\'cadastro\'); selecionarModoCadastro(\'reuniao\')">Cadastrar reunião</button></div>';
    renderPaginacaoAtas(0);
    return;
  }
  if(!disponiveis.length){
    lista.innerHTML = '<div class="minuta-escolha-vazia">Nenhuma reunião encontrada para essa busca.</div>';
    renderPaginacaoAtas(0);
    return;
  }
  const totalPaginas=Math.ceil(disponiveis.length/itensPorPaginaAtas);
  if(paginaAtas>totalPaginas) paginaAtas=totalPaginas;
  const inicio=(paginaAtas-1)*itensPorPaginaAtas;
  const atasPagina=disponiveis.slice(inicio,inicio+itensPorPaginaAtas);
  lista.innerHTML = atasPagina.map(item => {
    const situacaoAta = obterSituacaoAtaListagem(item);
    const minutaExistente = situacaoAta.registro;
    const acao = minutaExistente ? `abrirMinutaHistorico('${minutaExistente.id}')` : `abrirMinutaReuniao('${item.id}')`;
    const menu = minutaExistente
      ? `<button type="button" onclick="abrirMinutaHistorico('${minutaExistente.id}')">Editar ata</button>
         <button type="button" onclick="abrirModalExportarAta('${minutaExistente.id}')">Exportar</button>
         <div class="divider"></div><button class="del" type="button" onclick="excluirMinutaHistorico('${minutaExistente.id}')">Excluir ata</button>`
      : `<button type="button" onclick="abrirMinutaReuniao('${item.id}')">Gerar ata</button>`;
    return `<div class="minuta-reuniao-opcao${minutaExistente ? ' com-minuta' : ''}" role="button" tabindex="0" onclick="${acao}" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();${acao}}">
      <span class="minuta-reuniao-data"><strong>${escapeHtml(fmtData(item.data))}</strong><small>${escapeHtml(item.horario)}</small></span>
      <span class="minuta-reuniao-conteudo"><strong>${escapeHtml(item.frequencia)}</strong></span>
      <span class="ata-reuniao-pauta">${escapeHtml(item.pauta || 'Sem pauta informada')}</span>
      <span class="ata-situacao ${situacaoAta.classe}">${situacaoAta.rotulo}</span>
      <div class="actions minuta-reuniao-acoes" onclick="event.stopPropagation()" onkeydown="event.stopPropagation()"><button class="actions-toggle" type="button" onclick="toggleAcoes(event,'minuta-${item.id}')" aria-label="Ações da ata">⋮</button><div class="actions-dropdown" id="acoes-minuta-${item.id}">${menu}</div></div>
    </div>`;
  }).join('');
  renderPaginacaoAtas(disponiveis.length);
}

function filtrarAtas(){
  paginaAtas=1;
  renderEscolhaReuniaoMinuta();
}

function limparFiltrosAtas(){
  ['minuta-busca-reuniao','minuta-filtro-ano','minuta-filtro-unidade','ata-filtro-situacao'].forEach(id=>{
    const campo=document.getElementById(id);
    if(campo) campo.value='';
  });
  filtrarAtas();
}

function alterarItensAtas(valor){
  const quantidade=Number(valor);
  if(![10,20,50].includes(quantidade)) return;
  itensPorPaginaAtas=quantidade;
  paginaAtas=1;
  try{ localStorage.setItem('igov:atas-itens-pagina',String(quantidade)); }catch(e){}
  renderEscolhaReuniaoMinuta();
}

function renderPaginacaoAtas(totalItens){
  const elemento=document.getElementById('atas-paginacao');
  if(!elemento) return;
  const totalPaginas=Math.ceil(totalItens/itensPorPaginaAtas);
  if(totalPaginas<=1){ elemento.innerHTML=''; return; }
  let html=`<button class="pagina-btn pagina-seta" type="button" onclick="mudarPaginaAtas(-1)" ${paginaAtas===1?'disabled':''} aria-label="Página anterior"><span class="system-icon system-icon-chevron-back" aria-hidden="true"></span></button>`;
  for(let pagina=1;pagina<=totalPaginas;pagina++){
    html+=`<button class="pagina-btn ${pagina===paginaAtas?'active':''}" type="button" onclick="irParaPaginaAtas(${pagina})">${pagina}</button>`;
  }
  html+=`<button class="pagina-btn pagina-seta" type="button" onclick="mudarPaginaAtas(1)" ${paginaAtas===totalPaginas?'disabled':''} aria-label="Próxima página"><span class="system-icon system-icon-chevron-forward" aria-hidden="true"></span></button>`;
  elemento.innerHTML=html;
}

function mudarPaginaAtas(direcao){
  irParaPaginaAtas(paginaAtas+direcao);
}

function irParaPaginaAtas(pagina){
  const totalItens=document.querySelectorAll('#minuta-reunioes-disponiveis .minuta-reuniao-opcao').length;
  const totalFiltrado=Number.parseInt(document.getElementById('atas-total')?.textContent,10)||totalItens;
  const totalPaginas=Math.ceil(totalFiltrado/itensPorPaginaAtas);
  if(pagina<1||pagina>totalPaginas) return;
  paginaAtas=pagina;
  renderEscolhaReuniaoMinuta();
  document.querySelector('.ata-tabela-card')?.scrollIntoView({behavior:'smooth',block:'start'});
}

function popularFiltrosEscolhaMinuta(){
  const seletorAno = document.getElementById('minuta-filtro-ano');
  const seletorUnidade = document.getElementById('minuta-filtro-unidade');
  if(seletorAno){
    const atual = seletorAno.value;
    const anos = [...new Set(reunioes.map(item => (item.data || '').slice(0,4)).filter(Boolean))].sort((a,b) => b.localeCompare(a));
    seletorAno.innerHTML = '<option value="">Todos</option>' + anos.map(ano => `<option value="${ano}">${ano}</option>`).join('');
    if(anos.includes(atual)) seletorAno.value = atual;
  }
  if(seletorUnidade){
    const atual = seletorUnidade.value;
    const unidadesDisponiveis = [...new Set(reunioes.map(item => item.frequencia).filter(Boolean))]
      .sort((a,b) => nomeUnidadeFiltroMinuta(a).localeCompare(nomeUnidadeFiltroMinuta(b), 'pt-BR'));
    seletorUnidade.innerHTML = '<option value="">Todas</option>' + unidadesDisponiveis
      .map(codigo => `<option value="${escapeHtml(codigo)}">${escapeHtml(nomeUnidadeFiltroMinuta(codigo))}</option>`)
      .join('');
    if(unidadesDisponiveis.includes(atual)) seletorUnidade.value = atual;
  }
}

function nomeUnidadeFiltroMinuta(codigo){
  return unidadesPersonalizadas.find(unidade => unidade.codigo === codigo)?.nome || codigo || 'Sem unidade';
}

