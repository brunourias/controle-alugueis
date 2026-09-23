# Auditoria do produto — Controle de Aluguéis

Data da rodada: 23/09/2026  
Base auditada: versão 261; correções preparadas como versão 262.

## A. Resumo executivo

O aplicativo já ultrapassou a fase de protótipo simples. Ele possui autenticação persistente, workspaces, perfis de acesso, sincronização granular no Firestore, operação offline, PWA, pagamentos parciais, recibos, despesas, contratos, histórico, relatórios, rateio de energia, administração e onboarding.

A base funcional é boa, mas ainda não deve ser vendida como SaaS financeiro sem uma etapa adicional de endurecimento. Os maiores riscos encontrados estavam na separação do cache entre contas, persistência local, integridade de IDs, exclusão de histórico e validação de baixas. Esses pontos receberam correções incrementais nesta rodada.

O principal risco remanescente é arquitetural: `app.js` e `styles.css` concentram quase todo o produto. A sincronização já detecta conflitos, mas a mesclagem ainda trabalha com registros amplos e não oferece histórico imutável no servidor. Isso é suficiente para uso controlado, porém não para prometer rastreabilidade financeira plena a clientes pagantes.

## Inventário do sistema atual

### Telas e áreas

- Portão de acesso e autenticação por e-mail, senha e Google.
- Bloqueio local por PIN e suporte condicional a biometria.
- Início com central de ações e resumo do mês.
- Visão geral, unidades, financeiro, cobranças, gastos, imposto de renda e relatórios.
- Rateio de energia com leituras, cobrança, comparativos e histórico.
- Administração da plataforma, planos, aprovações e auditoria administrativa.
- Configurações, empreendimentos, categorias, equipe, permissões, backup e segurança.
- Onboarding contextual do primeiro uso.

### Modais e fluxos principais

- Unidade/contrato, cobrança, gasto, pagamento, parcelas históricas, recibo, relatório anual, rateio de energia, configurações, autenticação e administração.
- Pagamento integral, atrasado, parcial, acordo de saldo, correção e exclusão de baixa.
- Encerramento e novo contrato com preservação de histórico.
- Recibo individual e recibo de baixa parcial.
- Exportação/importação de backup e backups versionados internos.

### Dados e persistência

- Estado local em `localStorage`, com normalização de versões antigas.
- Estado granular em Firestore: metadados, unidades, contratos, pagamentos, cobranças, despesas e rateios.
- Detecção de conflito por comparação com uma base remota conhecida.
- Service Worker com estratégia network-first para aplicação e cache-first para ícones.
- Dados pessoais armazenados: nome, telefone, e-mail, observações e informações contratuais do inquilino.

## B. Problemas encontrados

### P0 — críticos

1. O cache local era compartilhado pela mesma chave entre contas diferentes no mesmo aparelho. Uma troca de usuário poderia levar dados da conta anterior para a reconciliação da nova conta.
2. Falha ou lotação do `localStorage` podia interromper o salvamento com exceção, sem garantia de feedback adequado.

### P1 — graves

1. A validação de pagamento misturava `||` com operador ternário. Pela precedência da expressão, uma baixa de valor zero podia ser aceita.
2. IDs ausentes, inválidos ou duplicados podiam colidir ao converter registros locais em documentos granulares do Firestore.
3. A exclusão de uma unidade permitia remover pagamentos, recibos, cobranças, anexos e contratos históricos depois de uma confirmação genérica.
4. Links de anexos vindos de backup ou nuvem não validavam o protocolo antes de virarem links clicáveis.
5. A mesclagem automática escolhe registros pelo `updatedAt`, mas vários objetos antigos ainda não possuem revisão própria. Conflitos simultâneos no mesmo registro continuam exigindo decisão humana.
6. O modelo de `paymentHistory` usa uma chave por unidade e competência. Dois contratos da mesma unidade no mesmo mês podem ser exibidos, mas não possuem dois lançamentos financeiros independentes completos.

### P2 — importantes

