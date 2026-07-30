/* ===== ETAPAS E GERAÇÃO DA MINUTA ===== */

function abrirMinutaReuniao(id){
  const reuniao = reunioes.find(item => item.id === id);
  if(!reuniao) return;
  minutaReuniaoId = id;
  minutaHistoricoReuniao = null;
  minutaHistoricoIdAtivo = null;
  document.querySelector('.minuta-pagina')?.classList.remove('minuta-editando-existente');
  const titulo = document.getElementById('minuta-reuniao-titulo');
  const rotuloEditor = document.querySelector('label[for="minuta-reuniao-texto"]');
  if(titulo) titulo.textContent = 'Gerar ata';
  if(rotuloEditor) rotuloEditor.textContent = 'Ata gerada';
  document.getElementById('minuta-reuniao-identificacao').textContent = `${reuniao.frequencia} • ${fmtData(reuniao.data)} às ${reuniao.horario}`;
  document.getElementById('minuta-reuniao-transcricao').value = '';
  definirTextoEditorMinuta('minuta-reuniao-descricao', '');
  definirTextoEditorMinuta('minuta-reuniao-providencias', '');
  definirTextoEditorMinuta('minuta-reuniao-pauta', reuniao.pauta || '');
  definirTextoEditorMinuta('minuta-reuniao-texto', '');
  const statusIA = document.getElementById('minuta-ia-status');
  if(statusIA) statusIA.textContent = 'Se o texto for uma transcrição, use “Editar com IA”. Se já for um resumo ou uma descrição, clique em “Prosseguir”.';
  passoMinutaLiberado = 1;
  mostrarPassoMinuta(1);
  atualizarNavegacaoMinuta();
  limparErroCampo(document.getElementById('minuta-reuniao-descricao'));
  document.getElementById('minuta-pagina-vazia')?.classList.add('oculto');
  document.querySelector('.minuta-pagina')?.classList.remove('oculto');
  document.getElementById('view-minutas')?.classList.add('minuta-em-edicao');
  setTab('minutas');
  window.scrollTo({top:0, behavior:'smooth'});
}

function mostrarPassoMinuta(passo){
  document.getElementById('minuta-passo-transcricao')?.classList.toggle('oculto', passo !== 1);
  document.getElementById('minuta-passo-revisao')?.classList.toggle('oculto', passo !== 2);
  document.getElementById('minuta-reuniao-resultado')?.classList.toggle('oculto', passo !== 3);
  document.querySelectorAll('[data-minuta-passo]').forEach(item => item.classList.toggle('active', Number(item.dataset.minutaPasso) === passo));
}

function navegarPassoMinuta(passo){
  if(passo > passoMinutaLiberado) return;
  if(passo === 1){
    const status = document.getElementById('minuta-ia-status');
    if(status) status.textContent = passoMinutaLiberado > 1 ? 'O conteúdo foi mantido. Prossiga ou edite novamente com IA.' : 'Se o texto for uma transcrição, use a IA. Se já estiver resumido, apenas prossiga.';
  }
  mostrarPassoMinuta(passo);
}

function atualizarNavegacaoMinuta(){
  document.querySelectorAll('[data-minuta-passo]').forEach(item => {
    item.disabled = Number(item.dataset.minutaPasso) > passoMinutaLiberado;
  });
}

function fecharModalMinutaReuniao(){
  document.querySelector('.minuta-pagina')?.classList.add('oculto');
  document.querySelector('.minuta-pagina')?.classList.remove('minuta-editando-existente');
  document.getElementById('minuta-pagina-vazia')?.classList.remove('oculto');
  document.getElementById('view-minutas')?.classList.remove('minuta-em-edicao');
  minutaReuniaoId = null;
  minutaHistoricoReuniao = null;
  minutaHistoricoIdAtivo = null;
  window.scrollTo({top:0, behavior:'smooth'});
}

function montarPaginaMinuta(){
  const overlay = document.getElementById('minuta-reuniao-modal-overlay');
  const destino = document.getElementById('minuta-pagina-conteudo');
  const painel = overlay?.querySelector('.minuta-reuniao-modal');
  if(!overlay || !destino || !painel) return;

  painel.classList.remove('modal');
  painel.classList.add('panel', 'minuta-pagina', 'oculto');
  painel.removeAttribute('role');
  painel.removeAttribute('aria-modal');
  painel.removeAttribute('tabindex');

  const voltar = painel.querySelector('.modal-close');
  if(voltar){
    voltar.className = 'minuta-voltar-reunioes';
    voltar.textContent = 'Fechar ata';
    voltar.setAttribute('aria-label', 'Fechar ata');
  }

  destino.appendChild(painel);
  overlay.remove();
}

function gerarTextoMinuta(reuniao, descricao, dados = {}){
  const membros = normalizarMembros(reuniao.membros, reuniao.frequencia).filter(membro => membro.nome);
  const convidados = normalizarParticipantes(reuniao.convidados ?? reuniao.participantes);
  const linhasMembros = membros.length ? membros.map(membro => `${membro.nome} - ${membro.cargo}`).join('\n') : 'Não informado';
  const linhasConvidados = convidados.length ? convidados.join('\n') : 'Não houve convidados registrados.';
  const formato = rotuloFormatoReuniao(reuniao.formato);
  const local = dados.local || (normalizarFormatoReuniao(reuniao.formato) === 'Presencial' ? 'Reunião presencial' : 'Sala virtual - SARA');
  const pauta = dados.pauta || reuniao.pauta;
  const providencias = dados.providencias || 'Não foram registradas providências.';
  const tituloParticipantes = reuniao.frequencia === 'CGTIC' ? `\nParticipantes do CGTIC:\n` : '\n';
  return `ATA - PRESI/${reuniao.frequencia}\n\nFormato: ${formato}\nLocal: ${local}\nData - Hora: ${fmtData(reuniao.data)}, às ${reuniao.horario}\n\nComitê de Governança de TIC:\n${tituloParticipantes}${linhasMembros}\n\nConvidados:\n${linhasConvidados}\n\nPAUTA:\n${pauta}\n\nDESCRIÇÃO DOS PROBLEMAS / SOLICITAÇÕES / DELIBERAÇÕES:\n${descricao}\n\nPROVIDÊNCIAS:\n${providencias}`;
}

