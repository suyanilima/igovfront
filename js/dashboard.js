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
  const vigentes=statusDocumentos.filter(documento=>documento.status==='Vigente').length;
  const alertas=statusDocumentos.filter(documento=>documento.status==='Alerta').length;
  const vencidos=statusDocumentos.filter(documento=>documento.status==='Vencido').length;
  const idsComMinuta=new Set(minutasHistorico.map(registro=>registro.reuniao?.id).filter(Boolean));
  const reunioesComMinuta=reunioes.filter(reuniao=>idsComMinuta.has(reuniao.id)).length;
  const semMinuta=Math.max(0,reunioes.length-reunioesComMinuta);
  const cobertura=reunioes.length?Math.round((reunioesComMinuta/reunioes.length)*100):0;
  const percentualVigentes=docs.length?Math.round((vigentes/docs.length)*100):0;

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
  definirTextoDashboard('dashboard-cobertura-minutas',`${cobertura}%`);
  definirTextoDashboard('dashboard-cobertura-texto',`${reunioesComMinuta} de ${reunioes.length} reuniões`);
  definirTextoDashboard('dashboard-atualizacao',`Atualizado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`);

  const anel=document.getElementById('dashboard-anel-documentos');
  if(anel){
    const totalStatus=Math.max(1,docs.length);
    const fimVigentes=(vigentes/totalStatus)*360;
    const fimAlertas=((vigentes+alertas)/totalStatus)*360;
    const fimVencidos=((vigentes+alertas+vencidos)/totalStatus)*360;
    anel.style.background=docs.length
      ? `conic-gradient(#168A4B 0deg ${fimVigentes}deg,#C47A00 ${fimVigentes}deg ${fimAlertas}deg,#C62828 ${fimAlertas}deg ${fimVencidos}deg,#E9EEF5 ${fimVencidos}deg 360deg)`
      : '#E9EEF5';
  }
  const barra=document.getElementById('dashboard-cobertura-barra');
  if(barra) barra.style.width=`${cobertura}%`;

  const porUnidade=new Map();
  reunioes.forEach(reuniao=>porUnidade.set(reuniao.frequencia,(porUnidade.get(reuniao.frequencia)||0)+1));
  const totalReunioes=Math.max(1,reunioes.length);
  const unidades=document.getElementById('dashboard-unidades');
  if(unidades){
    unidades.innerHTML=porUnidade.size
      ? [...porUnidade.entries()].sort((a,b)=>b[1]-a[1]).map(([codigo,total])=>{
        const percentual=Math.round((total/totalReunioes)*100);
        return `<div class="dashboard-unidade-linha"><b title="${escapeHtml(nomeUnidadeDashboard(codigo))}">${escapeHtml(nomeUnidadeDashboard(codigo))}</b><span class="dashboard-unidade-barra"><i style="width:${percentual}%"></i></span><strong>${percentual}%</strong></div>`;
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

  const recentes=[...reunioes].sort((a,b)=>`${b.data}T${b.horario}`.localeCompare(`${a.data}T${a.horario}`));
  const listaReunioes=document.getElementById('dashboard-reunioes-recentes');
  if(listaReunioes){
    listaReunioes.innerHTML=recentes.length
      ? recentes.map(reuniao=>`<div class="dashboard-lista-item"><div><strong>${escapeHtml(nomeUnidadeDashboard(reuniao.frequencia))}</strong><span>${escapeHtml(fmtData(reuniao.data))} às ${escapeHtml(reuniao.horario||'--:--')} · ${escapeHtml(reuniao.pauta||'Sem pauta')}</span></div><em class="${idsComMinuta.has(reuniao.id)?'completa':''}">${idsComMinuta.has(reuniao.id)?'Com minuta':'Pendente'}</em></div>`).join('')
      : '<div class="dashboard-lista-vazia">Nenhuma reunião cadastrada.</div>';
  }
}