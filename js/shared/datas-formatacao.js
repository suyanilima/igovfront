/* ===== DATAS E FORMATAÇÃO COMPARTILHADA ===== */

const TYPE_INITIALS = { Projeto:'PJ', Plano:'PL', Planilha:'PN', Processo:'PC', Normativo:'NR', 'Sem normativo':'--' };

// Prazos de validade disponíveis no cadastro e seus respectivos períodos de alerta
const VALIDADE_LABELS = new Proxy({ '6m':'6 meses' }, {
  get(alvo, validade){
    if(validade in alvo) return alvo[validade];
    const anos = obterAnosValidade(validade);
    return anos ? `${anos} ano${anos === 1 ? '' : 's'}` : '';
  }
});

function obterAnosValidade(validade){
  const correspondencia = String(validade || '').match(/^(\d{1,2})(?:a)?$/);
  const anos = correspondencia ? Number(correspondencia[1]) : 0;
  return Number.isInteger(anos) && anos >= 1 && anos <= 99 ? anos : 0;
}

function normalizarValidadeAnos(validade){
  const anos = obterAnosValidade(validade);
  return anos ? `${anos}a` : '';
}

// Rótulos exibidos para cada status (o token interno 'Alerta' aparece como "A vencer")
const STATUS_LABELS = { Vigente:'Vigente', Alerta:'A vencer', Vencido:'Vencido' };
function statusLabel(status){ return STATUS_LABELS[status] || status; }

function uid(){
  return globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,9)}`;
}

function todayStr(){
  const d = new Date();
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}

function diffDias(dataStr){
  const hoje = new Date(); hoje.setHours(0,0,0,0);
  const alvo = new Date(dataStr+'T00:00:00');
  return Math.round((alvo - hoje) / 86400000);
}

function formatarNomeProprio(valor){
  const palavrasMinusculas = [
    'da', 'das', 'de', 'do', 'dos', 'e'
  ];

  return valor
    .toLowerCase()
    .split(/\s+/)
    .map((palavra, indice) => {
      if(indice > 0 && palavrasMinusculas.includes(palavra)){
        return palavra;
      }

      return palavra.charAt(0).toUpperCase() + palavra.slice(1);
    })
    .join(' ');
}

function formatarMaiusculo(valor){
  return valor.toUpperCase();
}

function formatarEmail(valor){
  return valor.toLowerCase().replace(/\s/g, '');
}

function formatarSomenteNumeros(valor){
  return String(valor || '').replace(/\D/g, '').slice(0, LIMITES_CAMPOS.sei);
}

const SUFIXO_SEI = '6018000';
const TAMANHO_PARTE_VARIAVEL_SEI = 13;

function obterParteVariavelSei(valor){
  const numeros = formatarSomenteNumeros(valor);
  return numeros.slice(0, TAMANHO_PARTE_VARIAVEL_SEI);
}

function normalizarNumeroSei(valor){
  const parteVariavel = obterParteVariavelSei(valor);
  return parteVariavel.length === TAMANHO_PARTE_VARIAVEL_SEI
    ? parteVariavel + SUFIXO_SEI
    : parteVariavel;
}

function formatarNumeroSei(valor){
  const numeros = obterParteVariavelSei(valor);
  let resultado = numeros.slice(0, 7);
  if(numeros.length > 7) resultado += `-${numeros.slice(7, 9)}`;
  if(numeros.length > 9) resultado += `.${numeros.slice(9, 13)}`;
  if(numeros.length === TAMANHO_PARTE_VARIAVEL_SEI) resultado += '.6.01.8000';
  return resultado;
}

function numeroSeiValido(valor){
  return obterParteVariavelSei(valor).length === TAMANHO_PARTE_VARIAVEL_SEI;
}

function formatarTelefone(valor){
  const numeros = valor.replace(/\D/g, '').slice(0, 11);

  if(numeros.length <= 2){
    return numeros.length
      ? `(${numeros}`
      : '';
  }

  if(numeros.length <= 7){
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
  }

  return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
}

function primeiraLetraMaiuscula(valor){
  const texto = valor.trimStart();

  if(!texto) return '';

  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// Calcula a data de vencimento a partir da data de vigência (última renovação) + prazo de validade
function calcularVencimento(dataVigencia, validade){
  const meses = validade === '6m' ? 6 : (obterAnosValidade(validade) || 1) * 12;
  return somarMeses(dataVigencia, meses);
}

// "Prazo?" -> Vigente | Próximo do vencimento (Alerta) | Vencido
// Recebe o documento completo para poder calcular o início do alerta conforme seu prazo de validade
function calcularStatus(doc){
  if(doc && typeof doc === 'object' && (doc.semNormativo || doc.tipo === 'Sem normativo')) return null;
  const dataStr = (doc && typeof doc === 'object') ? doc.data : doc;
  const d = diffDias(dataStr);
  if(d < 0) return 'Vencido';

  // Documentos com prazo de validade definido: alerta calculado a partir do vencimento
  if(doc && typeof doc === 'object' && doc.validade){
    const mesesAlerta = doc.validade === '6m' ? 3 : 6;
    const inicioAlerta = somarMeses(dataStr, -mesesAlerta);
    if(diffDias(inicioAlerta) <= 0) return 'Alerta';
    return 'Vigente';
  }

  // Compatibilidade com documentos antigos (sem prazo de validade cadastrado)
  if(d <= 90) return 'Alerta';
  return 'Vigente';
}

function fmtData(dataStr){
  if(!dataStr) return '-';
  const [y,m,d] = dataStr.split('-');
  return `${d}/${m}/${y}`;
}

function fmtDias(dataStr){
  const d = diffDias(dataStr);
  if(d < 0) return `venceu há ${Math.abs(d)} dia${Math.abs(d)===1?'':'s'}`;
  if(d === 0) return 'vence hoje';
  return `em ${d} dia${d===1?'':'s'}`;
}

// Total de dias de validade do documento (da data de vigência até o vencimento calculado)
function fmtValidoPor(doc){
  if(!doc.dataVigencia && !doc.dataCriacao) return '';
  const inicio = doc.dataVigencia || doc.dataCriacao;
  const dias = Math.round((new Date(doc.data+'T00:00:00') - new Date(inicio+'T00:00:00')) / 86400000);
  if(dias <= 0) return '';
  return `Válido por ${dias} dia${dias===1?'':'s'}`;
}

