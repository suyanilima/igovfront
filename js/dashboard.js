/* ===== DASHBOARD PRINCIPAL ===== */

function definirTextoDashboard(id,valor){
  const elemento=document.getElementById(id);
  if(elemento) elemento.textContent=String(valor);
}

function nomeUnidadeDashboard(codigo){
  return unidadesPersonalizadas.find(unidade=>unidade.codigo===codigo)?.nome || codigo || 'Sem unidade';
}

function renderDashboard(){
  const statusDocumentos=docs.map(documento=>({...documento,status:calcularStatus(documento)}));
  const semNormativo=statusDocumentos.filter(documento=>documento.semNormativo || documento.tipo==='Sem normativo').length;
  const documentosNormativos=statusDocumentos.filter(documento=>!(documento.semNormativo || documento.tipo==='Sem normativo'));
  const vigentes=documentosNormativos.filter(documento=>documento.status==='Vigente').length;
  const alertas=documentosNormativos.filter(documento=>documento.status==='Alerta').length;
  const vencidos=documentosNormativos.filter(documento=>documento.status==='Vencido').length;
  const idsComMinuta=new Set(minutasHistorico.map(registro=>registro.reuniao?.id).filter(Boolean));
  const reunioesComMinuta=reunioes.filter(reuniao=>idsComMinuta.has(reuniao.id)).length;
  const semMinuta=Math.max(0,reunioes.length-reunioesComMinuta);
  const cobertura=reunioes.length?Math.round((reunioesComMinuta/reunioes.length)*100):0;
  const percentualVigentes=documentosNormativos.length?Math.round((vigentes/documentosNormativos.length)*100):0;
  const hoje=new Date();
  hoje.setHours(0,0,0,0);
  const situacaoReuniao=reuniao=>{
    if(typeof obterSituacaoReuniao==='function') return obterSituacaoReuniao(reuniao);
    const situacao=String(reuniao.situacao || reuniao.status || '').toLocaleLowerCase('pt-BR');
    if(situacao.includes('cancel')) return 'Cancelada';
    if(situacao.includes('conclu')) return 'Concluída';
    if(situacao.includes('agend')) return 'Agendada';
    const data=new Date(`${reuniao.data || '9999-12-31'}T00:00:00`);
    return !Number.isNaN(data.getTime()) && data < hoje ? 'Concluída' : 'Agendada';
  };
  const reunioesConcluidas=reunioes.filter(item=>situacaoReuniao(item)==='Concluída').length;
  const reunioesAgendadas=reunioes.filter(item=>['Agendada','Reagendada'].includes(situacaoReuniao(item))).length;
  const reunioesCanceladas=reunioes.filter(item=>situacaoReuniao(item)==='Cancelada').length;
  const percentualReunioesConcluidas=reunioes.length?Math.round((reunioesConcluidas/reunioes.length)*100):0;
  const reunioesComAtaPrevista=reunioes.filter(reuniao=>situacaoReuniao(reuniao)!=='Cancelada');
  const atasConcluidas=reunioesComAtaPrevista.filter(reuniao=>idsComMinuta.has(reuniao.id)).length;
  const atasEmAndamento=reunioesComAtaPrevista.filter(reuniao=>!idsComMinuta.has(reuniao.id) && situacaoReuniao(reuniao)==='Concluída').length;
  const atasPendentes=reunioesComAtaPrevista.filter(reuniao=>!idsComMinuta.has(reuniao.id) && ['Agendada','Reagendada'].includes(situacaoReuniao(reuniao))).length;
  const percentualAtasConcluidas=reunioesComAtaPrevista.length?Math.round((atasConcluidas/reunioesComAtaPrevista.length)*100):0;

  definirTextoDashboard('dashboard-total-documentos',docs.length);
  definirTextoDashboard('dashboard-documentos-detalhe',`${alertas+vencidos} exigindo atenção`);
  definirTextoDashboard('dashboard-total-reunioes',reunioes.length);
  definirTextoDashboard('dashboard-reunioes-detalhe',`${new Set(reunioes.map(item=>item.frequencia).filter(Boolean)).size} unidade(s)`);
  definirTextoDashboard('dashboard-total-minutas',minutasHistorico.length);
  definirTextoDashboard('dashboard-minutas-detalhe',`${cobertura}% das reuniões`);
  definirTextoDashboard('dashboard-reunioes-sem-minuta',semMinuta);
  definirTextoDashboard('dashboard-percentual-vigentes',`${percentualVigentes}%`);
  definirTextoDashboard('dashboard-doc-vigentes',vigentes);
  definirTextoDashboard('dashboard-doc-alerta',alertas);
  definirTextoDashboard('dashboard-doc-vencidos',vencidos);
  definirTextoDashboard('dashboard-doc-sem-normativo',semNormativo);
  definirTextoDashboard('dashboard-reunioes-concluidas',reunioesConcluidas);
  definirTextoDashboard('dashboard-reunioes-agendadas',reunioesAgendadas);
  definirTextoDashboard('dashboard-reunioes-canceladas',reunioesCanceladas);
  definirTextoDashboard('dashboard-percentual-reunioes-concluidas',`${percentualReunioesConcluidas}%`);
  definirTextoDashboard('dashboard-atas-concluidas',atasConcluidas);
  definirTextoDashboard('dashboard-atas-andamento',atasEmAndamento);
  definirTextoDashboard('dashboard-atas-pendentes',atasPendentes);
  definirTextoDashboard('dashboard-percentual-atas-concluidas',`${percentualAtasConcluidas}%`);
  definirTextoDashboard('dashboard-atualizacao',`Atualizado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`);

  const anel=document.getElementById('dashboard-anel-documentos');
  if(anel){
    const totalStatus=Math.max(1,docs.length);
    const fimVigentes=(vigentes/totalStatus)*360;
    const fimAlertas=((vigentes+alertas)/totalStatus)*360;
    const fimVencidos=((vigentes+alertas+vencidos)/totalStatus)*360;
    const fimSemNormativo=((vigentes+alertas+vencidos+semNormativo)/totalStatus)*360;
    anel.style.background=docs.length
      ? `conic-gradient(#168A4B 0deg ${fimVigentes}deg,#C47A00 ${fimVigentes}deg ${fimAlertas}deg,#C62828 ${fimAlertas}deg ${fimVencidos}deg,#64748B ${fimVencidos}deg ${fimSemNormativo}deg,#E9EEF5 ${fimSemNormativo}deg 360deg)`
      : '#E9EEF5';
  }
  const pintarAnel=(id,valores,cores)=>{
    const elemento=document.getElementById(id);
    if(!elemento) return;
    const total=valores.reduce((soma,valor)=>soma+valor,0);
    if(!total){ elemento.style.background='#E9EEF5'; return; }
    let inicio=0;
    elemento.style.background=`conic-gradient(${valores.map((valor,indice)=>{
      const fim=inicio+(valor/total)*360;
      const faixa=`${cores[indice]} ${inicio}deg ${fim}deg`;
      inicio=fim;
      return faixa;
    }).join(',')})`;
  };
  pintarAnel('dashboard-anel-reunioes',[reunioesConcluidas,reunioesAgendadas,reunioesCanceladas],['#168A4B','#C47A00','#C62828']);
  pintarAnel('dashboard-anel-atas',[atasConcluidas,atasEmAndamento,atasPendentes],['#168A4B','#C47A00','#4F7FC1']);

  const porUnidade=new Map();
  reunioes.forEach(reuniao=>porUnidade.set(reuniao.frequencia,(porUnidade.get(reuniao.frequencia)||0)+1));
  const unidades=document.getElementById('dashboard-unidades');
  if(unidades){
    unidades.innerHTML=porUnidade.size
      ? [...porUnidade.entries()].sort((a,b)=>b[1]-a[1]).map(([codigo,total])=>{
        const concluidas=reunioes.filter(reuniao=>reuniao.frequencia===codigo && idsComMinuta.has(reuniao.id)).length;
        const percentual=Math.round((concluidas/total)*100);
        return `<div class="dashboard-unidade-linha"><b title="${escapeHtml(nomeUnidadeDashboard(codigo))}">${escapeHtml(nomeUnidadeDashboard(codigo))}</b><span class="dashboard-unidade-barra" role="progressbar" aria-label="${escapeHtml(nomeUnidadeDashboard(codigo))}: ${concluidas} de ${total} atas concluídas" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percentual}"><i style="width:${percentual}%"></i></span><strong>${concluidas} de ${total} atas</strong></div>`;
      }).join('')
      : '<div class="dashboard-lista-vazia">Nenhuma reunião cadastrada.</div>';
  }

  const documentosAtencao=statusDocumentos
    .filter(documento=>['Alerta','Vencido'].includes(documento.status))
    .sort((a,b)=>String(a.data||'').localeCompare(String(b.data||'')));
  const listaDocumentos=document.getElementById('dashboard-documentos-atencao');
  if(listaDocumentos){
    listaDocumentos.innerHTML=documentosAtencao.length
      ? documentosAtencao.map(documento=>`<div class="dashboard-lista-item"><div><strong title="${escapeHtml(documento.nome)}">${escapeHtml(documento.nome)}</strong><span>Vencimento: ${escapeHtml(documento.data?fmtData(documento.data):'não informado')}</span></div><em class="${documento.status==='Vencido'?'vencido':'alerta'}">${escapeHtml(statusLabel(documento.status))}</em></div>`).join('')
      : '<div class="dashboard-lista-vazia">Nenhum documento exige atenção.</div>';
  }

  const recentes=[...reunioes].sort((a,b)=>`${b.data || ''}T${b.horario || ''}`.localeCompare(`${a.data || ''}T${a.horario || ''}`));
  const listaReunioes=document.getElementById('dashboard-reunioes-recentes');
  if(listaReunioes){
    listaReunioes.innerHTML=recentes.length
      ? recentes.map(reuniao=>{
        const situacao=situacaoReuniao(reuniao);
        const classe=situacao==='Concluída'?'completa':situacao==='Cancelada'?'vencido':'alerta';
        return `<div class="dashboard-lista-item"><div><strong>${escapeHtml(nomeUnidadeDashboard(reuniao.frequencia))}</strong><span title="${escapeHtml(reuniao.pauta || 'Sem pauta informada')}">${escapeHtml(reuniao.pauta || 'Sem pauta informada')}</span></div><em class="${classe}">${escapeHtml(situacao)}</em></div>`;
      }).join('')
      : '<div class="dashboard-lista-vazia">Nenhuma reunião cadastrada.</div>';
  }

}
