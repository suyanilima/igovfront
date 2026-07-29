/* ===== CADASTRO, EDIÇÃO E EXCLUSÃO DE REUNIÕES ===== */

function todosParticipantesReuniao(item){
  const membros = normalizarMembros(item.membros, item.frequencia).filter(membro => membro.nome).map(membro => `${membro.nome} — ${membro.cargo}`);
  const convidados = normalizarParticipantes(item.convidados ?? item.participantes);
  return [...membros, ...convidados];
}

function normalizarLinkReuniao(valor){
  const link = limitarTexto(String(valor || '').trim(), 500);
  return /^https?:\/\//i.test(link) ? link : '';
}

function carregarReunioes(){
  try{
    const dados = JSON.parse(localStorage.getItem(REUNIOES_STORAGE_KEY) || '[]');
    reunioes = Array.isArray(dados) ? dados.map(item => ({
      id: limitarTexto(item.id, 80),
      data: limitarTexto(item.data, 10),
      horario: limitarTexto(item.horario, 5),
      frequencia: item.frequencia === 'GOVTIC' ? 'CGOVTIC' : limitarTexto(item.frequencia, 40),
      formato: normalizarFormatoReuniao(item.formato),
      link: normalizarLinkReuniao(item.link),
      pauta: limitarTexto(item.pauta, 200),
      membros: normalizarMembros(item.membros, item.frequencia === 'GOVTIC' ? 'CGOVTIC' : item.frequencia),
      convidados: normalizarParticipantes(item.convidados ?? item.participantes),
      participantes: normalizarParticipantes(item.participantes),
      resumo: limitarTexto(item.resumo, 100)
    })) : [];
  }catch(e){
    reunioes = [];
  }
  atualizarFiltroTiposReuniao();
  renderReunioes();
}

function salvarReunioes(){
  try{
    localStorage.setItem(REUNIOES_STORAGE_KEY, JSON.stringify(reunioes));
    return true;
  }catch(e){
    toast('Não foi possível salvar a reunião neste navegador.', 'vencido');
    return false;
  }
}

function alterarFormatoReuniao(prefixo){
  const campoFormato=document.getElementById(`${prefixo}-formato`);
  const grupoLink=document.getElementById(`${prefixo}-link-grupo`);
  const campoLink=document.getElementById(`${prefixo}-link`);
  const presencial=normalizarFormatoReuniao(campoFormato?.value)==='Presencial';
  grupoLink?.classList.toggle('oculto',presencial);
  if(presencial && campoLink) campoLink.value='';
}

