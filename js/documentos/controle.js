/* ===== js/documentos/controle.js ===== */
/* ===== ABA: CONTROLE (tabela, filtros, menu de ações e exportação) ===== */

function render(){
  const withStatus = docs.map(d => ({...d, status: calcularStatus(d)}));
  if(typeof renderDashboard === 'function') renderDashboard();
  if(typeof renderSetoresDocumentos === 'function') renderSetoresDocumentos();
  const totalDocumentos=document.getElementById('documentos-total');
  popularFiltroAno();

  const buscaTexto = (document.getElementById('busca-nome')?.value || '').trim().toLowerCase();
  const statusSelecionado = document.getElementById('filtro-status')?.value || 'todos';
  const tipoSelecionado = document.getElementById('filtro-tipo')?.value || '';
  const anoSelecionado = document.getElementById('filtro-ano')?.value || '';

  const assinaturaFiltros = JSON.stringify([
    buscaTexto,
    statusSelecionado,
    tipoSelecionado,
    anoSelecionado
  ]);

  if(assinaturaFiltros !== filtrosAnteriores){
    paginaAtual = 1;
    filtrosAnteriores = assinaturaFiltros;
  }

  let visiveis = unidadeSelecionadaDocumentos
    ? withStatus.filter(documentoPertenceUnidadeSelecionada)
    : withStatus;
  visiveis = statusSelecionado==='todos' ? visiveis : visiveis.filter(d=>d.status===statusSelecionado);
  if(buscaTexto) visiveis = visiveis.filter(d => d.nome.toLowerCase().includes(buscaTexto));
  if(tipoSelecionado) visiveis = visiveis.filter(d => d.tipo === tipoSelecionado);
  if(anoSelecionado) visiveis = visiveis.filter(d => (d.dataVigencia || d.dataCriacao || d.data || '').slice(0,4) === anoSelecionado);
  if(totalDocumentos) totalDocumentos.textContent=`${visiveis.length} documento${visiveis.length===1?'':'s'}`;

  visiveis.sort((a,b)=> (a.data ? new Date(a.data) : Infinity) - (b.data ? new Date(b.data) : Infinity));

  const lista = document.getElementById('lista');

  if(withStatus.length === 0){
    if(typeof atualizarSelecaoVisivelRelatorio === 'function') atualizarSelecaoVisivelRelatorio('documentos', []);
    lista.innerHTML = `<div class="empty"><b>Nenhum documento aqui</b>Cadastre um documento para começar a acompanhar o prazo.</div>`;
    renderPaginacao(0);
    return;
  }

  if(visiveis.length === 0){
    if(typeof atualizarSelecaoVisivelRelatorio === 'function') atualizarSelecaoVisivelRelatorio('documentos', []);
    lista.innerHTML = `<div class="empty"><b>Nenhum documento encontrado</b>Tente ajustar a busca ou os filtros aplicados.</div>`;
    renderPaginacao(0);
    return;
  }

  const totalPaginas = Math.ceil(visiveis.length / ITENS_POR_PAGINA);
  if(paginaAtual > totalPaginas) paginaAtual = totalPaginas;

  const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const documentosPagina = visiveis.slice(inicio, inicio + ITENS_POR_PAGINA);

  lista.innerHTML = documentosPagina.map(d => `
    <div class="row">
      <label class="selecao-registro" onclick="event.stopPropagation()"><input type="checkbox" ${typeof relatorioSelecao!=='undefined'&&relatorioSelecao.documentos.has(d.id)?'checked':''} onchange="selecionarRegistroParaRelatorio('documentos','${d.id}',this.checked)" aria-label="Selecionar ${escapeHtml(d.nome)}"></label>
      <div class="doc-name-wrap">
        <div class="type-icon">${TYPE_INITIALS[d.tipo] || '--'}</div>
        <div>
          <div class="doc-name" title="${escapeHtml(d.nome)}">${escapeHtml(d.nome)}</div>
          <div class="doc-sei" title="${d.semNormativo || d.tipo === 'Sem normativo' ? '-' : `SEI ${escapeHtml(formatarNumeroSei(d.sei))}`}">${d.semNormativo || d.tipo === 'Sem normativo' ? '-' : `SEI ${escapeHtml(formatarNumeroSei(d.sei))}`}</div>
        </div>
      </div>
      <div class="doc-responsavel">${d.gestorNome
        ? `<div class="responsavel-nome" title="${escapeHtml(d.gestorNome)}">${escapeHtml(d.gestorNome)}</div>${d.gestorSetor ? `<div class="responsavel-setor" title="${escapeHtml(d.gestorSetor)}">${escapeHtml(d.gestorSetor)}</div>` : ''}`
        : '<span class="sem-responsavel">Não informado</span>'}</div>
      <div class="doc-type" title="${escapeHtml(d.tipo)}">${escapeHtml(d.tipo)}</div>
      <div class="doc-updated">${d.ultimaAtualizacao ? fmtData(d.ultimaAtualizacao) : '—'}</div>
      <div class="doc-date">${d.data ? fmtData(d.data) : '-'}</div>
      <div>${d.status ? `<span class="tag ${d.status==='Vigente'?'valido':d.status==='Alerta'?'alerta':'vencido'}">${statusLabel(d.status)}</span>` : '-'}</div>
      <div class="actions">
        <button class="actions-toggle" onclick="toggleAcoes(event,'${d.id}')" aria-label="Ações">⋮</button>
        <div class="actions-dropdown" id="acoes-${d.id}">
          <button onclick="verResumo('${d.id}')">Resumo</button>
          ${d.semNormativo || d.tipo === 'Sem normativo' ? '' : `<button onclick="notificarGestor('${d.id}')">Notificar gestor</button>`}
          <button onclick="editar('${d.id}')">Editar</button>
          ${d.semNormativo || d.tipo === 'Sem normativo' ? '' : `<button class="renew" onclick="renovar('${d.id}')">Renovar vigência</button>`}
          <button onclick="verHistorico('${d.id}')">Histórico de edições</button>
          <div class="divider"></div>
          <button class="del" onclick="excluir('${d.id}')">Excluir</button>
        </div>
      </div>
    </div>
  `).join('');

  if(typeof atualizarSelecaoVisivelRelatorio === 'function') atualizarSelecaoVisivelRelatorio('documentos', documentosPagina);
  renderPaginacao(visiveis.length);
}

