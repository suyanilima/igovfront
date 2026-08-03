/* ===== js/documentos/modais.js ===== */
/* ===== MODAIS: renovar, excluir, editar, resumo e notificar gestor ===== */

let renovandoId = null;
let prazoRenovacaoSelecionado = null;

// Renova o documento -> Escolhe o prazo (6m/1a/2a) -> Vigência = hoje -> Recalcula vencimento -> Salvar
function renovar(id){
  const doc = docs.find(d=>d.id===id);
  if(!doc) return;
  if(doc.semNormativo || doc.tipo === 'Sem normativo'){
    toast('Documentos sem normativo não possuem vigência para renovar.', 'alerta');
    return;
  }
  renovandoId = id;
  prazoRenovacaoSelecionado = null;
  document.getElementById('modal-doc-nome').textContent = doc.nome;
  document.getElementById('modal-data-atual').value = fmtData(doc.data);
  document.getElementById('modal-validade').value = '';
  document.getElementById('modal-responsavel').value = '';
  document.getElementById('modal-motivo').value = '';
  limparErrosRenovacao();
  atualizarPreviewRenovacao();
  abrirModalElemento('modal-overlay');
}

function fecharModal(){
  fecharModalElemento('modal-overlay');
  renovandoId = null;
  prazoRenovacaoSelecionado = null;
}

// Chamado ao escolher o novo prazo de validade no select
function selecionarPrazoRenovacao(prazo){
  prazoRenovacaoSelecionado = normalizarValidadeAnos(prazo) || null;
  definirErroRenovacao('validade', '');
  atualizarPreviewRenovacao();
}

// Atualiza o texto de apoio mostrando o vencimento recalculado a partir de hoje + prazo escolhido
function atualizarPreviewRenovacao(){
  const preview = document.getElementById('modal-vencimento-preview');
  if(!preview) return;
  if(!prazoRenovacaoSelecionado){
    preview.textContent = 'Selecione um prazo de renovação.';
    return;
  }
  const vencimento = calcularVencimento(todayStr(), prazoRenovacaoSelecionado);
  preview.textContent = `Vencimento calculado ${fmtData(vencimento)}`;
}

async function confirmarRenovacao(){
  const doc = docs.find(d=>d.id===renovandoId);
  const responsavel = limitarTexto(document.getElementById('modal-responsavel').value.trim(), LIMITES_CAMPOS.gestorNome);
  const motivo = limitarTexto(document.getElementById('modal-motivo').value.trim(), LIMITES_CAMPOS.motivo);
  if(!doc){ fecharModal(); return; }
  limparErrosRenovacao();
  if(!prazoRenovacaoSelecionado){
    definirErroRenovacao('validade', 'Selecione um prazo de renovação.');
    document.getElementById('modal-validade').focus();
    return;
  }
  if(!responsavel){
    definirErroRenovacao('responsavel', 'Informe o responsável pela renovação.');
    document.getElementById('modal-responsavel').focus();
    return;
  }
  if(!motivo){
    definirErroRenovacao('motivo', 'Informe o motivo da renovação.');
    document.getElementById('modal-motivo').focus();
    return;
  }

  const estadoAnterior = {...doc, historico: Array.isArray(doc.historico) ? [...doc.historico] : []};
  const novaVigencia = todayStr();
  const vencimentoAnterior = doc.data;
  const novoVencimento = calcularVencimento(novaVigencia, prazoRenovacaoSelecionado);

  doc.dataVigencia = novaVigencia;
  doc.validade = prazoRenovacaoSelecionado;
  doc.data = novoVencimento;
  doc.ultimaAtualizacao = todayStr();

  let texto = `Vigência renovada em ${fmtData(novaVigencia)} (validade: ${VALIDADE_LABELS[prazoRenovacaoSelecionado]}). Vencimento alterado de ${fmtData(vencimentoAnterior)} para ${fmtData(novoVencimento)}.`;
  if(motivo) texto += ` Motivo: ${motivo}`;
  addHistorico(doc, 'renovacao', texto, responsavel);

  if(!await salvar()){
    Object.assign(doc, estadoAnterior);
    return;
  }
  render();
  fecharModal();
  verificarVencimento(doc);
}

