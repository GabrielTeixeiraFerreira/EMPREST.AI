# EMPREST.AI

## Desenvolvimento

Instale as dependências e inicie o frontend com:

```bash
npm install
npm run dev
```

Defina `VITE_API_URL` no arquivo `.env` antes do build para apontar para a
API correspondente ao ambiente. O valor pode ser informado com ou sem o
prefixo `/v1`; o frontend o normaliza automaticamente. O valor padrão é
`http://localhost:3000/v1`.
No projeto da Vercel, use `VITE_API_URL=https://emprestaiback.vercel.app` e
faça um novo deploy após salvar a variável.

Para gerar o bundle de produção:

```bash
npm run build
```