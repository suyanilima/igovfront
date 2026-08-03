/* ===== js/documentos/cadastro.js ===== */
/* ===== ABA: CADASTRAR DOCUMENTO ===== */

let modoCadastro = null;

function atualizarObrigatoriedadeFundamentacaoCadastro(){
  const obrigatoria=modoCadastro==='documento' && document.getElementById('f-tipo')?.value==='Normativo';
  const baseLegal=document.getElementById('f-baselegal');
  const baseLegalNumero=document.getElementById('f-baselegal-num');
  if(baseLegal) baseLegal.required=obrigatoria;
  if(baseLegalNumero) baseLegalNumero.required=obrigatoria;
  document.getElementById('f-baselegal-required')?.toggleAttribute('hidden',!obrigatoria);
  document.getElementById('f-baselegal-num-required')?.toggleAttribute('hidden',!obrigatoria);
}

function selecionarModoCadastro(modo){
  modoCadastro = modo;

  const semNormativo = modo === 'semNormativo';
  const reuniao = modo === 'reuniao';
  const documentoAtivo = modo === 'documento' || semNormativo;
  const normativo = modo === 'documento';
  const camposNormativos = document.getElementById('campos-normativos');
  const camposPrazo = document.getElementById('campos-prazo');
  const camposTipoSei = document.getElementById('campos-tipo-sei');
  const baseLegal = document.getElementById('f-baselegal');
  const baseLegalNumero = document.getElementById('f-baselegal-num');

  document.getElementById('modo-documento')?.classList.toggle('active', normativo);
  document.getElementById('modo-sem-normativo')?.classList.toggle('active', semNormativo);
  document.getElementById('modo-reuniao')?.classList.toggle('active', reuniao);
  document.getElementById('cadastro-documento-form')?.classList.toggle('oculto', !documentoAtivo);
  document.getElementById('cadastro-reuniao-form')?.classList.toggle('oculto', !reuniao);
  document.getElementById('documento-form-blocks')?.classList.toggle('sem-normativo-layout', semNormativo);

  camposPrazo?.classList.toggle('oculto', semNormativo);
  camposTipoSei?.classList.toggle('oculto', semNormativo);

  if(camposNormativos){
    camposNormativos.classList.toggle('oculto', semNormativo);
  }

  if(baseLegal && semNormativo) baseLegal.value = '';

  if(baseLegalNumero && semNormativo) baseLegalNumero.value = '';

  ['f-data-vigencia', 'f-validade', 'f-tipo', 'f-sei'].forEach(id => {
    const campo = document.getElementById(id);
    if(campo) campo.required = normativo;
  });

  ['f-nome', 'f-gestor-nome', 'f-gestor-setor', 'f-gestor-email', 'f-gestor-whatsapp', 'f-desc'].forEach(id => {
    const campo = document.getElementById(id);
    if(campo) campo.required = documentoAtivo;
  });

  ['r-data', 'r-horario', 'r-frequencia', 'r-pauta'].forEach(id => {
    const campo = document.getElementById(id);
    if(campo) campo.required = reuniao;
  });

  if(semNormativo){
    document.getElementById('f-tipo').value = 'Projeto';
    document.getElementById('f-sei').value = '';
    document.getElementById('f-data-vigencia').value = '';
    atualizarPreviewVencimento();
  }
  atualizarObrigatoriedadeFundamentacaoCadastro();
  if(typeof sincronizarSeletoresPersonalizados === 'function') sincronizarSeletoresPersonalizados();
}

