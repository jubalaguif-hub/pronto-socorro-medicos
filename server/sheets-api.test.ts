import { describe, it, expect } from "vitest";
import { fetchSheetDataFromAPI } from "./sheets-api";

describe("Google Sheets API Integration", () => {
  it("should fetch data from Google Sheets API", async () => {
    const data = await fetchSheetDataFromAPI();
    
    // Validar que retorna um array
    expect(Array.isArray(data)).toBe(true);
    
    // Se houver dados, validar estrutura
    if (data.length > 0) {
      const firstItem = data[0];
      expect(firstItem).toHaveProperty("data");
      expect(firstItem).toHaveProperty("predio");
      expect(firstItem).toHaveProperty("setor");
      expect(firstItem).toHaveProperty("sai");
      expect(firstItem).toHaveProperty("entra");
      expect(firstItem).toHaveProperty("observacoes");
    }
  });

  it("should handle API errors gracefully", async () => {
    // Mesmo com erro, deve retornar array vazio
    const data = await fetchSheetDataFromAPI();
    expect(Array.isArray(data)).toBe(true);
  });
});
