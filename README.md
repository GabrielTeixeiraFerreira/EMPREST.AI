# EMPREST.AI

## Desenvolvimento

Instale as dependências e inicie o frontend com:

```bash
npm install
npm run dev
```

Defina `VITE_API_URL` no arquivo `.env` antes do build para apontar para a
API correspondente ao ambiente. O valor padrão é `http://localhost:3000/v1`.

Para gerar o bundle de produção:

```bash
npm run build
```