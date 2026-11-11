# Relatório de auditoria de integridade

**Data:** 11/11/2026  
**Escopo:** regras de aluguel, baixas, juros e multa, contratos, rescisões, rateios, relatórios, sincronização e permissões.  
**Método:** revisão estática completa do código e das regras do Firestore, execução das verificações existentes e cruzamento dos pontos de cálculo que alimentam grade, painel e relatórios. Esta auditoria não alterou dados nem acessou a base real do usuário.

## Conclusão executiva

O sistema possui avanços importantes: baixa parcial separa principal de encargos, a multa e os juros podem ser dispensados, o rateio fecha em centavos, há histórico de contrato e há tentativas de proteger a sincronização concorrente. Porém, ele **ainda não deve ser tratado como plenamente auditável** sem corrigir os itens críticos abaixo.

Os riscos principais são:

1. O rateio de água não usa o mesmo armazenamento granular e a mesma confirmação de nuvem do rateio de energia.
2. Uma unidade possui somente um registro financeiro por competência (`AAAA-MM`), o que não representa com segurança dois contratos com pagamentos distintos no mesmo mês.
3. O valor “em atraso” do resumo anual/mensal não usa a mesma composição (principal + encargos correntes) usada em outras telas.
4. A rescisão calcula a multa contratual, mas não consolida automaticamente alugueis vencidos, rateios e outros débitos no total final.

## Resultado dos testes existentes

- `node --check app.js`: aprovado.
- `node tests/integrity.mjs`: aprovado.
- `node tests/energy-rate.mjs`: aprovado.
- `git diff --check`: aprovado.

Esses testes são úteis como proteção contra regressões visuais e de presença de código. Grande parte deles, porém, verifica se uma função, texto ou seletor existe. Eles não executam uma matriz financeira real de cenários. Portanto, aprovação dos testes atuais **não comprova** que os totais financeiros estejam corretos em todos os casos.

## Achados críticos — corrigir antes de ampliar o uso

### 1. Rateio de água tem sincronização e permissão diferentes do rateio de energia

**Risco:** alto — perda, conflito ou divergência de lançamentos de água entre aparelhos.

**Evidência:** `waterAllocations` permanece dentro do documento `meta/app`; `granularSnapshot` retira apenas `energyAllocations` para uma coleção própria. O rateio de água chama apenas `saveState()`, enquanto a energia também chama `persistEnergyAllocationNow()`. Nas regras, `meta` só pode ser alterado por `metadataManager` (owner/admin/operator), embora a tela aceite `manageExpenses`.

**Efeito prático:** um usuário de perfil Financeiro pode registrar um rateio de água localmente e não conseguir gravá-lo na nuvem. Mesmo para o proprietário, concorrência de alterações gera conflito do documento de metadados inteiro; não há recuperação específica para água.

**Recomendação:** criar `waterAllocations` como coleção granular paralela a `energyAllocations`; mover leitura, escrita, listeners, baseline e recuperação de conflito para essa coleção. Ao salvar ou dar baixa, confirmar a escrita em nuvem imediatamente e mostrar “sincronizado” somente após confirmação.

### 2. Um único pagamento por unidade e competência não suporta dois contratos no mesmo mês

**Risco:** alto — recebimentos podem ser atribuídos ao contrato errado, sobrescritos ou omitidos.

**Evidência:** `getPaymentRecord(unit, year, month)` retorna somente `paymentHistory["AAAA-MM"]`. O histórico do contrato usa `historicContractId`, mas esse campo existe dentro do único registro daquela competência. O próprio cálculo mensal reconhece que contratos distintos podem gerar duas parcelas legítimas na mesma competência, sem haver modelo capaz de persistir duas baixas independentes para elas.

**Efeito prático:** troca de inquilino no mesmo mês, pagamento tardio do contrato encerrado e pagamento do novo contrato podem competir pela mesma chave. Este é exatamente o tipo de cenário que já gerou duplicidade e totais inesperados nas telas anteriores.

**Recomendação:** migrar para uma entidade de parcela/lançamento com identificador próprio, por exemplo `installments/{contractId}-{reference}`. Cada baixa deve apontar para a parcela e o contrato de origem. A grade pode continuar agrupada por unidade, mas o relatório e o caixa devem somar lançamentos, nunca inferir a origem pela data ou pelo contrato atual.

### 3. “Em atraso” não tem uma fonte única de cálculo de encargos

**Risco:** alto — telas podem divergir e apresentar principal sem os juros correntes.

**Evidência:** em `monthlyFinancialMetrics`, `addOpenLate(rent)` atribui o mesmo valor para `overdueBase` e `overdueWithCharges`. Já o relatório anual por unidade usa `updatedAmount(unit, month)`, que chama `lateChargeBreakdown` e inclui multa e juros. Assim, dois pontos do sistema chamam o valor de atraso, porém usam fórmulas diferentes.

**Efeito prático:** o card “Em atraso”, o total anual e a lista por unidade podem não bater — sobretudo depois de uma baixa parcial ou muitos dias de atraso.

