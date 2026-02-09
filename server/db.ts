import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, alteracoes, InsertAlteracao, configApp, operadores } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getAllAlteracoes() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get alteracoes: database not available");
    return [];
  }

  try {
    const result = await db.select().from(alteracoes).orderBy(desc(alteracoes.createdAt));
    return result;
  } catch (error) {
    console.error("[Database] Failed to get alteracoes:", error);
    return [];
  }
}

export async function insertAlteracao(data: InsertAlteracao) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot insert alteracao: database not available");
    return null;
  }

  try {
    const result = await db.insert(alteracoes).values(data);
    return result;
  } catch (error) {
    console.error("[Database] Failed to insert alteracao:", error);
    return null;
  }
}

export async function getLastSyncTime() {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select()
      .from(configApp)
      .where(eq(configApp.chave, "lastSyncTime"))
      .limit(1);
    return result.length > 0 ? result[0].valor : null;
  } catch (error) {
    console.error("[Database] Failed to get lastSyncTime:", error);
    return null;
  }
}

export async function setLastSyncTime(timestamp: string) {
  const db = await getDb();
  if (!db) return false;

  try {
    await db
      .insert(configApp)
      .values({ chave: "lastSyncTime", valor: timestamp })
      .onDuplicateKeyUpdate({
        set: { valor: timestamp },
      });
    return true;
  } catch (error) {
    console.error("[Database] Failed to set lastSyncTime:", error);
    return false;
  }
}


export async function clearAlteracoes() {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.delete(alteracoes);
    return true;
  } catch (error) {
    console.error("[Database] Failed to clear alteracoes:", error);
    return false;
  }
}

export async function deleteAlteracao(id: number) {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.delete(alteracoes).where(eq(alteracoes.id, id));
    return true;
  } catch (error) {
    console.error("[Database] Failed to delete alteracao:", error);
    return false;
  }
}

export async function updateAlteracao(id: number, data: Partial<InsertAlteracao>) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.update(alteracoes).set(data).where(eq(alteracoes.id, id));
    return result;
  } catch (error) {
    console.error("[Database] Failed to update alteracao:", error);
    return null;
  }
}

export async function getAlteracaoById(id: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.select().from(alteracoes).where(eq(alteracoes.id, id)).limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Database] Failed to get alteracao:", error);
    return null;
  }
}

export async function getGestorPassword() {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select()
      .from(configApp)
      .where(eq(configApp.chave, "gestorPassword"))
      .limit(1);
    return result.length > 0 ? result[0].valor : null;
  } catch (error) {
    console.error("[Database] Failed to get gestor password:", error);
    return null;
  }
}

export async function setGestorPassword(password: string) {
  const db = await getDb();
  if (!db) return false;

  try {
    await db
      .insert(configApp)
      .values({ chave: "gestorPassword", valor: password })
      .onDuplicateKeyUpdate({
        set: { valor: password },
      });
    return true;
  } catch (error) {
    console.error("[Database] Failed to set gestor password:", error);
    return false;
  }
}

// Operadores functions
export async function createOperador(usuario: string, senha: string, nome: string, email?: string) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(operadores).values({
      usuario,
      senha,
      nome,
      email,
      role: "operador",
      ativo: 1,
    });
    return result;
  } catch (error) {
    console.error("[Database] Failed to create operador:", error);
    return null;
  }
}

export async function getOperadorByUsuario(usuario: string) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.select().from(operadores).where(eq(operadores.usuario, usuario)).limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Database] Failed to get operador:", error);
    return null;
  }
}

export async function getAllOperadores() {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(operadores);
  } catch (error) {
    console.error("[Database] Failed to get operadores:", error);
    return [];
  }
}

export async function updateOperador(id: number, data: Partial<typeof operadores.$inferInsert>) {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.update(operadores).set(data).where(eq(operadores.id, id));
    return true;
  } catch (error) {
    console.error("[Database] Failed to update operador:", error);
    return false;
  }
}

export async function deleteOperador(id: number) {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.delete(operadores).where(eq(operadores.id, id));
    return true;
  } catch (error) {
    console.error("[Database] Failed to delete operador:", error);
    return false;
  }
}

// Auditoria functions
export async function getAlteracoesByOperador(operadorUsuario: string) {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db
      .select()
      .from(alteracoes)
      .where(eq(alteracoes.criadoPor, operadorUsuario))
      .orderBy(desc(alteracoes.createdAt));
    return result;
  } catch (error) {
    console.error("[Database] Failed to get alteracoes by operador:", error);
    return [];
  }
}

export async function updateAlteracaoWithAudit(id: number, data: any, editadoPor: string) {
  const db = await getDb();
  if (!db) return false;

  try {
    await db
      .update(alteracoes)
      .set({
        ...data,
        editadoPor,
      })
      .where(eq(alteracoes.id, id));
    return true;
  } catch (error) {
    console.error("[Database] Failed to update alteracao with audit:", error);
    return false;
  }
}

export async function deleteAlteracaoByOperador(id: number, operadorUsuario: string) {
  const db = await getDb();
  if (!db) return false;

  try {
    // Verificar se o operador criou este registro
    const result = await db
      .select()
      .from(alteracoes)
      .where(eq(alteracoes.id, id))
      .limit(1);

    if (result.length === 0 || result[0].criadoPor !== operadorUsuario) {
      console.error("[Database] Operador não tem permissão para deletar este registro");
      return false;
    }

    await db.delete(alteracoes).where(eq(alteracoes.id, id));
    return true;
  } catch (error) {
    console.error("[Database] Failed to delete alteracao:", error);
    return false;
  }
}

export async function insertAlteracaoWithAudit(data: InsertAlteracao, criadoPor: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot insert alteracao: database not available");
    return null;
  }

  try {
    const result = await db.insert(alteracoes).values({
      ...data,
      criadoPor,
    });
    return result;
  } catch (error) {
    console.error("[Database] Failed to insert alteracao with audit:", error);
    return null;
  }
}
