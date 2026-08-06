/* ===== CONFIGURADOR DE RELATÓRIOS ===== */
const RELATORIO_CAMPOS_DOCUMENTOS=[['setorPai','Setor'],['unidade','Unidade escolhida'],['nome','Documento'],['tipo','Tipo'],['baseLegal','Fundamentação legal'],['sei','Nº SEI'],['dataVigencia','Data de vigência'],['validade','Prazo de validade'],['data','Vencimento'],['status','Situação'],['ultimaAtualizacao','Última atualização'],['gestorNome','Gestor responsável'],['gestorSetor','Setor do gestor'],['gestorEmail','E-mail do gestor'],['gestorWhatsapp','WhatsApp do gestor'],['descricao','Descrição']];
const RELATORIO_CAMPOS_REUNIOES=[['data','Data'],['horario','Horário'],['frequencia','Unidade'],['periodicidade','Periodicidade'],['formato','Formato'],['situacao','Situação'],['link','Link'],['pauta','Pauta'],['membros','Membros'],['convidados','Convidados'],['minuta','Situação da ata']];
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
function abrirRelatorio(origem='documentos', contexto=null){
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
  const resumoPeriodo=quantidade===1
    ? `A reunião de ${escapeHtml(contexto?.periodo)} será exportada.`
    : `Todas as ${quantidade} reuniões de ${escapeHtml(contexto?.periodo)} serão exportadas.`;
  const introducao=contexto?.periodo
    ? `<strong>${resumoPeriodo}</strong> Escolha abaixo quais informações devem aparecer no arquivo.`
    : `<strong>${quantidade} ${rotulo} selecionado${quantidade===1?'':'s'}.</strong> Escolha abaixo quais informações devem aparecer no arquivo.`;
  document.getElementById('relatorio-intro').innerHTML=introducao;
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
    if(relatorioOrigemAtual==='reunioes'){
      const campos=[...document.querySelectorAll('[data-campo="reunioes"]:checked')].map(i=>i.value);
      const itens=reunioes.filter(i=>relatorioSelecao.reunioes.has(i.id));
      gerarRelatorioPdfReunioes(itens,campos);
    }else gerarRelatorioPdf(cabecalhos,linhas,total,relatorioOrigemAtual);
    fecharRelatorio();return;
  }
  const escaparCsv=v=>{let texto=String(v??'');if(/^[=+@]/.test(texto))texto=`'${texto}`;return `"${texto.replace(/"/g,'""')}"`;};
  const csv=[cabecalhos,...linhas].map(linha=>linha.map(escaparCsv).join(';')).join('\r\n');
  const url=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'})),link=document.createElement('a');
  link.href=url;link.download=`relatorio_${relatorioOrigemAtual}_${todayStr()}.csv`;document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);fecharRelatorio();toast(`<b>Relatório CSV exportado</b> — ${total} registro${total===1?'':'s'}.`,'valido');
}

