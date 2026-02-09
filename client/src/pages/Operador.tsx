import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, LogOut, AlertCircle, Check, Plus, Edit2, Trash2, Calendar } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface Operador {
  id: number;
  usuario: string;
  nome: string;
  role: string;
}

interface Alteracao {
  id: number;
  data: string;
  predio: string;
  setor: string;
  sai: string;
  entra: string;
  motivo?: string | null | undefined;
  observacoes?: string | null | undefined;
  criadoPor?: string | null | undefined;
  editadoPor?: string | null | undefined;
  createdAt?: Date;
  updatedAt?: Date;
}

export default function Operador() {
  const [, setLocation] = useLocation();
  const [operador, setOperador] = useState<Operador | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [minhasAlteracoes, setMinhasAlteracoes] = useState<Alteracao[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Form states
  const [data, setData] = useState("");
  const [predio, setPredio] = useState("");
  const [setor, setSetor] = useState("");
  const [sai, setSai] = useState("");
  const [entra, setEntra] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const insertMutation = trpc.operadores.inserirComAudit.useMutation();
  const editMutation = trpc.operadores.editarMeu.useMutation();
  const deleteMutation = trpc.operadores.deletarMeu.useMutation();
  const minhasQuery = trpc.operadores.minhas.useQuery(
    { operadorUsuario: operador?.usuario || "" },
    { enabled: !!operador }
  );

  useEffect(() => {
    const token = localStorage.getItem("operadorToken");
    if (!token) {
      setLocation("/operador-login");
    } else {
      try {
        const operadorData = JSON.parse(token);
        setOperador(operadorData);
        setIsLoading(false);
      } catch (error) {
        localStorage.removeItem("operadorToken");
        setLocation("/operador-login");
      }
    }
  }, [setLocation]);

  useEffect(() => {
    if (minhasQuery.data) {
      setMinhasAlteracoes(minhasQuery.data);
    }
  }, [minhasQuery.data]);

  const handleLogout = () => {
    localStorage.removeItem("operadorToken");
    setLocation("/");
  };

  const handleEdit = (alteracao: Alteracao) => {
    setEditingId(alteracao.id);
    setData(alteracao.data);
    setPredio(alteracao.predio);
    setSetor(alteracao.setor);
    setSai(alteracao.sai);
    setEntra(alteracao.entra);
    setObservacoes(alteracao.observacoes || "");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setData("");
    setPredio("");
    setSetor("");
    setSai("");
    setEntra("");
    setObservacoes("");
    setShowDatePicker(false);
  };

  const handleDateSelect = (date: Date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    setData(`${day}/${month}/${year}`);
    setShowDatePicker(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!data || !predio || !setor || !sai || !entra) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }

    if (editingId) {
      // Editar registro existente
      await editMutation.mutateAsync({
        id: editingId,
        operadorUsuario: operador!.usuario,
        data: {
          data,
          predio,
          setor,
          sai,
          entra,
          observacoes,
        },
      });
    } else {
      // Inserir novo registro
      await insertMutation.mutateAsync({
        data,
        predio,
        setor,
        sai,
        entra,
        motivo: sai.split(" ").slice(1).join(" ") || "",
        observacoes,
        operadorUsuario: operador!.usuario,
      });
    }

    // Limpar formulário
    handleCancelEdit();
    // Recarregar dados
    minhasQuery.refetch();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja deletar este registro?")) return;

    await deleteMutation.mutateAsync({
      id,
      operadorUsuario: operador!.usuario,
    });

    minhasQuery.refetch();
  };

  // Gerar calendário para o date picker
  const generateCalendar = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Preencher dias vazios do mês anterior
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Preencher dias do mês atual
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  const calendarDays = generateCalendar();
  const monthName = new Date().toLocaleString("pt-BR", { month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Painel do Operador</h1>
            <p className="text-gray-600 mt-1">Bem-vindo, {operador?.nome}</p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>

        {/* Form Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{editingId ? "Editar Alteração" : "Inserir Nova Alteração"}</CardTitle>
            <CardDescription>
              Preencha os dados da alteração de escala
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Date Picker */}
                <div className="relative">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Data (DD/MM/YYYY)"
                      value={data}
                      onChange={(e) => setData(e.target.value)}
                      required
                      readOnly
                      className="cursor-pointer"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowDatePicker(!showDatePicker)}
                      className="px-3"
                    >
                      <Calendar className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Calendar Popup */}
                  {showDatePicker && (
                    <div className="absolute top-12 left-0 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50">
                      <div className="mb-3 text-center font-semibold text-gray-700">
                        {monthName}
                      </div>
                      <div className="grid grid-cols-7 gap-1 mb-3">
                        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"].map((day) => (
                          <div key={day} className="w-8 h-8 flex items-center justify-center text-xs font-bold text-gray-500">
                            {day}
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((day, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => day && handleDateSelect(day)}
                            disabled={!day}
                            className={`w-8 h-8 text-sm rounded ${
                              day
                                ? "hover:bg-blue-500 hover:text-white cursor-pointer"
                                : "text-gray-300 cursor-not-allowed"
                            }`}
                          >
                            {day?.getDate()}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Input
                  placeholder="Prédio"
                  value={predio}
                  onChange={(e) => setPredio(e.target.value)}
                  required
                />
                <Input
                  placeholder="Setor"
                  value={setor}
                  onChange={(e) => setSetor(e.target.value)}
                  required
                />
                <Input
                  placeholder="Sai (Nome Profissional)"
                  value={sai}
                  onChange={(e) => setSai(e.target.value)}
                  required
                />
                <Input
                  placeholder="Entra (Nome Profissional)"
                  value={entra}
                  onChange={(e) => setEntra(e.target.value)}
                  required
                />
                <Input
                  placeholder="Observações"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  <Plus className="w-4 h-4 mr-2" />
                  {editingId ? "Atualizar" : "Inserir"}
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={handleCancelEdit}>
                    Cancelar
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Minhas Alterações */}
        <Card>
          <CardHeader>
            <CardTitle>Minhas Alterações</CardTitle>
            <CardDescription>
              Registros que você criou ou editou
            </CardDescription>
          </CardHeader>
          <CardContent>
            {minhasAlteracoes.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Nenhuma alteração criada por você ainda.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left py-2 px-2">Data</th>
                      <th className="text-left py-2 px-2">Prédio</th>
                      <th className="text-left py-2 px-2">Setor</th>
                      <th className="text-left py-2 px-2">Sai</th>
                      <th className="text-left py-2 px-2">Entra</th>
                      <th className="text-left py-2 px-2">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {minhasAlteracoes.map((alt) => (
                      <tr key={alt.id} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-2">{alt.data}</td>
                        <td className="py-2 px-2">{alt.predio}</td>
                        <td className="py-2 px-2">{alt.setor}</td>
                        <td className="py-2 px-2 text-xs">{alt.sai}</td>
                        <td className="py-2 px-2 text-xs">{alt.entra}</td>
                        <td className="py-2 px-2 flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(alt)}
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(alt.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
