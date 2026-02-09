import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Loader2, Download, RefreshCw, LogOut, AlertCircle, Edit2, Trash2, X, Check, Lock, Plus } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Gestor() {
  const [, setLocation] = useLocation();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"alteracoes" | "operadores">("alteracoes");

  // Alterações states
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<any>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState("");
  const [senhaNova, setSenhaNova] = useState("");
  const [senhaNovaConfirm, setSenhaNovaConfirm] = useState("");

  // Operadores states
  const [showNovoOperador, setShowNovoOperador] = useState(false);
  const [novoOperador, setNovoOperador] = useState({ usuario: "", senha: "", nome: "", email: "" });
  const [editingOperadorId, setEditingOperadorId] = useState<number | null>(null);
  const [editingOperador, setEditingOperador] = useState<any>(null);
  const [showResetSenha, setShowResetSenha] = useState<number | null>(null);
  const [novaSenhaOperador, setNovaSenhaOperador] = useState("");

  // Queries
  const alteracoesQuery = trpc.alteracoes.list.useQuery();
  const syncMutation = trpc.alteracoes.sync.useMutation();
  const lastSyncQuery = trpc.alteracoes.getLastSync.useQuery();
  const deleteMutation = trpc.alteracoes.delete.useMutation();
  const updateMutation = trpc.alteracoes.update.useMutation();
  const changePasswordMutation = trpc.auth.changeGestorPassword.useMutation();

  // Operadores queries
  const operadoresQuery = trpc.operadores.list.useQuery();
  const createOperadorMutation = trpc.operadores.create.useMutation();
  const updateOperadorMutation = trpc.operadores.update.useMutation();
  const deleteOperadorMutation = trpc.operadores.delete.useMutation();

  useEffect(() => {
    const token = localStorage.getItem("gestorToken");
    if (!token) {
      setLocation("/");
    } else {
      setIsAuthorized(true);
      setIsLoading(false);
    }
  }, [setLocation]);

  // Alterações handlers
  const handleSync = async () => {
    await syncMutation.mutateAsync();
    alteracoesQuery.refetch();
    lastSyncQuery.refetch();
  };

  const handleLogout = () => {
    localStorage.removeItem("gestorToken");
    setLocation("/");
  };

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja apagar este registro?")) {
      await deleteMutation.mutateAsync({ id });
      alteracoesQuery.refetch();
    }
  };

  const handleEdit = (alt: any) => {
    setEditingId(alt.id);
    setEditData({ ...alt });
  };

  const handleSaveEdit = async () => {
    if (editingId && editData) {
      await updateMutation.mutateAsync({
        id: editingId,
        data: {
          data: editData.data,
          predio: editData.predio,
          setor: editData.setor,
          sai: editData.sai,
          entra: editData.entra,
          observacoes: editData.observacoes,
        },
      });
      setEditingId(null);
      setEditData(null);
      alteracoesQuery.refetch();
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData(null);
  };

  const handleChangePassword = async () => {
    if (senhaNova !== senhaNovaConfirm) {
      alert("As senhas não coincidem!");
      return;
    }

    if (senhaNova.length < 4) {
      alert("A nova senha deve ter pelo menos 4 caracteres!");
      return;
    }

    await changePasswordMutation.mutateAsync({
      senhaAtual,
      senhaNova,
    });

    if (changePasswordMutation.data?.success) {
      alert("Senha alterada com sucesso!");
      setShowChangePassword(false);
      setSenhaAtual("");
      setSenhaNova("");
      setSenhaNovaConfirm("");
    }
  };

  const downloadCSV = () => {
    if (!alteracoesQuery.data) return;

    const headers = ["Data", "Prédio", "Setor", "Sai", "Entra", "Motivo", "Observações"];
    const rows = alteracoesQuery.data.map((alt) => [
      alt.data,
      alt.predio,
      alt.setor,
      alt.sai,
      alt.entra,
      alt.motivo || "",
      alt.observacoes || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `historico-alteracoes-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Operadores handlers
  const handleCreateOperador = async () => {
    if (!novoOperador.usuario || !novoOperador.senha || !novoOperador.nome) {
      alert("Preencha todos os campos obrigatórios!");
      return;
    }

    await createOperadorMutation.mutateAsync(novoOperador);
    if (createOperadorMutation.data?.success) {
      setNovoOperador({ usuario: "", senha: "", nome: "", email: "" });
      setShowNovoOperador(false);
      operadoresQuery.refetch();
    }
  };

  const handleUpdateOperador = async () => {
    if (editingOperadorId && editingOperador) {
      await updateOperadorMutation.mutateAsync({
        id: editingOperadorId,
        data: {
          nome: editingOperador.nome,
          email: editingOperador.email,
          ativo: editingOperador.ativo,
        },
      });
      setEditingOperadorId(null);
      setEditingOperador(null);
      operadoresQuery.refetch();
    }
  };

  const handleDeleteOperador = async (id: number) => {
    if (confirm("Tem certeza que deseja deletar este operador?")) {
      await deleteOperadorMutation.mutateAsync({ id });
      operadoresQuery.refetch();
    }
  };

  const handleResetSenhaOperador = async (id: number) => {
    if (!novaSenhaOperador) {
      alert("Digite a nova senha!");
      return;
    }

    await updateOperadorMutation.mutateAsync({
      id,
      data: { senha: novaSenhaOperador },
    });

    if (updateOperadorMutation.data?.success) {
      alert("Senha alterada com sucesso!");
      setShowResetSenha(null);
      setNovaSenhaOperador("");
      operadoresQuery.refetch();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Hospital Metropolitano Odilson Behrens"
              className="h-10 object-contain"
            />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Painel do Administrador</h1>
              <p className="text-sm text-gray-600">Gerenciamento do Sistema</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowChangePassword(!showChangePassword)}
              variant="outline"
              className="text-blue-600 border-blue-300 hover:bg-blue-50"
            >
              <Lock className="mr-2 h-4 w-4" />
              Alterar Senha
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Change Password Card */}
        {showChangePassword && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-900">Alterar Senha de Acesso</CardTitle>
              <CardDescription>Defina uma nova senha para o acesso à Administração</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Senha Atual
                  </label>
                  <Input
                    type="password"
                    value={senhaAtual}
                    onChange={(e) => setSenhaAtual(e.target.value)}
                    placeholder="Digite a senha atual"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nova Senha
                  </label>
                  <Input
                    type="password"
                    value={senhaNova}
                    onChange={(e) => setSenhaNova(e.target.value)}
                    placeholder="Digite a nova senha"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar Nova Senha
                  </label>
                  <Input
                    type="password"
                    value={senhaNovaConfirm}
                    onChange={(e) => setSenhaNovaConfirm(e.target.value)}
                    placeholder="Confirme a nova senha"
                    className="w-full"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleChangePassword}
                    disabled={changePasswordMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {changePasswordMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Alterando...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Alterar Senha
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowChangePassword(false);
                      setSenhaAtual("");
                      setSenhaNova("");
                      setSenhaNovaConfirm("");
                    }}
                    variant="outline"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancelar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            onClick={() => setActiveTab("alteracoes")}
            className={activeTab === "alteracoes" ? "bg-orange-500 text-white" : "bg-white text-gray-700 border border-gray-300"}
          >
            Alterações de Escala
          </Button>
          <Button
            onClick={() => setActiveTab("operadores")}
            className={activeTab === "operadores" ? "bg-blue-600 text-white" : "bg-white text-gray-700 border border-gray-300"}
          >
            Gerenciar Operadores
          </Button>
        </div>

        {/* Alterações Tab */}
        {activeTab === "alteracoes" && (
          <>
            {/* Status Card */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Status da Sincronização</CardTitle>
                <CardDescription>
                  Última atualização:{" "}
                  {lastSyncQuery.data?.lastSync
                    ? new Date(lastSyncQuery.data.lastSync).toLocaleString("pt-BR")
                    : "Nunca sincronizado"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex gap-4">
                <Button
                  onClick={handleSync}
                  disabled={syncMutation.isPending || alteracoesQuery.isLoading}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {syncMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sincronizando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Sincronizar Planilha
                    </>
                  )}
                </Button>
                <Button
                  onClick={downloadCSV}
                  disabled={!alteracoesQuery.data || alteracoesQuery.data.length === 0}
                  variant="outline"
                  className="text-green-600 border-green-300 hover:bg-green-50"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Exportar CSV
                </Button>
              </CardContent>
            </Card>

            {/* Alterações Table */}
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Alterações</CardTitle>
                <CardDescription>
                  Total de registros: {alteracoesQuery.data?.length || 0}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {alteracoesQuery.isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                  </div>
                ) : alteracoesQuery.data && alteracoesQuery.data.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">Data</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">Prédio</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">Setor</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">Ausência</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">Reposição</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {alteracoesQuery.data.map((alt) => (
                          <tr key={alt.id} className="border-b hover:bg-gray-50">
                            {editingId === alt.id ? (
                              <>
                                <td className="py-3 px-4">
                                  <Input
                                    value={editData.data}
                                    onChange={(e) => setEditData({ ...editData, data: e.target.value })}
                                    className="w-full"
                                  />
                                </td>
                                <td className="py-3 px-4">
                                  <Input
                                    value={editData.predio}
                                    onChange={(e) => setEditData({ ...editData, predio: e.target.value })}
                                    className="w-full"
                                  />
                                </td>
                                <td className="py-3 px-4">
                                  <Input
                                    value={editData.setor}
                                    onChange={(e) => setEditData({ ...editData, setor: e.target.value })}
                                    className="w-full"
                                  />
                                </td>
                                <td className="py-3 px-4">
                                  <Input
                                    value={editData.sai}
                                    onChange={(e) => setEditData({ ...editData, sai: e.target.value })}
                                    className="w-full"
                                  />
                                </td>
                                <td className="py-3 px-4">
                                  <Input
                                    value={editData.entra}
                                    onChange={(e) => setEditData({ ...editData, entra: e.target.value })}
                                    className="w-full"
                                  />
                                </td>
                                <td className="py-3 px-4 flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={handleSaveEdit}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={handleCancelEdit}
                                    variant="outline"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="py-3 px-4">{alt.data}</td>
                                <td className="py-3 px-4 font-medium">{alt.predio}</td>
                                <td className="py-3 px-4">{alt.setor}</td>
                                <td className="py-3 px-4">{alt.sai}</td>
                                <td className="py-3 px-4">{alt.entra}</td>
                                <td className="py-3 px-4 flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleEdit(alt)}
                                    variant="outline"
                                    className="text-blue-600 border-blue-300 hover:bg-blue-50"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleDelete(alt.id)}
                                    variant="outline"
                                    className="text-red-600 border-red-300 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Nenhuma alteração registrada.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Operadores Tab */}
        {activeTab === "operadores" && (
          <>
            {/* Novo Operador Card */}
            {showNovoOperador && (
              <Card className="mb-6 border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-blue-900">Criar Novo Operador</CardTitle>
                  <CardDescription>Adicione um novo operador ao sistema</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Usuário *
                      </label>
                      <Input
                        value={novoOperador.usuario}
                        onChange={(e) => setNovoOperador({ ...novoOperador, usuario: e.target.value })}
                        placeholder="Digite o usuário"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Senha *
                      </label>
                      <Input
                        type="password"
                        value={novoOperador.senha}
                        onChange={(e) => setNovoOperador({ ...novoOperador, senha: e.target.value })}
                        placeholder="Digite a senha"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome *
                      </label>
                      <Input
                        value={novoOperador.nome}
                        onChange={(e) => setNovoOperador({ ...novoOperador, nome: e.target.value })}
                        placeholder="Digite o nome"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <Input
                        type="email"
                        value={novoOperador.email}
                        onChange={(e) => setNovoOperador({ ...novoOperador, email: e.target.value })}
                        placeholder="Digite o email (opcional)"
                        className="w-full"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleCreateOperador}
                        disabled={createOperadorMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {createOperadorMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Criando...
                          </>
                        ) : (
                          <>
                            <Plus className="mr-2 h-4 w-4" />
                            Criar Operador
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => {
                          setShowNovoOperador(false);
                          setNovoOperador({ usuario: "", senha: "", nome: "", email: "" });
                        }}
                        variant="outline"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Novo Operador Button */}
            {!showNovoOperador && (
              <div className="mb-6">
                <Button
                  onClick={() => setShowNovoOperador(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Operador
                </Button>
              </div>
            )}

            {/* Operadores Table */}
            <Card>
              <CardHeader>
                <CardTitle>Operadores do Sistema</CardTitle>
                <CardDescription>
                  Total de operadores: {operadoresQuery.data?.length || 0}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {operadoresQuery.isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  </div>
                ) : operadoresQuery.data && operadoresQuery.data.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">Usuário</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">Nome</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">Email</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">Role</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {operadoresQuery.data.map((op) => (
                          <tr key={op.id} className="border-b hover:bg-gray-50">
                            {editingOperadorId === op.id ? (
                              <>
                                <td className="py-3 px-4">{op.usuario}</td>
                                <td className="py-3 px-4">
                                  <Input
                                    value={editingOperador.nome}
                                    onChange={(e) => setEditingOperador({ ...editingOperador, nome: e.target.value })}
                                    className="w-full"
                                  />
                                </td>
                                <td className="py-3 px-4">
                                  <Input
                                    value={editingOperador.email || ""}
                                    onChange={(e) => setEditingOperador({ ...editingOperador, email: e.target.value })}
                                    className="w-full"
                                  />
                                </td>
                                <td className="py-3 px-4">{op.role}</td>
                                <td className="py-3 px-4">
                                  <select
                                    value={editingOperador.ativo}
                                    onChange={(e) => setEditingOperador({ ...editingOperador, ativo: parseInt(e.target.value) })}
                                    className="px-2 py-1 border border-gray-300 rounded"
                                  >
                                    <option value={1}>Ativo</option>
                                    <option value={0}>Inativo</option>
                                  </select>
                                </td>
                                <td className="py-3 px-4 flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={handleUpdateOperador}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setEditingOperadorId(null);
                                      setEditingOperador(null);
                                    }}
                                    variant="outline"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="py-3 px-4 font-medium">{op.usuario}</td>
                                <td className="py-3 px-4">{op.nome}</td>
                                <td className="py-3 px-4">{op.email || "-"}</td>
                                <td className="py-3 px-4">
                                  <span className="px-2 py-1 bg-gray-200 text-gray-800 rounded text-xs font-medium">
                                    {op.role}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${op.ativo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                    {op.ativo ? "Ativo" : "Inativo"}
                                  </span>
                                </td>
                                <td className="py-3 px-4 flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setEditingOperadorId(op.id);
                                      setEditingOperador({ ...op });
                                    }}
                                    variant="outline"
                                    className="text-blue-600 border-blue-300 hover:bg-blue-50"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => setShowResetSenha(op.id)}
                                    variant="outline"
                                    className="text-orange-600 border-orange-300 hover:bg-orange-50"
                                  >
                                    <Lock className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleDeleteOperador(op.id)}
                                    variant="outline"
                                    className="text-red-600 border-red-300 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Nenhum operador registrado.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reset Senha Modal */}
            {showResetSenha && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <Card className="w-full max-w-md">
                  <CardHeader>
                    <CardTitle>Alterar Senha do Operador</CardTitle>
                    <CardDescription>Digite a nova senha para este operador</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nova Senha
                      </label>
                      <Input
                        type="password"
                        value={novaSenhaOperador}
                        onChange={(e) => setNovaSenhaOperador(e.target.value)}
                        placeholder="Digite a nova senha"
                        className="w-full"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleResetSenhaOperador(showResetSenha)}
                        disabled={updateOperadorMutation.isPending}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        {updateOperadorMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Alterando...
                          </>
                        ) : (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Alterar Senha
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => {
                          setShowResetSenha(null);
                          setNovaSenhaOperador("");
                        }}
                        variant="outline"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Cancelar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
