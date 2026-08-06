/* ===== EDICAO ===== */

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

