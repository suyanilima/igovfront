/* ===== CONFIGURADOR DE RELATÓRIOS ===== */
const RELATORIO_CAMPOS_DOCUMENTOS=[['setorPai','Setor'],['unidade','Unidade escolhida'],['nome','Documento'],['tipo','Tipo'],['baseLegal','Fundamentação legal'],['sei','Nº SEI'],['dataVigencia','Data de vigência'],['validade','Prazo de validade'],['data','Vencimento'],['status','Situação'],['ultimaAtualizacao','Última atualização'],['gestorNome','Gestor responsável'],['gestorSetor','Setor do gestor'],['gestorEmail','E-mail do gestor'],['gestorWhatsapp','WhatsApp do gestor'],['descricao','Descrição']];
const RELATORIO_CAMPOS_REUNIOES=[['data','Data'],['horario','Horário'],['frequencia','Unidade'],['periodicidade','Periodicidade'],['formato','Formato'],['situacao','Situação'],['link','Link'],['pauta','Pauta'],['membros','Membros'],['convidados','Convidados'],['resumo','Resumo'],['minuta','Situação da ata']];
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
    <p class="relatorio-intro" id="relatorio-intro">Escolha as informações que devem entrar no arquivo.</p>
    <div class="relatorio-fontes" hidden>
      <label class="relatorio-fonte-toggle"><input id="relatorio-incluir-documentos" type="checkbox" onchange="alternarFonteRelatorio('documentos')"> Documentos</label>
      <label class="relatorio-fonte-toggle"><input id="relatorio-incluir-reunioes" type="checkbox" onchange="alternarFonteRelatorio('reunioes')"> Reuniões</label>
    </div>
    ${secaoRelatorio('documentos','Documentos',`<label>Buscar<input id="relatorio-doc-busca" type="search" placeholder="Nome do documento" oninput="aplicarFiltrosRelatorio('documentos')"></label><label>Situação<select id="relatorio-doc-status" onchange="aplicarFiltrosRelatorio('documentos')"><option value="">Todas</option><option value="Vigente">Vigente</option><option value="Alerta">Próximo do vencimento</option><option value="Vencido">Vencido</option></select></label><label>Tipo<select id="relatorio-doc-tipo" onchange="aplicarFiltrosRelatorio('documentos')"></select></label><label>Ano<select id="relatorio-doc-ano" onchange="aplicarFiltrosRelatorio('documentos')"></select></label>`,RELATORIO_CAMPOS_DOCUMENTOS)}
    ${secaoRelatorio('reunioes','Reuniões',`<label>Buscar<input id="relatorio-reuniao-busca" type="search" placeholder="Pauta ou participante" oninput="aplicarFiltrosRelatorio('reunioes')"></label><label>Unidade<select id="relatorio-reuniao-tipo" onchange="aplicarFiltrosRelatorio('reunioes')"></select></label><label>Ano<select id="relatorio-reuniao-ano" onchange="aplicarFiltrosRelatorio('reunioes')"></select></label>`,RELATORIO_CAMPOS_REUNIOES)}
    <div class="modal-actions"><button type="button" onclick="fecharRelatorio()">Cancelar</button><button class="export-excel" type="button" onclick="gerarRelatorioSelecionado('csv')">Exportar Excel</button><button id="relatorio-exportar-pdf" class="export-pdf" type="button" onclick="gerarRelatorioSelecionado('pdf')">Exportar PDF</button></div></div>`;
  document.body.appendChild(overlay);overlay.addEventListener('click',e=>{if(e.target===overlay)fecharRelatorio();});
  document.getElementById('relatorio-doc-tipo').innerHTML=opcoesRelatorio([...new Set(docs.map(item=>item.tipo).filter(Boolean))].sort());
  document.getElementById('relatorio-doc-ano').innerHTML=opcoesRelatorio([...new Set(docs.map(item=>(item.dataVigencia||item.dataCriacao||item.data||'').slice(0,4)).filter(Boolean))].sort((a,b)=>b.localeCompare(a)));
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
  document.getElementById('relatorio-exportar-pdf').hidden=false;
  ['documentos','reunioes'].forEach(t=>{alternarFonteRelatorio(t);atualizarContadorRelatorio(t);});
  const overlay=document.getElementById('relatorio-modal-overlay');overlay.classList.add('open');overlay.setAttribute('aria-hidden','false');overlay.querySelector('.relatorio-modal').focus();
}
function fecharRelatorio(){const o=document.getElementById('relatorio-modal-overlay');if(!o)return;o.classList.remove('open');o.setAttribute('aria-hidden','true');relatorioFocoAnterior?.focus?.();}
function alternarFonteRelatorio(tipo){const s=document.getElementById(`relatorio-secao-${tipo}`);if(s)s.hidden=!document.getElementById(`relatorio-incluir-${tipo}`)?.checked;}
function marcarCamposRelatorio(tipo,marcar){document.querySelectorAll(`[data-campo="${tipo}"]`).forEach(campo=>{campo.checked=marcar;});}
function registrosFiltradosRelatorio(tipo){
  if(tipo==='documentos'){
    const b=(document.getElementById('relatorio-doc-busca')?.value||'').trim().toLowerCase(),s=document.getElementById('relatorio-doc-status')?.value||'',t=document.getElementById('relatorio-doc-tipo')?.value||'',a=document.getElementById('relatorio-doc-ano')?.value||'';
    return docs.map(d=>({...d,status:calcularStatus(d)})).filter(d=>documentoPertenceUnidadeSelecionada(d)&&(!b||d.nome.toLowerCase().includes(b))&&(!s||d.status===s)&&(!t||d.tipo===t)&&(!a||(d.dataVigencia||d.dataCriacao||d.data||'').startsWith(a)));
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
  const contexto=localizarUnidadeDocumento(d.unidade);
  const v={setorPai:contexto?`${contexto.setor.codigo} — ${contexto.setor.nome}`:'',unidade:contexto?`${contexto.codigo} — ${contexto.nome}`:'',nome:d.nome,tipo:d.tipo,baseLegal:d.baseLegal?`${d.baseLegal}${d.baseLegalNumero?' nº '+d.baseLegalNumero:''}`:'',sei:formatarNumeroSei(d.sei)||'',dataVigencia:d.dataVigencia?fmtData(d.dataVigencia):'',validade:d.validade?(VALIDADE_LABELS[d.validade]||d.validade):'',data:d.data?fmtData(d.data):'',status:statusLabel(d.status),ultimaAtualizacao:d.ultimaAtualizacao?fmtData(d.ultimaAtualizacao):'',gestorNome:d.gestorNome||'',gestorSetor:d.gestorSetor||'',gestorEmail:d.gestorEmail||'',gestorWhatsapp:d.gestorWhatsapp||'',descricao:d.descricao||''};return v[c]??'';
}
function valorReuniaoRelatorio(r,c){
  const unidade=unidadesPersonalizadas.find(u=>u.codigo===r.frequencia)?.nome||r.frequencia;
  const v={data:r.data?fmtData(r.data):'',horario:r.horario||'',frequencia:unidade||'',periodicidade:FREQUENCIAS_REUNIAO[r.frequencia]||'',formato:rotuloFormatoReuniao(r.formato),situacao:typeof obterSituacaoReuniao==='function'?obterSituacaoReuniao(r):(r.situacao||'Agendada'),link:r.link||'',pauta:r.pauta||'',membros:normalizarMembros(r.membros,r.frequencia).filter(m=>m.nome).map(m=>`${m.nome} — ${m.cargo}`).join('\n'),convidados:normalizarParticipantes(r.convidados??r.participantes).join('\n'),resumo:r.resumo||'',minuta:minutasHistorico.some(m=>m.reuniao?.id===r.id)?'Ata gerada':'Sem ata'};return v[c]??'';
}
function obterLogoNormaDataUrl(){
  const imagem=document.querySelector('.brand-logo');
  if(!imagem)return '';
  try{
    const canvas=document.createElement('canvas');
    const larguraOriginal=imagem.naturalWidth||8976,alturaOriginal=imagem.naturalHeight||2156;
    canvas.width=1200;canvas.height=Math.round(1200*(alturaOriginal/larguraOriginal));
    canvas.getContext('2d').drawImage(imagem,0,0,canvas.width,canvas.height);
    return canvas.toDataURL('image/png');
  }catch(e){return imagem.src||'';}
}
function gerarRelatorioSelecionado(formato='csv'){
  const fontes=[relatorioOrigemAtual];
  if(!fontes.length){toast('Selecione documentos e/ou reuniões para o relatório.','alerta');return;}
  let total=0,cabecalhos=[],linhas=[];
  fontes.forEach(tipo=>{
    const defs=tipo==='documentos'?RELATORIO_CAMPOS_DOCUMENTOS:RELATORIO_CAMPOS_REUNIOES,campos=[...document.querySelectorAll(`[data-campo="${tipo}"]:checked`)].map(i=>i.value),itens=(tipo==='documentos'?docs:reunioes).filter(i=>relatorioSelecao[tipo].has(i.id));
    if(!campos.length||!itens.length)return;
    total+=itens.length;
    cabecalhos=campos.map(c=>defs.find(([id])=>id===c)?.[1]||c);
    linhas=itens.map(item=>{const n=tipo==='documentos'?{...item,status:calcularStatus(item)}:item;return campos.map(c=>tipo==='documentos'?valorDocumentoRelatorio(n,c):valorReuniaoRelatorio(n,c));});
  });
  if(!total){toast('Marque ao menos um registro e um campo em uma das seções.','alerta');return;}
  if(formato==='pdf'){
    gerarRelatorioPdf(cabecalhos,linhas,total,relatorioOrigemAtual);
    fecharRelatorio();return;
  }
  const escaparCsv=v=>{let texto=String(v??'');if(/^[=+@]/.test(texto))texto=`'${texto}`;return `"${texto.replace(/"/g,'""')}"`;};
  const csv=[cabecalhos,...linhas].map(linha=>linha.map(escaparCsv).join(';')).join('\r\n');
  const url=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'})),link=document.createElement('a');
  link.href=url;link.download=`relatorio_${relatorioOrigemAtual}_${todayStr()}.csv`;document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);fecharRelatorio();toast(`<b>Relatório CSV exportado</b> — ${total} registro${total===1?'':'s'}.`,'valido');
}

