/* ===== LISTAGEM, FILTROS E PAGINAÇÃO DE REUNIÕES ===== */

function renderReunioes(){
  if(typeof renderDashboard === 'function') renderDashboard();
  const lista = document.getElementById('reunioes-lista');
  const total = document.getElementById('reunioes-total');
  if(!lista || !total) return;
  total.textContent = reunioes.length;
  renderEscolhaReuniaoMinuta();

  popularFiltroAnoReunioes();

  if(!reunioes.length){
    if(typeof atualizarSelecaoVisivelRelatorio === 'function') atualizarSelecaoVisivelRelatorio('reunioes', []);
    lista.innerHTML = '<div class="reunioes-vazio"><b>Nenhuma reunião cadastrada</b>Acesse Cadastros e escolha a categoria Reunião para criar o primeiro registro.</div>';
    renderPaginacaoReunioes(0);
    return;
  }

  const filtradas = obterReunioesFiltradas();
  if(!filtradas.length){
    if(typeof atualizarSelecaoVisivelRelatorio === 'function') atualizarSelecaoVisivelRelatorio('reunioes', []);
    lista.innerHTML = '<div class="reunioes-vazio"><b>Nenhuma reunião encontrada</b>Revise a busca ou os filtros selecionados.</div>';
    renderPaginacaoReunioes(0);
    return;
  }

  const totalPaginas = Math.ceil(filtradas.length / itensPorPaginaReunioes);
  if(paginaReunioes > totalPaginas) paginaReunioes = totalPaginas;
  const inicio = (paginaReunioes - 1) * itensPorPaginaReunioes;
  const pagina = filtradas.slice(inicio, inicio + itensPorPaginaReunioes);

  lista.innerHTML = pagina.map(item => `
    <div class="reuniao-item">
      <label class="selecao-registro" onclick="event.stopPropagation()"><input type="checkbox" ${typeof relatorioSelecao!=='undefined'&&relatorioSelecao.reunioes.has(item.id)?'checked':''} onchange="selecionarRegistroParaRelatorio('reunioes','${item.id}',this.checked)" aria-label="Selecionar reunião de ${fmtData(item.data)}"></label>
      <div class="reuniao-data"><strong>${fmtData(item.data)}</strong><span>${escapeHtml(item.horario)}</span></div>
      <div><span class="reuniao-frequencia">${escapeHtml(item.frequencia)}</span><span class="reuniao-periodicidade">${FREQUENCIAS_REUNIAO[item.frequencia]}</span><span class="reuniao-formato">${escapeHtml(rotuloFormatoReuniao(item.formato))}</span></div>
      <div class="reuniao-link-celula">${item.link ? `<a class="reuniao-link" href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer">Abrir</a>` : '-'}</div>
      <div class="reuniao-celula reuniao-pauta">${escapeHtml(item.pauta)}</div>
      <div class="reuniao-celula reuniao-participantes-celula">${todosParticipantesReuniao(item).map(nome => `<span>${escapeHtml(nome)}</span>`).join('') || '—'}</div>
      <div class="actions reuniao-acoes">
        <button class="actions-toggle" type="button" onclick="toggleAcoes(event,'reuniao-${item.id}')" aria-label="Ações da reunião">⋮</button>
        <div class="actions-dropdown" id="acoes-reuniao-${item.id}">
          <button type="button" onclick="abrirMinutaReuniao('${item.id}')">Gerar minuta da ata</button>
          <button type="button" onclick="editarReuniao('${item.id}')">Editar</button>
          <button type="button" onclick="notificarReuniao('${item.id}')">Notificar</button>
          <div class="divider"></div>
          <button class="del" type="button" onclick="excluirReuniao('${item.id}')">Excluir</button>
        </div>
      </div>
    </div>
  `).join('');
  if(typeof atualizarSelecaoVisivelRelatorio === 'function') atualizarSelecaoVisivelRelatorio('reunioes', pagina);
  renderPaginacaoReunioes(filtradas.length);
}

function renderEscolhaReuniaoMinuta(){
  const lista = document.getElementById('minuta-reunioes-disponiveis');
  if(!lista) return;
  popularFiltrosEscolhaMinuta();
  const busca = (document.getElementById('minuta-busca-reuniao')?.value || '').trim().toLowerCase();
  const ano = document.getElementById('minuta-filtro-ano')?.value || '';
  const unidade = document.getElementById('minuta-filtro-unidade')?.value || '';
  const disponiveis = [...reunioes]
    .filter(item => !ano || (item.data || '').slice(0,4) === ano)
    .filter(item => !unidade || item.frequencia === unidade)
    .filter(item => !busca || [item.frequencia, nomeUnidadeFiltroMinuta(item.frequencia), item.pauta, fmtData(item.data)].join(' ').toLowerCase().includes(busca))
    .sort((a,b) => `${b.data}T${b.horario}`.localeCompare(`${a.data}T${a.horario}`));

  if(!reunioes.length){
    lista.innerHTML = '<div class="minuta-escolha-vazia">Nenhuma reunião cadastrada.<button type="button" onclick="setTab(\'cadastro\'); selecionarModoCadastro(\'reuniao\')">Cadastrar reunião</button></div>';
    return;
  }
  if(!disponiveis.length){
    lista.innerHTML = '<div class="minuta-escolha-vazia">Nenhuma reunião encontrada para essa busca.</div>';
    return;
  }
  lista.innerHTML = disponiveis.map(item => {
    const minutaExistente = minutasHistorico.find(registro => registro.reuniao?.id === item.id);
    const acao = minutaExistente ? `abrirMinutaHistorico('${minutaExistente.id}')` : `abrirMinutaReuniao('${item.id}')`;
    const menu = minutaExistente
      ? `<button type="button" onclick="abrirMinutaHistorico('${minutaExistente.id}')">Editar minuta</button>
         <button type="button" onclick="baixarMinutaHistorico('${minutaExistente.id}','pdf')">Baixar PDF</button>
         <button type="button" onclick="baixarMinutaHistorico('${minutaExistente.id}','word')">Baixar Word</button>
         <div class="divider"></div><button class="del" type="button" onclick="excluirMinutaHistorico('${minutaExistente.id}')">Excluir minuta</button>`
      : `<button type="button" onclick="abrirMinutaReuniao('${item.id}')">Gerar minuta</button>`;
    return `<div class="minuta-reuniao-opcao${minutaExistente ? ' com-minuta' : ''}">
      <button class="minuta-reuniao-selecao" type="button" onclick="${acao}">
        <span class="minuta-reuniao-data"><strong>${escapeHtml(fmtData(item.data))}</strong><small>${escapeHtml(item.horario)}</small></span>
        <span class="minuta-reuniao-conteudo"><strong>${escapeHtml(item.frequencia)}${minutaExistente ? '<em>Minuta gerada</em>' : ''}</strong><span>${escapeHtml(item.pauta || 'Sem pauta informada')}</span></span>
      </button>
      <div class="actions minuta-reuniao-acoes"><button class="actions-toggle" type="button" onclick="toggleAcoes(event,'minuta-${item.id}')" aria-label="Ações da minuta">⋮</button><div class="actions-dropdown" id="acoes-minuta-${item.id}">${menu}</div></div>
    </div>`;
  }).join('');
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

function obterReunioesFiltradas(){
  const busca = (document.getElementById('reuniao-busca')?.value || '').trim().toLowerCase();
  const tipo = document.getElementById('reuniao-filtro-tipo')?.value || '';
  const ano = document.getElementById('reuniao-filtro-ano')?.value || '';
  return [...reunioes]
    .filter(item => !tipo || item.frequencia === tipo)
    .filter(item => !ano || (item.data || '').slice(0,4) === ano)
    .filter(item => {
      if(!busca) return true;
      const texto = [item.pauta, item.resumo, ...todosParticipantesReuniao(item)].join(' ').toLowerCase();
      return texto.includes(busca);
    })
    .sort((a,b) => `${b.data}T${b.horario}`.localeCompare(`${a.data}T${a.horario}`));
}

function popularFiltroAnoReunioes(){
  const seletor = document.getElementById('reuniao-filtro-ano');
  if(!seletor) return;
  const atual = seletor.value;
  const anos = [...new Set(reunioes.map(item => (item.data || '').slice(0,4)).filter(Boolean))].sort((a,b) => b.localeCompare(a));
  seletor.innerHTML = '<option value="">Todos</option>' + anos.map(ano => `<option value="${ano}">${ano}</option>`).join('');
  if(anos.includes(atual)) seletor.value = atual;
}

function exportarRelatorioReunioes(){
  const filtradas=obterReunioesFiltradas();
  if(!filtradas.length){
    toast('Não há reuniões para exportar com os filtros selecionados.', 'alerta');
    return;
  }
  const cabecalho=['Data','Horário','Unidade','Periodicidade','Formato','Link','Pauta','Membros','Convidados','Resumo','Situação da minuta'];
  const linhas=filtradas.map(reuniao=>{
    const membros=normalizarMembros(reuniao.membros,reuniao.frequencia)
      .filter(membro=>membro.nome)
      .map(membro=>`${membro.nome} — ${membro.cargo}`)
      .join('\n');
    const convidados=normalizarParticipantes(reuniao.convidados ?? reuniao.participantes).join('\n');
    const unidade=unidadesPersonalizadas.find(item=>item.codigo===reuniao.frequencia)?.nome || reuniao.frequencia;
    const possuiMinuta=minutasHistorico.some(registro=>registro.reuniao?.id===reuniao.id);
    return [
      fmtData(reuniao.data),
      reuniao.horario || '',
      unidade,
      FREQUENCIAS_REUNIAO[reuniao.frequencia] || '',
      rotuloFormatoReuniao(reuniao.formato),
      reuniao.link || '',
      reuniao.pauta || '',
      membros,
      convidados,
      reuniao.resumo || '',
      possuiMinuta ? 'Minuta gerada' : 'Sem minuta'
    ];
  });
  const escaparCsv=valor=>{
    let texto=String(valor ?? '');
    if(/^[=+@]/.test(texto)) texto=`'${texto}`;
    return `"${texto.replace(/"/g,'""')}"`;
  };
  const csv=[cabecalho,...linhas].map(linha=>linha.map(escaparCsv).join(';')).join('\r\n');
  const url=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'}));
  const link=document.createElement('a');
  link.href=url;
  link.download=`relatorio_reunioes_igov_${todayStr()}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  toast(`<b>Relatório exportado</b> — ${filtradas.length} reunião${filtradas.length===1?'':'ões'}.`, 'valido');
}

function filtrarReunioes(){
  paginaReunioes = 1;
  renderReunioes();
}

function alterarItensReunioes(valor){
  const quantidade = Number(valor);
  if(![10,20,50].includes(quantidade)) return;
  itensPorPaginaReunioes = quantidade;
  paginaReunioes = 1;
  renderReunioes();
}

function renderPaginacaoReunioes(totalItens){
  const elemento = document.getElementById('reunioes-paginacao');
  if(!elemento) return;
  const totalPaginas = Math.ceil(totalItens / itensPorPaginaReunioes);
  if(totalPaginas <= 1){ elemento.innerHTML = ''; return; }
  let html = `<button class="pagina-btn" type="button" onclick="mudarPaginaReunioes(-1)" ${paginaReunioes === 1 ? 'disabled' : ''}>&lt;</button>`;
  for(let pagina = 1; pagina <= totalPaginas; pagina++){
    html += `<button class="pagina-btn ${pagina === paginaReunioes ? 'active' : ''}" type="button" onclick="irParaPaginaReunioes(${pagina})">${pagina}</button>`;
  }
  html += `<button class="pagina-btn" type="button" onclick="mudarPaginaReunioes(1)" ${paginaReunioes === totalPaginas ? 'disabled' : ''}>&gt;</button>`;
  elemento.innerHTML = html;
}

function mudarPaginaReunioes(direcao){
  irParaPaginaReunioes(paginaReunioes + direcao);
}

function irParaPaginaReunioes(pagina){
  const totalPaginas = Math.ceil(obterReunioesFiltradas().length / itensPorPaginaReunioes);
  if(pagina < 1 || pagina > totalPaginas) return;
  paginaReunioes = pagina;
  renderReunioes();
  document.querySelector('.reunioes-lista-card')?.scrollIntoView({behavior:'smooth', block:'start'});
}