function cadastrarReuniao(){
  const campos = ['r-data','r-horario','r-frequencia','r-formato','r-pauta'];
  const invalido = campos.map(id => document.getElementById(id)).find(campo => !campo?.value.trim() || !campo.checkValidity());
  if(invalido){
    mostrarErroCampo(invalido, invalido.value.trim() ? 'Informe um valor válido.' : 'Este campo é obrigatório.');
    invalido.focus();
    invalido.classList.add('campo-invalido');
    setTimeout(() => invalido.classList.remove('campo-invalido'), 1800);
    return;
  }

  const membroSemNome = membrosReuniaoCadastro.findIndex(membro => !membro.nome.trim());
  if(membroSemNome >= 0){
    const campoMembro = document.getElementById(`r-membro-${membroSemNome}`);
    mostrarErroCampo(campoMembro, 'Informe o nome do membro que ocupa este cargo.');
    campoMembro?.focus();
    return;
  }

  const formato = normalizarFormatoReuniao(document.getElementById('r-formato').value);
  const campoLink = document.getElementById('r-link');
  const linkDigitado = formato === 'Presencial' ? '' : campoLink.value.trim();
  const link = normalizarLinkReuniao(linkDigitado);
  if(linkDigitado && (!campoLink.checkValidity() || !link)){
    mostrarErroCampo(campoLink, 'Informe um link válido iniciado por http:// ou https://.');
    campoLink.focus();
    return;
  }

  const frequencia = document.getElementById('r-frequencia').value;
  if(!FREQUENCIAS_REUNIAO[frequencia]) return;

  const reuniao = {
    id: uid(),
    data: document.getElementById('r-data').value,
    horario: document.getElementById('r-horario').value,
    frequencia,
    formato,
    link,
    pauta: limitarTexto(document.getElementById('r-pauta').value.trim(), 200),
    membros: membrosReuniaoCadastro.map(membro => ({...membro, nome:limitarTexto(formatarNomeProprio(membro.nome), 50)})),
    convidados: [...participantesReuniaoCadastro],
    participantes: [...membrosReuniaoCadastro.map(membro => membro.nome), ...participantesReuniaoCadastro],
    resumo: ''
  };

  const indiceEdicao = reuniaoEditandoId ? reunioes.findIndex(item => item.id === reuniaoEditandoId) : -1;
  const anterior = indiceEdicao >= 0 ? reunioes[indiceEdicao] : null;
  if(indiceEdicao >= 0){
    reuniao.id = reuniaoEditandoId;
    reunioes[indiceEdicao] = reuniao;
  }else{
    reunioes.unshift(reuniao);
  }
  if(!salvarReunioes()){
    if(indiceEdicao >= 0) reunioes[indiceEdicao] = anterior;
    else reunioes.shift();
    return;
  }

  [...campos, 'r-link'].forEach(id => {
    const campo = document.getElementById(id);
    if(campo) campo.value = '';
  });
  document.getElementById('r-formato').value = 'Online';
  alterarFormatoReuniao('r');
  participantesReuniaoCadastro = [];
  membrosReuniaoCadastro = [];
  reuniaoEditandoId = null;
  document.getElementById('r-participante-input').value = '';
  renderParticipantesCadastro();
  atualizarContadorPauta();
  alterarTipoReuniao();
  atualizarEstadoEdicaoReuniao();
  renderReunioes();
  selecionarModoCadastro('reuniao');
  setTab('cadastro');
  toast(`<b>Reunião salva.</b> O registro ${escapeHtml(reuniao.frequencia)} foi ${indiceEdicao >= 0 ? 'atualizado' : 'cadastrado'}.`, 'valido');
}

function editarReuniao(id){
  const reuniao = reunioes.find(item => item.id === id);
  if(!reuniao) return;
  reuniaoEditandoId = id;
  document.getElementById('edit-r-data').value = reuniao.data || '';
  document.getElementById('edit-r-horario').value = reuniao.horario || '';
  document.getElementById('edit-r-frequencia').value = reuniao.frequencia || 'CGOVTIC';
  document.getElementById('edit-r-formato').value = normalizarFormatoReuniao(reuniao.formato);
  document.getElementById('edit-r-link').value = reuniao.link || '';
  alterarFormatoReuniao('edit-r');
  document.getElementById('edit-r-pauta').value = reuniao.pauta || '';
  membrosReuniaoEdicao = normalizarMembros(reuniao.membros, reuniao.frequencia);
  participantesReuniaoEdicao = normalizarParticipantes(reuniao.convidados ?? reuniao.participantes);
  renderMembrosEdicaoReuniao();
  renderParticipantesEdicaoReuniao();
  abrirModalElemento('edit-reuniao-modal-overlay');
}

function fecharModalEditarReuniao(){
  fecharModalElemento('edit-reuniao-modal-overlay');
  reuniaoEditandoId = null;
  participantesReuniaoEdicao = [];
  membrosReuniaoEdicao = [];
}

function alterarTipoEdicaoReuniao(tipo){
  if(!FREQUENCIAS_REUNIAO[tipo]) return;
  membrosReuniaoEdicao = normalizarMembros([], tipo);
  renderMembrosEdicaoReuniao();
}

function atualizarNomeMembroEdicaoReuniao(indice, valor){
  if(!membrosReuniaoEdicao[indice]) return;
  membrosReuniaoEdicao[indice].nome = limitarTexto(valor, 50);
  limparErroCampo(document.getElementById(`edit-r-membro-${indice}`));
}