1. O teste de responsividade da central de ações falhava por depender de uma distância fixa entre declarações CSS, apesar da regra visual existir.
2. A leitura monetária aceitava `1.500` como `1.5` quando não havia vírgula.
3. O término da ativação de workspace possuía instruções inalcançáveis após um `return`, atrasando a atualização visual e do status.
4. Erros tratados do Firebase eram escritos como três erros no console.
5. Percentuais de multa e juros aceitavam valores sem limite superior na normalização e no salvamento.
6. No celular de 360 px, a grade anual continua utilizável por rolagem, mas valores auxiliares e ícones ficam pequenos. É uma dívida de acessibilidade, não uma quebra funcional.

### Cálculos financeiros

- Multa: percentual único sobre o saldo principal elegível.
- Juros: taxa mensal convertida em taxa diária por divisão por 30.
- Pagamento no vencimento usa comparação de dia civil e não é marcado como atraso.
- Baixas parciais separam total pago, encargos e principal abatido.
- Juros históricos pagos são lidos do lançamento persistido, portanto mudanças futuras da configuração não reescrevem recibos pagos.
- O saldo aberto usa a configuração vigente. Para comercialização, a política contratual do saldo deveria ser versionada no contrato ou acordo.

### Dados e histórico

- Há normalização de estruturas antigas e preservação de contratos encerrados.
- Recibos usam valores persistidos quando existe pagamento registrado.
- Ainda há dependência de dados atuais em algumas consultas agregadas quando um registro histórico antigo não contém todos os campos. Isso é uma compatibilidade necessária, mas reduz a força probatória dos dados legados.

### Sincronização

- A separação granular e a verificação de base antes da escrita são positivas.
- Escritas são feitas em lotes de até 400 operações.
- Não há fila durável de operações offline; o estado local completo é a recuperação.
- Não existe resolução por campo nem log financeiro imutável no backend.
- As regras do Firestore não possuem testes automatizados com Emulator Suite no repositório.

### UX e UI

- Navegação e vocabulário estão majoritariamente padronizados.
- Modais encadeados possuem pilha e foco restaurado.
- Estados de salvamento e sincronização são visíveis.
- O CSS acumulou muitas camadas corretivas e uso frequente de `!important`, aumentando risco de regressão.
- Textos abaixo de aproximadamente 11 px ainda aparecem em áreas densas no mobile.

### Segurança e privacidade

- Dados renderizados por `innerHTML` são geralmente escapados com `escapeHtml`.
- A chave pública do Firebase no cliente não é segredo; a proteção real está nas regras.
- O e-mail administrativo está fixo no código e nas regras. Não é segredo, mas dificulta governança e troca de responsável.
- O PIN é uma barreira local de interface, não criptografia do banco local.
- Ainda faltam política de retenção, exportação por titular, exclusão controlada e registro de consentimento para uma operação comercial aderente à LGPD.

### Performance e código

- Para dezenas de unidades, a aplicação é adequada.
- `app.js` tem cerca de 10 mil linhas e `styles.css` mais de 7 mil linhas.
- Renderizações recalculam diversos indicadores percorrendo unidades, meses e históricos. Com 500 unidades e vários anos, isso tende a ficar perceptível.
- O documento de metadados e os objetos locais ainda podem crescer de forma relevante, embora pagamentos e cobranças já estejam separados na nuvem.

### PWA

- Manifesto, ícones, atalhos, cache versionado e aviso de atualização estão presentes.
- A versão 262 mantém `index`, CSS, JavaScript, motor de energia e Service Worker alinhados.
- Dependências do Firebase são remotas. Em abertura totalmente offline, o funcionamento depende da sessão offline previamente autorizada e do cache do navegador para bibliotecas externas.

## C. Correções realizadas