function gerarRelatorioPdfReunioes(itens,campos){
  const JsPdf=window.jspdf?.jsPDF;
  if(!JsPdf){toast('Não foi possível carregar o gerador de PDF.','vencido');return;}
  const pdf=new JsPdf({orientation:'portrait',unit:'mm',format:'a4',compress:true});
  const larguraPagina=210,margem=8,larguraUtil=larguraPagina-(margem*2),limitePagina=282,logo=obterLogoNormaDataUrl();
  const selecionado=new Set(campos),azul=[28,65,108],cinza=[82,82,82],borda=[190,190,190],fundo=[242,242,242];
  const texto=(valor,padrao='Não informado')=>String(valor||padrao);
  let pagina=1,y=35;
  function cabecalho(){
    if(logo){try{pdf.addImage(logo,'PNG',margem,6,42,10);}catch(e){}}
    else{pdf.setTextColor(...azul);pdf.setFontSize(15);pdf.setFont('helvetica','bold');pdf.text('NORMA',margem,14);}
    pdf.setTextColor(35,35,35);pdf.setFontSize(14);pdf.setFont('helvetica','bold');pdf.text('Relatório de reuniões',margem,23);
    pdf.setTextColor(...cinza);pdf.setFontSize(6.5);pdf.setFont('helvetica','normal');
    pdf.text(`Emitido em ${new Date().toLocaleString('pt-BR')}`,margem,28);
    pdf.text(`Página ${pagina}`,larguraPagina-margem,23,{align:'right'});
    pdf.setDrawColor(160,160,160);pdf.setLineWidth(.25);pdf.line(margem,31,larguraPagina-margem,31);
    pdf.text(`Página ${pagina}`,larguraPagina/2,291,{align:'center'});
    y=35;
  }
  function novaPagina(){pdf.addPage('a4','portrait');pagina++;cabecalho();}
  function linhasValor(valor,w,maximo=8){return pdf.splitTextToSize(texto(valor),w-4).slice(0,maximo);}
  function alturaValor(valor,w,maximo=8){return Math.max(7,3+(linhasValor(valor,w,maximo).length*3.2));}
  function secao(rotulo,valor,maximo=8){
    const linhas=linhasValor(valor,larguraUtil,maximo),altura=Math.max(7,3+(linhas.length*3.2));
    pdf.setFillColor(...fundo);pdf.setDrawColor(...borda);pdf.rect(margem,y,larguraUtil,6,'FD');
    pdf.setTextColor(...cinza);pdf.setFontSize(7);pdf.setFont('helvetica','bold');pdf.text(rotulo,margem+2,y+4.1);y+=6;
    pdf.setFillColor(255,255,255);pdf.rect(margem,y,larguraUtil,altura,'FD');
    pdf.setTextColor(40,40,40);pdf.setFontSize(7);pdf.setFont('helvetica','normal');pdf.text(linhas,margem+2,y+4.4);y+=altura;
  }
  cabecalho();
  itens.forEach(reuniao=>{
    const unidade=unidadesPersonalizadas.find(u=>u.codigo===reuniao.frequencia)?.nome||reuniao.frequencia;
    const membros=normalizarMembros(reuniao.membros,reuniao.frequencia).filter(m=>m.nome);
    const convidados=normalizarParticipantes(reuniao.convidados??reuniao.participantes);
    const participantes=membros.length+convidados.length;
    const metas=[];
    if(selecionado.has('data')||selecionado.has('horario'))metas.push(['Data e horário',[
      selecionado.has('data')?(reuniao.data?fmtData(reuniao.data):'Data não informada'):'',
      selecionado.has('horario')?(reuniao.horario?`às ${reuniao.horario}`:'Horário não informado'):''
    ].filter(Boolean).join(' ')]);
    if(selecionado.has('frequencia')||selecionado.has('periodicidade'))metas.push(['Unidade',[
      selecionado.has('frequencia')?texto(unidade):'',
      selecionado.has('periodicidade')?texto(FREQUENCIAS_REUNIAO[reuniao.frequencia],'Periodicidade não informada'):''
    ].filter(Boolean).join(' · ')]);
    if(selecionado.has('formato'))metas.push(['Formato',rotuloFormatoReuniao(reuniao.formato)]);
    if(selecionado.has('situacao')||selecionado.has('minuta'))metas.push(['Situação',[
      selecionado.has('situacao')?(typeof obterSituacaoReuniao==='function'?obterSituacaoReuniao(reuniao):texto(reuniao.situacao,'Agendada')):'',
      selecionado.has('minuta')?(minutasHistorico.some(m=>m.reuniao?.id===reuniao.id)?'Ata gerada':'Sem ata'):''
    ].filter(Boolean).join(' · ')]);
    if(selecionado.has('link'))metas.push(['Acesso',reuniao.link||'Não informado']);
    if(selecionado.has('membros')||selecionado.has('convidados'))metas.push(['Participação',`${participantes} ${participantes===1?'participante':'participantes'}`]);
    const linhasMeta=[];for(let i=0;i<metas.length;i+=3)linhasMeta.push(metas.slice(i,i+3));
    let alturaBloco=8;
    linhasMeta.forEach(linha=>{const w=larguraUtil/linha.length;alturaBloco+=6+Math.max(...linha.map(([,valor])=>alturaValor(valor,w,3)));});
    if(selecionado.has('pauta'))alturaBloco+=6+alturaValor(reuniao.pauta||'Nenhuma pauta cadastrada.',larguraUtil,8);
    if(selecionado.has('membros'))alturaBloco+=6+alturaValor(membros.map(m=>`${m.nome} - ${m.cargo}`).join('\n')||'Nenhum membro informado.',larguraUtil,10);
    if(selecionado.has('convidados'))alturaBloco+=6+alturaValor(convidados.join('\n')||'Nenhum convidado informado.',larguraUtil,10);
    alturaBloco+=4;
    if(y+alturaBloco>limitePagina)novaPagina();
    pdf.setFillColor(211,225,242);pdf.setDrawColor(...borda);pdf.rect(margem,y,larguraUtil,8,'FD');
    pdf.setTextColor(...azul);pdf.setFontSize(8);pdf.setFont('helvetica','bold');
    pdf.text(`Reunião: ${texto(reuniao.pauta,'Sem pauta')}`,margem+2,y+5.3,{maxWidth:larguraUtil-4});y+=8;
    linhasMeta.forEach(linha=>{
      const w=larguraUtil/linha.length,altura=Math.max(...linha.map(([,valor])=>alturaValor(valor,w,3)));
      linha.forEach(([rotulo],i)=>{pdf.setFillColor(230,230,230);pdf.setDrawColor(...borda);pdf.rect(margem+i*w,y,w,6,'FD');pdf.setTextColor(45,45,45);pdf.setFontSize(7);pdf.setFont('helvetica','bold');pdf.text(rotulo,margem+i*w+2,y+4.1);});y+=6;
      linha.forEach(([,valor],i)=>{pdf.setFillColor(255,255,255);pdf.rect(margem+i*w,y,w,altura,'FD');pdf.setTextColor(40,40,40);pdf.setFontSize(7);pdf.setFont('helvetica','normal');pdf.text(linhasValor(valor,w,3),margem+i*w+2,y+4.3);});y+=altura;
    });
    if(selecionado.has('pauta'))secao('Pauta',reuniao.pauta||'Nenhuma pauta cadastrada.');
    if(selecionado.has('membros'))secao('Membros da unidade',membros.map(m=>`${m.nome} - ${m.cargo}`).join('\n')||'Nenhum membro informado.',10);
    if(selecionado.has('convidados'))secao('Convidados',convidados.join('\n')||'Nenhum convidado informado.',10);
    y+=4;
  });
  pdf.save(`relatorio_norma_reunioes_${todayStr()}.pdf`);
  toast(`<b>PDF Norma exportado</b> — ${itens.length} reunião${itens.length===1?'':'ões'}.`,'valido');
}