function renderMembrosEdicaoReuniao(){
  const lista = document.getElementById('edit-r-membros-lista');
  if(!lista) return;
  lista.innerHTML = membrosReuniaoEdicao.map((membro, indice) => `
    <div class="membro-fixo">
      <label for="edit-r-membro-${indice}">${escapeHtml(membro.cargo)}</label>
      <input id="edit-r-membro-${indice}" type="text" maxlength="50" value="${escapeHtml(membro.nome)}" placeholder="Nome do membro" oninput="atualizarNomeMembroEdicaoReuniao(${indice},this.value)">
    </div>
  `).join('');
}

function adicionarParticipanteEdicaoReuniao(){
  const campo = document.getElementById('edit-r-participante-input');
  const campoSetor = document.getElementById('edit-r-participante-setor');
  if(!campo) return;
  const siglaSetor = String(campoSetor?.value || '').trim().toUpperCase();
  if(!SETORES_CONVIDADOS[siglaSetor]){
    mostrarErroCampo(campoSetor, 'Digite e escolha uma sigla válida.');
    campoSetor?.focus();
    return;
  }
  campoSetor.value = siglaSetor;
  const nome = formatarConvidadoComSetor(campo.value, siglaSetor);
  if(!nome){ campo.focus(); return; }
  if(participantesReuniaoEdicao.length >= 30){
    toast('O limite é de 30 participantes por reunião.', 'alerta');
    return;
  }
  if(participantesReuniaoEdicao.some(item => item.toLowerCase() === nome.toLowerCase())){
    toast('Esse participante já foi adicionado.', 'alerta');
    return;
  }
  participantesReuniaoEdicao.push(nome);
  limparErroCampo(campo);
  limparErroCampo(campoSetor);
  campo.value = '';
  campoSetor.value = '';
  renderParticipantesEdicaoReuniao();
  campo.focus();
}

function removerParticipanteEdicaoReuniao(indice){
  participantesReuniaoEdicao.splice(indice, 1);
  renderParticipantesEdicaoReuniao();
}

function renderParticipantesEdicaoReuniao(){
  const lista = document.getElementById('edit-r-participantes-lista');
  if(!lista) return;
  lista.innerHTML = participantesReuniaoEdicao.map((nome, indice) => {
    const nomeExibicao = resumirConvidadoParaExibicao(nome);
    return `<li><span class="participante-nome" title="${escapeHtml(nomeExibicao)}">${escapeHtml(nomeExibicao)}</span><button type="button" onclick="removerParticipanteEdicaoReuniao(${indice})" aria-label="Remover ${escapeHtml(nomeExibicao)}">×</button></li>`;
  }).join('');
}

function confirmarEdicaoReuniao(){
  const reuniao = reunioes.find(item => item.id === reuniaoEditandoId);
  if(!reuniao) return;
  const ids = ['edit-r-data','edit-r-horario','edit-r-frequencia','edit-r-formato','edit-r-pauta'];
  const invalido = ids.map(id => document.getElementById(id)).find(campo => !campo.value.trim() || !campo.checkValidity());
  if(invalido){
    mostrarErroCampo(invalido, invalido.value.trim() ? 'Informe um valor válido.' : 'Este campo é obrigatório.');
    invalido.focus();
    return;
  }
  const membroSemNome = membrosReuniaoEdicao.findIndex(membro => !membro.nome.trim());
  if(membroSemNome >= 0){
    const campoMembro = document.getElementById(`edit-r-membro-${membroSemNome}`);
    mostrarErroCampo(campoMembro, 'Informe o nome do membro que ocupa este cargo.');
    campoMembro?.focus();
    return;
  }
  const formato = normalizarFormatoReuniao(document.getElementById('edit-r-formato').value);
  const campoLink = document.getElementById('edit-r-link');
  const linkDigitado = formato === 'Presencial' ? '' : campoLink.value.trim();
  const link = normalizarLinkReuniao(linkDigitado);
  if(linkDigitado && (!campoLink.checkValidity() || !link)){
    mostrarErroCampo(campoLink, 'Informe um link válido iniciado por http:// ou https://.');
    campoLink.focus();
    return;
  }

  const anterior = {...reuniao, participantes:[...normalizarParticipantes(reuniao.participantes)]};
  reuniao.data = document.getElementById('edit-r-data').value;
  reuniao.horario = document.getElementById('edit-r-horario').value;
  reuniao.frequencia = document.getElementById('edit-r-frequencia').value;
  reuniao.formato = formato;
  reuniao.link = link;
  reuniao.pauta = limitarTexto(document.getElementById('edit-r-pauta').value.trim(), 200);
  reuniao.convidados = [...participantesReuniaoEdicao];
  reuniao.membros = membrosReuniaoEdicao.map(membro => ({...membro, nome:limitarTexto(formatarNomeProprio(membro.nome), 50)}));
  reuniao.participantes = [...reuniao.membros.filter(membro => membro.nome).map(membro => membro.nome), ...participantesReuniaoEdicao];
  if(!salvarReunioes()){
    Object.assign(reuniao, anterior);
    return;
  }
  renderReunioes();
  fecharModalEditarReuniao();
  toast('Reunião atualizada com sucesso.', 'valido');
}

