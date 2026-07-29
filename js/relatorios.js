/* ===== CONFIGURADOR DE RELATÓRIOS ===== */
const RELATORIO_CAMPOS_DOCUMENTOS=[['nome','Documento'],['tipo','Tipo'],['baseLegal','Fundamentação legal'],['sei','Nº SEI'],['dataVigencia','Data de vigência'],['validade','Prazo de validade'],['data','Vencimento'],['status','Situação'],['ultimaAtualizacao','Última atualização'],['gestorNome','Gestor responsável'],['gestorSetor','Setor do gestor'],['gestorEmail','E-mail do gestor'],['gestorWhatsapp','WhatsApp do gestor'],['descricao','Descrição']];
const RELATORIO_CAMPOS_REUNIOES=[['data','Data'],['horario','Horário'],['frequencia','Unidade'],['periodicidade','Periodicidade'],['formato','Formato'],['link','Link'],['pauta','Pauta'],['membros','Membros'],['convidados','Convidados'],['resumo','Resumo'],['minuta','Situação da minuta']];
let relatorioSelecao={documentos:new Set(),reunioes:new Set()};
let relatorioVisiveis={documentos:[],reunioes:[]};
let relatorioFocoAnterior=null;
let relatorioOrigemAtual='documentos';

function opcoesRelatorio(valores,todos='Todos'){return `<option value="">${todos}</option>${valores.map(v=>`<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('')}`;}
function camposRelatorio(tipo,campos){return campos.map(([id,nome])=>`<label class="relatorio-check"><input type="checkbox" data-campo="${tipo}" value="${id}" checked> ${nome}</label>`).join('');}
function garantirModalRelatorio(){
  if(document.getElementById('relatorio-modal-overlay'))return;
  const overlay=document.createElement('div');overlay.id='relatorio-modal-overlay';overlay.setAttribute('aria-hidden','true');
  overlay.innerHTML=`<div class="modal relatorio-modal" role="dialog" aria-modal="true" aria-labelledby="relatorio-titulo" tabindex="-1">
    <div class="modal-head"><h3 id="relatorio-titulo">Configurar relatório</h3><button class="modal-close" type="button" onclick="fecharRelatorio()" aria-label="Fechar">✕</button></div>
    <p class="relatorio-intro" id="relatorio-intro">Escolha as informações que devem entrar no arquivo CSV.</p>
    <div class="relatorio-fontes" hidden>
      <label class="relatorio-fonte-toggle"><input id="relatorio-incluir-documentos" type="checkbox" onchange="alternarFonteRelatorio('documentos')"> Documentos</label>
      <label class="relatorio-fonte-toggle"><input id="relatorio-incluir-reunioes" type="checkbox" onchange="alternarFonteRelatorio('reunioes')"> Reuniões</label>
    </div>
    ${secaoRelatorio('documentos','Documentos',`<label>Buscar<input id="relatorio-doc-busca" type="search" placeholder="Nome do documento" oninput="aplicarFiltrosRelatorio('documentos')"></label><label>Situação<select id="relatorio-doc-status" onchange="aplicarFiltrosRelatorio('documentos')"><option value="">Todas</option><option value="Vigente">Vigente</option><option value="Alerta">Próximo do vencimento</option><option value="Vencido">Vencido</option></select></label><label>Tipo<select id="relatorio-doc-tipo" onchange="aplicarFiltrosRelatorio('documentos')"></select></label>`,RELATORIO_CAMPOS_DOCUMENTOS)}
    ${secaoRelatorio('reunioes','Reuniões',`<label>Buscar<input id="relatorio-reuniao-busca" type="search" placeholder="Pauta ou participante" oninput="aplicarFiltrosRelatorio('reunioes')"></label><label>Unidade<select id="relatorio-reuniao-tipo" onchange="aplicarFiltrosRelatorio('reunioes')"></select></label><label>Ano<select id="relatorio-reuniao-ano" onchange="aplicarFiltrosRelatorio('reunioes')"></select></label>`,RELATORIO_CAMPOS_REUNIOES)}
    <div class="modal-actions"><button type="button" onclick="fecharRelatorio()">Cancelar</button><button class="confirm" type="button" onclick="gerarRelatorioSelecionado()">Exportar relatório</button></div></div>`;
  document.body.appendChild(overlay);overlay.addEventListener('click',e=>{if(e.target===overlay)fecharRelatorio();});
}
function secaoRelatorio(tipo,titulo,filtros,campos){return `<section class="relatorio-secao" id="relatorio-secao-${tipo}"><div class="relatorio-secao-head"><div><h4>Campos do relatório</h4><small>Marque somente as informações necessárias.</small></div><div class="relatorio-campos-acoes"><button type="button" onclick="marcarCamposRelatorio('${tipo}',true)">Selecionar todos</button><button type="button" onclick="marcarCamposRelatorio('${tipo}',false)">Limpar</button></div></div><div class="relatorio-campos">${camposRelatorio(tipo,campos)}</div></section>`;}
function abrirRelatorio(origem='documentos'){
  garantirModalRelatorio();relatorioFocoAnterior=document.activeElement;
  if(!relatorioSelecao[origem].size){toast(`Selecione ao menos um ${origem==='documentos'?'documento':'registro de reunião'} antes de exportar.`,'alerta');return;}
  relatorioOrigemAtual=origem;
  const incluirDocumentos=document.getElementById('relatorio-incluir-documentos');
  const incluirReunioes=document.getElementById('relatorio-incluir-reunioes');
  incluirDocumentos.checked=origem==='documentos';incluirDocumentos.disabled=true;
  incluirReunioes.checked=origem==='reunioes';incluirReunioes.disabled=true;
  const quantidade=relatorioSelecao[origem].size;
  const rotulo=origem==='documentos'?(quantidade===1?'documento':'documentos'):(quantidade===1?'reunião':'reuniões');
  document.getElementById('relatorio-titulo').textContent=`Exportar relatório de ${origem==='documentos'?'documentos':'reuniões'}`;
  document.getElementById('relatorio-intro').innerHTML=`<strong>${quantidade} ${rotulo} selecionado${quantidade===1?'':'s'}.</strong> Escolha abaixo quais informações devem aparecer no arquivo.`;
  ['documentos','reunioes'].forEach(t=>{alternarFonteRelatorio(t);atualizarContadorRelatorio(t);});
  const overlay=document.getElementById('relatorio-modal-overlay');overlay.classList.add('open');overlay.setAttribute('aria-hidden','false');overlay.querySelector('.relatorio-modal').focus();
}
function fecharRelatorio(){const o=document.getElementById('relatorio-modal-overlay');if(!o)return;o.classList.remove('open');o.setAttribute('aria-hidden','true');relatorioFocoAnterior?.focus?.();}
function alternarFonteRelatorio(tipo){const s=document.getElementById(`relatorio-secao-${tipo}`);if(s)s.hidden=!document.getElementById(`relatorio-incluir-${tipo}`)?.checked;}
function marcarCamposRelatorio(tipo,marcar){document.querySelectorAll(`[data-campo="${tipo}"]`).forEach(campo=>{campo.checked=marcar;});}
function registrosFiltradosRelatorio(tipo){
  if(tipo==='documentos'){
    const b=(document.getElementById('relatorio-doc-busca')?.value||'').trim().toLowerCase(),s=document.getElementById('relatorio-doc-status')?.value||'',t=document.getElementById('relatorio-doc-tipo')?.value||'';
    return docs.map(d=>({...d,status:calcularStatus(d)})).filter(d=>(!b||d.nome.toLowerCase().includes(b))&&(!s||d.status===s)&&(!t||d.tipo===t));
  }
  const b=(document.getElementById('relatorio-reuniao-busca')?.value||'').trim().toLowerCase(),u=document.getElementById('relatorio-reuniao-tipo')?.value||'',a=document.getElementById('relatorio-reuniao-ano')?.value||'';
  return reunioes.filter(r=>{const texto=[r.pauta,r.resumo,...todosParticipantesReuniao(r)].join(' ').toLowerCase();return(!b||texto.includes(b))&&(!u||r.frequencia===u)&&(!a||(r.data||'').startsWith(a));});
}
function renderRegistrosRelatorio(tipo){
  const lista=document.getElementById(`relatorio-lista-${tipo}`);if(!lista)return;const registros=registrosFiltradosRelatorio(tipo);
  lista.innerHTML=registros.length?registros.map(item=>{
    const marcado=relatorioSelecao[tipo].has(item.id);
    if(tipo==='documentos')return `<label class="relatorio-registro"><input type="checkbox" ${marcado?'checked':''} onchange="selecionarRegistroRelatorio('documentos','${item.id}',this.checked)"><span><strong>${escapeHtml(item.nome)}</strong><small>${escapeHtml(item.tipo||'Sem tipo')}</small></span><small>${escapeHtml(statusLabel(item.status))}</small></label>`;
    const unidade=unidadesPersonalizadas.find(u=>u.codigo===item.frequencia)?.nome||item.frequencia;
    return `<label class="relatorio-registro"><input type="checkbox" ${marcado?'checked':''} onchange="selecionarRegistroRelatorio('reunioes','${item.id}',this.checked)"><span><strong>${escapeHtml(item.pauta||'Reunião sem pauta')}</strong><small>${escapeHtml(unidade||'Sem unidade')}</small></span><small>${fmtData(item.data)}</small></label>`;
  }).join(''):'<div class="relatorio-vazio">Nenhum registro encontrado com estes filtros.</div>';atualizarContadorRelatorio(tipo);
}
function aplicarFiltrosRelatorio(tipo){relatorioSelecao[tipo]=new Set(registrosFiltradosRelatorio(tipo).map(i=>i.id));renderRegistrosRelatorio(tipo);}
function selecionarRegistroRelatorio(tipo,id,marcado){marcado?relatorioSelecao[tipo].add(id):relatorioSelecao[tipo].delete(id);atualizarContadorRelatorio(tipo);}
function marcarVisiveisRelatorio(tipo,marcar){registrosFiltradosRelatorio(tipo).forEach(i=>marcar?relatorioSelecao[tipo].add(i.id):relatorioSelecao[tipo].delete(i.id));renderRegistrosRelatorio(tipo);}
function atualizarContadorRelatorio(tipo){const e=document.getElementById(`relatorio-contador-${tipo}`),n=relatorioSelecao[tipo].size;if(e)e.textContent=`${n} selecionado${n===1?'':'s'}`;}
function selecionarRegistroParaRelatorio(tipo,id,marcado){
  marcado?relatorioSelecao[tipo].add(id):relatorioSelecao[tipo].delete(id);
  atualizarSelecaoVisivelRelatorio(tipo);
}
function atualizarSelecaoVisivelRelatorio(tipo,itens){
  if(itens)relatorioVisiveis[tipo]=itens.map(i=>i.id);
  const ids=relatorioVisiveis[tipo],marcados=ids.filter(id=>relatorioSelecao[tipo].has(id)).length;
  const mestre=document.getElementById(tipo==='documentos'?'selecionar-documentos-visiveis':'selecionar-reunioes-visiveis');
  if(mestre){mestre.checked=ids.length>0&&marcados===ids.length;mestre.indeterminate=marcados>0&&marcados<ids.length;}
}
function selecionarTodosDocumentosVisiveis(marcar){
  relatorioVisiveis.documentos.forEach(id=>marcar?relatorioSelecao.documentos.add(id):relatorioSelecao.documentos.delete(id));render();
}
function selecionarTodasReunioesVisiveis(marcar){
  relatorioVisiveis.reunioes.forEach(id=>marcar?relatorioSelecao.reunioes.add(id):relatorioSelecao.reunioes.delete(id));renderReunioes();
}
function valorDocumentoRelatorio(d,c){
  const v={nome:d.nome,tipo:d.tipo,baseLegal:d.baseLegal?`${d.baseLegal}${d.baseLegalNumero?' nº '+d.baseLegalNumero:''}`:'',sei:formatarNumeroSei(d.sei)||'',dataVigencia:d.dataVigencia?fmtData(d.dataVigencia):'',validade:d.validade?(VALIDADE_LABELS[d.validade]||d.validade):'',data:d.data?fmtData(d.data):'',status:statusLabel(d.status),ultimaAtualizacao:d.ultimaAtualizacao?fmtData(d.ultimaAtualizacao):'',gestorNome:d.gestorNome||'',gestorSetor:d.gestorSetor||'',gestorEmail:d.gestorEmail||'',gestorWhatsapp:d.gestorWhatsapp||'',descricao:d.descricao||''};return v[c]??'';
}
function valorReuniaoRelatorio(r,c){
  const unidade=unidadesPersonalizadas.find(u=>u.codigo===r.frequencia)?.nome||r.frequencia;
  const v={data:r.data?fmtData(r.data):'',horario:r.horario||'',frequencia:unidade||'',periodicidade:FREQUENCIAS_REUNIAO[r.frequencia]||'',formato:rotuloFormatoReuniao(r.formato),link:r.link||'',pauta:r.pauta||'',membros:normalizarMembros(r.membros,r.frequencia).filter(m=>m.nome).map(m=>`${m.nome} — ${m.cargo}`).join('\n'),convidados:normalizarParticipantes(r.convidados??r.participantes).join('\n'),resumo:r.resumo||'',minuta:minutasHistorico.some(m=>m.reuniao?.id===r.id)?'Minuta gerada':'Sem minuta'};return v[c]??'';
}
function gerarRelatorioSelecionado(){
  const fontes=[relatorioOrigemAtual];
  if(!fontes.length){toast('Selecione documentos e/ou reuniões para o relatório.','alerta');return;}
  const escapar=v=>{let t=String(v??'');if(/^[=+@]/.test(t))t=`'${t}`;return `"${t.replace(/"/g,'""')}"`;},blocos=[];let total=0;
  fontes.forEach(tipo=>{
    const defs=tipo==='documentos'?RELATORIO_CAMPOS_DOCUMENTOS:RELATORIO_CAMPOS_REUNIOES,campos=[...document.querySelectorAll(`[data-campo="${tipo}"]:checked`)].map(i=>i.value),itens=(tipo==='documentos'?docs:reunioes).filter(i=>relatorioSelecao[tipo].has(i.id));
    if(!campos.length||!itens.length)return;total+=itens.length;if(fontes.length>1)blocos.push([escapar(tipo==='documentos'?'DOCUMENTOS':'REUNIÕES')]);blocos.push(campos.map(c=>escapar(defs.find(([id])=>id===c)?.[1]||c)));
    itens.forEach(item=>{const n=tipo==='documentos'?{...item,status:calcularStatus(item)}:item;blocos.push(campos.map(c=>escapar(tipo==='documentos'?valorDocumentoRelatorio(n,c):valorReuniaoRelatorio(n,c))));});blocos.push([]);
  });
  if(!total){toast('Marque ao menos um registro e um campo em uma das seções.','alerta');return;}
  const url=URL.createObjectURL(new Blob(['\uFEFF'+blocos.map(l=>l.join(';')).join('\r\n')],{type:'text/csv;charset=utf-8;'})),link=document.createElement('a');
  link.href=url;link.download=`relatorio_igov_${todayStr()}.csv`;document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);fecharRelatorio();toast(`<b>Relatório exportado</b> — ${total} registro${total===1?'':'s'}.`,'valido');
}
function exportarRelatorio(){abrirRelatorio('documentos');}
function exportarRelatorioReunioes(){abrirRelatorio('reunioes');}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.getElementById('relatorio-modal-overlay')?.classList.contains('open'))fecharRelatorio();});