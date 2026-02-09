import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const alteracoes = mysqlTable("alteracoes", {
  id: int("id").autoincrement().primaryKey(),
  data: varchar("data", { length: 10 }).notNull(), // DD/MM/YYYY
  predio: varchar("predio", { length: 100 }).notNull(),
  setor: varchar("setor", { length: 100 }).notNull(),
  sai: varchar("sai", { length: 255 }).notNull(),
  entra: varchar("entra", { length: 255 }).notNull(),
  motivo: varchar("motivo", { length: 255 }),
  observacoes: text("observacoes"),
  criadoPor: varchar("criadoPor", { length: 100 }), // Usuário que criou
  editadoPor: varchar("editadoPor", { length: 100 }), // Último usuário que editou
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Alteracao = typeof alteracoes.$inferSelect;
export type InsertAlteracao = typeof alteracoes.$inferInsert;

export const configApp = mysqlTable("configApp", {
  id: int("id").autoincrement().primaryKey(),
  chave: varchar("chave", { length: 100 }).notNull().unique(),
  valor: text("valor"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ConfigApp = typeof configApp.$inferSelect;
export type InsertConfigApp = typeof configApp.$inferInsert;
export const operadores = mysqlTable("operadores", {
  id: int("id").autoincrement().primaryKey(),
  usuario: varchar("usuario", { length: 100 }).notNull().unique(),
  senha: varchar("senha", { length: 255 }).notNull(),
  nome: varchar("nome", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  role: mysqlEnum("role", ["operador", "admin"]).default("operador").notNull(),
  ativo: int("ativo").default(1).notNull(), // 1 = ativo, 0 = inativo
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Operador = typeof operadores.$inferSelect;
export type InsertOperador = typeof operadores.$inferInsert;
