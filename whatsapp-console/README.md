# Console privado do WhatsApp — Bessie

Este diretório é uma base inicial de implementação; não está ativo no site até ser implantado e protegido. A página HTML, sozinha, não envia mensagens sem o endpoint Worker.

## Acesso restrito

1. Configure uma aplicação Cloudflare Access para o hostname administrativo. Crie uma política **Allow** com selector **Emails** e valor exato `bessie.bsbsh@gmail.com`; não use “Everyone” nem “Emails ending in”.
2. Configure o hostname/rota de forma que a página e o endpoint API fiquem atrás do Access.
3. No Worker, configure `CF_ACCESS_TEAM_DOMAIN` como o domínio da equipe Zero Trust (ex.: `https://sua-equipe.cloudflareaccess.com`, sem barra final) e `CF_ACCESS_AUD` como o Application Audience (AUD) da aplicação Access. O Worker valida a assinatura JWT e o e-mail permitido em cada requisição de envio, inclusive no endpoint de API.
4. Teste que uma sessão sem login e qualquer outro e-mail recebem HTTP 401. Não exponha o endpoint em uma rota que ignore a validação.

## Configuração do Worker

Defina estas variáveis não secretas no ambiente do Worker:
- `CF_ACCESS_TEAM_DOMAIN`
- `CF_ACCESS_AUD`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_GRAPH_VERSION` (use uma versão Graph API suportada pela Meta e mantenha-a atualizada)

Cadastre `WHATSAPP_TOKEN` como **secret** pelo painel Cloudflare ou comando `wrangler secret put WHATSAPP_TOKEN`. Nunca coloque o token em HTML, no Git ou nesta documentação.

A página espera o endpoint `POST /api/whatsapp/send`. O worker.js é um handler independente e precisa ser integrado à configuração de deploy existente; não substitua o Worker atual sem verificar como os assets do site são servidos.

## Fluxo inicial e limites

- Envia somente templates do WhatsApp aprovados pela Meta; não oferece envio em massa.
- Exige confirmação explícita e declaração de consentimento na interface. Isso é uma confirmação operacional, não prova automática de consentimento; mantenha registros de opt-in e respeite pedidos de descadastro.
- Antes de produção, adicione rate limiting, registro de auditoria sem armazenar tokens/dados excessivos, tratamento de opt-out e testes de segurança.
- A Cloud API pode cobrar mensagens conforme as regras e tarifas vigentes da Meta. O uso da API não é automaticamente gratuito.
- A coexistência com o WhatsApp Business do celular depende da elegibilidade do número e do processo de onboarding da Meta ou de parceiro compatível. Não é garantida.

## Implantação segura

A branch de desenvolvimento é `feature/whatsapp-private-console`. Estes arquivos são apenas o primeiro passo: não estão implantados nem conectados ao número real. Revise o `worker.js`, integre o handler com o deploy atual, configure secrets e Access, teste em ambiente controlado e só então publique.
