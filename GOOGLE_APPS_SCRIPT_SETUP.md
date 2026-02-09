# Guia de Configuração - Google Apps Script

## O que é?

O Google Apps Script é um serviço gratuito do Google que permite automatizar tarefas na sua planilha. Vamos usá-lo para **monitorar mudanças na planilha e enviar os dados automaticamente para o site** sempre que você fizer alterações.

## Benefícios

✅ **Sincronização instantânea** - Dados aparecem no site em segundos  
✅ **Sem problemas de quota** - Totalmente estável e confiável  
✅ **100% gratuito** - Sem custos adicionais  
✅ **Automático** - Funciona sozinho, sem intervenção  

---

## Passo a Passo de Instalação

### 1. Abrir a Planilha

Acesse sua planilha no Google Sheets:
https://docs.google.com/spreadsheets/d/2PACX-1vRRkHd8T6hd_3QnN5YWjYClnAK_z9PcWgeqe4sH-e3bPEtbf9_6zPw7jhZcdSZMaYmaqG80YKo-xx92/edit

### 2. Acessar o Apps Script

- Clique em **"Extensões"** (menu superior)
- Clique em **"Apps Script"**
- Uma nova aba será aberta

### 3. Copiar o Código

Na aba do Apps Script que abriu:

1. **Limpe todo o código existente** (se houver)
2. **Copie TODO o código abaixo** e cole no editor:

```javascript
/**
 * Google Apps Script para monitorar planilha e enviar dados ao site
 */

// ===== CONFIGURAÇÃO =====
// URL do seu site (será fornecida)
const WEBHOOK_URL = "https://seu-site-aqui.com/api/trpc/alteracoes.webhook";

// ID da planilha
const SHEET_ID = "2PACX-1vRRkHd8T6hd_3QnN5YWjYClnAK_z9PcWgeqe4sH-e3bPEtbf9_6zPw7jhZcdSZMaYmaqG80YKo-xx92";
const SHEET_NAME = "ALTERAÇÕES - FINAIS DE SEMANA";

// ===== FUNÇÕES PRINCIPAIS =====

function onOpen() {
  console.log("[Apps Script] Planilha aberta");
  setupTrigger();
}

function setupTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }
  
  ScriptApp.newTrigger("onSheetChange")
    .onEdit(SpreadsheetApp.getActiveSpreadsheet())
    .create();
  
  console.log("[Apps Script] Trigger configurado");
}

function onSheetChange(e) {
  console.log("[Apps Script] Mudança detectada");
  sendDataToWebsite();
}

function sendDataToWebsite() {
  try {
    console.log("[Apps Script] Buscando dados da planilha...");
    
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      console.error("[Apps Script] Planilha não encontrada: " + SHEET_NAME);
      return;
    }
    
    const data = sheet.getDataRange().getValues();
    
    if (data.length < 2) {
      console.log("[Apps Script] Nenhum dado para enviar");
      return;
    }
    
    const headers = data[0];
    const alteracoes = [];
    
    const dataIdx = headers.findIndex(h => h.toString().toLowerCase().includes("data"));
    const predioIdx = headers.findIndex(h => h.toString().toLowerCase().includes("prédio") || h.toString().toLowerCase().includes("predio"));
    const setorIdx = headers.findIndex(h => h.toString().toLowerCase().includes("setor"));
    const saiIdx = headers.findIndex(h => h.toString().toLowerCase().includes("sai"));
    const entraIdx = headers.findIndex(h => h.toString().toLowerCase().includes("entra"));
    const obsIdx = headers.findIndex(h => h.toString().toLowerCase().includes("observações") || h.toString().toLowerCase().includes("observacoes"));
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
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

function testScript() {
  console.log("[Apps Script] Testando script...");
  sendDataToWebsite();
}

function resetScript() {
  console.log("[Apps Script] Resetando script...");
  setupTrigger();
  sendDataToWebsite();
}
```

### 4. Salvar o Projeto

- Clique em **"Salvar"** (ícone de disquete)
- Dê um nome ao projeto (ex: "Quadro Avisos")
- Clique em **"OK"**

### 5. Executar Função de Teste

- Na lista de funções (lado esquerdo), selecione **"testScript"**
- Clique no botão **"Executar"** (ícone de play)
- Autorize o script quando solicitado
- Verifique os logs para confirmar que funcionou

### 6. Deploy como Web App

1. Clique em **"Deploy"** (botão azul, canto superior direito)
2. Clique em **"New deployment"**
3. Selecione **"Type"** → **"Web app"**
4. Configure:
   - **Execute as**: Seu email (jubalaguif@gmail.com)
   - **Who has access**: "Qualquer pessoa"
5. Clique em **"Deploy"**
6. **Copie a URL** que aparece (será algo como: `https://script.google.com/macros/d/...`)

### 7. Configurar URL no Script

Agora você precisa atualizar a URL do webhook no script:

1. Volte ao editor do Apps Script
2. Encontre a linha: `const WEBHOOK_URL = "https://seu-site-aqui.com/api/trpc/alteracoes.webhook";`
3. **Substitua** `https://seu-site-aqui.com` pela URL do seu site

**Exemplo:**
```javascript
const WEBHOOK_URL = "https://seu-site-manus.com/api/trpc/alteracoes.webhook";
```

4. Clique em **"Salvar"**
5. Clique em **"Deploy"** → **"All deployments"** → Atualize a versão

---

## Testando o Sistema

1. **Acesse o site** → Painel do Enfermeiro
2. **Abra a planilha** em outra aba
3. **Adicione uma nova linha** com dados de teste
4. **Volte ao site** e clique em **"Atualizar"**
5. **Você deve ver os dados aparecerem em segundos!**

---

## Solução de Problemas

### "Erro 403 - Acesso Negado"
- Verifique se a URL do webhook está correta
- Certifique-se de que o site está online

### "Nenhum dado aparecendo"
- Abra o Apps Script
- Clique em **"Execução"** (menu esquerdo)
- Verifique os logs para erros
- Execute **"resetScript"** manualmente

### "Erro ao autorizar"
- Clique em **"Autorizar"** quando solicitado
- Confirme que você quer permitir o acesso

---

## Suporte

Se tiver dúvidas, entre em contato! O sistema está 100% pronto para usar.
