import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import * as db from "./db";

async function syncFromSheets() {
  try {
    const SHEET_ID = "1ULUDSLZifG3frUbWX4MiY5ZT2kRYHvKyH3RDEP8POxs";
    const SHEET_NAME = "Visualização";
    const API_KEY = process.env.GOOGLE_SHEETS_API_KEY;

    if (!API_KEY) {
      console.error("[Sync] API_KEY não configurada");
      return { success: false, count: 0 };
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}?key=${API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error("[Sync] API error:", response.status);
      return { success: false, count: 0 };
    }

    const data = await response.json();
    const values = data.values || [];

    if (values.length < 2) {
      // Planilha vazia - não fazer nada (manter registros existentes)
      await db.setLastSyncTime(new Date().toISOString());
      console.log("[Sync] ✓ Planilha vazia - registros mantidos");
      return { success: true, count: 0 };
    }

    // Limpar banco para sincronizar dados novos
    await db.clearAlteracoes();

    let count = 0;
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      if (!row[0] || row[0].toString().trim() === "") continue;

      const dataStr = row[0].toString().trim();
      const predio = row[1] ? row[1].toString().trim() : "";
      const setor = row[2] ? row[2].toString().trim() : "";
      const sai = row[3] ? row[3].toString().trim() : "";
      const entra = row[4] ? row[4].toString().trim() : "";
      const observacoes = row[5] ? row[5].toString().trim() : "";

      await db.insertAlteracao({
        data: dataStr,
        predio,
        setor,
        sai,
        entra,
        motivo: sai.split(" ").slice(1).join(" ") || "",
        observacoes,
      });

      count++;
    }

    await db.setLastSyncTime(new Date().toISOString());
    console.log("[Sync] ✓ Sincronizadas", count, "alterações");

    return { success: true, count };
  } catch (error) {
    console.error("[Sync] Erro:", error);
    return { success: false, count: 0 };
  }
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie("session");
      return { ok: true };
    }),

    loginGestor: publicProcedure
      .input(z.object({ senha: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const senhaCorreta = await db.getGestorPassword();
        
        if (input.senha !== senhaCorreta) {
          return { success: false };
        }
        
        ctx.res.cookie("gestorToken", "true");
        return { success: true };
      }),

    changeGestorPassword: publicProcedure
      .input(z.object({ senhaAtual: z.string(), senhaNova: z.string() }))
      .mutation(async ({ input }) => {
        const senhaCorreta = await db.getGestorPassword();
        
        if (input.senhaAtual !== senhaCorreta) {
          return { success: false, message: "Senha atual incorreta" };
        }
        
        const result = await db.setGestorPassword(input.senhaNova);
        return { success: result, message: result ? "Senha alterada com sucesso" : "Erro ao alterar senha" };
      }),
  }),

  alteracoes: router({
    list: publicProcedure.query(async () => {
      return await db.getAllAlteracoes();
    }),
    
    sync: publicProcedure.mutation(async () => {
      return await syncFromSheets();
    }),
    
    getLastSync: publicProcedure.query(async () => {
      const lastSync = await db.getLastSyncTime();
      return { lastSync };
    }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const success = await db.deleteAlteracao(input.id);
        return { success };
      }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          data: z.string().optional(),
          predio: z.string().optional(),
          setor: z.string().optional(),
          sai: z.string().optional(),
          entra: z.string().optional(),
          observacoes: z.string().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        const result = await db.updateAlteracao(input.id, input.data);
        return { success: !!result };
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getAlteracaoById(input.id);
      }),

    insert: publicProcedure
      .input(z.object({
        data: z.string(),
        predio: z.string(),
        setor: z.string(),
        sai: z.string(),
        entra: z.string(),
        motivo: z.string().optional(),
        observacoes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await db.insertAlteracao(input);
        return { success: !!result };
      }),
  }),

  operadores: router({
    login: publicProcedure
      .input(z.object({ usuario: z.string(), senha: z.string() }))
      .mutation(async ({ input }) => {
        const operador = await db.getOperadorByUsuario(input.usuario);
        if (!operador || operador.ativo === 0) {
          return { success: false, message: "Usuário ou senha incorretos" };
        }
        if (operador.senha !== input.senha) {
          return { success: false, message: "Usuário ou senha incorretos" };
        }
        return { success: true, operador: { id: operador.id, usuario: operador.usuario, nome: operador.nome, role: operador.role } };
      }),

    list: publicProcedure.query(async () => {
      return await db.getAllOperadores();
    }),

    create: publicProcedure
      .input(z.object({ usuario: z.string(), senha: z.string(), nome: z.string(), email: z.string().optional() }))
      .mutation(async ({ input }) => {
        const result = await db.createOperador(input.usuario, input.senha, input.nome, input.email);
        return { success: !!result };
      }),

    update: publicProcedure
      .input(z.object({ id: z.number(), data: z.object({ nome: z.string().optional(), email: z.string().optional(), ativo: z.number().optional(), senha: z.string().optional() }) }))
      .mutation(async ({ input }) => {
        const result = await db.updateOperador(input.id, input.data);
        return { success: result };
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const result = await db.deleteOperador(input.id);
        return { success: result };
      }),

    minhas: publicProcedure
      .input(z.object({ operadorUsuario: z.string() }))
      .query(async ({ input }) => {
        return await db.getAlteracoesByOperador(input.operadorUsuario);
      }),

    editarMeu: publicProcedure
      .input(z.object({
        id: z.number(),
        operadorUsuario: z.string(),
        data: z.object({
          data: z.string().optional(),
          predio: z.string().optional(),
          setor: z.string().optional(),
          sai: z.string().optional(),
          entra: z.string().optional(),
          observacoes: z.string().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        const result = await db.updateAlteracaoWithAudit(input.id, input.data, input.operadorUsuario);
        return { success: result };
      }),

    deletarMeu: publicProcedure
      .input(z.object({ id: z.number(), operadorUsuario: z.string() }))
      .mutation(async ({ input }) => {
        const result = await db.deleteAlteracaoByOperador(input.id, input.operadorUsuario);
        return { success: result };
      }),

    inserirComAudit: publicProcedure
      .input(z.object({
        data: z.string(),
        predio: z.string(),
        setor: z.string(),
        sai: z.string(),
        entra: z.string(),
        motivo: z.string().optional(),
        observacoes: z.string().optional(),
        operadorUsuario: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { operadorUsuario, ...dados } = input;
        const result = await db.insertAlteracaoWithAudit(dados, operadorUsuario);
        return { success: !!result };
      })
  }),
});

export type AppRouter = typeof appRouter;