// Cadastrar documento -> Classificar o tipo -> Preencher dados -> Salvar -> Verifica o vencimento
async function cadastrar(){
  const nome = limitarTexto(document.getElementById('f-nome').value.trim(), LIMITES_CAMPOS.nome);
  const semNormativo = modoCadastro === 'semNormativo';
  const tipo = semNormativo ? 'Sem normativo' : document.getElementById('f-tipo').value;
  const fundamentacaoObrigatoria = tipo === 'Normativo';
  const baseLegal = semNormativo ? 'Sem normativo' : document.getElementById('f-baselegal').value;
  const baseLegalNumero = semNormativo ? '' : limitarTexto(document.getElementById('f-baselegal-num').value.trim(), LIMITES_CAMPOS.baseLegalNumero);
  const sei = semNormativo ? '' : normalizarNumeroSei(document.getElementById('f-sei').value);
  const dataVigencia = semNormativo ? '' : document.getElementById('f-data-vigencia').value;
  const validade = semNormativo ? '' : normalizarValidadeAnos(document.getElementById('f-validade').value);
  const descricao = limitarTexto(document.getElementById('f-desc').value.trim(), LIMITES_CAMPOS.descricao);
  const gestorNome = limitarTexto(document.getElementById('f-gestor-nome').value.trim(), LIMITES_CAMPOS.gestorNome);
  const gestorSetor = limitarTexto(document.getElementById('f-gestor-setor').value.trim().toUpperCase(), LIMITES_CAMPOS.gestorSetor);
  const unidade = gestorSetor;
  const gestorEmail = limitarTexto(document.getElementById('f-gestor-email').value.trim(), LIMITES_CAMPOS.gestorEmail);
  const gestorWhatsapp = limitarTexto(document.getElementById('f-gestor-whatsapp').value.trim(), LIMITES_CAMPOS.gestorWhatsapp);

  const camposObrigatorios = [
    { id:'f-nome', nome:'Nome do documento' },
    ...(semNormativo ? [] : [
      { id:'f-data-vigencia', nome:'Data de vigência' },
      { id:'f-validade', nome:'Prazo de validade' },
      { id:'f-tipo', nome:'Tipo' },
      { id:'f-sei', nome:'N° SEI' },
      ...(fundamentacaoObrigatoria ? [
        { id:'f-baselegal', nome:'Fundamentação legal' },
        { id:'f-baselegal-num', nome:'Número da fundamentação legal' }
      ] : [])
    ]),
    { id:'f-gestor-nome', nome:'Nome do gestor' },
    { id:'f-gestor-setor', nome:'Setor' },
    { id:'f-gestor-email', nome:'E-mail do gestor' },
    { id:'f-gestor-whatsapp', nome:'WhatsApp ou telefone' },
    { id:'f-desc', nome:'Descrição breve' }
  ];

  const campoVazio = camposObrigatorios.find(campo => {
    const elemento = document.getElementById(campo.id);
    return !elemento || !elemento.value.trim();
  });

  if(campoVazio){
    const elemento = document.getElementById(campoVazio.id);
    mostrarErroCampo(elemento, `${campoVazio.nome} é obrigatório.`);
    if(elemento){
      elemento.focus();
      elemento.classList.add('campo-invalido');
      setTimeout(() => elemento.classList.remove('campo-invalido'), 1800);
    }
    return;
  }

  if(typeof SETORES_CONVIDADOS!=='undefined' && !SETORES_CONVIDADOS[gestorSetor]){
    const campoSetor=document.getElementById('f-gestor-setor');
    mostrarErroCampo(campoSetor, 'Selecione um setor da lista de unidades.');
    campoSetor?.focus();
    return;
  }

  const campoInvalido = camposObrigatorios
    .map(campo => document.getElementById(campo.id))
    .find(elemento => elemento && !elemento.checkValidity());
  if(campoInvalido){
    mostrarErroCampo(campoInvalido, 'Informe um valor válido dentro do limite permitido.');
    campoInvalido.focus();
    campoInvalido.classList.add('campo-invalido');
    setTimeout(() => campoInvalido.classList.remove('campo-invalido'), 1800);
    return;
  }

  const emailCampo = document.getElementById('f-gestor-email');
  if(emailCampo && !emailCampo.checkValidity()){
    mostrarErroCampo(emailCampo, 'Informe um e-mail válido para o gestor.');
    emailCampo.focus();
    emailCampo.classList.add('campo-invalido');
    setTimeout(() => emailCampo.classList.remove('campo-invalido'), 1800);
    return;
  }

  // Vencimento calculado automaticamente: data de vigência (última renovação) + prazo de validade
  const data = semNormativo ? '' : calcularVencimento(dataVigencia, validade);

  const doc = {
    id:uid(), nome, tipo, sei, dataVigencia, validade, data, descricao, unidade,
    baseLegal, baseLegalNumero, semNormativo,
    gestorNome, gestorSetor, gestorEmail, gestorWhatsapp,
    ultimaAtualizacao: todayStr(),
    historico: []
  };
  const textoCriacao = semNormativo
    ? 'Documento sem normativo cadastrado no sistema.'
    : `Documento cadastrado no sistema. Vencimento calculado para ${fmtData(data)} (validade: ${VALIDADE_LABELS[validade]}).`;
  addHistorico(doc, 'criacao', textoCriacao, gestorNome);
  docs.unshift(doc);
  if(!await salvar()){
    docs.shift();
    return;
  }

  document.getElementById('f-nome').value='';
  document.getElementById('f-baselegal').value='';
  document.getElementById('f-baselegal-num').value='';
  document.getElementById('f-sei').value='';
  document.getElementById('f-data-vigencia').value='';
  document.getElementById('f-validade').value='1';
  document.getElementById('f-desc').value='';
  document.getElementById('f-gestor-nome').value='';
  document.getElementById('f-gestor-setor').value='';
  document.getElementById('f-gestor-email').value='';
  document.getElementById('f-gestor-whatsapp').value='';
  atualizarPreviewVencimento();
  selecionarModoCadastro(modoCadastro);

  render();
  setTab('cadastro');
  toast(`<b>Cadastro salvo com sucesso.</b> O documento "${escapeHtml(doc.nome)}" foi registrado.`, 'valido');
}

