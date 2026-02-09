# Quadro de Avisos - TODO

## Backend & Database
- [x] Criar schema de banco de dados (tabela alteracoes)
- [x] Implementar integração com Google Sheets API
- [x] Criar procedimento tRPC para sincronizar dados
- [x] Criar procedimento tRPC para listar alterações
- [x] Criar procedimento tRPC para gerar CSV
- [x] Implementar autenticação simples por senha para gestor

## Frontend - Autenticação
- [x] Criar página de login com opções Gestor/Enfermeiro
- [x] Implementar validação de senha para gestor
- [x] Implementar redirecionamento para painel correto

## Frontend - Painel do Gestor
- [x] Criar layout do painel do gestor
- [x] Implementar visualização de avisos atuais
- [x] Implementar histórico de registros
- [x] Implementar botão de atualizar dados
- [x] Implementar download de CSV
- [x] Adicionar logout

## Frontend - Painel do Enfermeiro
- [x] Criar layout do painel do enfermeiro
- [x] Implementar quadro de avisos visual
- [x] Implementar botão de atualizar informações
- [x] Implementar timestamp da última atualização
- [x] Implementar mensagem de "sem alterações"
- [x] Adicionar logout

## Design & Responsividade
- [x] Extrair e aplicar cores da logo (laranja #F39C12)
- [x] Implementar design responsivo para mobile
- [x] Adicionar logo da empresa em destaque
- [x] Implementar layout limpo e intuitivo
- [x] Testar em diferentes resoluções

## Testes & Validação
- [ ] Testar integração com Google Sheets
- [ ] Testar autenticação do gestor
- [ ] Testar sincronização de dados
- [ ] Testar responsividade (desktop e mobile)
- [ ] Testar download de CSV

## Página de Apresentação
- [ ] Criar página web interativa de apresentação
- [ ] Incluir gráficos e visualizações dos dados
- [ ] Implementar funcionalidades de exploração de dados
- [ ] Adicionar opções de compartilhamento

## Deploy & Finalização
- [ ] Criar checkpoint final
- [ ] Documentar instruções de uso
- [ ] Preparar para entrega


## Correções & Melhorias
- [x] Corrigir parser de dados da planilha Google Sheets (usando CSV export)
- [x] Implementar sincronização automática a cada 30 segundos
- [x] Adicionar filtros por unidade (Prédio) no painel do enfermeiro
- [x] Melhorar visual do painel do enfermeiro com cards mais destacados
- [x] Testar sincronização com dados reais da planilha


## Integração Google Sheets API v4
- [x] Configurar Google Sheets API v4 com chave de API pública
- [x] Implementar integração com Google Sheets API no backend
- [x] Adicionar polling em tempo real no frontend (10 segundos)
- [x] Testar sincronização instantânea com dados reais
- [x] Validar performance e cache (3 segundos no backend)


## Melhorias Solicitadas
- [x] Criar entrada separada para Enfermeiros UPA e Enfermeiros HOB na tela de login
- [x] Filtrar automaticamente dados por prédio (UPA/HOB) conforme acesso
- [ ] Implementar Histórico Permanente que nunca deleta registros sincronizados

## Ajustes de Design - Fase Final
- [x] Reorganizar tela de login com UPA e HOB em destaque, Gestor discreto ao lado
- [x] Remover cores do Prédio no painel do Gestor (histórico)
- [x] Ajustar cores de Ausência/Reposição para design mais sutil e elegante
- [x] Testar visual em desktop e mobile
- [x] Validar cores e layout final
