import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, RefreshCw, LogOut, CheckCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

export default function Enfermeiro() {
  const [, setLocation] = useLocation();
  const predioDaLogin = localStorage.getItem("enfermeiroPredio") as "UPA" | "HOB" | null;
  const [selectedPredio, setSelectedPredio] = useState<string>(predioDaLogin || "todos");
  const [isLoading, setIsLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{
    type: "success" | "error";
    count: number;
    timestamp: string;
  } | null>(null);

  const alteracoesQuery = trpc.alteracoes.list.useQuery();
  const lastSyncQuery = trpc.alteracoes.getLastSync.useQuery();
  const syncMutation = trpc.alteracoes.sync.useMutation();
  const logoutMutation = trpc.auth.logout.useMutation();

  // Atualizar lista a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      alteracoesQuery.refetch();
      lastSyncQuery.refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Limpar mensagem após 5 segundos
  useEffect(() => {
    if (syncMessage) {
      const timer = setTimeout(() => setSyncMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [syncMessage]);

  // Definir prédio automaticamente ao carregar
  useEffect(() => {
    if (predioDaLogin) {
      setSelectedPredio(predioDaLogin);
    }
  }, [predioDaLogin]);

  const handleAtualizar = async () => {
    setIsLoading(true);
    try {
      const result = await syncMutation.mutateAsync();
      setSyncMessage({
        type: result.success ? "success" : "error",
        count: result.count || 0,
        timestamp: new Date().toLocaleTimeString("pt-BR"),
      });
      await alteracoesQuery.refetch();
      await lastSyncQuery.refetch();
    } catch (error) {
      console.error("Erro ao sincronizar:", error);
      setSyncMessage({
        type: "error",
        count: 0,
        timestamp: new Date().toLocaleTimeString("pt-BR"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSair = async () => {
    try {
      await logoutMutation.mutateAsync();
      setLocation("/");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  // Obter lista de prédios únicos
  const prediosSet = new Set<string>();
  (alteracoesQuery.data || []).forEach((a) => prediosSet.add(a.predio));
  const predios = ["todos", ...Array.from(prediosSet)];

  // Filtrar alterações
  const alteracoesFiltradas =
    selectedPredio === "todos"
      ? alteracoesQuery.data || []
      : (alteracoesQuery.data || []).filter((a) => a.predio === selectedPredio);

  // Determinar imagem de fundo baseada no prédio
  const backgroundImage = predioDaLogin === "UPA" ? "/upa-bg.jpg" : "/ps-bg.jpg";

  return (
    <div 
      className="min-h-screen relative"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Overlay com transparência */}
      <div className="absolute inset-0 bg-orange-50/70"></div>
      
      {/* Conteúdo com posicionamento relativo */}
      <div className="relative z-10">
        {/* Header */}
        <div className="bg-white border-b border-orange-200 py-4 px-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Hospital"
                className="h-12"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Quadro de Avisos
                </h1>
                <p className="text-sm text-gray-600">Alterações na escala.</p>
              </div>
            </div>
            <Button
              onClick={handleSair}
              className="bg-orange-600 hover:bg-orange-700 text-white flex gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="max-w-6xl mx-auto p-4">
          {/* Alerta */}
          <Card className="mb-6 bg-orange-50 border-orange-200 p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-orange-900">
                  Informações sobre alterações na escala.
                </h3>
                <p className="text-sm text-orange-800 mt-1">
                  Este quadro exibe as alterações realizadas nas escalas de finais
                  de semana. Os dados são sincronizados automaticamente.
                </p>
              </div>
            </div>
          </Card>

          {/* Filtros */}
          {!predioDaLogin && (
            <div className="mb-6 flex flex-wrap gap-2">
              {predios.map((predio) => (
                <Button
                  key={predio}
                  onClick={() => setSelectedPredio(predio)}
                  variant={selectedPredio === predio ? "default" : "outline"}
                  className={
                    selectedPredio === predio
                      ? "bg-orange-600 hover:bg-orange-700 text-white"
                      : "border-orange-200 text-orange-600 hover:bg-orange-50"
                  }
                >
                {predio === "todos"
                  ? `Todas as Unidades (${alteracoesQuery.data?.length || 0})`
                  : `${predio} (${(alteracoesQuery.data || []).filter((a) => a.predio === predio).length})`}
                </Button>
              ))}
            </div>
          )}
          {predioDaLogin && (
            <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700 font-medium">Visualizando apenas alterações de: <strong>{predioDaLogin}</strong></p>
            </div>
          )}

          {/* Info + Botão */}
          <div className="mb-6 bg-white rounded-lg border border-orange-200 p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-sm text-gray-600">
                  Última atualização:{" "}
                  <span className="font-semibold text-gray-900">
                    {lastSyncQuery.data?.lastSync
                      ? new Date(lastSyncQuery.data.lastSync).toLocaleString(
                          "pt-BR"
                        )
                      : "Nunca"}
                  </span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Total de alterações: {alteracoesFiltradas.length}
                </p>
              </div>
              <Button
                onClick={handleAtualizar}
                disabled={isLoading}
                className="bg-orange-600 hover:bg-orange-700 text-white flex gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                Atualizar
              </Button>
            </div>

            {/* Mensagem de Sincronização - Menor e Integrada */}
            {syncMessage && (
              <div
                className={`flex items-center gap-2 p-2 rounded text-sm ${
                  syncMessage.type === "success"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                <span>
                  {syncMessage.type === "success"
                    ? `Dados sincronizados: ${syncMessage.count} registro${syncMessage.count !== 1 ? "s" : ""}`
                    : "Erro ao sincronizar"}
                </span>
              </div>
            )}
          </div>

          {/* Tabela */}
          {alteracoesFiltradas.length > 0 ? (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-orange-100 border-b border-orange-200">
                    <tr>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                        Data
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                        Prédio
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                        Setor
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                        Ausência
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                        Reposição
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                        Observações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {alteracoesFiltradas.map((alt, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-orange-100 hover:bg-orange-50"
                      >
                        <td className="px-4 py-3 text-sm text-gray-900 text-center">
                          {typeof alt.data === "string"
                            ? alt.data
                            : new Date(alt.data).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          <span className={`px-2 py-1 rounded font-medium ${
                            alt.predio === 'UPA' 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-orange-100 text-orange-700'
                          }`}>
                            {alt.predio}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-center">
                          {alt.setor}
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          <span className="inline-block px-3 py-1 bg-red-50 text-red-700 rounded-md font-medium border border-red-200">
                            {alt.sai}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          <span className="inline-block px-3 py-1 bg-green-50 text-green-700 rounded-md font-medium border border-green-200">
                            {alt.entra}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-center">
                          {alt.observacoes}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <Card className="p-8 text-center bg-white">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="text-lg font-semibold text-gray-900">
                O cenário permanece inalterado.
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Favor contatar o responsável de referência em caso de dúvidas.
              </p>
            </Card>
          )}

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-gray-600 pb-4">
            <p>Sincronização automática a cada 30 segundos</p>
          </div>
        </div>
      </div>
    </div>
  );
}