function gerarRelatorioPdf(cabecalhos,linhas,total,tipo='documentos'){
  const JsPdf=window.jspdf?.jsPDF;
  if(!JsPdf){toast('Não foi possível carregar o gerador de PDF.','vencido');return;}
  const pdf=new JsPdf({orientation:'landscape',unit:'mm',format:'a4',compress:true});
  const larguraPagina=297,margem=10,larguraUtil=larguraPagina-(margem*2),alturaLimite=196;
  const colunas=4,espaco=2,larguraCelula=(larguraUtil-(espaco*(colunas-1)))/colunas;
  const emitido=new Date().toLocaleString('pt-BR');
  const logo=obterLogoNormaDataUrl();
  const reunioesRelatorio=tipo==='reunioes';
  const tituloRelatorio=reunioesRelatorio?'Relatório de reuniões':'Relatório de documentos';
  const rotuloRegistro=reunioesRelatorio?'Reunião':'Documento';
  let pagina=1,y=0;
  function cabecalhoPagina(){
    if(logo){try{pdf.addImage(logo,'PNG',margem,7,46,11);}catch(e){}}
    else{pdf.setTextColor(12,50,111);pdf.setFontSize(16);pdf.setFont('helvetica','bold');pdf.text('NORMA',margem,16);}
    pdf.setTextColor(12,50,111);pdf.setFontSize(14);pdf.setFont('helvetica','bold');pdf.text(tituloRelatorio,margem,27);
    pdf.setTextColor(92,102,117);pdf.setFontSize(7);pdf.setFont('helvetica','normal');pdf.text(`${total} registro${total===1?'':'s'} · Emitido em ${emitido}`,margem,32);
    pdf.setDrawColor(12,50,111);pdf.setLineWidth(.7);pdf.line(margem,35,larguraPagina-margem,35);
    y=40;
  }
  function rodapePagina(){pdf.setTextColor(92,102,117);pdf.setFontSize(6);pdf.text(`Norma · Página ${pagina}`,larguraPagina-margem,204,{align:'right'});}
  function novaPagina(){rodapePagina();pdf.addPage('a4','landscape');pagina++;cabecalhoPagina();}
  cabecalhoPagina();
  linhas.forEach((linha,indiceLinha)=>{
    const indiceNome=cabecalhos.findIndex(item=>item===(reunioesRelatorio?'Pauta':'Documento'));
    const nome=indiceNome>=0?linha[indiceNome]:`${rotuloRegistro} ${indiceLinha+1}`;
    const campos=cabecalhos.map((rotulo,indice)=>({rotulo,valor:linha[indice]})).filter((_,indice)=>indice!==indiceNome);
    const grupos=[];
    for(let indice=0;indice<campos.length;indice+=colunas)grupos.push(campos.slice(indice,indice+colunas));
    const alturas=grupos.map(grupo=>Math.max(14,...grupo.map(campo=>{
      const valor=pdf.splitTextToSize(String(campo.valor||'—'),larguraCelula-4).slice(0,4);
      return 8+(valor.length*3.1);
    })));
    const alturaBloco=10+alturas.reduce((soma,altura)=>soma+altura,0)+6;
    if(y+Math.min(alturaBloco,alturaLimite-40)>alturaLimite)novaPagina();
    pdf.setFillColor(210,224,243);pdf.setDrawColor(170,191,220);pdf.rect(margem,y,larguraUtil,10,'FD');
    pdf.setTextColor(12,50,111);pdf.setFontSize(9);pdf.setFont('helvetica','bold');
    pdf.text(`${rotuloRegistro}: ${String(nome||'—')}`,margem+3,y+6.4,{maxWidth:larguraUtil-6});y+=10;
    grupos.forEach((grupo,indiceGrupo)=>{
      const altura=alturas[indiceGrupo];
      if(y+altura>alturaLimite){novaPagina();pdf.setFillColor(233,240,249);pdf.rect(margem,y,larguraUtil,7,'F');pdf.setTextColor(12,50,111);pdf.setFontSize(7);pdf.setFont('helvetica','bold');pdf.text(`${String(nome||'—')} — continuação`,margem+2,y+4.7);y+=7;}
      grupo.forEach((campo,indiceCampo)=>{
        const x=margem+(indiceCampo*(larguraCelula+espaco));
        pdf.setFillColor(242,244,247);pdf.setDrawColor(195,202,212);pdf.rect(x,y,larguraCelula,6,'FD');
        pdf.setTextColor(32,48,72);pdf.setFontSize(6.5);pdf.setFont('helvetica','bold');pdf.text(String(campo.rotulo),x+2,y+4,{maxWidth:larguraCelula-4});
        pdf.setFillColor(255,255,255);pdf.rect(x,y+6,larguraCelula,altura-6,'FD');
        pdf.setTextColor(40,49,63);pdf.setFontSize(7);pdf.setFont('helvetica','normal');
        const valor=pdf.splitTextToSize(String(campo.valor||'—'),larguraCelula-4).slice(0,4);pdf.text(valor,x+2,y+10);
      });
      y+=altura;
    });
    y+=6;
  });
  rodapePagina();pdf.save(`relatorio_norma_${tipo}_${todayStr()}.pdf`);toast(`<b>PDF Norma exportado</b> — ${total} registro${total===1?'':'s'}.`,'valido');
}
function exportarRelatorio(){abrirRelatorio('documentos');}
function exportarRelatorioReunioes(){abrirRelatorio('reunioes');}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.getElementById('relatorio-modal-overlay')?.classList.contains('open'))fecharRelatorio();});
