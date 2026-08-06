/* ===== HISTORICO ===== */

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

  lista.style.removeProperty('max-height');
  lista.scrollTop = 0;
  abrirModalElemento('historico-modal-overlay');
}

function fecharModalHistorico(){
  fecharModalElemento('historico-modal-overlay');
}

