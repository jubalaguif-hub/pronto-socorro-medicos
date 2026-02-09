import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, LogIn } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function OperadorLogin() {
  const [, setLocation] = useLocation();
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  const loginMutation = trpc.operadores.login.useMutation();

  // Efeito para redirecionar após login bem-sucedido
  useEffect(() => {
    if (loginMutation.data?.success) {
      localStorage.setItem("operadorToken", JSON.stringify(loginMutation.data.operador));
      setLocation("/operador");
    }
  }, [loginMutation.data?.success, setLocation]);

  // Efeito para mostrar erro
  useEffect(() => {
    if (loginMutation.isError || (loginMutation.data && !loginMutation.data.success)) {
      const errorMsg = loginMutation.data?.message || "Erro ao fazer login";
      setErro(errorMsg);
    }
  }, [loginMutation.isError, loginMutation.data?.success, loginMutation.data?.message]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");

    if (!usuario || !senha) {
      setErro("Preencha todos os campos");
      return;
    }

    await loginMutation.mutateAsync({ usuario, senha });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/logo.png"
            alt="Hospital Metropolitano Odilson Behrens"
            className="h-16 mx-auto mb-4 object-contain"
          />
          <h1 className="text-3xl font-bold text-gray-900">Quadro de Avisos</h1>
          <p className="text-gray-600 mt-2">Acesso do Operador</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Login do Operador</CardTitle>
            <CardDescription>
              Faça login para inserir alterações na escala
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {erro && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{erro}</AlertDescription>
                </Alert>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Usuário
                </label>
                <Input
                  type="text"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  placeholder="Digite seu usuário"
                  className="w-full"
                  disabled={loginMutation.isPending}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Senha
                </label>
                <Input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Digite sua senha"
                  className="w-full"
                  disabled={loginMutation.isPending}
                />
              </div>

              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Entrar
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <Button
                onClick={() => setLocation("/")}
                variant="outline"
                className="w-full"
              >
                Voltar para Home
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Não tem acesso? Contate o administrador do sistema.</p>
        </div>
      </div>
    </div>
  );
}
