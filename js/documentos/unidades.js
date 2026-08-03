/* ===== ORGANOGRAMA E NAVEGAÇÃO DOS DOCUMENTOS ===== */

const ORGANOGRAMA_DOCUMENTOS = Object.freeze([
  {
    codigo:'PRES',
    nome:'Presidência',
    unidades:[
      ['GAPRES','Gabinete da Presidência'],
      ['ASJUR','Assessoria Jurídica da Presidência'],
      ['ASCOM','Assessoria de Comunicação Social'],
      ['AGEL','Assessoria de Gestão Eleitoral'],
      ['ASPLAN','Assessoria de Planejamento, Estratégia e Gestão'],
      ['NULAB','Núcleo Laboratório de Inovação e Gestão da Qualidade'],
      ['NISIPJ','Núcleo de Inteligência, Segurança Institucional e Polícia Judicial']
    ]
  },
  {
    codigo:'VICRE',
    nome:'Vice-Presidência e Corregedoria Regional Eleitoral',
    unidades:[
      ['GACRE','Gabinete da Vice-Presidência e Corregedoria Regional Eleitoral'],
      ['ASCRE','Assessoria da Corregedoria Regional Eleitoral'],
      ['COCRE','Coordenadoria da Corregedoria Regional Eleitoral'],
      ['SRDP','Seção de Revisão da Autuação e Distribuição de Processos'],
      ['SECAP','Seção de Controle e Acompanhamento de Processos'],
      ['SLDAG','Seção de Legislação, Documentação e Arquivo-Geral'],
      ['SDP','Seção de Direitos Políticos'],
      ['SOC','Seção de Orientação e Correição']
    ]
  },
  {
    codigo:'EJE',
    nome:'Escola Judiciária Eleitoral',
    unidades:[
      ['AEJE','Assistência da Escola Judiciária Eleitoral']
    ]
  },
  {
    codigo:'OUVIDORIA',
    nome:'Ouvidoria Eleitoral',
    unidades:[
      ['AOUV','Assistência da Ouvidoria']
    ]
  },
  {
    codigo:'DG',
    nome:'Diretoria-Geral',
    unidades:[
      ['GADG','Gabinete da Diretoria-Geral'],
      ['ASSAI','Assistência de Sustentabilidade, Acessibilidade e Inclusão'],
      ['ASGIM','Assessoria de Gestão de Imóveis']
    ]
  },
  {
    codigo:'SAOF',
    nome:'Secretaria de Administração, Orçamento e Finanças',
    unidades:[
      ['GASAOF','Gabinete da Secretaria de Administração, Orçamento e Finanças'],
      ['ASGOVSAOF','Assessoria de Governança e Planejamento da SAOF'],
      ['COFIN','Coordenadoria de Orçamento e Finanças'],
      ['SPEO','Seção de Programação e Execução Orçamentária'],
      ['SPEF','Seção de Programação e Execução Financeira'],
      ['SECON','Seção de Contabilidade'],
      ['COMAP','Coordenadoria de Material e Patrimônio'],
      ['SEMAP','Seção de Material e Patrimônio'],
      ['SLC','Seção de Compras, Licitações e Contratos'],
      ['SGEC','Seção de Gestão de Contratos'],
      ['COSEG','Coordenadoria de Serviços Gerais'],
      ['SETRAN','Seção de Transportes'],
      ['SEADE','Seção de Administração do Edifício']
    ]
  },
  {
    codigo:'SJ',
    nome:'Secretaria Judiciária',
    unidades:[
      ['GAJUD','Gabinete da Secretaria Judiciária'],
      ['COSES','Coordenadoria das Sessões'],
      ['SECEP','Seção de Exame de Contas Eleitorais e Partidárias'],
      ['SRJAR','Seção de Registros de Julgamentos, Acórdãos e Resoluções'],
      ['SEANT','Seção de Atas e Notas Taquigráficas'],
      ['CRIP','Coordenadoria de Registros e Informações Processuais'],
      ['SJIP','Seção de Jurisprudência, Indexação e Gerenciamento de Dados Partidários']
    ]
  },
  {
    codigo:'SGP',
    nome:'Secretaria de Gestão de Pessoas',
    unidades:[
      ['GSGP','Gabinete da Secretaria de Gestão de Pessoas'],
      ['COGEP','Coordenadoria de Gestão de Pessoas'],
      ['SECARF','Seção de Cadastro e Registros Funcionais'],
      ['SEPAG','Seção de Pagamentos'],
      ['SASBEN','Seção de Assistência à Saúde e Benefícios'],
      ['SAREMI','Seção de Apoio, Registro de Magistrados e Inativos']
    ]
  },
  {
    codigo:'STI',
    nome:'Secretaria de Tecnologia da Informação',
    unidades:[
      ['GSTI','Gabinete da Secretaria de Tecnologia da Informação'],
      ['ASPGOVTI','Assistência de Planejamento e Governança de Tecnologia da Informação'],
      ['CIE','Coordenadoria de Infraestrutura'],
      ['SEREDE','Seção de Redes'],
      ['SSU','Seção de Suporte aos Usuários'],
      ['SCSEG','Seção de Cibersegurança'],
      ['SEUE','Seção de Urnas Eletrônicas'],
      ['CSCOR','Coordenadoria de Soluções Corporativas'],
      ['SSEC','Seção de Sistemas Eleitorais e Corporativos'],
      ['SDBD','Seção de Desenvolvimento e Banco de Dados'],
      ['SCPE','Seção de Cadastro Eleitoral e Processos Específicos']
    ]
  },
  {
    codigo:'COAUDI',
    nome:'Coordenadoria de Auditoria Interna',
    unidades:[
      ['SEGLOF','Seção de Auditoria de Gestão de Logística, Orçamento e Finanças'],
      ['SEAPTIC','Seção de Auditoria de Gestão de Pessoas e Tecnologia da Informação e Comunicação']
    ]
  }
]);

