/* ===== HISTÓRICO DE MINUTAS ===== */

function carregarHistoricoMinutas(){
  try{
    const dados = JSON.parse(localStorage.getItem(MINUTAS_STORAGE_KEY) || '[]');
    minutasHistorico = Array.isArray(dados) ? dados : [];
  }catch(e){
    minutasHistorico = [];
  }
  renderHistoricoMinutas();
  if(typeof renderDashboard === 'function') renderDashboard();
}

function salvarHistoricoMinutas(){
  localStorage.setItem(MINUTAS_STORAGE_KEY, JSON.stringify(minutasHistorico.slice(0, 50)));
  if(typeof renderDashboard === 'function') renderDashboard();
}

function registrarMinutaHistorico(reuniao){
  const registro = {
    id:`minuta-${Date.now()}`,
    geradaEm:new Date().toISOString(),
    reuniao:{...reuniao},
    transcricao:document.getElementById('minuta-reuniao-transcricao')?.value || '',
    pautaHtml:obterHtmlEditorMinuta('minuta-reuniao-pauta'),
    descricaoHtml:obterHtmlEditorMinuta('minuta-reuniao-descricao'),
    providenciasHtml:obterHtmlEditorMinuta('minuta-reuniao-providencias'),
    minutaHtml:obterHtmlEditorMinuta('minuta-reuniao-texto')
  };
  minutasHistorico = minutasHistorico.filter(item => item.reuniao?.id !== reuniao.id);
  minutasHistorico.unshift(registro);
  minutaHistoricoIdAtivo = registro.id;
  minutasHistorico = minutasHistorico.slice(0, 50);
  salvarHistoricoMinutas();
  renderHistoricoMinutas();
  renderEscolhaReuniaoMinuta();
}

function renderHistoricoMinutas(){
  const lista = document.getElementById('minutas-historico-lista');
  const total = document.getElementById('minutas-historico-total');
  if(!lista || !total) return;
  total.textContent = `${minutasHistorico.length} ${minutasHistorico.length === 1 ? 'ata' : 'atas'}`;
  if(!minutasHistorico.length){
    lista.innerHTML = '<div class="minutas-historico-vazio">Nenhuma ata foi gerada ainda.</div>';
    return;
  }
  lista.innerHTML = minutasHistorico.map(item => {
    const reuniao = item.reuniao || {};
    const geradaEm = new Date(item.geradaEm);
    const dataGeracao = Number.isNaN(geradaEm.getTime()) ? 'Data não informada' : geradaEm.toLocaleString('pt-BR');
    return `<article class="minuta-historico-item">
      <div><strong>${escapeHtml(reuniao.frequencia || 'Reunião')}</strong><span>${escapeHtml(fmtData(reuniao.data))} às ${escapeHtml(reuniao.horario || '--:--')}</span><small>Gerada em ${escapeHtml(dataGeracao)}</small></div>
      <p>${escapeHtml(reuniao.pauta || 'Sem pauta informada')}</p>
      <div class="minuta-historico-acoes"><button type="button" onclick="abrirMinutaHistorico('${item.id}')">Abrir</button><button class="danger" type="button" onclick="excluirMinutaHistorico('${item.id}')">Excluir</button></div>
    </article>`;
  }).join('');
}

function carregarDadosMinutaHistorico(registro){
  minutaReuniaoId = registro.reuniao.id;
  minutaHistoricoReuniao = registro.reuniao;
  minutaHistoricoIdAtivo = registro.id;
  document.getElementById('minuta-reuniao-identificacao').textContent = `${registro.reuniao.frequencia} • ${fmtData(registro.reuniao.data)} às ${registro.reuniao.horario}`;
  document.getElementById('minuta-reuniao-transcricao').value = registro.transcricao || '';
  document.getElementById('minuta-reuniao-pauta').innerHTML = registro.pautaHtml || textoAtaParaHtml(registro.reuniao.pauta || '');
  document.getElementById('minuta-reuniao-descricao').innerHTML = registro.descricaoHtml || '';
  document.getElementById('minuta-reuniao-providencias').innerHTML = registro.providenciasHtml || '';
  document.getElementById('minuta-reuniao-texto').innerHTML = registro.minutaHtml || '';
  ['minuta-reuniao-pauta','minuta-reuniao-descricao','minuta-reuniao-providencias'].forEach(idEditor => atualizarContadorEditorMinuta(document.getElementById(idEditor)));
  passoMinutaLiberado = 3;
  atualizarNavegacaoMinuta();
  mostrarPassoMinuta(2);
}