function cancelarEdicaoReuniao(){
  reuniaoEditandoId = null;
  participantesReuniaoCadastro = [];
  ['r-data','r-horario','r-frequencia','r-link','r-pauta','r-participante-input'].forEach(id => {
    const campo = document.getElementById(id);
    if(campo) campo.value = '';
  });
  renderParticipantesCadastro();
  atualizarContadorPauta();
  atualizarEstadoEdicaoReuniao();
}

function atualizarEstadoEdicaoReuniao(){
  const botaoSalvar = document.getElementById('btn-salvar-reuniao');
  const botaoCancelar = document.getElementById('btn-cancelar-edicao-reuniao');
  if(botaoSalvar) botaoSalvar.textContent = reuniaoEditandoId ? 'Atualizar reunião' : 'Salvar reunião';
  botaoCancelar?.classList.toggle('oculto', !reuniaoEditandoId);
}

function notificarReuniao(id){
  const reuniao = reunioes.find(item => item.id === id);
  if(!reuniao) return;
  toast('A notificação ficará disponível após a integração dos participantes com os usuários e contatos do sistema.', 'alerta');
}

function executarAcaoReuniao(acao, id){
  if(acao === 'editar') editarReuniao(id);
  if(acao === 'excluir') excluirReuniao(id);
  if(acao === 'notificar') notificarReuniao(id);
}

function adicionarParticipanteReuniao(){
  const campo = document.getElementById('r-participante-input');
  const campoSetor = document.getElementById('r-participante-setor');
  if(!campo) return;
  const siglaSetor = String(campoSetor?.value || '').trim().toUpperCase();
  if(!SETORES_CONVIDADOS[siglaSetor]){
    mostrarErroCampo(campoSetor, 'Digite e escolha uma sigla válida.');
    campoSetor?.focus();
    return;
  }
  campoSetor.value = siglaSetor;
  const nome = formatarConvidadoComSetor(campo.value, siglaSetor);
  if(!nome){
    campo.focus();
    return;
  }
  if(participantesReuniaoCadastro.length >= 30){
    toast('O limite é de 30 participantes por reunião.', 'alerta');
    return;
  }
  if(participantesReuniaoCadastro.some(item => item.toLowerCase() === nome.toLowerCase())){
    toast('Esse participante já foi adicionado.', 'alerta');
    campo.select();
    return;
  }
  participantesReuniaoCadastro.push(nome);
  limparErroCampo(campo);
  limparErroCampo(campoSetor);
  campo.value = '';
  campoSetor.value = '';
  renderParticipantesCadastro();
  campo.focus();
}