let setorSelecionadoDocumentos='';
let unidadeSelecionadaDocumentos='';

function localizarUnidadeDocumento(codigo){
  if(codigo==='SEM_UNIDADE') return {setor:{codigo:'PENDENTES',nome:'Documentos pendentes de classificação'},codigo:'SEM_UNIDADE',nome:'Sem unidade definida'};
  if(codigo?.startsWith('SETOR:')){
    const codigoSetor=codigo.slice(6);
    if(codigoSetor==='TODAS') return {setor:{codigo:'TODAS',nome:'Todas as unidades'},codigo,nome:'Todas as unidades'};
    const setor=ORGANOGRAMA_DOCUMENTOS.find(item=>item.codigo===codigoSetor);
    if(setor) return {setor,codigo,nome:setor.nome};
    if(codigoSetor==='TRE-AC') return {setor:{codigo:'TRE-AC',nome:'Tribunal Regional Eleitoral do Acre'},codigo,nome:'Demais unidades do TRE-AC'};
  }
  for(const setor of ORGANOGRAMA_DOCUMENTOS){
    if(setor.codigo===codigo) return {setor,codigo,nome:setor.nome};
    const unidade=setor.unidades.find(item=>item[0]===codigo);
    if(unidade) return {setor,codigo:unidade[0],nome:unidade[1]};
  }
  if(typeof SETORES_CONVIDADOS!=='undefined' && SETORES_CONVIDADOS[codigo]){
    return {setor:{codigo:'TRE-AC',nome:'Tribunal Regional Eleitoral do Acre'},codigo,nome:SETORES_CONVIDADOS[codigo]};
  }
  return null;
}

function contagemDocumentosUnidade(codigo){
  return docs.filter(doc=>(doc.unidade || doc.gestorSetor)===codigo).length;
}

function documentoPertenceUnidadeSelecionada(doc){
  if(!unidadeSelecionadaDocumentos) return true;
  if(unidadeSelecionadaDocumentos==='SEM_UNIDADE') return !doc.unidade;
  if(unidadeSelecionadaDocumentos.startsWith('SETOR:')){
    const codigoSetor=unidadeSelecionadaDocumentos.slice(6);
    if(codigoSetor==='TODAS') return Boolean(doc.unidade || doc.gestorSetor);
    const codigoDocumento=doc.unidade || doc.gestorSetor;
    const contexto=localizarUnidadeDocumento(codigoDocumento);
    return contexto?.setor.codigo===codigoSetor;
  }
  return (doc.unidade || doc.gestorSetor)===unidadeSelecionadaDocumentos;
}

