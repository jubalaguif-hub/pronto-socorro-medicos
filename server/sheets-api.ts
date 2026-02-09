import axios from "axios";

const SHEET_ID = "2PACX-1vRRkHd8T6hd_3QnN5YWjYClnAK_z9PcWgeqe4sH-e3bPEtbf9_6zPw7jhZcdSZMaYmaqG80YKo-xx92";
const SHEET_RANGE = "ALTERAÇÕES - FINAIS DE SEMANA!A:F"; // Intervalo completo

// Cache para evitar rate limiting
let cachedData: AlteracaoSheet[] = [];
let lastFetchTime = 0;
const CACHE_DURATION = 15000; // 15 segundos de cache para evitar rate limiting

export interface AlteracaoSheet {
  data: string;
  predio: string;
  setor: string;
  sai: string;
  entra: string;
  observacoes: string;
}

/**
 * Busca dados da planilha usando Google Sheets API v4
 * Retorna um array de alterações
 */
export async function fetchSheetDataFromAPI(): Promise<AlteracaoSheet[]> {
  try {
    // Usar cache se disponível e ainda válido
    const now = Date.now();
    if (cachedData.length > 0 && now - lastFetchTime < CACHE_DURATION) {
      console.log("[Sheets API] Usando dados em cache");
      return cachedData;
    }

    const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
    
    if (!apiKey) {
      console.error("[Sheets API] GOOGLE_SHEETS_API_KEY não configurada");
      // Retornar cache anterior se disponível
      return cachedData;
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(SHEET_RANGE)}?key=${apiKey}`;
    
    console.log("[Sheets API] Fetching data from Google Sheets API v4");
    
    const response = await axios.get(url, {
      timeout: 10000,
    });

    const values = response.data.values || [];
    
    if (values.length === 0) {
      console.log("[Sheets API] Nenhum dado encontrado na planilha");
      return [];
    }

    // Primeira linha é o header
    const headers = values[0] || [];
    console.log("[Sheets API] Headers:", headers);

    // Encontrar índices das colunas
    const dataIdx = headers.findIndex((h: string) => h?.toLowerCase().includes("data"));
    const predioIdx = headers.findIndex((h: string) => h?.toLowerCase().includes("prédio") || h?.toLowerCase().includes("predio"));
    const setorIdx = headers.findIndex((h: string) => h?.toLowerCase().includes("setor"));
    const saiIdx = headers.findIndex((h: string) => h?.toLowerCase().includes("sai"));
    const entraIdx = headers.findIndex((h: string) => h?.toLowerCase().includes("entra"));
    const obsIdx = headers.findIndex((h: string) => h?.toLowerCase().includes("observações") || h?.toLowerCase().includes("observacoes"));

    console.log("[Sheets API] Column indices:", { dataIdx, predioIdx, setorIdx, saiIdx, entraIdx, obsIdx });

    // Processar dados (pulando header)
    const alteracoes: AlteracaoSheet[] = values
      .slice(1)
      .filter((row: string[]) => {
        // Pular linhas vazias
        return row && row.length > 0 && row[dataIdx]?.trim();
      })
      .map((row: string[]) => ({
        data: row[dataIdx]?.trim() || "",
        predio: row[predioIdx]?.trim() || "",
        setor: row[setorIdx]?.trim() || "",
        sai: row[saiIdx]?.trim() || "",
        entra: row[entraIdx]?.trim() || "",
        observacoes: row[obsIdx]?.trim() || "",
      }));

    console.log("[Sheets API] Processadas", alteracoes.length, "alterações");
    if (alteracoes.length > 0) {
      console.log("[Sheets API] Primeira alteração:", alteracoes[0]);
    }

    // Atualizar cache
    cachedData = alteracoes;
    lastFetchTime = now;

    return alteracoes;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("[Sheets API] Erro ao buscar dados:", {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data,
      });
    } else {
      console.error("[Sheets API] Erro desconhecido:", error);
    }
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