function definirErroRenovacao(campo, mensagem){
  const erro = document.getElementById(`erro-modal-${campo}`);
  const entrada = document.getElementById(`modal-${campo}`);
  if(erro) erro.textContent = mensagem;
  entrada?.classList.toggle('campo-invalido', Boolean(mensagem));
}

function limparErrosRenovacao(){
  ['validade', 'responsavel', 'motivo'].forEach(campo => definirErroRenovacao(campo, ''));
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('modal-responsavel')?.addEventListener('input', () => definirErroRenovacao('responsavel', ''));
  document.getElementById('modal-motivo')?.addEventListener('input', () => definirErroRenovacao('motivo', ''));
});

let excluindoId = null;

function excluir(id){
  const doc = docs.find(d=>d.id===id);
  if(!doc) return;
  excluindoId = id;
  document.getElementById('delete-doc-nome').textContent = doc.nome;
  abrirModalElemento('delete-modal-overlay');
}

function fecharModalExcluir(){
  fecharModalElemento('delete-modal-overlay');
  excluindoId = null;
}

async function confirmarExclusao(){
  const doc = docs.find(d=>d.id===excluindoId);
  if(!doc){ fecharModalExcluir(); return; }
  const anteriores = docs;
  docs = docs.filter(d=>d.id!==excluindoId);
  if(!await salvar()){
    docs = anteriores;
    return;
  }
  render();
  fecharModalExcluir();
  toast(`<b>${escapeHtml(doc.nome)}</b> foi excluído.`, 'vencido');
}

let editandoId = null;

function atualizarObrigatoriedadeFundamentacaoEdicao(){
  const doc=docs.find(item=>item.id===editandoId);
  const semNormativo=doc?.semNormativo || doc?.tipo==='Sem normativo';
  const obrigatoria=!semNormativo && document.getElementById('edit-tipo')?.value==='Normativo';
  const baseLegal=document.getElementById('edit-baselegal');
  const baseLegalNumero=document.getElementById('edit-baselegal-num');
  if(baseLegal) baseLegal.required=obrigatoria;
  if(baseLegalNumero) baseLegalNumero.required=obrigatoria;
  document.getElementById('edit-baselegal-required')?.toggleAttribute('hidden',!obrigatoria);
  document.getElementById('edit-baselegal-num-required')?.toggleAttribute('hidden',!obrigatoria);
}

function editar(id){
  const doc = docs.find(d=>d.id===id);
  if(!doc) return;
  editandoId = id;
  const semNormativo = doc.semNormativo || doc.tipo === 'Sem normativo';
  document.getElementById('edit-campos-prazo')?.classList.toggle('oculto', semNormativo);
  document.getElementById('edit-campos-tipo-sei')?.classList.toggle('oculto', semNormativo);
  document.getElementById('edit-campos-normativos')?.classList.toggle('oculto', semNormativo);
  document.getElementById('edit-nome').value = doc.nome;
  document.getElementById('edit-tipo').value = doc.tipo;
  document.getElementById('edit-baselegal').value = doc.baseLegal || '';
  document.getElementById('edit-baselegal-num').value = doc.baseLegalNumero || '';
  document.getElementById('edit-sei').value = formatarNumeroSei(doc.sei);
  document.getElementById('edit-data-vigencia').value = doc.dataVigencia || doc.dataCriacao || '';
  document.getElementById('edit-validade').value = obterAnosValidade(doc.validade) || 1;
  document.getElementById('edit-desc').value = doc.descricao || '';
  document.getElementById('edit-gestor-nome').value = doc.gestorNome || '';
  document.getElementById('edit-gestor-setor').value = doc.gestorSetor || doc.unidade || '';
  document.getElementById('edit-gestor-email').value = doc.gestorEmail || '';
  document.getElementById('edit-gestor-whatsapp').value = doc.gestorWhatsapp || '';
  atualizarObrigatoriedadeFundamentacaoEdicao();
  atualizarPreviewEdicao();
  abrirModalElemento('edit-modal-overlay');
}

