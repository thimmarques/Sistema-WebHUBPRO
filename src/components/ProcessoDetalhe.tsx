import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProcessos } from '../hooks/useProcessos';
import { ProcessoGeralTab } from './tabs/ProcessoGeralTab';
import { ProcessoMovimentacoesTab } from './tabs/ProcessoMovimentacoesTab';
import { ProcessoPrazosTab } from './tabs/ProcessoPrazosTab';
import { ProcessoCustasTab, ProcessoDocumentosTab } from './index';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { ArrowLeft, Edit2, Trash2 } from 'lucide-react';

interface ProcessoDetalheProps {
  processoId?: string;
  onBack?: () => void;
}

export function ProcessoDetalhe({ processoId: propId, onBack: propOnBack }: ProcessoDetalheProps) {
  const { id: paramId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { processos } = useProcessos();

  const id = propId || paramId;
  const processo = processos.find(p => p.id === id);

  const handleBack = () => {
    if (propOnBack) {
      propOnBack();
    } else {
      navigate('/processos');
    }
  };

  if (!processo) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={handleBack} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div className="text-center py-12">
          <p className="text-gray-600">Processo não encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Button variant="ghost" onClick={handleBack} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar
      </Button>

      <Card className="p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">{processo.numero_cnj}</h1>
            <p className="text-gray-600">{processo.polo_ativo_nome} vs {processo.polo_passivo_nome}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Edit2 className="w-4 h-4 mr-2" />
              Editar
            </Button>
            <Button variant="destructive" size="sm">
              <Trash2 className="w-4 h-4 mr-2" />
              Deletar
            </Button>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="geral" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="movimentacoes">Movimentações</TabsTrigger>
          <TabsTrigger value="prazos">Prazos</TabsTrigger>
          <TabsTrigger value="custas">Custas</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="mt-6">
          <ProcessoGeralTab processo={processo} />
        </TabsContent>

        <TabsContent value="movimentacoes" className="mt-6">
          <ProcessoMovimentacoesTab processo={processo} />
        </TabsContent>

        <TabsContent value="prazos" className="mt-6">
          <ProcessoPrazosTab processo={processo} />
        </TabsContent>

        <TabsContent value="custas" className="mt-6">
          <ProcessoCustasTab processo={processo} />
        </TabsContent>

        <TabsContent value="documentos" className="mt-6">
          <ProcessoDocumentosTab processo={processo} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