**Recomendação:** criar uma única função pura, por exemplo `openDebtForInstallment(installment, asOfDate)`, retornando `principal`, `fine`, `interest` e `total`. Todos os cards, relatórios, cobrança e recibos devem consumir exatamente esse retorno. Exibir data/hora de referência do cálculo.

### 4. Rescisão não consolida automaticamente todos os débitos financeiros

**Risco:** alto — demonstrativo de saída pode ser interpretado como valor final, mas deixar de fora aluguel vencido e consumo pendente.

**Evidência:** `rescissionValues()` soma somente multa proporcional, aluguel adicional, extras e caução. `exitUtilitiesPending()` apenas gera alerta; as parcelas vencidas e rateios não entram automaticamente no total de rescisão.

**Efeito prático:** o valor enviado ao inquilino pode ser menor do que o efetivamente devido, ou exigir conferência manual sem rastreabilidade.

**Recomendação:** incluir um bloco obrigatório de “débitos consolidados” na simulação: parcelas abertas com encargos na data de corte, energia, água e ajustes manuais. Cada linha precisa ter origem, competência e opção explícita de excluir com justificativa. O demonstrativo deve separar “multa rescisória” de “débitos já vencidos”.

## Achados importantes — próxima prioridade

### 5. Baixa de energia e água não confirma sincronização imediata

**Risco:** médio/alto — o usuário vê “pago”, mas a alteração pode ficar só no aparelho.

**Evidência:** `toggleEnergyPayment()` e `toggleWaterPayment()` chamam somente `saveState()`. A baixa de aluguel possui `syncCriticalPaymentNow()`; energia só tem persistência imediata quando se salva a fatura inteira, não quando se muda o status pago.

**Recomendação:** criar `syncCriticalUtilityPaymentNow(tipo, allocationId)` e só informar sucesso em nuvem após a confirmação. Manter um marcador visual “salvo localmente / sincronizado”.

### 6. Alterar um rateio já pago altera o valor histórico sem ajuste

**Risco:** médio/alto — recibo e histórico podem mudar depois da cobrança.

**Evidência:** ao editar uma alocação, energia e água recalculam todos os valores e preservam `paid`/`paidAt` do registro anterior. Não existe valor originalmente cobrado, versão ou lançamento de diferença.

**Recomendação:** bloquear alteração de leitura/valor que afete uma unidade já paga; oferecer “criar ajuste” com valor, motivo, data e comprovante. Registrar uma versão imutável da fatura enviada.

### 7. “Recebido” representa principal; “caixa” é calculado apenas no modal

**Risco:** médio — usuário pode interpretar “Recebido” como tudo o que entrou no caixa.

**Evidência:** `monthlyFinancialMetrics.received` soma principal; juros e multa são somados em `receivedChargesForMonth()` para o modal de composição. O resumo principal não deixa essa convenção suficientemente explícita.

**Recomendação:** padronizar três medidas: “Aluguéis recebidos”, “Encargos recebidos” e “Caixa recebido”. Em todo relatório, declarar qual medida está sendo exibida. O resultado líquido deve ter regra explícita: caixa ou competência.

### 8. Juros e multa dependem de convenções não formalizadas na configuração

**Risco:** médio — disputa sobre cálculo em casos de pagamento parcial e acordo.

**Evidência:** juros são taxa mensal dividida por 30 e contam a partir do vencimento ou da última baixa de encargos; multa incide uma única vez sobre o saldo que restava ao lançar a baixa. A implementação é coerente, mas a política não é apresentada como regra contratual versionada nem registra a regra usada em cada lançamento.

**Recomendação:** salvar no pagamento uma “memória de cálculo” imutável: regra, taxa, base, período, data de corte e arredondamento. Permitir configurar se juros contam a partir do dia seguinte ao vencimento e se acordo suspende juros até nova data.

### 9. Data de referência para cálculos não é auditável no relatório

**Risco:** médio — o mesmo atraso muda diariamente, sem explicar ao usuário a data de corte.

**Evidência:** `lateChargeBreakdown()` usa `new Date()` quando nenhuma data é passada. Relatórios anuais, cartões e modais podem ser abertos em datas diferentes com valores diferentes.

**Recomendação:** cada tela financeira deve informar “calculado em DD/MM/AAAA” e permitir selecionar data de posição para relatórios/exportações.

### 10. Rateio sem consumo não possui política explícita para custo mínimo/fixo

**Risco:** médio — fatura pode ter tarifa fixa, mas unidade de consumo zero recebe R$ 0,00.

**Evidência:** `calculateAllocation()` distribui a fatura somente entre leituras positivas.

**Recomendação:** configurar por empreendimento: “100% proporcional”, “taxa fixa + proporcional” ou “mínimo por unidade”. O demonstrativo precisa revelar a regra usada.

### 11. Registros financeiros podem crescer até exceder limites práticos do Firestore

**Risco:** médio — falhas de sincronização conforme aumenta histórico.

