/* ===== LISTAGEM, FILTROS E PAGINAÇÃO DE REUNIÕES ===== */

let visualizacaoReunioes='lista';
let calendarioReunioesMes=new Date(new Date().getFullYear(),new Date().getMonth(),1);
let calendarioReunioesDia=todayStr();

function alterarVisualizacaoReunioes(modo){
  visualizacaoReunioes=modo==='calendario'?'calendario':'lista';
  document.getElementById('reunioes-visualizacao-lista').hidden=visualizacaoReunioes!=='lista';
  document.getElementById('reunioes-visualizacao-calendario').hidden=visualizacaoReunioes!=='calendario';
  document.getElementById('reunioes-modo-lista')?.classList.toggle('active',visualizacaoReunioes==='lista');
  document.getElementById('reunioes-modo-calendario')?.classList.toggle('active',visualizacaoReunioes==='calendario');
  if(visualizacaoReunioes==='calendario')renderCalendarioReunioes();
}

function chaveDataCalendario(data){
  return `${data.getFullYear()}-${String(data.getMonth()+1).padStart(2,'0')}-${String(data.getDate()).padStart(2,'0')}`;
}

function classeSituacaoCalendario(reuniao){
  const situacao=obterSituacaoReuniao(reuniao);
  return situacao==='Concluída'?'concluida':situacao==='Cancelada'?'cancelada':situacao==='Reagendada'?'reagendada':'agendada';
}

function renderCalendarioReunioes(){
  const grade=document.getElementById('reunioes-calendario-grade');
  const titulo=document.getElementById('reunioes-calendario-titulo');
  if(!grade||!titulo)return;
  const filtradas=typeof obterReunioesFiltradas==='function'?obterReunioesFiltradas():reunioes;
  const porData=filtradas.reduce((mapa,reuniao)=>{if(reuniao.data)(mapa[reuniao.data]??=[]).push(reuniao);return mapa;},{});
  Object.values(porData).forEach(itens=>itens.sort((a,b)=>(a.horario||'').localeCompare(b.horario||'')));
  titulo.textContent=calendarioReunioesMes.toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
  const primeiro=new Date(calendarioReunioesMes.getFullYear(),calendarioReunioesMes.getMonth(),1);
  const inicio=new Date(primeiro);inicio.setDate(1-primeiro.getDay());
  const hoje=todayStr(),dias=[];
  for(let indice=0;indice<42;indice++){
    const data=new Date(inicio);data.setDate(inicio.getDate()+indice);
    const chave=chaveDataCalendario(data),eventos=porData[chave]||[];
    const classes=['calendario-dia'];
    if(data.getMonth()!==calendarioReunioesMes.getMonth())classes.push('fora-mes');
    if(chave===hoje)classes.push('hoje');
    if(chave===calendarioReunioesDia)classes.push('selecionado');
    const eventosHtml=eventos.slice(0,3).map(reuniao=>`<button class="calendario-evento ${classeSituacaoCalendario(reuniao)}" type="button" onclick="event.stopPropagation();verResumoReuniao('${reuniao.id}')" title="${escapeHtml(`${reuniao.horario||''} · ${reuniao.frequencia||''} · ${reuniao.pauta||'Sem pauta'}`)}"><strong>${escapeHtml(reuniao.horario||'--:--')}</strong> ${escapeHtml(reuniao.frequencia||'Reunião')}</button>`).join('');
    dias.push(`<div class="${classes.join(' ')}" role="button" tabindex="0" onclick="selecionarDiaCalendarioReunioes('${chave}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();selecionarDiaCalendarioReunioes('${chave}')}" aria-label="${data.toLocaleDateString('pt-BR',{day:'numeric',month:'long'})}, ${eventos.length} reunião${eventos.length===1?'':'ões'}"><span class="calendario-dia-numero">${data.getDate()}</span>${eventosHtml}${eventos.length>3?`<span class="calendario-eventos-restantes">+${eventos.length-3} reunião${eventos.length-3===1?'':'ões'}</span>`:''}</div>`);
  }
  grade.innerHTML=dias.join('');
  renderAgendaDiaCalendario(porData[calendarioReunioesDia]||[]);
}

