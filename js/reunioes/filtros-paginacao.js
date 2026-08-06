/* ===== FILTROS PAGINACAO ===== */

function obterReunioesFiltradas(){
  const busca = (document.getElementById('reuniao-busca')?.value || '').trim().toLowerCase();
  const tipo = document.getElementById('reuniao-filtro-tipo')?.value || '';
  const ano = document.getElementById('reuniao-filtro-ano')?.value || '';
  return [...reunioes]
    .filter(item => !tipo || item.frequencia === tipo)
    .filter(item => !ano || (item.data || '').slice(0,4) === ano)
    .filter(item => {
      if(!busca) return true;
      const texto = [item.pauta, item.resumo, ...todosParticipantesReuniao(item)].join(' ').toLowerCase();
      return texto.includes(busca);
    })
    .sort((a,b) => `${b.data}T${b.horario}`.localeCompare(`${a.data}T${a.horario}`));
}

function popularFiltroAnoReunioes(){
  const seletor = document.getElementById('reuniao-filtro-ano');
  if(!seletor) return;
  const atual = seletor.value;
  const anos = [...new Set(reunioes.map(item => (item.data || '').slice(0,4)).filter(Boolean))].sort((a,b) => b.localeCompare(a));
  seletor.innerHTML = '<option value="">Todos</option>' + anos.map(ano => `<option value="${ano}">${ano}</option>`).join('');
  if(anos.includes(atual)) seletor.value = atual;
}

function exportarRelatorioReunioes(){
  const filtradas=obterReunioesFiltradas();
  if(!filtradas.length){
    toast('Não há reuniões para exportar com os filtros selecionados.', 'alerta');
    return;
  }
  const cabecalho=['Data','Horário','Unidade','Periodicidade','Formato','Situação','Link','Pauta','Membros','Convidados','Resumo','Situação da ata'];
  const linhas=filtradas.map(reuniao=>{
    const membros=normalizarMembros(reuniao.membros,reuniao.frequencia)
      .filter(membro=>membro.nome)
      .map(membro=>`${membro.nome} — ${membro.cargo}`)
      .join('\n');
    const convidados=normalizarParticipantes(reuniao.convidados ?? reuniao.participantes).join('\n');
    const unidade=unidadesPersonalizadas.find(item=>item.codigo===reuniao.frequencia)?.nome || reuniao.frequencia;
    const possuiMinuta=minutasHistorico.some(registro=>registro.reuniao?.id===reuniao.id);
    return [
      fmtData(reuniao.data),
      reuniao.horario || '',
      unidade,
      FREQUENCIAS_REUNIAO[reuniao.frequencia] || '',
      rotuloFormatoReuniao(reuniao.formato),
      obterSituacaoReuniao(reuniao),
      reuniao.link || '',
      reuniao.pauta || '',
      membros,
      convidados,
      reuniao.resumo || '',
      possuiMinuta ? 'Ata gerada' : 'Sem ata'
    ];
  });
  const escaparCsv=valor=>{
    let texto=String(valor ?? '');
    if(/^[=+@]/.test(texto)) texto=`'${texto}`;
    return `"${texto.replace(/"/g,'""')}"`;
  };
  const csv=[cabecalho,...linhas].map(linha=>linha.map(escaparCsv).join(';')).join('\r\n');
  const url=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'}));
  const link=document.createElement('a');
  link.href=url;
  link.download=`relatorio_reunioes_igov_${todayStr()}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  toast(`<b>Relatório exportado</b> — ${filtradas.length} reunião${filtradas.length===1?'':'ões'}.`, 'valido');
}

function filtrarReunioes(){
  paginaReunioes = 1;
  renderReunioes();
}

function limparFiltrosReunioes(){
  ['reuniao-busca','reuniao-filtro-tipo','reuniao-filtro-ano'].forEach(id=>{
    const campo=document.getElementById(id);
    if(campo) campo.value='';
  });
  filtrarReunioes();
}

function alterarItensReunioes(valor){
  const quantidade = Number(valor);
  if(![10,20,50].includes(quantidade)) return;
  itensPorPaginaReunioes = quantidade;
  paginaReunioes = 1;
  try{ localStorage.setItem('igov:reunioes-itens-pagina',String(quantidade)); }catch(e){}
  renderReunioes();
}

function renderPaginacaoReunioes(totalItens){
  const elemento = document.getElementById('reunioes-paginacao');
  if(!elemento) return;
  const totalPaginas = Math.ceil(totalItens / itensPorPaginaReunioes);
  if(totalPaginas <= 1){ elemento.innerHTML = ''; return; }
  let html = `<button class="pagina-btn pagina-seta" type="button" onclick="mudarPaginaReunioes(-1)" ${paginaReunioes === 1 ? 'disabled' : ''} aria-label="Página anterior"><span class="system-icon system-icon-chevron-back" aria-hidden="true"></span></button>`;
  for(let pagina = 1; pagina <= totalPaginas; pagina++){
    html += `<button class="pagina-btn ${pagina === paginaReunioes ? 'active' : ''}" type="button" onclick="irParaPaginaReunioes(${pagina})">${pagina}</button>`;
  }
  html += `<button class="pagina-btn pagina-seta" type="button" onclick="mudarPaginaReunioes(1)" ${paginaReunioes === totalPaginas ? 'disabled' : ''} aria-label="Próxima página"><span class="system-icon system-icon-chevron-forward" aria-hidden="true"></span></button>`;
  elemento.innerHTML = html;
}

function mudarPaginaReunioes(direcao){
  irParaPaginaReunioes(paginaReunioes + direcao);
}

function irParaPaginaReunioes(pagina){
  const totalPaginas = Math.ceil(obterReunioesFiltradas().length / itensPorPaginaReunioes);
  if(pagina < 1 || pagina > totalPaginas) return;
  paginaReunioes = pagina;
  renderReunioes();
  document.querySelector('.reunioes-lista-card')?.scrollIntoView({behavior:'smooth', block:'start'});
}

document.addEventListener('DOMContentLoaded',()=>{
  try{
    const quantidade=Number(localStorage.getItem('igov:reunioes-itens-pagina'));
    if([10,20,50].includes(quantidade)) itensPorPaginaReunioes=quantidade;
  }catch(e){}
  const seletor=document.getElementById('reuniao-itens-pagina');
  if(seletor) seletor.value=String(itensPorPaginaReunioes);
  try{
    const quantidadeAtas=Number(localStorage.getItem('igov:atas-itens-pagina'));
    if([10,20,50].includes(quantidadeAtas)) itensPorPaginaAtas=quantidadeAtas;
  }catch(e){}
  const seletorAtas=document.getElementById('ata-itens-pagina');
  if(seletorAtas) seletorAtas.value=String(itensPorPaginaAtas);
});