// Atualiza o texto de apoio mostrando a data de vencimento calculada em tempo real, a partir da vigência + validade
function atualizarPreviewVencimento(){
  const dataVigencia = document.getElementById('f-data-vigencia').value;
  const validade = document.getElementById('f-validade').value;
  const preview = document.getElementById('f-vencimento-preview');
  if(!preview) return;
  if(!dataVigencia){
    preview.textContent = '';
    return;
  }
  const vencimento = calcularVencimento(dataVigencia, validade);
  preview.textContent = `Vencimento calculado: ${fmtData(vencimento)}`;
}
document.addEventListener('DOMContentLoaded', ()=>{
  const nomeDocumento = document.getElementById('f-nome');
  const nomeGestor = document.getElementById('f-gestor-nome');
  const setorGestor = document.getElementById('f-gestor-setor');
  const emailGestor = document.getElementById('f-gestor-email');
  const telefoneGestor = document.getElementById('f-gestor-whatsapp');
  const numeroSei = document.getElementById('f-sei');
  const descricao = document.getElementById('f-desc');

  if(nomeDocumento){
    nomeDocumento.addEventListener('blur', () => {
      nomeDocumento.value = formatarNomeProprio(nomeDocumento.value);
    });
  }

  if(nomeGestor){
    nomeGestor.addEventListener('blur', () => {
      nomeGestor.value = formatarNomeProprio(nomeGestor.value);
    });
  }

  if(setorGestor){
    setorGestor.addEventListener('input', () => {
      setorGestor.value = formatarMaiusculo(setorGestor.value);
    });
  }

  if(emailGestor){
    emailGestor.addEventListener('input', () => {
      emailGestor.value = formatarEmail(emailGestor.value);
    });
  }

  if(telefoneGestor){
    telefoneGestor.addEventListener('input', () => {
      telefoneGestor.value = formatarTelefone(telefoneGestor.value);
    });
  }

  if(numeroSei){
    numeroSei.addEventListener('input', () => {
      numeroSei.value = formatarNumeroSei(numeroSei.value);
    });
  }

  if(descricao){
    descricao.addEventListener('blur', () => {
      descricao.value = primeiraLetraMaiuscula(descricao.value);
    });
  }
  selecionarModoCadastro(null);
  const dataVigencia = document.getElementById('f-data-vigencia');
  const validade = document.getElementById('f-validade');
  if(dataVigencia) dataVigencia.addEventListener('input', atualizarPreviewVencimento);
  if(validade) validade.addEventListener('change', atualizarPreviewVencimento);
});

// Verifica o vencimento -> Prazo? -> notifica (Alerta/Vencido) ou segue direto (Vigente)
function verificarVencimento(doc){
  const status = calcularStatus(doc);
  if(!status){
    toast(`<b>${escapeHtml(doc.nome)}</b> salvo como documento sem normativo.`, 'valido');
    return;
  }
  if(status === 'Vencido'){
    toast(`<b>Atenção</b> — "${escapeHtml(doc.nome)}" está vencido. Use “Notificar gestor” para enviar uma mensagem.`, 'vencido');
  } else if(status === 'Alerta'){
    toast(`<b>Atenção</b> — "${escapeHtml(doc.nome)}" está próximo do vencimento. Use “Notificar gestor” para enviar uma mensagem.`, 'alerta');
  } else {
    toast(`<b>${escapeHtml(doc.nome)}</b> salvo como Vigente.`, 'valido');
  }
}
