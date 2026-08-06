/* ===== RENOVACAO ===== */

/* ===== DETALHES E AÇÕES DE DOCUMENTOS ===== */
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

