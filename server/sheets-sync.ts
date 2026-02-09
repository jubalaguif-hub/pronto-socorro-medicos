import * as db from "./db";

const SHEET_ID = "1ULUDSLZifG3frUbWX4MiY5ZT2kRYHvKyH3RDEP8POxs";
const SHEET_NAME = "Visualização";

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

export async function syncFromSheets() {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}?key=${process.env.GOOGLE_SHEETS_API_KEY}`;

    const response = await fetch(url);
    if (!response.ok) {
      console.error("[Sheets Sync] API error:", response.status);
      return { success: false, count: 0 };
    }

    const data = await response.json();
    const values = data.values || [];

    if (values.length < 2) {
      return { success: true, count: 0 };
    }

    // Limpar banco antes de sincronizar
    await db.clearAlteracoes();

    const alteracoes = [];
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      if (!row[0] || row[0].toString().trim() === "") continue;

      const dataFormatada = formatDate(row[0].toString());
      const predio = row[1] ? row[1].toString().trim() : "";
      const setor = row[2] ? row[2].toString().trim() : "";
      const sai = row[3] ? row[3].toString().trim() : "";
      const entra = row[4] ? row[4].toString().trim() : "";
      const observacoes = row[5] ? row[5].toString().trim() : "";

      const result = await db.insertAlteracao({
        data: dataFormatada,
        predio,
        setor,
        sai,
        entra,
        motivo: sai.split(" ").slice(1).join(" ") || "",
        observacoes,
      });

      if (result) {
        alteracoes.push(result);
      }
    }

    await db.setLastSyncTime(new Date().toISOString());

    console.log("[Sheets Sync] ✓ Sincronizadas", alteracoes.length, "alterações");
    return { success: true, count: alteracoes.length };
  } catch (error) {
    console.error("[Sheets Sync] Erro:", error);
    return { success: false, count: 0, error: error instanceof Error ? error.message : "Erro desconhecido" };
  }
}
