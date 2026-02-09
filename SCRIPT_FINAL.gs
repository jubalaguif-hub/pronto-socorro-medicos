// ============================================
// SCRIPT PARA QUADRO DE AVISOS
// Copie TUDO isso e cole no Google Apps Script
// ============================================

const WEBHOOK_URL = "https://3000-i77t53u5e9ss2hht7q8tn-5a326a99.us1.manus.computer/api/webhook/alteracoes";
const SHEET_ID = "2PACX-1vRRkHd8T6hd_3QnN5YWjYClnAK_z9PcWgeqe4sH-e3bPEtbf9_6zPw7jhZcdSZMaYmaqG80YKo-xx92";
const SHEET_NAME = "ALTERAÇÕES - FINAIS DE SEMANA";

function onOpen() {
  setupTrigger();
}

function setupTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger("onSheetChange").onEdit(SpreadsheetApp.getActiveSpreadsheet()).create();
}

function onSheetChange(e) {
  sendData();
}

function sendData() {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    
    if (data.length < 2) return;
    
    const alteracoes = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[0] || row[0].toString().trim() === "") continue;
      
      alteracoes.push({
        data: row[0] ? row[0].toString().trim() : "",
        predio: row[1] ? row[1].toString().trim() : "",
        setor: row[2] ? row[2].toString().trim() : "",
        sai: row[3] ? row[3].toString().trim() : "",
        entra: row[4] ? row[4].toString().trim() : "",
        observacoes: row[5] ? row[5].toString().trim() : ""
      });
    }
    
    if (alteracoes.length === 0) return;
    
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
    
    const response = UrlFetchApp.fetch(WEBHOOK_URL, options);
    Logger.log("Status: " + response.getResponseCode());
    Logger.log("Response: " + response.getContentText());
    
  } catch (error) {
    Logger.log("Erro: " + error.toString());
  }
}

function test() {
  sendData();
}
