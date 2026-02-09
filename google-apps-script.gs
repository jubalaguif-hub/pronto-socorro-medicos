/**
 * Google Apps Script para monitorar planilha e enviar dados ao site
 * 
 * INSTRUÇÕES DE INSTALAÇÃO:
 * 1. Abra a planilha no Google Sheets
 * 2. Clique em "Extensões" > "Apps Script"
 * 3. Copie TODO o código abaixo para o editor
 * 4. Clique em "Deploy" > "New deployment" > "Type: Web app"
 * 5. Execute como: Seu email (jubalaguif@gmail.com)
 * 6. Quem tem acesso: "Qualquer pessoa"
 * 7. Copie o URL da web app
 * 8. Configure o WEBHOOK_URL abaixo com o URL do seu site
 */

// ===== CONFIGURAÇÃO =====
// Substitua com o URL do seu site (será fornecido)
const WEBHOOK_URL = "https://seu-site.com/api/webhook/alteracoes";

// ID da planilha (não precisa alterar, já está correto)
const SHEET_ID = "2PACX-1vRRkHd8T6hd_3QnN5YWjYClnAK_z9PcWgeqe4sH-e3bPEtbf9_6zPw7jhZcdSZMaYmaqG80YKo-xx92";
const SHEET_NAME = "ALTERAÇÕES - FINAIS DE SEMANA";

// ===== FUNÇÕES PRINCIPAIS =====

/**
 * Função acionada quando a planilha é aberta
 * Configura o trigger para monitorar mudanças
 */
function onOpen() {
  console.log("[Apps Script] Planilha aberta");
  setupTrigger();
}

/**
 * Configura trigger para monitorar mudanças
 */
function setupTrigger() {
  // Remover triggers antigos
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }
  
  // Criar novo trigger para monitorar mudanças
  ScriptApp.newTrigger("onSheetChange")
    .onEdit(SpreadsheetApp.getActiveSpreadsheet())
    .create();
  
  console.log("[Apps Script] Trigger configurado");
}

/**
 * Função acionada quando há mudanças na planilha
 */
function onSheetChange(e) {
  console.log("[Apps Script] Mudança detectada");
  
  // Enviar dados atualizados
  sendDataToWebsite();
}

/**
 * Busca dados da planilha e envia para o website
 */
function sendDataToWebsite() {
  try {
    console.log("[Apps Script] Buscando dados da planilha...");
    
    // Obter planilha
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      console.error("[Apps Script] Planilha não encontrada: " + SHEET_NAME);
      return;
    }
    
    // Obter dados
    const data = sheet.getDataRange().getValues();
    
    if (data.length < 2) {
      console.log("[Apps Script] Nenhum dado para enviar");
      return;
    }
    
    // Processar dados
    const headers = data[0];
    const alteracoes = [];
    
    // Encontrar índices das colunas
    const dataIdx = headers.findIndex(h => h.toString().toLowerCase().includes("data"));
    const predioIdx = headers.findIndex(h => h.toString().toLowerCase().includes("prédio") || h.toString().toLowerCase().includes("predio"));
    const setorIdx = headers.findIndex(h => h.toString().toLowerCase().includes("setor"));
    const saiIdx = headers.findIndex(h => h.toString().toLowerCase().includes("sai"));
    const entraIdx = headers.findIndex(h => h.toString().toLowerCase().includes("entra"));
    const obsIdx = headers.findIndex(h => h.toString().toLowerCase().includes("observações") || h.toString().toLowerCase().includes("observacoes"));
    
    console.log("[Apps Script] Índices encontrados: data=" + dataIdx + ", prédio=" + predioIdx + ", setor=" + setorIdx + ", sai=" + saiIdx + ", entra=" + entraIdx + ", obs=" + obsIdx);
    
    // Processar linhas (pulando header)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      // Pular linhas vazias
      if (!row[dataIdx] || row[dataIdx].toString().trim() === "") {
        continue;
      }
      
      alteracoes.push({
        data: row[dataIdx] ? row[dataIdx].toString().trim() : "",
        predio: row[predioIdx] ? row[predioIdx].toString().trim() : "",
        setor: row[setorIdx] ? row[setorIdx].toString().trim() : "",
        sai: row[saiIdx] ? row[saiIdx].toString().trim() : "",
        entra: row[entraIdx] ? row[entraIdx].toString().trim() : "",
        observacoes: row[obsIdx] ? row[obsIdx].toString().trim() : ""
      });
    }
    
    console.log("[Apps Script] " + alteracoes.length + " alterações encontradas");
    
    if (alteracoes.length === 0) {
      console.log("[Apps Script] Nenhuma alteração para enviar");
      return;
    }
    
    // Enviar para website
    const payload = {
      timestamp: new Date().toISOString(),
      alteracoes: alteracoes,
      total: alteracoes.length
    };
    
    const options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    console.log("[Apps Script] Enviando " + alteracoes.length + " alterações para " + WEBHOOK_URL);
    
    const response = UrlFetchApp.fetch(WEBHOOK_URL, options);
    const responseCode = response.getResponseCode();
    
    console.log("[Apps Script] Resposta: " + responseCode);
    
    if (responseCode === 200) {
      console.log("[Apps Script] ✓ Dados enviados com sucesso!");
    } else {
      console.error("[Apps Script] ✗ Erro ao enviar: " + response.getContentText());
    }
    
  } catch (error) {
    console.error("[Apps Script] Erro: " + error.toString());
  }
}

/**
 * Função para testar o script manualmente
 */
function testScript() {
  console.log("[Apps Script] Testando script...");
  sendDataToWebsite();
}

/**
 * Função para resetar o script
 */
function resetScript() {
  console.log("[Apps Script] Resetando script...");
  setupTrigger();
  sendDataToWebsite();
}
