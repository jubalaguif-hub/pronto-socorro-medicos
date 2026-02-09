import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { AlertCircle, Lock, Eye } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Login() {
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<"select" | "gestor" | "enfermeiro">("select");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPredio, setSelectedPredio] = useState<"UPA" | "HOB" | null>(null);

  const loginGestorMutation = trpc.auth.loginGestor.useMutation();

  const handleGestorLogin = async () => {
    if (!senha.trim()) {
      setError("Por favor, digite a senha");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await loginGestorMutation.mutateAsync({ senha });
      if (result.success) {
        // Armazenar token de gestor no localStorage
        localStorage.setItem("gestorToken", "true");
        setLocation("/gestor");
      } else {
        setError("Senha incorreta");
      }
    } catch (err) {
      setError("Erro ao fazer login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnfermeiroLogin = (predio: "UPA" | "HOB") => {
    localStorage.removeItem("gestorToken");
    localStorage.setItem("enfermeiroPredio", predio);
    setLocation("/enfermeiro");
  };

  if (mode === "select") {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
        style={{
          backgroundImage: 'url(/login-bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* Overlay com gradiente e transparência */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-50/85 via-green-100/80 to-green-50/85 backdrop-blur-sm"></div>
        
        {/* Conteúdo */}
        <div className="relative z-10 w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="flex justify-center mb-4">
              <img
                src="/logo.png"
                alt="Hospital Metropolitano Odilson Behrens"
                className="h-20 object-contain drop-shadow-lg"
              />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 drop-shadow-md">Quadro de Avisos Médicos</h1>
            <p className="text-gray-700 mt-2 font-medium drop-shadow-sm" style={{fontSize: '14px', fontWeight: '200'}}>Escala de Técnicos de Enfermagem</p>
          </div>

          {/* Main Content - UPA e HOB em lista vertical */}
          <div className="space-y-4 mb-8">
            {/* UPA */}
            <Button
              onClick={() => handleEnfermeiroLogin("UPA")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Médicos UPA
            </Button>

            {/* HOB */}
            <Button
              onClick={() => handleEnfermeiroLogin("HOB")}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Médicos HOB
            </Button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-gray-400"></div>
            <span className="text-xs text-gray-600 font-medium">OU</span>
            <div className="flex-1 h-px bg-gray-400"></div>
          </div>

          {/* Link para Operador */}
          <Button
            onClick={() => setLocation("/operador-login")}
            variant="ghost"
            className="w-full text-gray-700 hover:bg-white/40 text-sm py-2 font-medium"
          >
            <Lock className="h-4 w-4 mr-2" />
            Acesso Operador
          </Button>

          {/* Administrador - Minimalista em baixo */}
          <Button
            onClick={() => setMode("gestor")}
            variant="ghost"
            className="w-full text-gray-700 hover:bg-white/40 text-sm py-2 font-medium mt-4"
          >
            <Lock className="h-4 w-4 mr-2" />
            Acesso Administrador
          </Button>

          {/* Footer Info */}
          <p className="text-xs text-center text-gray-700 mt-8 font-medium drop-shadow-sm">
            Enfermeiros: Acesso direto ao quadro de avisos do seu prédio.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img
              src="/logo.png"
              alt="Hospital Metropolitano Odilson Behrens"
              className="h-16 object-contain"
            />
          </div>
          <CardTitle className="text-2xl">Acesso Gerência do PS</CardTitle>
          <CardDescription>Digite a senha para continuar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Senha</label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Digite sua senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleGestorLogin()}
                className="pr-10"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                <Eye className="h-4 w-4" />
              </button>
            </div>
          </div>

          <Button
            onClick={handleGestorLogin}
            disabled={isLoading}
            className="w-full bg-gray-700 hover:bg-gray-800 text-white h-10"
          >
            {isLoading ? "Verificando..." : "Entrar"}
          </Button>

          <Button
            onClick={() => setMode("select")}
            variant="ghost"
            className="w-full"
            disabled={isLoading}
          >
            Voltar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