// Atualiza o texto de apoio mostrando o vencimento recalculado na tela de edição
function atualizarPreviewEdicao(){
  const dataVigencia = document.getElementById('edit-data-vigencia').value;
  const validade = document.getElementById('edit-validade').value;
  const preview = document.getElementById('edit-vencimento-preview');
  if(!preview) return;
  if(!dataVigencia){
    preview.textContent = '';
    return;
  }
  const vencimento = calcularVencimento(dataVigencia, validade);
  preview.textContent = `Vencimento calculado: ${fmtData(vencimento)}`;
}
document.addEventListener('DOMContentLoaded', ()=>{
  const dataEl = document.getElementById('edit-data-vigencia');
  const validadeEl = document.getElementById('edit-validade');
  const numeroSeiEl = document.getElementById('edit-sei');
  if(dataEl) dataEl.addEventListener('input', atualizarPreviewEdicao);
  if(validadeEl) validadeEl.addEventListener('input', atualizarPreviewEdicao);
  if(numeroSeiEl){
    numeroSeiEl.addEventListener('input', ()=>{
      numeroSeiEl.value = formatarNumeroSei(numeroSeiEl.value);
    });
  }
});

function fecharModalEditar(){
  fecharModalElemento('edit-modal-overlay');
  editandoId = null;
}