function renderPaginacao(totalItens){
  const paginacao = document.getElementById('paginacao');
  if(!paginacao) return;

  const totalPaginas = Math.ceil(totalItens / ITENS_POR_PAGINA);

  if(totalPaginas <= 1){
    paginacao.innerHTML = '';
    return;
  }

  let html = `
    <button
      class="pagina-btn pagina-seta"
      onclick="mudarPagina(-1)"
      ${paginaAtual === 1 ? 'disabled' : ''}
      aria-label="Página anterior">
      &lt;
    </button>
  `;

  for(let i = 1; i <= totalPaginas; i++){
    html += `
      <button
        class="pagina-btn ${i === paginaAtual ? 'active' : ''}"
        onclick="irParaPagina(${i})">
        ${i}
      </button>
    `;
  }

  html += `
    <button
      class="pagina-btn pagina-seta"
      onclick="mudarPagina(1)"
      ${paginaAtual === totalPaginas ? 'disabled' : ''}
      aria-label="Próxima página">
      &gt;
    </button>
  `;

  paginacao.innerHTML = html;
}

function alterarItensPorPagina(valor){
  const quantidade = Number(valor);
  if(!OPCOES_ITENS_POR_PAGINA.includes(quantidade)) return;
  ITENS_POR_PAGINA = quantidade;
  paginaAtual = 1;
  try{ localStorage.setItem(PAGINACAO_KEY, String(quantidade)); }catch(e){}
  render();
}

document.addEventListener('DOMContentLoaded', () => {
  const seletor = document.getElementById('itens-por-pagina');
  if(seletor) seletor.value = String(ITENS_POR_PAGINA);
});

function mudarPagina(direcao){
  const totalItens = obterDocumentosVisiveis().length;
  const totalPaginas = Math.ceil(totalItens / ITENS_POR_PAGINA);
  const novaPagina = paginaAtual + direcao;

  if(novaPagina < 1 || novaPagina > totalPaginas) return;

  paginaAtual = novaPagina;
  render();

  const tabela = document.querySelector('.ledger');
  if(tabela){
    tabela.scrollIntoView({behavior:'smooth', block:'start'});
  }
}

function obterDocumentosVisiveis(){
  const withStatus = docs.map(d => ({...d, status: calcularStatus(d)}));
  const buscaTexto = (document.getElementById('busca-nome')?.value || '').trim().toLowerCase();
  const statusSelecionado = document.getElementById('filtro-status')?.value || 'todos';
  const tipoSelecionado = document.getElementById('filtro-tipo')?.value || '';
  const anoSelecionado = document.getElementById('filtro-ano')?.value || '';

  let visiveis = unidadeSelecionadaDocumentos
    ? withStatus.filter(documentoPertenceUnidadeSelecionada)
    : withStatus;
  visiveis = statusSelecionado === 'todos'
    ? visiveis
    : visiveis.filter(d => d.status === statusSelecionado);

  if(buscaTexto) visiveis = visiveis.filter(d => d.nome.toLowerCase().includes(buscaTexto));
  if(tipoSelecionado) visiveis = visiveis.filter(d => d.tipo === tipoSelecionado);
  if(anoSelecionado){
    visiveis = visiveis.filter(d =>
      (d.dataVigencia || d.dataCriacao || d.data || '').slice(0,4) === anoSelecionado
    );
  }

  return visiveis;
}

