import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("alteracoes router", () => {
  it("should list alteracoes", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.alteracoes.list();

    expect(Array.isArray(result)).toBe(true);
  });

  it("should get last sync time", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.alteracoes.getLastSync();

    expect(result).toHaveProperty("lastSync");
  });
});

describe("auth router", () => {
  it("should validate gestor password", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const correctPassword = process.env.GESTOR_PASSWORD || "admin123";
    const result = await caller.auth.loginGestor({ senha: correctPassword });

    expect(result.success).toBe(true);
  });

  it("should reject incorrect password", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.loginGestor({ senha: "wrongpassword" });

    expect(result.success).toBe(false);
  });
});