function renderAgendaDiaCalendario(eventos){
  const agenda=document.getElementById('reunioes-calendario-agenda');
  if(!agenda)return;
  const partes=calendarioReunioesDia.split('-').map(Number),data=new Date(partes[0],partes[1]-1,partes[2]);
  agenda.innerHTML=`<h4>Agenda de ${data.toLocaleDateString('pt-BR',{day:'2-digit',month:'long'})}</h4>${eventos.length?eventos.map(reuniao=>`<button class="calendario-agenda-item" type="button" onclick="verResumoReuniao('${reuniao.id}')"><i class="${classeSituacaoCalendario(reuniao)}"></i><span><strong>${escapeHtml(reuniao.horario||'--:--')} · ${escapeHtml(reuniao.frequencia||'Reunião')}</strong><small>${escapeHtml(reuniao.pauta||'Sem pauta informada')}</small></span></button>`).join(''):'<p>Nenhuma reunião neste dia.</p>'}`;
}

function selecionarDiaCalendarioReunioes(chave){
  calendarioReunioesDia=chave;
  const [ano,mes]=chave.split('-').map(Number);
  if(ano!==calendarioReunioesMes.getFullYear()||mes-1!==calendarioReunioesMes.getMonth())calendarioReunioesMes=new Date(ano,mes-1,1);
  renderCalendarioReunioes();
}

function navegarCalendarioReunioes(direcao){
  calendarioReunioesMes=new Date(calendarioReunioesMes.getFullYear(),calendarioReunioesMes.getMonth()+direcao,1);
  calendarioReunioesDia=chaveDataCalendario(calendarioReunioesMes);
  renderCalendarioReunioes();
}

function irHojeCalendarioReunioes(){
  const hoje=new Date();calendarioReunioesMes=new Date(hoje.getFullYear(),hoje.getMonth(),1);calendarioReunioesDia=todayStr();renderCalendarioReunioes();
}