function renderSetoresDocumentos(){
  const grade=document.getElementById('documentos-setores-grid');
  if(!grade) return;
  const setoresAtivos=new Map();
  docs.forEach(doc=>{
    const codigo=doc.unidade || doc.gestorSetor;
    if(!codigo) return;
    const contexto=localizarUnidadeDocumento(codigo);
    if(!contexto) return;
    const chave=contexto.setor.codigo;
    const atual=setoresAtivos.get(chave) || {setor:contexto.setor,quantidade:0,unidades:new Set()};
    atual.quantidade++;
    atual.unidades.add(codigo);
    setoresAtivos.set(chave,atual);
  });
  if(!setoresAtivos.size){
    grade.innerHTML='<div class="documentos-setores-vazio"><strong>Nenhuma unidade para acompanhar</strong><span>Cadastre o primeiro documento e escolha sua unidade responsável. Ela aparecerá aqui automaticamente.</span><button type="button" onclick="setTab(\'cadastro\'); selecionarModoCadastro(\'documento\')">Cadastrar documento</button></div>';
    return;
  }
  const totalDocumentos=[...setoresAtivos.values()].reduce((total,item)=>total+item.quantidade,0);
  const cardTodas=`<button type="button" class="reuniao-tipo-btn documento-unidade-opcao documento-todas-unidades" onclick="abrirUnidadeDocumentos('SETOR:TODAS')">
    <strong>Todas as unidades</strong>
    <span>Visão geral dos documentos cadastrados</span>
    <em>${totalDocumentos} documento${totalDocumentos===1?'':'s'}</em>
  </button>`;
  grade.innerHTML=cardTodas+[...setoresAtivos.values()].map(({setor,quantidade})=>
    `<button type="button" class="reuniao-tipo-btn documento-unidade-opcao" onclick="abrirUnidadeDocumentos('SETOR:${escapeHtml(setor.codigo)}')">
      <span class="documento-unidade-identificacao"><strong>${escapeHtml(setor.codigo)}</strong><span>${escapeHtml(setor.nome)}</span></span>
      <em>${quantidade} documento${quantidade===1?'':'s'}</em>
    </button>`
  ).join('');
}

function abrirUnidadeDocumentos(codigo){
  const contexto=localizarUnidadeDocumento(codigo);
  if(!contexto) return;
  setorSelecionadoDocumentos=contexto.setor.codigo;
  unidadeSelecionadaDocumentos=contexto.codigo;
  document.getElementById('documentos-setores-view')?.classList.add('oculto');
  document.getElementById('documentos-acompanhamento')?.classList.remove('oculto');
  definirContextoDocumentos();
  paginaAtual=1;
  filtrosAnteriores='';
  render();
}

function definirContextoDocumentos(){
  const contexto=localizarUnidadeDocumento(unidadeSelecionadaDocumentos);
  if(!contexto) return;
  const breadcrumb=document.getElementById('documentos-breadcrumb');
  const titulo=document.getElementById('documentos-lista-titulo');
  if(breadcrumb) breadcrumb.textContent=contexto.setor.codigo==='TODAS' ? 'Visão geral' : 'Unidade selecionada';
  if(titulo) titulo.textContent=contexto.setor.codigo==='TODAS' ? 'Documentos de todas as unidades' : `${contexto.setor.codigo} — ${contexto.setor.nome}`;
}

function voltarParaSetoresDocumentos(){
  unidadeSelecionadaDocumentos='';
  setorSelecionadoDocumentos='';
  document.getElementById('documentos-acompanhamento')?.classList.add('oculto');
  document.getElementById('documentos-setores-view')?.classList.remove('oculto');
  renderSetoresDocumentos();
}

function prepararRelatorioDocumentosFiltrados(){
  const itens=obterDocumentosVisiveis();
  if(!itens.length){
    toast('Não há documentos para exportar com os filtros selecionados.','alerta');
    return;
  }
  if(typeof relatorioSelecao!=='undefined') relatorioSelecao.documentos=new Set(itens.map(item=>item.id));
  abrirRelatorio('documentos');
  const copiarFiltro=(origem,destino,transformar=valor=>valor)=>{
    const campoDestino=document.getElementById(destino);
    if(campoDestino) campoDestino.value=transformar(document.getElementById(origem)?.value || '');
  };
  copiarFiltro('busca-nome','relatorio-doc-busca');
  copiarFiltro('filtro-status','relatorio-doc-status',valor=>valor==='todos'?'':valor);
  copiarFiltro('filtro-tipo','relatorio-doc-tipo');
  copiarFiltro('filtro-ano','relatorio-doc-ano');
}

document.addEventListener('DOMContentLoaded',()=>{
  if(typeof configurarBuscaSetor==='function'){
    configurarBuscaSetor('f-gestor-setor','f-gestor-setor-sugestoes');
    configurarBuscaSetor('edit-gestor-setor','edit-gestor-setor-sugestoes');
  }
  renderSetoresDocumentos();
});
