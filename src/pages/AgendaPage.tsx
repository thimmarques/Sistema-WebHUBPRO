import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, AlertCircle } from 'lucide-react';
import { useEventos } from '@/hooks/useEventos';
import { Evento } from '@/types/evento';

export function AgendaPage() {
  const { eventos, loading, error } = useEventos();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  // Usa data_inicio como campo principal do Evento
  const getEventosForDate = (day: number): Evento[] => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      .toISOString()
      .split('T')[0];
    return eventos.filter((e) => {
      const eventDate = (e.data_inicio || e.data || '').split('T')[0];
      return eventDate === dateStr;
    });
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Eventos próximos 30 dias
  const proximosEventos = eventos
    .filter((e) => {
      const eventDate = new Date(e.data_inicio || e.data || '');
      const today = new Date();
      const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      return eventDate >= today && eventDate <= thirtyDaysFromNow;
    })
    .sort(
      (a, b) =>
        new Date(a.data_inicio || a.data || '').getTime() -
        new Date(b.data_inicio || b.data || '').getTime()
    );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando agenda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Agenda</h1>
            <p className="text-gray-600 mt-2">Calendário de eventos e prazos</p>
          </div>
          <div className="flex gap-2">
            {(['month', 'week', 'day'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-2 rounded-lg font-medium text-sm ${
                  viewMode === mode
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {mode === 'month' ? 'Mês' : mode === 'week' ? 'Semana' : 'Dia'}
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Calendário - Visão Mensal */}
        {viewMode === 'month' && (
          <div className="bg-white rounded-lg shadow">
            {/* Navegação */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 rounded-lg">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-semibold text-gray-900">
                {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </h2>
              <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 rounded-lg">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Cabeçalho com dias da semana */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                  <div key={day} className="text-center font-semibold text-gray-500 text-sm py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Grid de dias */}
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}

                {days.map((day) => {
                  const dayEventos = getEventosForDate(day);
                  const isToday =
                    new Date().getDate() === day &&
                    new Date().getMonth() === currentDate.getMonth() &&
                    new Date().getFullYear() === currentDate.getFullYear();

                  return (
                    <div
                      key={day}
                      className={`aspect-square border rounded-lg p-1.5 hover:bg-blue-50 cursor-pointer transition ${
                        isToday
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <p
                        className={`text-xs font-semibold mb-1 ${
                          isToday ? 'text-blue-600' : 'text-gray-700'
                        }`}
                      >
                        {day}
                      </p>
                      <div className="space-y-0.5">
                        {dayEventos.slice(0, 2).map((evento) => (
                          <div
                            key={evento.id}
                            className="text-xs bg-blue-100 text-blue-800 rounded px-1 py-0.5 truncate"
                            title={evento.title || evento.tipo}
                          >
                            {evento.title || evento.tipo}
                          </div>
                        ))}
                        {dayEventos.length > 2 && (
                          <p className="text-xs text-gray-400">+{dayEventos.length - 2} mais</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Visão Semanal / Diária - Placeholder */}
        {(viewMode === 'week' || viewMode === 'day') && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              Visão por {viewMode === 'week' ? 'semana' : 'dia'} em desenvolvimento.
            </p>
          </div>
        )}

        {/* Lista de Próximos Eventos */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">
            Próximos Eventos (30 dias)
          </h3>
          {proximosEventos.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">
              Nenhum evento nos próximos 30 dias.
            </p>
          ) : (
            <div className="space-y-3">
              {proximosEventos.map((evento) => (
                <div
                  key={evento.id}
                  className="flex items-start gap-4 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {evento.title || evento.tipo}
                    </p>
                    {evento.descricao && (
                      <p className="text-sm text-gray-600 truncate">{evento.descricao}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(evento.data_inicio || evento.data || '').toLocaleDateString('pt-BR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                      {evento.hora_inicio ? ` às ${evento.hora_inicio}` : ''}
                    </p>
                  </div>
                  <span className="flex-shrink-0 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                    {evento.tipo}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
