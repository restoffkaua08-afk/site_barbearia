# Barbearia Nilles

Site público com agendamento integrado à API do sistema. O cliente escolhe serviço, profissional, data e horário, informa nome, e-mail e celular e envia uma solicitação pendente. A barbearia confirma ou cancela pelo aplicativo; o site não informa que o horário está confirmado antes dessa decisão.

## Publicar na Vercel

1. Importe este repositório na Vercel e mantenha a raiz do projeto como diretório de publicação.
2. Configure as variáveis de ambiente no projeto e em cada ambiente utilizado:
   - `AGENDA_API_URL`: URL HTTPS da API, sem rota adicional (por exemplo, `https://api.seudominio.com`).
   - `AGENDA_TENANT_SLUG`: slug exato da barbearia cadastrado na API.
3. Faça o deploy com Node.js 22 ou superior. Os comandos do projeto são `npm run build` e `npm start`.

Não coloque segredos da API no navegador. O site encaminha as chamadas pelo endpoint de servidor `/api/appointments`; sem as duas variáveis, a agenda responde como indisponível.

## API e dados necessários

A API precisa estar publicada e configurada com banco de dados, proteção contra abuso e um estabelecimento ativo contendo serviços, profissionais vinculados e horários de funcionamento. Ela deve oferecer `GET /v1/public/:slug/catalog`, `GET /v1/public/:slug/appointments?staffId=...` e `POST /v1/public/:slug/appointments`, conforme o contrato do sistema de agendamento. O backend valida novamente o horário e evita reservas simultâneas; os horários exibidos no site não substituem essa validação.

O pedido exige nome, e-mail e telefone. A autorização de contato pelo WhatsApp é opcional e é enviada como preferência, não dispara mensagens automaticamente. O fluxo do aplicativo pode preparar uma mensagem para envio manual pela loja.

## Desenvolvimento e teste

Requer Node.js 22 ou superior.

```sh
npm ci
npm run dev
npm test
```

O fluxo de agendamento fica em `app/agendamento/page.tsx`, o proxy da API em `app/api/appointments/route.ts` e os cálculos de horário/fuso em `lib/booking.js`.
