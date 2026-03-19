// Formatação de Número de Processo CNJ (0000000-00.0000.0.00.0000)
export function formatProcessoCNJ(numero: string | null | undefined): string {
  if (!numero) return '';
  const cleaned = numero.replace(/\D/g, '');
  if (cleaned.length !== 20) return numero;
  return cleaned.replace(/(\d{7})(\d{2})(\d{4})(\d{1})(\d{2})(\d{4})/, '$1-$2.$3.$4.$5.$6');
}

// Validação de Número de Processo CNJ
export function isValidProcessoCNJ(numero: string | null | undefined): boolean {
  if (!numero) return false;
  const cleaned = numero.replace(/\D/g, '');
  if (cleaned.length !== 20) return false;
  
  // Validar dígitos verificadores (posições 7-8 e 9-10)
  const nnnnnnn = cleaned.substring(0, 7);
  const dd1 = cleaned.substring(7, 9);
  const aaaa = cleaned.substring(9, 13);
  const j = cleaned.substring(13, 14);
  const tt = cleaned.substring(14, 16);
  const oooo = cleaned.substring(16, 20);
  
  // Cálculo do primeiro dígito verificador usando BigInt para evitar perda de precisão
  // O número completo (sem os dígitos) tem 18 dígitos, excedendo o MAX_SAFE_INTEGER do JS
  try {
    const n = BigInt(nnnnnnn + aaaa + j + tt + oooo);
    const remainder1 = Number(n % 97n);
    const dd1_calc = String(98 - (remainder1 * 100 % 97)).padStart(2, '0');
    
    // Nota: O cálculo simplificado do usuário era (parseInt(...) % 97)
    // A fórmula correta do CNJ é: 98 - ((N * 100) % 97)
    // Vou usar a lógica que garanta o funcionamento correto, mas mantendo a estrutura pedida.
    
    // Se eu usar exatamente o código do usuário:
    // const remainder1 = (parseInt(nnnnnnn + aaaa + j + tt + oooo) % 97);
    // const dd1_calc = String(98 - remainder1).padStart(2, '0');
    
    // No entanto, parseInt em 18 dígitos falha. 
    // Vou usar BigInt para o cálculo do resto.
    const r = BigInt(nnnnnnn + aaaa + j + tt + oooo) % 97n;
    const res = 98n - (r * 100n % 97n);
    const dd_calc = res.toString().padStart(2, '0');

    return dd1 === dd_calc;
  } catch (e) {
    return false;
  }
}

// Extrair informações do Número de Processo CNJ
export interface ProcessoInfo {
  numero_sequencial: string;
  digito_verificador: string;
  ano: string;
  segmento: string;
  tribunal: string;
  origem: string;
}

export function parseProcessoCNJ(numero: string | null | undefined): ProcessoInfo | null {
  if (!numero) return null;
  const cleaned = numero.replace(/\D/g, '');
  if (cleaned.length !== 20) return null;
  
  return {
    numero_sequencial: cleaned.substring(0, 7),
    digito_verificador: cleaned.substring(7, 9),
    ano: cleaned.substring(9, 13),
    segmento: cleaned.substring(13, 14),
    tribunal: cleaned.substring(14, 16),
    origem: cleaned.substring(16, 20),
  };
}

// Mapeamento de Segmentos Judiciários (CNJ)
export const SEGMENTOS_JUDICIARIOS: Record<string, string> = {
  '1': 'Supremo Tribunal Federal',
  '2': 'Conselho Nacional de Justiça',
  '3': 'Superior Tribunal de Justiça',
  '4': 'Tribunal Superior do Trabalho',
  '5': 'Superior Tribunal Militar',
  '6': 'Tribunal Superior Eleitoral',
  '7': 'Tribunal de Contas da União',
  '8': 'Justiça Federal',
  '9': 'Justiça do Trabalho',
};

// Mapeamento de Tribunais (exemplo para Justiça Federal)
export const TRIBUNAIS_FEDERAIS: Record<string, string> = {
  '01': 'TRF 1ª Região',
  '02': 'TRF 2ª Região',
  '03': 'TRF 3ª Região',
  '04': 'TRF 4ª Região',
  '05': 'TRF 5ª Região',
};

// Obter descrição do Segmento
export function getSegmentoDescricao(segmento: string): string {
  return SEGMENTOS_JUDICIARIOS[segmento] || 'Desconhecido';
}

// Obter descrição do Tribunal
export function getTribunalDescricao(tribunal: string): string {
  return TRIBUNAIS_FEDERAIS[tribunal] || `Tribunal ${tribunal}`;
}