function salvarEdicaoMinutaHistorico(){
  if(!minutaHistoricoIdAtivo){
    const reuniao = obterReuniaoMinutaAtual();
    if(reuniao) registrarMinutaHistorico(reuniao);
    return;
  }
  const indice = minutasHistorico.findIndex(item => item.id === minutaHistoricoIdAtivo);
  if(indice < 0) return;
  minutasHistorico[indice] = {
    ...minutasHistorico[indice],
    geradaEm:new Date().toISOString(),
    transcricao:document.getElementById('minuta-reuniao-transcricao')?.value || '',
    pautaHtml:obterHtmlEditorMinuta('minuta-reuniao-pauta'),
    descricaoHtml:obterHtmlEditorMinuta('minuta-reuniao-descricao'),
    providenciasHtml:obterHtmlEditorMinuta('minuta-reuniao-providencias'),
    minutaHtml:obterHtmlEditorMinuta('minuta-reuniao-texto')
  };
  salvarHistoricoMinutas();
  renderEscolhaReuniaoMinuta();
  toast('Alterações da ata salvas.', 'valido');
}

function concluirAta(){
  const reuniao = obterReuniaoMinutaAtual();
  if(!reuniao) return;
  if(!minutaHistoricoIdAtivo) registrarMinutaHistorico(reuniao);
  const indice = minutasHistorico.findIndex(item => item.id === minutaHistoricoIdAtivo);
  if(indice >= 0){
    minutasHistorico[indice] = {
      ...minutasHistorico[indice],
      concluida:true,
      concluidaEm:new Date().toISOString(),
      geradaEm:new Date().toISOString(),
      transcricao:document.getElementById('minuta-reuniao-transcricao')?.value || '',
      pautaHtml:obterHtmlEditorMinuta('minuta-reuniao-pauta'),
      descricaoHtml:obterHtmlEditorMinuta('minuta-reuniao-descricao'),
      providenciasHtml:obterHtmlEditorMinuta('minuta-reuniao-providencias'),
      minutaHtml:obterHtmlEditorMinuta('minuta-reuniao-texto')
    };
    salvarHistoricoMinutas();
    renderHistoricoMinutas();
    renderEscolhaReuniaoMinuta();
  }
  fecharModalMinutaReuniao();
  toast('Ata concluída com sucesso.', 'valido');
}

function abrirModalExportarAta(){
  abrirModalElemento('exportar-ata-modal-overlay');
}

function fecharModalExportarAta(){
  fecharModalElemento('exportar-ata-modal-overlay');
}

function exportarAta(formato){
  fecharModalExportarAta();
  if(formato === 'pdf') imprimirMinutaPdf();
  else baixarMinutaWord();
}

function abrirMinutaHistorico(id){
  const registro = minutasHistorico.find(item => item.id === id);
  if(!registro?.reuniao) return;
  carregarDadosMinutaHistorico(registro);
  document.querySelector('.minuta-pagina')?.classList.remove('minuta-editando-existente');
  const titulo = document.getElementById('minuta-reuniao-titulo');
  const rotuloEditor = document.querySelector('label[for="minuta-reuniao-texto"]');
  if(titulo) titulo.textContent = 'Editar ata';
  if(rotuloEditor) rotuloEditor.textContent = 'Visualização da ata';
  document.getElementById('minuta-pagina-vazia')?.classList.add('oculto');
  document.querySelector('.minuta-pagina')?.classList.remove('oculto');
  document.getElementById('view-minutas')?.classList.add('minuta-em-edicao');
  setTab('minutas');
  window.scrollTo({top:0, behavior:'smooth'});
}

function baixarMinutaHistorico(id, formato){
  const registro = minutasHistorico.find(item => item.id === id);
  if(!registro?.reuniao) return;
  carregarDadosMinutaHistorico(registro);
  if(formato === 'pdf') imprimirMinutaPdf();
  else baixarMinutaWord();
}

function excluirMinutaHistorico(id){
  const registro = minutasHistorico.find(item => item.id === id);
  if(!registro?.reuniao) return;
  excluindoMinutaId = id;
  const identificacao = document.getElementById('delete-minuta-identificacao');
  if(identificacao) identificacao.textContent = `${registro.reuniao.frequencia} de ${fmtData(registro.reuniao.data)}`;
  abrirModalElemento('delete-minuta-modal-overlay');
}

function fecharModalExcluirMinuta(){
  fecharModalElemento('delete-minuta-modal-overlay');
  excluindoMinutaId = null;
}

function confirmarExclusaoMinuta(){
  if(!excluindoMinutaId) return;
  const minutaId = excluindoMinutaId;
  const reuniaoId = minutasHistorico.find(item => item.id === minutaId)?.reuniao?.id;
  minutasHistorico = minutasHistorico.filter(item => item.id !== minutaId && (!reuniaoId || item.reuniao?.id !== reuniaoId));
  salvarHistoricoMinutas();
  renderHistoricoMinutas();
  renderEscolhaReuniaoMinuta();
  fecharModalElemento('delete-minuta-modal-overlay');
  excluindoMinutaId = null;
  toast('Ata excluída com sucesso.', 'valido');
}