function selecionarTipoReuniao(tipo){
  if(!FREQUENCIAS_REUNIAO[tipo]) return;
  document.getElementById('r-frequencia').value = tipo;
  membrosReuniaoCadastro = normalizarMembros([], tipo);
  participantesReuniaoCadastro = [];
  document.getElementById('reuniao-tipo-etapa')?.classList.add('oculto');
  document.getElementById('reuniao-dados-etapa')?.classList.remove('oculto');
  const resumo = document.getElementById('reuniao-tipo-selecionado');
  if(resumo) resumo.textContent = `${tipo} — ${FREQUENCIAS_REUNIAO[tipo]}`;
  document.querySelectorAll('.reuniao-tipo-btn').forEach(botao => botao.classList.toggle('active', botao.dataset.tipo === tipo));
  renderMembrosCadastro();
  renderParticipantesCadastro();
}

function alterarTipoReuniao(){
  const campo = document.getElementById('r-frequencia');
  if(campo) campo.value = '';
  membrosReuniaoCadastro = [];
  document.getElementById('reuniao-tipo-etapa')?.classList.remove('oculto');
  document.getElementById('reuniao-dados-etapa')?.classList.add('oculto');
}

function atualizarNomeMembroReuniao(indice, valor){
  if(!membrosReuniaoCadastro[indice]) return;
  membrosReuniaoCadastro[indice].nome = limitarTexto(valor, 50);
  limparErroCampo(document.getElementById(`r-membro-${indice}`));
}

function atualizarContadorPauta(){
  const campo = document.getElementById('r-pauta');
  const contador = document.getElementById('r-pauta-contador');
  if(!campo || !contador) return;
  const limite = Number(campo.maxLength) || 200;
  const quantidade = campo.value.length;
  contador.textContent = `${quantidade}/${limite}`;
  contador.classList.toggle('proximo-limite', quantidade >= Math.ceil(limite * .9));
}

function renderMembrosCadastro(){
  const lista = document.getElementById('r-membros-lista');
  if(!lista) return;
  lista.innerHTML = membrosReuniaoCadastro.map((membro, indice) => `
    <div class="membro-fixo">
      <label for="r-membro-${indice}">${escapeHtml(membro.cargo)}</label>
      <input id="r-membro-${indice}" type="text" maxlength="50" value="${escapeHtml(membro.nome)}" placeholder="Nome do membro" oninput="atualizarNomeMembroReuniao(${indice},this.value)">
    </div>
  `).join('');
}

function removerParticipanteReuniao(indice){
  participantesReuniaoCadastro.splice(indice, 1);
  renderParticipantesCadastro();
}

function renderParticipantesCadastro(){
  const lista = document.getElementById('r-participantes-lista');
  if(!lista) return;
  lista.innerHTML = participantesReuniaoCadastro.map((nome, indice) => {
    const nomeExibicao = resumirConvidadoParaExibicao(nome);
    return `<li><span class="participante-nome" title="${escapeHtml(nomeExibicao)}">${escapeHtml(nomeExibicao)}</span><button type="button" onclick="removerParticipanteReuniao(${indice})" aria-label="Remover convidado ${escapeHtml(nomeExibicao)}">×</button></li>`;
  }).join('');
}

function excluirReuniao(id){
  const reuniao = reunioes.find(item => item.id === id);
  if(!reuniao) return;
  excluindoReuniaoId = id;
  document.getElementById('delete-reuniao-pauta').textContent = reuniao.pauta || 'Sem pauta';
  abrirModalElemento('delete-reuniao-modal-overlay');
}

function fecharModalExcluirReuniao(){
  fecharModalElemento('delete-reuniao-modal-overlay');
  excluindoReuniaoId = null;
}

function confirmarExclusaoReuniao(){
  const indice = reunioes.findIndex(item => item.id === excluindoReuniaoId);
  if(indice < 0){
    fecharModalExcluirReuniao();
    return;
  }
  const removida = reunioes.splice(indice, 1)[0];
  if(!salvarReunioes()){
    reunioes.splice(indice, 0, removida);
    return;
  }
  renderReunioes();
  fecharModalExcluirReuniao();
  toast('Reunião excluída.', 'vencido');
}