function gerarHtmlMinutaFinal(reuniao, pautaHtml, descricaoHtml, providenciasHtml){
  const membros = normalizarMembros(reuniao.membros, reuniao.frequencia).filter(item => item.nome);
  const convidados = normalizarParticipantes(reuniao.convidados ?? reuniao.participantes);
  const tituloParticipantes = reuniao.frequencia === 'CGTIC' ? '<br>Participantes do CGTIC:<br>' : '<br>';
  const linhasMembros = membros.map(item => `<strong>${escapeHtml(item.nome)}</strong> - ${escapeHtml(item.cargo)}`).join('<br>');
  const linhasConvidados = convidados.length ? convidados.map(escapeHtml).join('<br>') : 'Não houve convidados registrados.';
  const pauta = normalizarHtmlConteudoMinuta(pautaHtml || textoAtaParaHtml(reuniao.pauta));
  const descricao = normalizarHtmlConteudoMinuta(descricaoHtml);
  const providencias = normalizarHtmlConteudoMinuta(providenciasHtml) || 'Não foram registradas providências.';
  const formato = rotuloFormatoReuniao(reuniao.formato);
  const local = normalizarFormatoReuniao(reuniao.formato) === 'Presencial' ? 'Reunião presencial' : 'Sala virtual - SARA';
  const secao = (titulo, conteudo) => `<div class="ata-secao-titulo"><strong>${titulo}</strong></div>${conteudo ? `<div class="ata-secao-conteudo">${conteudo}</div>` : ''}`;
  return `<div class="ata-titulo"><strong>ATA - PRESI/${escapeHtml(reuniao.frequencia)}</strong></div><div class="ata-bloco"><strong>Formato:</strong> ${escapeHtml(formato)}<br><strong>Local:</strong> ${escapeHtml(local)}<br><strong>Data - Hora:</strong> ${escapeHtml(fmtData(reuniao.data))}, às ${escapeHtml(reuniao.horario)}</div><div class="ata-bloco"><strong>Comitê de Governança de TIC:</strong>${tituloParticipantes}${linhasMembros}<br><br><strong>Convidados:</strong><br>${linhasConvidados}</div><div class="ata-bloco">${secao('PAUTA:', pauta)}</div><div class="ata-bloco">${secao('DESCRIÇÃO DOS PROBLEMAS / SOLICITAÇÕES / DELIBERAÇÕES:', descricao)}</div><div class="ata-bloco">${secao('PROVIDÊNCIAS:', providencias)}</div>`;
}

function gerarMinutaReuniao(){
  const reuniao = obterReuniaoMinutaAtual();
  const campo = document.getElementById('minuta-reuniao-descricao');
  const descricao = limitarTexto(obterTextoEditorMinuta('minuta-reuniao-descricao'), 5000);
  const local = 'Sala virtual - SARA';
  const pauta = limitarTexto(reuniao?.pauta, 200);
  const providencias = limitarTexto(obterTextoEditorMinuta('minuta-reuniao-providencias'), 3000);
  if(!reuniao || !descricao){
    mostrarErroCampo(campo, 'Descreva o que ocorreu na reunião para gerar a ata.');
    campo?.focus();
    return;
  }
  const editorFinal = document.getElementById('minuta-reuniao-texto');
  editorFinal.innerHTML = gerarHtmlMinutaFinal(reuniao, obterHtmlEditorMinuta('minuta-reuniao-pauta'), obterHtmlEditorMinuta('minuta-reuniao-descricao'), obterHtmlEditorMinuta('minuta-reuniao-providencias'));
  atualizarContadorEditorMinuta(editorFinal);
  passoMinutaLiberado = 3;
  atualizarNavegacaoMinuta();
  mostrarPassoMinuta(3);
  if(minutaHistoricoIdAtivo) salvarEdicaoMinutaHistorico();
  else registrarMinutaHistorico(reuniao);
}

async function copiarMinutaReuniao(){
  const texto = obterTextoEditorMinuta('minuta-reuniao-texto');
  try{
    await navigator.clipboard.writeText(texto);
    toast('Ata copiada para a área de transferência.', 'valido');
  }catch(e){
    document.getElementById('minuta-reuniao-texto')?.focus();
    toast('Selecione e copie o texto da ata.', 'alerta');
  }
}

function baixarMinutaReuniao(){
  const reuniao = obterReuniaoMinutaAtual();
  const texto = obterTextoEditorMinuta('minuta-reuniao-texto');
  if(!reuniao || !texto) return;
  const url = URL.createObjectURL(new Blob([texto], {type:'text/plain;charset=utf-8'}));
  const link = document.createElement('a');
  link.href = url;
  link.download = `ata-${reuniao.frequencia.toLowerCase()}-${reuniao.data}.txt`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