1. Cache local isolado por UID, com migração compatível do cache anterior e preservação do cache da conta que deixou o aparelho.
2. Tratamento explícito para falha de serialização ou gravação local, com mensagem acionável ao usuário.
3. Cópia recuperável do conteúdo local corrompido quando houver espaço disponível.
4. Normalização de IDs únicos e seguros para unidades, despesas, tarefas e rateios.
5. Correção da precedência na validação de baixa e bloqueio explícito de pagamento igual a zero.
6. Proteção contra exclusão de unidade com contratos, pagamentos, atrasos, cobranças, anexos ou outro histórico.
7. Conversão segura de `1.500`, `1.500,00` e `1500.00`.
8. Limite de 0% a 100% para multa e juros mensais.
9. Validação de protocolo em links importados de anexos.
10. Remoção de mensagens técnicas tratadas do nível de erro do console.
11. Correção do encerramento da troca de workspace, atualizando status e controles.
12. Correção do teste CSS frágil e ampliação das verificações de regressão.
13. Atualização coordenada do cache PWA para a versão 262.

## D. Arquivos importantes alterados

- `app.js`: integridade dos dados, cache por usuário, persistência, pagamentos, exclusões, URLs e sincronização visual.
- `tests/integrity.mjs`: testes das correções de dinheiro, pagamentos, cache por usuário, exclusão, URLs e console.
- `index.html`: atualização dos recursos para a versão 262.
- `sw.js`: novo cache 262 e precache coerente.

## E. Problemas ainda existentes

1. `app.js` deve ser separado gradualmente em domínio financeiro, persistência, sincronização e UI. Não foi feita uma reescrita nesta rodada por segurança.
2. O modelo financeiro precisa evoluir de `unidade + competência` para `contrato + parcela + baixa`, permitindo múltiplos contratos no mesmo mês sem heurística.
3. A mesclagem precisa de revisão por registro/campo ou de um log de operações durável.
4. Faltam testes do Firestore com emulador, testes de navegador automatizados e testes visuais por breakpoint.
5. Impressão Android, compartilhamento nativo, biometria e reconexão entre dois dispositivos ainda precisam de homologação em dispositivos reais.
6. O upload de documentos está explicitamente desabilitado; a interface apenas lista referências existentes.
7. O CSS precisa de consolidação gradual de tokens e remoção de sobrescritas antigas.

## F. Riscos para produção

- Perda ou divergência em edição simultânea do mesmo registro, caso o usuário escolha a versão incorreta durante um conflito.
- Ausência de trilha financeira imutável para auditoria e contestação.
- Dependência de `localStorage` como contingência; ele tem limite baixo e pode ser limpo pelo navegador.
- Falta de monitoramento, alertas de erro, política formal de backup e restauração testada.
- Regras do Firestore sem teste automatizado podem regredir durante uma publicação.
- Dados pessoais ainda não possuem ciclo completo de retenção e eliminação.

## G. Riscos para escala

- Com 20 unidades: comportamento esperado adequado.
- Com 100 unidades: grade, resumos e relatórios podem exigir memoização e paginação.
- Com 500 unidades: renderização integral, filtros síncronos e estado local monolítico serão gargalos.
- Com vários anos: mapas mensais e backups completos aumentam armazenamento e custo de sincronização.
- Com vários colaboradores: conflitos de edição exigem revisão por documento e transações específicas.

## H. Preparação para monetização

Antes de cobrar, implementar:

1. Entitlements no backend para plano, limites e período de teste; a interface nunca deve ser a fonte da verdade.
2. Provedor de assinatura com webhooks idempotentes e reconciliação de status.
3. Auditoria administrativa sem dados financeiros desnecessários.
4. Backup automático, exportação completa e restauração ensaiada.
5. Política de privacidade, termos, canal de suporte e procedimento LGPD.
6. Analytics com eventos mínimos, sem conteúdo de contratos ou dados pessoais.
7. Observabilidade de erros, sincronização, falhas de recibo e atualizações PWA.
8. Ambiente de homologação separado do ambiente de produção.

## I. Próximos passos para a v1.0

1. Criar suíte de domínio financeiro com casos de vencimento, virada de mês/ano, bissexto, parcial e dois contratos na mesma competência.
2. Adotar entidades explícitas de contrato, parcela e baixa, com IDs independentes e histórico imutável.
3. Testar regras do Firestore no Emulator Suite e bloquear publicação se falharem.
4. Criar testes de navegador dos ciclos principais em desktop e 360/390/768 px.
5. Implementar fila/revisão de operações offline e uma tela de conflitos por registro.
6. Modularizar primeiro cálculos e persistência; depois sincronização; por último componentes de UI.
7. Consolidar Design System sem alterar a identidade visual atual.
8. Homologar recibo, PDF, impressão, compartilhamento, PWA e biometria em Android real.
9. Executar piloto com dados fictícios, depois piloto fechado com poucos proprietários.
10. Somente após telemetria, backup e suporte estarem ativos, iniciar cobrança.

