# Barbearia Nilles

Site público com agendamento integrado à API do sistema. O cliente escolhe serviço, profissional, data e horário, informa nome, e-mail e celular e envia uma solicitação pendente. A barbearia confirma ou cancela pelo aplicativo; o site não informa que o horário está confirmado antes dessa decisão.

## Publicar na Netlify

Use `npm run build` como comando de build e `.next` como diretório de publicação, com a integração Next.js da Netlify. Configure `AGENDA_API_URL` e `AGENDA_TENANT_SLUG` para manter o agendamento integrado à API existente.

O módulo `db/index.ts` usa Netlify Database (Postgres) com Drizzle, sem bindings do Cloudflare ou configuração manual de conexão. O schema fica em `db/schema.ts`; gere migrações com `npm run db:generate`. As migrações em `netlify/database/migrations` são aplicadas pela plataforma durante o deploy. A migração inicial cria a tabela de agendamentos e mantém a restrição de horário único; ela não importa dados de um banco D1 existente nem substitui a API de agendamento.

Os exemplos D1 e as ferramentas de build do Cloudflare permanecem como referências legadas, fora da verificação TypeScript do aplicativo Next.js. As migrações SQLite em `drizzle/` não são usadas pela Netlify.

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
npm install
npm run dev
npm test
```

O fluxo de agendamento fica em `app/agendamento/page.tsx`, o proxy da API em `app/api/appointments/route.ts` e os cálculos de horário/fuso em `lib/booking.js`.
