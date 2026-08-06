/* ===== EXCLUSAO ===== */

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