async function confirmarEdicao(){
  const doc = docs.find(d=>d.id===editandoId);
  if(!doc){ fecharModalEditar(); return; }

  const semNormativo = doc.semNormativo || doc.tipo === 'Sem normativo';
  const nome = limitarTexto(document.getElementById('edit-nome').value.trim(), LIMITES_CAMPOS.nome);
  const sei = semNormativo ? '' : normalizarNumeroSei(document.getElementById('edit-sei').value);
  const dataVigencia = semNormativo ? '' : document.getElementById('edit-data-vigencia').value;
  const validade = semNormativo ? '' : normalizarValidadeAnos(document.getElementById('edit-validade').value);
  const fundamentacaoObrigatoria = !semNormativo && document.getElementById('edit-tipo').value === 'Normativo';
  const descricao = limitarTexto(document.getElementById('edit-desc').value.trim(), LIMITES_CAMPOS.descricao);

  if(!nome || (!semNormativo && (!sei || !dataVigencia))){
    const campo = !nome ? document.getElementById('edit-nome') : !sei ? document.getElementById('edit-sei') : document.getElementById('edit-data-vigencia');
    mostrarErroCampo(campo, 'Este campo é obrigatório.');
    campo?.focus();
    return;
  }

  const camposEdicao = ['edit-nome', 'edit-gestor-nome', 'edit-gestor-setor', 'edit-gestor-email', 'edit-gestor-whatsapp', 'edit-desc'];
  if(!semNormativo) camposEdicao.push('edit-data-vigencia', 'edit-sei');
  if(fundamentacaoObrigatoria) camposEdicao.push('edit-baselegal', 'edit-baselegal-num');
  const campoInvalido = camposEdicao
    .map(id => document.getElementById(id))
    .find(elemento => elemento && (!elemento.value.trim() || !elemento.checkValidity()));
  if(campoInvalido){
    mostrarErroCampo(campoInvalido, campoInvalido.value.trim() ? 'Informe um valor válido.' : 'Este campo é obrigatório.');
    campoInvalido.focus();
    return;
  }

  const setorEditado=document.getElementById('edit-gestor-setor').value.trim().toUpperCase();
  if(typeof SETORES_CONVIDADOS!=='undefined' && !SETORES_CONVIDADOS[setorEditado]){
    const campoSetor=document.getElementById('edit-gestor-setor');
    mostrarErroCampo(campoSetor, 'Selecione um setor da lista de unidades.');
    campoSetor?.focus();
    return;
  }

  const estadoAnterior = {...doc, historico: Array.isArray(doc.historico) ? [...doc.historico] : []};
  const vencimentoAnterior = doc.data;
  const novoVencimento = semNormativo ? '' : calcularVencimento(dataVigencia, validade);

  doc.nome = nome;
  doc.tipo = semNormativo ? 'Sem normativo' : document.getElementById('edit-tipo').value;
  doc.baseLegal = semNormativo ? 'Sem normativo' : document.getElementById('edit-baselegal').value;
  doc.baseLegalNumero = semNormativo ? '' : limitarTexto(document.getElementById('edit-baselegal-num').value.trim(), LIMITES_CAMPOS.baseLegalNumero);
  doc.sei = sei;
  doc.dataVigencia = dataVigencia;
  doc.validade = validade;
  doc.data = novoVencimento;
  doc.descricao = descricao;
  doc.gestorNome = limitarTexto(document.getElementById('edit-gestor-nome').value.trim(), LIMITES_CAMPOS.gestorNome);
  doc.gestorSetor = limitarTexto(document.getElementById('edit-gestor-setor').value.trim().toUpperCase(), LIMITES_CAMPOS.gestorSetor);
  doc.unidade = doc.gestorSetor;
  doc.gestorEmail = limitarTexto(document.getElementById('edit-gestor-email').value.trim(), LIMITES_CAMPOS.gestorEmail);
  doc.gestorWhatsapp = limitarTexto(document.getElementById('edit-gestor-whatsapp').value.trim(), LIMITES_CAMPOS.gestorWhatsapp);
  doc.ultimaAtualizacao = todayStr();

  let texto = 'Documento editado.';
  if(!semNormativo && vencimentoAnterior !== novoVencimento) texto += ` Vencimento alterado de ${fmtData(vencimentoAnterior)} para ${fmtData(novoVencimento)}.`;
  addHistorico(doc, 'edicao', texto, doc.gestorNome);

  if(!await salvar()){
    Object.assign(doc, estadoAnterior);
    return;
  }
  render();
  renderSetoresDocumentos();
  fecharModalEditar();
  verificarVencimento(doc);
}

let resumoAtualId = null;

function verResumo(id){
  const doc = docs.find(d=>d.id===id);
  if(!doc) return;
  resumoAtualId = id;
  const status = calcularStatus(doc);

  document.getElementById('resumo-nome').textContent = doc.nome;
  document.getElementById('resumo-tipo').textContent = doc.tipo;
  document.getElementById('resumo-sei').textContent = formatarNumeroSei(doc.sei) || '-';

  document.getElementById('resumo-baselegal').textContent = doc.semNormativo || doc.tipo === 'Sem normativo' ? '-' : doc.baseLegal
    ? `${doc.baseLegal}${doc.baseLegalNumero ? ' n° ' + doc.baseLegalNumero : ''}`
    : 'Não informado';

  document.getElementById('resumo-venc').textContent = doc.data ? fmtData(doc.data) : '-';

  const situEl = document.getElementById('resumo-situacao');
  situEl.innerHTML = status ? `<span class="tag ${status==='Vigente'?'valido':status==='Alerta'?'alerta':'vencido'}">${statusLabel(status)}</span>` : '-';

  document.getElementById('resumo-gestor').textContent = doc.gestorNome ? doc.gestorNome : 'Não informado';
  document.getElementById('resumo-setor').textContent = doc.gestorSetor ? doc.gestorSetor : 'Não informado';

  document.getElementById('resumo-desc').textContent = doc.descricao ? doc.descricao : 'Nenhuma descrição cadastrada.';

  abrirModalElemento('resumo-modal-overlay');
}

