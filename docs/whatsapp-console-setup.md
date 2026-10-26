# Console privado de WhatsApp — Bessie

## Objetivo
Adicionar uma área administrativa ao site existente sem alterar a página pública. A área deverá permitir gerenciar envios pela WhatsApp Business Platform (Cloud API), após configuração da Meta.

## Administradora autorizada
- E-mail permitido no Cloudflare Access: `bessie.bsbsh@gmail.com`

## Estado inicial
O repositório atual é um site estático com `index.html`, imagens e arquivos SEO. Não há backend de WhatsApp identificado nesta revisão.

## Regras de segurança obrigatórias
1. **Não publicar uma página administrativa funcional antes de proteger o caminho no edge.** Um link escondido ou uma tela de login feita só em JavaScript não protege o painel.
2. Criar uma aplicação Cloudflare Access para o caminho administrativo e permitir somente `bessie.bsbsh@gmail.com`; ativar verificação por e-mail/OTP ou um provedor de identidade.
3. Não colocar tokens da Meta, app secret, credenciais ou chaves no HTML, JavaScript do navegador, GitHub ou histórico do repositório.
4. Guardar tokens como secrets no backend Cloudflare Workers e validar a identidade autenticada no servidor em cada rota protegida.
5. Adicionar limites de envio, validação de números, confirmação antes de campanhas, logs sem dados sensíveis e bloqueio de destinatários que pediram para não receber mensagens.
6. Configurar webhook da Meta com verificação de assinatura e validação do token de verificação.
7. Não realizar envios reais até que o número, WABA, token e templates estejam configurados e testados.

## Sequência de implantação
1. Confirmar a elegibilidade do número atual do WhatsApp Business para coexistência com a Cloud API. Não remover o número do aplicativo nem iniciar migração sem revisar as opções oferecidas pela Meta.
2. No painel Cloudflare, configurar Cloudflare Access para proteger a rota administrativa e autorizar somente o e-mail acima.
3. Implementar a área administrativa e o backend como Worker/rotas server-side; manter as chaves somente em secrets.
4. Configurar Meta for Developers, WhatsApp Business Account, número, webhook e modelos de mensagem.
5. Testar autenticação, envio de teste permitido, webhooks, limites e logs antes de liberar campanhas.

## Importante
O e-mail listado aqui é apenas a configuração desejada. Este arquivo não cria, por si só, uma política Cloudflare Access e não garante que a área esteja protegida. A proteção precisa ser efetivamente configurada e testada no painel Cloudflare antes de publicar qualquer interface administrativa.
