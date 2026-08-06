/* ===== CADASTRO ACOES ===== */

/* ===== CADASTRO, EDIÇÃO E EXCLUSÃO DE REUNIÕES ===== */

let reuniaoRemarcandoId = null;
let reuniaoCancelandoId = null;

function obterSituacaoReuniao(reuniao){
  if(reuniao?.cancelada || reuniao?.situacao === 'Cancelada') return 'Cancelada';
  const instante = new Date(`${reuniao?.data || ''}T${reuniao?.horario || '23:59'}`);
  if(!Number.isNaN(instante.getTime()) && instante.getTime() < Date.now()) return 'Concluída';
  if(reuniao?.reagendada || reuniao?.situacao === 'Reagendada') return 'Reagendada';
  return 'Agendada';
}

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
      resumo: limitarTexto(item.resumo, 100),
      situacao: item.situacao === 'Cancelada' ? 'Cancelada' : item.situacao === 'Reagendada' ? 'Reagendada' : '',
      cancelada: item.cancelada === true || item.situacao === 'Cancelada',
      reagendada: item.reagendada === true || item.situacao === 'Reagendada'
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
  reuniaoRemarcandoId = null;
  const tituloModal=document.getElementById('editar-reuniao-titulo');
  if(tituloModal) tituloModal.textContent='Editar reunião';
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
  reuniaoRemarcandoId = null;
  participantesReuniaoEdicao = [];
  membrosReuniaoEdicao = [];
}

function remarcarReuniao(id){
  const reuniao=reunioes.find(item=>item.id===id);
  if(!reuniao) return;
  reuniaoRemarcandoId=id;
  const identificacao=document.getElementById('remarcar-reuniao-identificacao');
  const data=document.getElementById('remarcar-reuniao-data');
  if(identificacao) identificacao.textContent=`${reuniao.frequencia} • atualmente em ${fmtData(reuniao.data)}`;
  if(data){
    data.value=reuniao.data || '';
    data.min=todayStr();
  }
  abrirModalElemento('remarcar-reuniao-modal-overlay');
  setTimeout(()=>data?.focus(),0);
}

function fecharRemarcacaoReuniao(){
  fecharModalElemento('remarcar-reuniao-modal-overlay');
  reuniaoRemarcandoId=null;
}

function confirmarRemarcacaoReuniao(){
  const reuniao=reunioes.find(item=>item.id===reuniaoRemarcandoId);
  const campo=document.getElementById('remarcar-reuniao-data');
  if(!reuniao || !campo?.value || !campo.checkValidity()){
    mostrarErroCampo(campo,'Informe uma nova data válida.');
    campo?.focus();
    return;
  }
  const anterior={...reuniao};
  reuniao.data=campo.value;
  reuniao.reagendada=true;
  reuniao.cancelada=false;
  reuniao.situacao='Reagendada';
  if(!salvarReunioes()){
    Object.assign(reuniao,anterior);
    return;
  }
  renderReunioes();
  fecharRemarcacaoReuniao();
  toast('Reunião remarcada com sucesso.','valido');
}

function cancelarReuniao(id){
  const reuniao=reunioes.find(item=>item.id===id);
  if(!reuniao) return;
  if((reuniao.data || '') < todayStr()){
    toast('Não é possível cancelar uma reunião cuja data já passou.','alerta');
    return;
  }
  if(obterSituacaoReuniao(reuniao)==='Cancelada'){
    toast('Esta reunião já está cancelada.','alerta');
    return;
  }
  reuniaoCancelandoId=id;
  const identificacao=document.getElementById('cancelar-reuniao-identificacao');
  if(identificacao) identificacao.textContent=`${reuniao.frequencia} • ${fmtData(reuniao.data)} às ${reuniao.horario || '—'}`;
  document.getElementById('cancelar-reuniao-pauta').textContent=reuniao.pauta || 'Sem pauta informada';
  abrirModalElemento('cancelar-reuniao-modal-overlay');
}

function fecharCancelamentoReuniao(){
  fecharModalElemento('cancelar-reuniao-modal-overlay');
  reuniaoCancelandoId=null;
}

function confirmarCancelamentoReuniao(){
  const reuniao=reunioes.find(item=>item.id===reuniaoCancelandoId);
  if(!reuniao){
    fecharCancelamentoReuniao();
    return;
  }
  if((reuniao.data || '') < todayStr()){
    fecharCancelamentoReuniao();
    toast('Não é possível cancelar uma reunião cuja data já passou.','alerta');
    return;
  }
  const anterior={...reuniao};
  reuniao.cancelada=true;
  reuniao.reagendada=false;
  reuniao.situacao='Cancelada';
  if(!salvarReunioes()){
    Object.assign(reuniao,anterior);
    return;
  }
  renderReunioes();
  fecharCancelamentoReuniao();
  toast('Reunião cancelada.','alerta');
}