**Evidência:** pagamentos de todas as competências de uma unidade ficam reunidos em `payments/{unitId}`; água permanece em `meta/app`; histórico de operação e backups também podem crescer no metadado.

**Recomendação:** mover baixa, rateio, cobrança e auditoria para documentos individuais pagináveis. Manter nos documentos agregados somente resumos/cache reconstruível.

### 12. Não existe trilha de auditoria financeira imutável

**Risco:** médio — é possível corrigir ou excluir baixa sem uma reconciliação formal visível.

**Evidência:** há `operationHistory` e backups, porém eles fazem parte do estado editável/sincronizável e não são um livro-caixa imutável com antes/depois, autor e justificativa.

**Recomendação:** criar “Livro de eventos” somente-acréscimo para: criação/edição/exclusão de baixa, dispensa de multa/juros, alteração de rateio e encerramento. Exigir justificativa em alterações que mudem valor já recebido.

## Melhorias de confiabilidade e processo

### 13. Criar suíte de testes numéricos, não apenas testes de presença

**Prioridade:** alta.

**Cenários mínimos:**

- pagamento no dia do vencimento, no dia seguinte e em fevereiro/meses de 30 dias;
- multa de 10% e juros de 1% a.m. com 1, 15 e 60 dias;
- baixa parcial antes e depois do vencimento;
- dispensa de multa, dispensa de juros e ambas;
- acordo com novo vencimento;
- dois contratos na mesma unidade/competência;
- contrato encerrado com parcelas abertas e posterior recebimento;
- rateio com centavos, leitura inicial, leitura zerada, leitura menor e leitura já paga;
- soma de grade = modal de composição = relatório anual = relatório de inadimplência.

Os testes devem validar números exatos e invariantes, não somente textos ou nomes de funções.

### 14. Criar reconciliação financeira automática

**Prioridade:** alta.

Uma rotina deve comparar, por competência e empreendimento:

`parcelas previstas = quitadas + abertas + canceladas/fora do período`

e, para caixa:

`caixa de aluguéis + encargos = soma de todas as baixas efetivamente registradas`.

Diferenças devem aparecer em uma tela “Conferência” com links para os lançamentos causadores. Não corrigir automaticamente valores financeiros.

### 15. Separar claramente três conceitos de período

**Prioridade:** alta.

Hoje, “competência da parcela”, “data real de recebimento” e “data de posição dos juros” coexistem. O sistema deve sempre mostrar os três quando forem relevantes. Relatório de competência e fluxo de caixa devem ser relatórios diferentes, com nomes inequívocos.

### 16. Fazer backups verificáveis e restauração em ambiente seguro

**Prioridade:** média.

Antes de cada migração de modelo financeiro, gerar backup exportável com checksum, data, quantidade de registros e totais por competência. Oferecer restauração em modo prévia, comparando totais antes de confirmar.

### 17. Validar regras do Firestore com emulador e perfis reais

**Prioridade:** média.

As regras estão bem estruturadas, mas devem receber testes automatizados para owner, admin, operator, billing, finance e viewer. Prioridade para: rateio de água, baixa de pagamento, metadados e exclusões. Hoje a incompatibilidade entre `manageExpenses` e a escrita no `meta/app` de água é um exemplo de regra que a UI aceita, mas o backend pode negar.

### 18. Adotar arredondamento e moeda como serviço único

**Prioridade:** média.

Há arredondamento no rateio, mas os cálculos de juros e rescisão trabalham com números de ponto flutuante até a apresentação. Centralizar `roundCurrency` nos pontos de persistência e definir: arredondamento por evento, por dia e por total. Nunca comparar dinheiro somente por igualdade de ponto flutuante.

### 19. Tornar ações financeiras reversíveis, não destrutivas

**Prioridade:** média.

Em vez de apagar uma baixa, criar “estorno” que preserve a operação original, o motivo e o usuário. Para correção, registrar substituição vinculada. Isso facilita conferência e reduz receio de números “que não existem”.

### 20. Criar painel de saúde do sistema

**Prioridade:** média.

Exibir: última sincronização confirmada, quantidade de alterações locais pendentes, conflitos, último backup, erros de validação, totais divergentes e versão do aplicativo. Isso evita que uma alteração pareça salva quando está apenas no telefone.

## Ordem de execução recomendada

1. Corrigir o armazenamento/sincronização/permissões de água e da baixa de utilidades.
2. Criar a entidade de parcela identificada por contrato e migrar os dados atuais com backup.
3. Centralizar cálculo de dívida aberta e fazer todos os resumos/relatórios usarem a mesma função.
4. Consolidar débitos reais no módulo de rescisão.
5. Implementar reconciliação financeira e testes numéricos de regressão.
6. Implantar livro de eventos, backups verificáveis e painel de saúde.

## Limites desta auditoria

Não houve acesso aos dados reais do Firestore, às regras efetivamente publicadas no console nem execução em navegador/mobile nesta rodada. Antes de declarar os valores atuais como reconciliados, é necessário executar a futura rotina de conferência contra a base real e revisar os casos já cadastrados de contratos sobrepostos, rescisões e baixas parciais.