## J. Maturidade do produto

### Estabilidade — boa para uso controlado

Estado atual: inicialização e principais estruturas são defensivas.  
Corrigido: falhas locais, IDs, console tratado e regressão de pagamento zero.  
Falta: testes E2E e observabilidade em produção.

### Integridade dos dados — intermediária

Estado atual: normalização, backups locais e sincronização granular já existem.  
Corrigido: cache por conta, proteção de exclusão e IDs únicos.  
Falta: log financeiro imutável e restauração validada.

### Cálculos financeiros — boa, com dívida de modelagem

Estado atual: fórmula centralizada para multa/juros e valores históricos persistidos.  
Corrigido: baixa zero e moeda brasileira ambígua.  
Falta: suíte matemática abrangente e parcelas vinculadas diretamente a contratos.

### UX — boa

Estado atual: navegação clara, ações principais visíveis e feedback de salvamento.  
Corrigido: status após troca de workspace e mensagens de falha local.  
Falta: reduzir densidade de telas avançadas e testar primeiro uso com pessoas externas.

### UI — intermediária para boa

Estado atual: identidade consistente e profissional.  
Corrigido: nenhuma reformulação desnecessária foi aplicada.  
Falta: consolidar CSS e elevar tamanho mínimo de textos auxiliares.

### Responsividade — boa com ressalvas

Estado atual: a grade anual funciona por rolagem lateral e a navegação mobile é dedicada.  
Validado: viewport estreito de 360 × 740 px.  
Falta: homologação em aparelhos reais, teclado virtual e modais extensos.

### Arquitetura — intermediária

Estado atual: separação de dados na nuvem melhorou, mas o cliente continua monolítico.  
Corrigido: não houve reescrita arriscada.  
Falta: módulos de domínio, persistência e sincronização com contratos claros.

### Qualidade do código — intermediária

Estado atual: muitas funções nomeadas e testes de integridade, porém arquivos excessivamente grandes.  
Corrigido: testes adicionais e condição financeira ambígua.  
Falta: lint, formatação automática, cobertura e remoção segura de CSS/código legado.

### Segurança — intermediária

Estado atual: autenticação, regras, perfis, escaping e reautenticação para ações sensíveis.  
Corrigido: isolamento do cache e protocolo de anexos.  
Falta: testes de regras, CSP, revisão externa e governança do administrador.

### Sincronização — intermediária

Estado atual: granular, com comparação de base, conflito explícito e modo offline.  
Corrigido: separação local por usuário e finalização visual de workspace.  
Falta: fila durável, revisões por entidade e testes reais multi-dispositivo.

### Performance — adequada ao porte atual

Estado atual: satisfatória para poucas dezenas de unidades.  
Corrigido: nenhuma micro-otimização sem evidência foi aplicada.  
Falta: medição com massas de 100 e 500 unidades e vários anos.

### Preparação para comercialização — ainda incompleta

Estado atual: existe uma base de contas, planos, equipe e administração.  
Corrigido: riscos imediatos de cache e integridade foram reduzidos.  
Falta: trilha financeira, backup operacional, testes de regras, observabilidade, LGPD, suporte e cobrança idempotente.

## Evidências de validação

- `node --check app.js`: aprovado.
- `node tests/integrity.mjs`: aprovado.
- `node tests/energy-rate.mjs`: aprovado.
- `git diff --check`: aprovado.
- Inicialização limpa da versão 262 em origem sem cache: sem erros ou avisos no console.
- Verificação visual do início e da grade de unidades em viewport 360 × 740 px.

Não foram feitas alterações em dados reais, pagamentos, permissões ou contas durante a auditoria visual.
