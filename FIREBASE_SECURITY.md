# Segurança do Firestore

As regras em `firestore.rules` protegem dados por área de trabalho e perfil:

- **owner/admin:** gestão da área, equipe e permissões;
- **operator:** contratos, unidades, cobranças e gastos;
- **billing:** leitura; a baixa de pagamento continua dependente da futura separação dos pagamentos em documentos próprios;
- **finance:** gastos e leitura;
- **viewer:** somente leitura.

## Antes de publicar

1. No Firebase Authentication, copie o **UID** da conta administradora.
2. No Firestore, crie manualmente o documento `platformAdmins/{UID}` com, por exemplo:

```json
{ "active": true, "createdAt": 0 }
```

3. No Console do Firebase, abra **Firestore Database → Rules**, cole o conteúdo de `firestore.rules` e publique.
4. Faça um teste com: proprietário, operador, financeiro, cobrança e consulta.

> Não publique as regras sem cadastrar o administrador. O painel de Administração da plataforma precisa desse documento para continuar acessando contas, planos e auditoria.

## Próxima evolução de permissões

Pagamentos e cobranças ainda fazem parte do documento da unidade. Para restringir no servidor que o perfil de cobrança altere somente pagamentos — sem poder alterar o contrato — será preciso mover pagamentos para uma subcoleção própria. As regras atuais mantêm esse perfil em leitura nesses documentos para não conceder permissão excessiva.