function fecharModalResumo(){
  fecharModalElemento('resumo-modal-overlay');
}

let notificandoId = null;

function montarMensagemGestor(doc){
  const status = calcularStatus(doc);
  const verbo = status === 'Vencido' ? 'venceu' : 'vence';
  const saudacao = doc.gestorNome ? `Olá, ${doc.gestorNome}!` : 'Olá!';
  return `${saudacao} O documento "${doc.nome}" (SEI ${formatarNumeroSei(doc.sei)}) ${verbo} em ${fmtData(doc.data)}. Poderia verificar a renovação/atualização, por favor? Obrigado(a).`;
}

function notificarGestor(id){
  const doc = docs.find(d=>d.id===id);
  if(!doc) return;
  if(doc.semNormativo || doc.tipo === 'Sem normativo'){
    toast('Documentos sem normativo não possuem aviso de vencimento.', 'alerta');
    return;
  }
  notificandoId = id;

  document.getElementById('notificar-doc-nome').textContent = doc.nome;
  document.getElementById('notificar-mensagem').textContent = montarMensagemGestor(doc);

  const semContato = !doc.gestorEmail && !doc.gestorWhatsapp;
  document.getElementById('notificar-sem-contato').style.display = semContato ? 'block' : 'none';

  document.getElementById('btn-notificar-email').style.display = doc.gestorEmail ? 'inline-block' : 'none';
  document.getElementById('btn-notificar-whatsapp').style.display = doc.gestorWhatsapp ? 'inline-block' : 'none';

  abrirModalElemento('notificar-modal-overlay');
}

function fecharModalNotificar(){
  fecharModalElemento('notificar-modal-overlay');
  notificandoId = null;
}

function abrirEmailGestor(){
  const doc = docs.find(d=>d.id===notificandoId);
  if(!doc || !doc.gestorEmail) return;
  const assunto = `Vencimento do documento: ${doc.nome}`;
  const corpo = montarMensagemGestor(doc);
  window.location.href = `mailto:${doc.gestorEmail}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
}

function abrirWhatsappGestor(){
  const doc = docs.find(d=>d.id===notificandoId);
  if(!doc || !doc.gestorWhatsapp) return;
  let digitos = doc.gestorWhatsapp.replace(/\D/g,'');
  if(!digitos.startsWith('55')) digitos = `55${digitos}`;
  const mensagem = montarMensagemGestor(doc);
  window.open(`https://wa.me/${digitos}?text=${encodeURIComponent(mensagem)}`, '_blank', 'noopener,noreferrer');
}

const HIST_LABELS = {
  criacao: 'Cadastro',
  edicao: 'Edição',
  renovacao: 'Renovação de vigência'
};

function verHistorico(id){
  const doc = docs.find(d=>d.id===id);
  if(!doc) return;

  document.getElementById('historico-doc-nome').textContent = doc.nome;
  const lista = document.getElementById('historico-lista');

  const historico = Array.isArray(doc.historico) ? [...doc.historico] : [];
  historico.sort((a,b)=> new Date(b.dataHora) - new Date(a.dataHora));

  if(historico.length === 0){
    lista.innerHTML = `<div class="historico-vazio">Nenhuma edição registrada para este documento ainda.</div>`;
  } else {
    lista.innerHTML = historico.map(h => `
      <div class="historico-item">
        <div class="historico-item-head">
          <span class="historico-tipo ${h.tipo}">${HIST_LABELS[h.tipo] || 'Alteração'}</span>
          <span class="historico-data">${fmtDataHora(h.dataHora)}</span>
        </div>
        <div class="historico-texto">${escapeHtml(h.texto)}</div>
        ${h.responsavel ? `<div class="historico-responsavel">Responsável: ${escapeHtml(h.responsavel)}</div>` : ''}
      </div>
    `).join('');
  }

  abrirModalElemento('historico-modal-overlay');
}

function fecharModalHistorico(){
  fecharModalElemento('historico-modal-overlay');
}
