/* ===== HISTÓRICO E DATAS AUXILIARES ===== */

// Adiciona uma entrada ao histórico de edições de um documento
function addHistorico(doc, tipo, texto, responsavel){
  if(!Array.isArray(doc.historico)) doc.historico = [];
  doc.historico.push({
    dataHora: new Date().toISOString(),
    tipo,
    texto,
    responsavel: responsavel || ''
  });
}

function fmtDataHora(isoStr){
  const d = new Date(isoStr);
  const data = d.toLocaleDateString('pt-BR');
  const hora = d.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
  return `${data} às ${hora}`;
}

// Soma meses a uma data (YYYY-MM-DD) preservando o dia quando possível
function somarMeses(dataStr, meses){
  const [y,m,d] = dataStr.split('-').map(Number);
  if(!y || !m || !d || !Number.isFinite(meses)) return dataStr;
  const base = new Date(y, m-1 + meses, 1);
  const ultimoDia = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
  base.setDate(Math.min(d, ultimoDia));
  return base.getFullYear()+'-'+String(base.getMonth()+1).padStart(2,'0')+'-'+String(base.getDate()).padStart(2,'0');
}