function renderReunioes(){
  if(typeof renderDashboard === 'function') renderDashboard();
  const lista = document.getElementById('reunioes-lista');
  const total = document.getElementById('reunioes-total');
  if(!lista || !total) return;
  renderEscolhaReuniaoMinuta();

  popularFiltroAnoReunioes();
  renderCalendarioReunioes();

  if(!reunioes.length){
    total.textContent = '0 reuniões';
    if(typeof atualizarSelecaoVisivelRelatorio === 'function') atualizarSelecaoVisivelRelatorio('reunioes', []);
    lista.innerHTML = '<div class="reunioes-vazio"><b>Nenhuma reunião cadastrada</b>Acesse Cadastros e escolha a categoria Reunião para criar o primeiro registro.</div>';
    renderPaginacaoReunioes(0);
    return;
  }

  const filtradas = obterReunioesFiltradas();
  total.textContent = `${filtradas.length} ${filtradas.length === 1 ? 'reunião' : 'reuniões'}`;
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

  lista.innerHTML = pagina.map(item => {
    const situacao=obterSituacaoReuniao(item);
    const classeSituacao=situacao==='Concluída'?'concluida':situacao==='Cancelada'?'cancelada':situacao==='Reagendada'?'reagendada':'agendada';
    const participantes=todosParticipantesReuniao(item);
    const participantesResumo=participantes.length
      ? `<span title="${escapeHtml(participantes[0])}">${escapeHtml(participantes[0])}</span>${participantes.length>1?`<span class="reuniao-participantes-restantes">+${participantes.length-1} ${participantes.length===2?'participante':'participantes'}</span>`:''}`
      : '—';
    return `
    <div class="reuniao-item">
      <label class="selecao-registro" onclick="event.stopPropagation()"><input type="checkbox" ${typeof relatorioSelecao!=='undefined'&&relatorioSelecao.reunioes.has(item.id)?'checked':''} onchange="selecionarRegistroParaRelatorio('reunioes','${item.id}',this.checked)" aria-label="Selecionar reunião de ${fmtData(item.data)}"></label>
      <div class="reuniao-data"><strong>${fmtData(item.data)}</strong><span>${escapeHtml(item.horario)}</span></div>
      <div><span class="reuniao-frequencia">${escapeHtml(item.frequencia)}</span><span class="reuniao-periodicidade">${FREQUENCIAS_REUNIAO[item.frequencia]}</span><span class="reuniao-formato">${escapeHtml(rotuloFormatoReuniao(item.formato))}</span></div>
      <div class="reuniao-link-celula">${item.link ? `<a class="reuniao-link" href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer">Abrir</a>` : '-'}</div>
      <div class="reuniao-celula reuniao-pauta">${escapeHtml(item.pauta)}</div>
      <div class="reuniao-celula reuniao-participantes-celula" title="${escapeHtml(participantes.join(' • '))}">${participantesResumo}</div>
      <div class="reuniao-situacao"><span class="${classeSituacao}">${escapeHtml(situacao)}</span></div>
      <div class="actions reuniao-acoes">
        <button class="actions-toggle" type="button" onclick="toggleAcoes(event,'reuniao-${item.id}')" aria-label="Ações da reunião">⋮</button>
        <div class="actions-dropdown" id="acoes-reuniao-${item.id}">
          <button type="button" onclick="verResumoReuniao('${item.id}')">Resumo</button>
          <button type="button" onclick="abrirMinutaReuniao('${item.id}')">Gerar ata</button>
          <button type="button" onclick="remarcarReuniao('${item.id}')">Remarcar</button>
          <button type="button" onclick="cancelarReuniao('${item.id}')">Cancelar reunião</button>
          <button type="button" onclick="editarReuniao('${item.id}')">Editar</button>
          <button type="button" onclick="notificarReuniao('${item.id}')">Notificar</button>
          <div class="divider"></div>
          <button class="del" type="button" onclick="excluirReuniao('${item.id}')">Excluir</button>
        </div>
      </div>
    </div>
  `}).join('');
  if(typeof atualizarSelecaoVisivelRelatorio === 'function') atualizarSelecaoVisivelRelatorio('reunioes', pagina);
  renderPaginacaoReunioes(filtradas.length);
}

function verResumoReuniao(id){
  const reuniao = reunioes.find(item => item.id === id);
  if(!reuniao) return;
  const participantes = todosParticipantesReuniao(reuniao);
  const membros = normalizarMembros(reuniao.membros, reuniao.frequencia).filter(membro => membro.nome);
  const convidados = normalizarParticipantes(reuniao.convidados ?? reuniao.participantes);
  const unidade = typeof nomeUnidadeFiltroMinuta === 'function' ? nomeUnidadeFiltroMinuta(reuniao.frequencia) : reuniao.frequencia;

  document.getElementById('resumo-reuniao-titulo').textContent = reuniao.pauta || 'Reunião sem pauta';
  document.getElementById('resumo-reuniao-data').textContent = `${fmtData(reuniao.data)} às ${reuniao.horario || '—'}`;
  document.getElementById('resumo-reuniao-unidade').textContent = unidade || reuniao.frequencia || 'Não informada';
  document.getElementById('resumo-reuniao-formato').textContent = rotuloFormatoReuniao(reuniao.formato);
  document.getElementById('resumo-reuniao-situacao').textContent = obterSituacaoReuniao(reuniao);
  document.getElementById('resumo-reuniao-link').innerHTML = reuniao.link
    ? `<a href="${escapeHtml(reuniao.link)}" target="_blank" rel="noopener noreferrer">Abrir link da reunião</a>`
    : 'Não informado';
  document.getElementById('resumo-reuniao-pauta').textContent = reuniao.pauta || 'Nenhuma pauta cadastrada.';
  document.getElementById('resumo-reuniao-membros').textContent = membros.length
    ? membros.map(membro => `${membro.nome} — ${membro.cargo}`).join('\n')
    : 'Nenhum membro informado.';
  document.getElementById('resumo-reuniao-convidados').textContent = convidados.length ? convidados.join('\n') : 'Nenhum convidado informado.';
  document.getElementById('resumo-reuniao-texto').textContent = reuniao.resumo || 'Nenhum resumo registrado.';
  document.getElementById('resumo-reuniao-participantes-total').textContent = `${participantes.length} ${participantes.length === 1 ? 'participante' : 'participantes'}`;
  abrirModalElemento('resumo-reuniao-modal-overlay');
}

function fecharResumoReuniao(){
  fecharModalElemento('resumo-reuniao-modal-overlay');
}

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
         <button class="export-pdf" type="button" onclick="baixarMinutaHistorico('${minutaExistente.id}','pdf')">Baixar PDF</button>
         <button class="export-docs" type="button" onclick="baixarMinutaHistorico('${minutaExistente.id}','word')">Baixar Word / Docs</button>
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
  const cabecalho=['Data','Horário','Unidade','Periodicidade','Formato','Situação','Link','Pauta','Membros','Convidados','Resumo','Situação da ata'];
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
      obterSituacaoReuniao(reuniao),
      reuniao.link || '',
      reuniao.pauta || '',
      membros,
      convidados,
      reuniao.resumo || '',
      possuiMinuta ? 'Ata gerada' : 'Sem ata'
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
  try{ localStorage.setItem('igov:reunioes-itens-pagina',String(quantidade)); }catch(e){}
  renderReunioes();
}

function renderPaginacaoReunioes(totalItens){
  const elemento = document.getElementById('reunioes-paginacao');
  if(!elemento) return;
  const totalPaginas = Math.ceil(totalItens / itensPorPaginaReunioes);
  if(totalPaginas <= 1){ elemento.innerHTML = ''; return; }
  let html = `<button class="pagina-btn pagina-seta" type="button" onclick="mudarPaginaReunioes(-1)" ${paginaReunioes === 1 ? 'disabled' : ''} aria-label="Página anterior"><span class="system-icon system-icon-chevron-back" aria-hidden="true"></span></button>`;
  for(let pagina = 1; pagina <= totalPaginas; pagina++){
    html += `<button class="pagina-btn ${pagina === paginaReunioes ? 'active' : ''}" type="button" onclick="irParaPaginaReunioes(${pagina})">${pagina}</button>`;
  }
  html += `<button class="pagina-btn pagina-seta" type="button" onclick="mudarPaginaReunioes(1)" ${paginaReunioes === totalPaginas ? 'disabled' : ''} aria-label="Próxima página"><span class="system-icon system-icon-chevron-forward" aria-hidden="true"></span></button>`;
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

document.addEventListener('DOMContentLoaded',()=>{
  try{
    const quantidade=Number(localStorage.getItem('igov:reunioes-itens-pagina'));
    if([10,20,50].includes(quantidade)) itensPorPaginaReunioes=quantidade;
  }catch(e){}
  const seletor=document.getElementById('reuniao-itens-pagina');
  if(seletor) seletor.value=String(itensPorPaginaReunioes);
  try{
    const quantidadeAtas=Number(localStorage.getItem('igov:atas-itens-pagina'));
    if([10,20,50].includes(quantidadeAtas)) itensPorPaginaAtas=quantidadeAtas;
  }catch(e){}
  const seletorAtas=document.getElementById('ata-itens-pagina');
  if(seletorAtas) seletorAtas.value=String(itensPorPaginaAtas);
});
