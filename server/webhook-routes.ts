import { Express } from "express";
import * as db from "./db";

export function registerWebhookRoutes(app: Express) {
  // Endpoint HTTP para receber dados do Google Apps Script
  app.post("/api/webhook/alteracoes", async (req, res) => {
    try {
      console.log("[Webhook] Recebido POST /api/webhook/alteracoes");
      console.log("[Webhook] Body:", JSON.stringify(req.body).substring(0, 200));

      const { timestamp, alteracoes, total } = req.body;

      if (!alteracoes || !Array.isArray(alteracoes)) {
        console.error("[Webhook] Formato inválido: alteracoes não é array");
        return res.status(400).json({ error: "Formato inválido" });
      }

      console.log("[Webhook] Limpando banco de dados...");
      await db.clearAlteracoes();

      console.log("[Webhook] Processando", alteracoes.length, "alterações");

      const results = [];
      for (const item of alteracoes) {
        try {
          const result = await db.insertAlteracao({
            data: item.data || "",
            predio: item.predio || "",
            setor: item.setor || "",
            sai: item.sai || "",
            entra: item.entra || "",
            motivo: item.sai?.split(" ").slice(1).join(" ") || "",
            observacoes: item.observacoes || "",
          });
          results.push(result);
          console.log("[Webhook] Inserida alteração:", item.data, item.predio);
        } catch (error) {
          console.error("[Webhook] Erro ao inserir alteração:", error);
        }
      }

      // Atualizar timestamp da última sincronização
      await db.setLastSyncTime(new Date().toISOString());

      console.log("[Webhook] ✓ Sucesso! Inseridas", results.length, "alterações");

      res.json({
        success: true,
        count: results.length,
        message: "Dados recebidos e salvos com sucesso",
      });
    } catch (error) {
      console.error("[Webhook] Erro geral:", error);
      res.status(500).json({
        success: false,
        error: "Erro ao processar webhook",
      });
    }
  });

  // Endpoint de health check
  app.get("/api/webhook/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });
}