function irParaPagina(pagina){
  paginaAtual = pagina;
  render();

  const tabela = document.querySelector('.ledger');
  if(tabela) tabela.scrollIntoView({behavior:'smooth', block:'start'});
}

// Popula o filtro de "Ano do documento" com os anos presentes nos documentos cadastrados,
// preservando a seleção atual sempre que possível
function popularFiltroAno(){
  const sel = document.getElementById('filtro-ano');
  if(!sel) return;
  const atual = sel.value;
  const anos = new Set();
  docs.filter(documentoPertenceUnidadeSelecionada).forEach(d => {
    const base = d.dataVigencia || d.dataCriacao || d.data;
    if(base) anos.add(base.slice(0,4));
  });
  const anosOrdenados = Array.from(anos).sort((a,b)=> b.localeCompare(a));
  sel.innerHTML = '<option value="">Todos</option>' + anosOrdenados.map(a=>`<option value="${a}">${a}</option>`).join('');
  if(anosOrdenados.includes(atual)) sel.value = atual;
}

function toggleAcoes(ev, id){
  ev.stopPropagation();
  const alvo = document.getElementById('acoes-'+id);

  document.querySelectorAll('.actions-dropdown.open').forEach(el=>{
    if(el !== alvo){
      el.classList.remove('open');
      el.classList.remove('above');
    }
  });

  document.querySelectorAll('.actions-toggle.open').forEach(el=>{
    if(el !== ev.currentTarget) el.classList.remove('open');
  });

  const vaiAbrir = !alvo.classList.contains('open');

  alvo.classList.remove('above');
  alvo.classList.toggle('open', vaiAbrir);
  ev.currentTarget.classList.toggle('open', vaiAbrir);

  if(vaiAbrir){
    const menuAltura = alvo.offsetHeight || 280;
    const botaoRect = ev.currentTarget.getBoundingClientRect();
    const espacoAbaixo = window.innerHeight - botaoRect.bottom;

    if(espacoAbaixo < menuAltura + 20){
      alvo.classList.add('above');
    }
  }
}
document.addEventListener('click', ()=>{
  document.querySelectorAll('.actions-dropdown.open').forEach(el=>{
    el.classList.remove('open');
    el.classList.remove('above');
  });
  document.querySelectorAll('.actions-toggle.open').forEach(el=>el.classList.remove('open'));
});

function exportarRelatorio(){
  if(docs.length === 0){
    toast('Não há documentos para exportar.', 'alerta');
    return;
  }

  const withStatus = docs.map(d => ({...d, status: calcularStatus(d)}))
    .sort((a,b)=> (a.data ? new Date(a.data) : Infinity) - (b.data ? new Date(b.data) : Infinity));

  const cabecalho = ['Documento','Tipo','Fundamentação legal','N° SEI','Data de vigência (última renovação)','Prazo de validade','Vencimento','Situação','Última atualização','Gestor responsável','Setor do gestor','E-mail do gestor','WhatsApp do gestor','Descrição'];
  const linhas = withStatus.map(d => [
    d.nome,
    d.tipo,
    d.baseLegal ? `${d.baseLegal}${d.baseLegalNumero ? ' n° ' + d.baseLegalNumero : ''}` : '',
    formatarNumeroSei(d.sei) || '-',
    d.dataVigencia ? fmtData(d.dataVigencia) : '-',
    d.validade ? VALIDADE_LABELS[d.validade] : '-',
    d.data ? fmtData(d.data) : '-',
    d.status ? statusLabel(d.status) : '-',
    d.ultimaAtualizacao ? fmtData(d.ultimaAtualizacao) : '',
    d.gestorNome || '',
    d.gestorSetor || '',
    d.gestorEmail || '',
    d.gestorWhatsapp || '',
    d.descricao || ''
  ]);

  const csvEscape = v => `"${String(v).replace(/"/g,'""')}"`;
  const csv = [cabecalho, ...linhas].map(l => l.map(csvEscape).join(';')).join('\r\n');

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const hoje = todayStr();
  a.href = url;
  a.download = `relatorio_documentos_igov_${hoje}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  toast(`<b>Relatório exportado</b> — ${withStatus.length} documento${withStatus.length===1?'':'s'}.`, 'valido');
}
