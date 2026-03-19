import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Cliente, Processo, Lancamento } from '../types';
import { formatDate, formatCurrency, formatCPF, formatCNPJ } from '../lib/formatters';
import { logExport } from './activityLogger';

export interface PDFConfig {
  titulo: string;
  tipo: 'procuracao' | 'contrato' | 'relatorio';
  cliente_id: string;
  usuario_id: string;
  data_geracao: string;
  incluir_watermark: boolean;
}

export interface PDFResult {
  sucesso: boolean;
  mensagem: string;
  arquivo?: Blob;
  nome_arquivo: string;
}

/**
 * Adiciona watermark ao PDF
 */
function addWatermark(pdf: jsPDF, texto: string): void {
  const pageCount = pdf.getNumberOfPages();
  const pageSize = pdf.internal.pageSize;
  const pageWidth = pageSize.getWidth();
  const pageHeight = pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setTextColor(200, 200, 200);
    pdf.setFontSize(40);
    pdf.text(texto, pageWidth / 2, pageHeight / 2, {
      align: 'center',
      angle: 45,
    });
  }

  pdf.setTextColor(0, 0, 0);
}

/**
 * Gera procuração em PDF
 */
export async function generateProcuracao(
  cliente: Cliente,
  config: PDFConfig
): Promise<PDFResult> {
  try {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;

    // Cabeçalho
    pdf.setFontSize(16);
    pdf.text('PROCURAÇÃO', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Dados do cliente
    pdf.setFontSize(11);
    pdf.text('OUTORGANTE:', 20, yPosition);
    yPosition += 7;

    const nomeCliente = cliente.nome;
    const documentoCliente = cliente.type === 'pf'
      ? `CPF: ${formatCPF(cliente.cpf)}`
      : `CNPJ: ${formatCNPJ(cliente.cnpj)}`;

    pdf.setFontSize(10);
    pdf.text(nomeCliente, 20, yPosition);
    yPosition += 7;
    pdf.text(documentoCliente, 20, yPosition);
    yPosition += 15;

    // Corpo da procuração
    pdf.setFontSize(11);
    pdf.text('OUTORGADO:', 20, yPosition);
    yPosition += 7;

    pdf.setFontSize(10);
    pdf.text('Advogado(a) designado(a) pelo escritório', 20, yPosition);
    yPosition += 15;

    // Poderes
    pdf.setFontSize(11);
    pdf.text('PODERES CONFERIDOS:', 20, yPosition);
    yPosition += 7;

    pdf.setFontSize(10);
    const poderes = [
      '• Representar em juízo e fora dele',
      '• Praticar atos processuais',
      '• Receber citações e intimações',
      '• Transigir e desistir de ações',
      '• Receber valores e dar quitação',
    ];

    poderes.forEach(poder => {
      pdf.text(poder, 20, yPosition);
      yPosition += 7;
    });

    yPosition += 10;

    // Rodapé
    pdf.setFontSize(10);
    pdf.text(`Gerado em: ${formatDate(config.data_geracao)}`, 20, pageHeight - 20);

    // Adicionar watermark se configurado
    if (config.incluir_watermark) {
      addWatermark(pdf, 'CÓPIA DIGITAL');
    }

    // Gerar blob
    const pdfBlob = pdf.output('blob');
    const nomeArquivo = `procuracao_${cliente.id}_${Date.now()}.pdf`;

    // Registrar em log de auditoria
    await logExport(config.usuario_id, 'procuracao', `Procuração gerada para cliente ${cliente.nome}`);

    return {
      sucesso: true,
      mensagem: 'Procuração gerada com sucesso',
      arquivo: pdfBlob,
      nome_arquivo: nomeArquivo,
    };
  } catch (error) {
    console.error('[PDF] Erro ao gerar procuração:', error);
    return {
      sucesso: false,
      mensagem: error instanceof Error ? error.message : 'Erro ao gerar procuração',
      nome_arquivo: '',
    };
  }
}

/**
 * Gera relatório de cliente em PDF
 */
export async function generateRelatorio(
  cliente: Cliente,
  processos: Processo[],
  lancamentos: Lancamento[],
  config: PDFConfig
): Promise<PDFResult> {
  try {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;

    // Cabeçalho
    pdf.setFontSize(16);
    pdf.text('RELATÓRIO DE CLIENTE', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Dados do cliente
    pdf.setFontSize(12);
    pdf.text('DADOS DO CLIENTE', 20, yPosition);
    yPosition += 8;

    pdf.setFontSize(10);
    pdf.text(`Nome: ${cliente.nome}`, 20, yPosition);
    yPosition += 6;

    const documento = cliente.type === 'pf'
      ? `CPF: ${formatCPF(cliente.cpf)}`
      : `CNPJ: ${formatCNPJ(cliente.cnpj)}`;
    pdf.text(documento, 20, yPosition);
    yPosition += 6;

    pdf.text(`Área: ${cliente.practice_area}`, 20, yPosition);
    yPosition += 6;

    pdf.text(`Status: ${cliente.status}`, 20, yPosition);
    yPosition += 6;

    pdf.text(`Cadastrado em: ${formatDate(cliente.created_at)}`, 20, yPosition);
    yPosition += 15;

    // Processos
    pdf.setFontSize(12);
    pdf.text(`PROCESSOS (${processos.length})`, 20, yPosition);
    yPosition += 8;

    pdf.setFontSize(10);
    if (processos.length === 0) {
      pdf.text('Nenhum processo cadastrado', 20, yPosition);
      yPosition += 6;
    } else {
      processos.slice(0, 5).forEach(processo => {
        pdf.text(`• ${processo.numero_cnj} - ${processo.status}`, 20, yPosition);
        yPosition += 6;
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = 20;
        }
      });
    }

    yPosition += 10;

    // Financeiro
    pdf.setFontSize(12);
    pdf.text('RESUMO FINANCEIRO', 20, yPosition);
    yPosition += 8;

    const totalReceitas = lancamentos
      .filter(l => l.tipo === 'receita')
      .reduce((sum, l) => sum + (l.valor || 0), 0);

    const totalDespesas = lancamentos
      .filter(l => l.tipo === 'despesa')
      .reduce((sum, l) => sum + (l.valor || 0), 0);

    const saldo = totalReceitas - totalDespesas;

    pdf.setFontSize(10);
    pdf.text(`Total de Receitas: ${formatCurrency(totalReceitas)}`, 20, yPosition);
    yPosition += 6;
    pdf.text(`Total de Despesas: ${formatCurrency(totalDespesas)}`, 20, yPosition);
    yPosition += 6;
    pdf.text(`Saldo: ${formatCurrency(saldo)}`, 20, yPosition);
    yPosition += 15;

    // Rodapé
    pdf.setFontSize(9);
    pdf.text(`Gerado em: ${formatDate(config.data_geracao)}`, 20, pageHeight - 20);

    // Adicionar watermark se configurado
    if (config.incluir_watermark) {
      addWatermark(pdf, 'CONFIDENCIAL');
    }

    // Gerar blob
    const pdfBlob = pdf.output('blob');
    const nomeArquivo = `relatorio_${cliente.id}_${Date.now()}.pdf`;

    // Registrar em log de auditoria
    await logExport(config.usuario_id, 'relatorio', `Relatório gerado para cliente ${cliente.nome}`);

    return {
      sucesso: true,
      mensagem: 'Relatório gerado com sucesso',
      arquivo: pdfBlob,
      nome_arquivo: nomeArquivo,
    };
  } catch (error) {
    console.error('[PDF] Erro ao gerar relatório:', error);
    return {
      sucesso: false,
      mensagem: error instanceof Error ? error.message : 'Erro ao gerar relatório',
      nome_arquivo: '',
    };
  }
}

/**
 * Gera contrato em PDF
 */
export async function generateContrato(
  cliente: Cliente,
  config: PDFConfig
): Promise<PDFResult> {
  try {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;

    // Cabeçalho
    pdf.setFontSize(16);
    pdf.text('CONTRATO DE PRESTAÇÃO DE SERVIÇOS JURÍDICOS', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Partes
    pdf.setFontSize(11);
    pdf.text('PARTES:', 20, yPosition);
    yPosition += 8;

    pdf.setFontSize(10);
    pdf.text('CONTRATANTE:', 20, yPosition);
    yPosition += 6;
    pdf.text(cliente.nome, 20, yPosition);
    yPosition += 6;

    const documento = cliente.type === 'pf'
      ? `CPF: ${formatCPF(cliente.cpf)}`
      : `CNPJ: ${formatCNPJ(cliente.cnpj)}`;
    pdf.text(documento, 20, yPosition);
    yPosition += 12;

    pdf.text('CONTRATADA:', 20, yPosition);
    yPosition += 6;
    pdf.text('Escritório de Advocacia', 20, yPosition);
    yPosition += 12;

    // Objeto
    pdf.setFontSize(11);
    pdf.text('OBJETO:', 20, yPosition);
    yPosition += 8;

    pdf.setFontSize(10);
    const textoObjeto = 'Prestação de serviços jurídicos na área de ' + cliente.practice_area;
    pdf.text(textoObjeto, 20, yPosition);
    yPosition += 15;

    // Cláusulas
    pdf.setFontSize(11);
    pdf.text('CLÁUSULAS:', 20, yPosition);
    yPosition += 8;

    pdf.setFontSize(10);
    const clausulas = [
      '1. O contratante autoriza a contratada a representá-lo em juízo e fora dele.',
      '2. Os honorários serão cobrados conforme tabela de preços vigente.',
      '3. O contratante se compromete a fornecer documentação necessária.',
      '4. Este contrato vigorará por tempo indeterminado.',
    ];

    clausulas.forEach(clausula => {
      pdf.text(clausula, 20, yPosition);
      yPosition += 8;
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        yPosition = 20;
      }
    });

    yPosition += 10;

    // Assinatura
    pdf.setFontSize(10);
    pdf.text('_________________________', 20, yPosition);
    yPosition += 6;
    pdf.text('Assinatura do Contratante', 20, yPosition);
    yPosition += 15;

    pdf.text('_________________________', 20, yPosition);
    yPosition += 6;
    pdf.text('Assinatura da Contratada', 20, yPosition);

    // Rodapé
    pdf.setFontSize(9);
    pdf.text(`Gerado em: ${formatDate(config.data_geracao)}`, 20, pageHeight - 20);

    // Adicionar watermark se configurado
    if (config.incluir_watermark) {
      addWatermark(pdf, 'RASCUNHO');
    }

    // Gerar blob
    const pdfBlob = pdf.output('blob');
    const nomeArquivo = `contrato_${cliente.id}_${Date.now()}.pdf`;

    // Registrar em log de auditoria
    await logExport(config.usuario_id, 'contrato', `Contrato gerado para cliente ${cliente.nome}`);

    return {
      sucesso: true,
      mensagem: 'Contrato gerado com sucesso',
      arquivo: pdfBlob,
      nome_arquivo: nomeArquivo,
    };
  } catch (error) {
    console.error('[PDF] Erro ao gerar contrato:', error);
    return {
      sucesso: false,
      mensagem: error instanceof Error ? error.message : 'Erro ao gerar contrato',
      nome_arquivo: '',
    };
  }
}

/**
 * Faz download do PDF no navegador
 */
export function downloadPDF(blob: Blob, nomeArquivo: string): void {
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nomeArquivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('[PDF] Erro ao fazer download:', error);
  }
}
