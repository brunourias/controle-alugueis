# Segurança do Firestore

O arquivo `firestore.rules` é a fonte versionada das regras de acesso do sistema. Ele protege os dados por área de trabalho, assinatura e perfil:

- **owner/admin:** gestão da área, equipe e permissões;
- **operator:** unidades, contratos, cobranças, pagamentos e gastos;
- **billing:** somente campos de cobrança e pagamento permitidos;
- **finance:** pagamentos e gastos, sem alterar contratos;
- **viewer:** somente leitura.

As regras também bloqueiam escrita de contas com assinatura vencida e exigem que convites sejam aceitos pelo mesmo e-mail convidado.

## Publicar uma alteração

1. Revise a alteração em `firestore.rules`.
2. No Firebase Console, abra **Firestore Database → Rules**.
3. Cole o conteúdo do arquivo e clique em **Publicar**.
4. Teste uma conta de cada perfil em uma área de trabalho de teste.

> A administração global atual está protegida pelo e-mail definido na função `platformAdmin()`. Se o administrador mudar, atualize esse e-mail nas regras e em `app.js`, publique os dois e teste o painel antes de remover o acesso anterior.

## Checklist de validação

- Uma conta sem aprovação não cria área pessoal.
- Um visitante não lê outra área de trabalho.
- Um perfil de consulta não grava nenhum dado.
- Cobrança não altera contrato, gastos ou configurações.
- Financeiro não altera contrato.
- Convite vencido, revogado ou aberto com outro e-mail é recusado.
- Assinatura vencida permite leitura, mas bloqueia escrita.

## Próxima evolução

Migrar pagamentos e cobranças para documentos próprios reduzirá o tamanho da unidade e deixará as permissões de baixa ainda mais simples de auditar.
