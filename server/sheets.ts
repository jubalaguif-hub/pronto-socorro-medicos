import axios from "axios";
import { parse } from "csv-parse/sync";

const SHEET_ID = "2PACX-1vRRkHd8T6hd_3QnN5YWjYClnAK_z9PcWgeqe4sH-e3bPEtbf9_6zPw7jhZcdSZMaYmaqG80YKo-xx92";
const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/e/${SHEET_ID}/export?format=csv&gid=0`;

export interface AlteracaoSheet {
  data: string;
  predio: string;
  setor: string;
  sai: string;
  entra: string;
  observacoes: string;
}

/**
 * Busca dados da planilha do Google Sheets usando export CSV
 * Retorna um array de alterações
 */
export async function fetchSheetData(): Promise<AlteracaoSheet[]> {
  try {
    console.log("[Sheets] Fetching data from:", SHEET_CSV_URL);
    
    const response = await axios.get(SHEET_CSV_URL, {
      timeout: 10000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    const csvData = response.data;
    console.log("[Sheets] CSV data received, length:", csvData.length);

    // Parse CSV
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, string>[];

    console.log("[Sheets] Parsed records:", records.length);

    // Converter para formato esperado
    const alteracoes: AlteracaoSheet[] = records
      .filter((record) => {
        // Pular linhas vazias e header
        return (
          record.Data &&
          record.Data.trim() !== "" &&
          record.Data !== "Data"
        );
      })
      .map((record) => ({
        data: record.Data?.trim() || "",
        predio: record.Prédio?.trim() || "",
        setor: record.Setor?.trim() || "",
        sai: record["Sai (Motivo)"]?.trim() || "",
        entra: record.Entra?.trim() || "",
        observacoes: record.Observações?.trim() || "",
      }));

    console.log("[Sheets] Processed alteracoes:", alteracoes.length);
    console.log("[Sheets] First record:", alteracoes[0]);

    return alteracoes;
  } catch (error) {
    console.error("[Sheets] Failed to fetch data:", error);
    return [];
  }
}

/**
 * Converte data de DD/MM/YYYY para YYYY-MM-DD para comparação
 */
export function parseDate(dateStr: string): Date | null {
  const parts = dateStr.split("/");
  if (parts.length !== 3) return null;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);

  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;

  return new Date(year, month - 1, day);
}