function gerarRelatorioPdf(cabecalhos,linhas,total,tipo='documentos'){
  const JsPdf=window.jspdf?.jsPDF;
  if(!JsPdf){toast('Não foi possível carregar o gerador de PDF.','vencido');return;}
  const pdf=new JsPdf({orientation:'portrait',unit:'mm',format:'a4',compress:true});
  const larguraPagina=210,margem=8,larguraUtil=194,limitePagina=282,logo=obterLogoNormaDataUrl();
  const azul=[28,65,108],cinza=[82,82,82],borda=[190,190,190],fundo=[242,242,242];
  let pagina=1,y=35;
  function cabecalhoPagina(){
    if(logo){try{pdf.addImage(logo,'PNG',margem,6,42,10);}catch(e){}}
    else{pdf.setTextColor(...azul);pdf.setFontSize(15);pdf.setFont('helvetica','bold');pdf.text('NORMA',margem,14);}
    pdf.setTextColor(35,35,35);pdf.setFontSize(14);pdf.setFont('helvetica','bold');pdf.text('Relatório de documentos',margem,23);
    pdf.setTextColor(...cinza);pdf.setFontSize(6.5);pdf.setFont('helvetica','normal');pdf.text(`Emitido em ${new Date().toLocaleString('pt-BR')}`,margem,28);
    pdf.text(`Página ${pagina}`,larguraPagina-margem,23,{align:'right'});pdf.text(`Página ${pagina}`,larguraPagina/2,291,{align:'center'});
    pdf.setDrawColor(160,160,160);pdf.setLineWidth(.25);pdf.line(margem,31,larguraPagina-margem,31);y=35;
  }
  function novaPagina(){pdf.addPage('a4','portrait');pagina++;cabecalhoPagina();}
  function linhasValor(valor,w,maximo=8){return pdf.splitTextToSize(String(valor||'—'),w-4).slice(0,maximo);}
  function alturaValor(valor,w,maximo=8){return Math.max(7,3+(linhasValor(valor,w,maximo).length*3.2));}
  function desenharSecao(rotulo,valor){
    const linhasTexto=linhasValor(valor,larguraUtil,10),altura=Math.max(7,3+(linhasTexto.length*3.2));
    pdf.setFillColor(...fundo);pdf.setDrawColor(...borda);pdf.rect(margem,y,larguraUtil,6,'FD');
    pdf.setTextColor(...cinza);pdf.setFontSize(7);pdf.setFont('helvetica','bold');pdf.text(rotulo,margem+2,y+4.1);y+=6;
    pdf.setFillColor(255,255,255);pdf.rect(margem,y,larguraUtil,altura,'FD');pdf.setTextColor(40,40,40);pdf.setFont('helvetica','normal');pdf.text(linhasTexto,margem+2,y+4.4);y+=altura;
  }
  cabecalhoPagina();
  linhas.forEach((linha,indiceLinha)=>{
    const indiceNome=cabecalhos.indexOf('Documento'),indiceDescricao=cabecalhos.indexOf('Descrição');
    const nome=indiceNome>=0?linha[indiceNome]:`Documento ${indiceLinha+1}`;
    const descricao=indiceDescricao>=0?linha[indiceDescricao]:'';
    const campos=cabecalhos.map((rotulo,indice)=>({rotulo,valor:linha[indice]})).filter((_,indice)=>indice!==indiceNome&&indice!==indiceDescricao);
    const grupos=[];
    for(let indice=0;indice<campos.length;indice+=3)grupos.push(campos.slice(indice,indice+3));
    let alturaBloco=8+4;
    grupos.forEach(grupo=>{const w=larguraUtil/grupo.length;alturaBloco+=6+Math.max(...grupo.map(campo=>alturaValor(campo.valor,w,4)));});
    if(indiceDescricao>=0)alturaBloco+=6+alturaValor(descricao,larguraUtil,10);
    if(y+alturaBloco>limitePagina)novaPagina();
    pdf.setFillColor(211,225,242);pdf.setDrawColor(...borda);pdf.rect(margem,y,larguraUtil,8,'FD');pdf.setTextColor(...azul);pdf.setFontSize(8);pdf.setFont('helvetica','bold');
    pdf.text(`Documento: ${String(nome||'—')}`,margem+2,y+5.3,{maxWidth:larguraUtil-4});y+=8;
    grupos.forEach(grupo=>{
      const w=larguraUtil/grupo.length,altura=Math.max(...grupo.map(campo=>alturaValor(campo.valor,w,4)));
      grupo.forEach((campo,i)=>{pdf.setFillColor(230,230,230);pdf.setDrawColor(...borda);pdf.rect(margem+i*w,y,w,6,'FD');pdf.setTextColor(45,45,45);pdf.setFontSize(7);pdf.setFont('helvetica','bold');pdf.text(campo.rotulo,margem+i*w+2,y+4.1,{maxWidth:w-4});});y+=6;
      grupo.forEach((campo,i)=>{pdf.setFillColor(255,255,255);pdf.rect(margem+i*w,y,w,altura,'FD');pdf.setTextColor(40,40,40);pdf.setFontSize(7);pdf.setFont('helvetica','normal');pdf.text(linhasValor(campo.valor,w,4),margem+i*w+2,y+4.3);});y+=altura;
    });
    if(indiceDescricao>=0)desenharSecao('Descrição',descricao);
    y+=4;
  });
  pdf.save(`relatorio_norma_${tipo}_${todayStr()}.pdf`);toast(`<b>PDF Norma exportado</b> — ${total} registro${total===1?'':'s'}.`,'valido');
}
function exportarRelatorio(){abrirRelatorio('documentos');}
function exportarRelatorioReunioes(){
  let contexto=null;
  if(typeof visualizacaoReunioes!=='undefined' && visualizacaoReunioes==='calendario' && typeof calendarioReunioesMes!=='undefined'){
    const mesSelecionado=`${calendarioReunioesMes.getFullYear()}-${String(calendarioReunioesMes.getMonth()+1).padStart(2,'0')}`;
    const reunioesDoMes=reunioes.filter(reuniao=>(reuniao.data||'').startsWith(mesSelecionado));
    const rotuloMes=calendarioReunioesMes.toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
    if(!reunioesDoMes.length){
      toast(`Não há reuniões em ${rotuloMes} para exportar.`,'alerta');
      return;
    }
    relatorioSelecao.reunioes=new Set(reunioesDoMes.map(reuniao=>reuniao.id));
    contexto={periodo:rotuloMes};
  }
  abrirRelatorio('reunioes',contexto);
}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.getElementById('relatorio-modal-overlay')?.classList.contains('open'))fecharRelatorio();});
