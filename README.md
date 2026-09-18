# DocFlow

Aplicação web para upload e processamento assíncrono de documentos.

O usuário envia um arquivo, a API responde imediatamente e um worker Celery processa o documento em segundo plano. O frontend acompanha os estados `PENDING`, `PROCESSING`, `COMPLETED` e `FAILED`.

## Destaques

- Autenticação com JWT e refresh token
- Upload com validação de extensão e tamanho
- Isolamento de documentos por usuário
- Processamento assíncrono com Celery e Redis
- Dashboard com status e documentos recentes
- API documentada com Swagger
- Testes automatizados com pytest
- Ambiente reproduzível com Docker Compose

## Stack

- **Backend:** Python, Django, Django REST Framework, PostgreSQL
- **Processamento:** Celery e Redis
- **Frontend:** Next.js, TypeScript, Tailwind CSS
- **Qualidade:** pytest, Ruff, ESLint e TypeScript
- **Infraestrutura:** Docker Compose

## Arquitetura

```text
Next.js → Django REST Framework → PostgreSQL
                    ↓
              Celery → Redis
```

O upload salva o documento e publica a task depois do commit da transação. Assim, o worker só começa quando o registro já existe no banco.

## Executar localmente

Pré-requisitos: Docker Desktop e Git.

```powershell
git clone <url-do-repositorio> docflow
cd docflow
Copy-Item .env.example .env
docker compose up --build
```

Aplicação: <http://localhost:3000>

API: <http://localhost:8000>

Swagger: <http://localhost:8000/api/docs/>

Para criar um usuário administrador:

```powershell
docker compose exec backend python manage.py createsuperuser
```

Para parar os serviços:

```powershell
docker compose down
```

## Endpoints principais

```text
POST   /api/auth/register/       Cadastro
POST   /api/auth/token/          Login
GET    /api/accounts/me/         Usuário autenticado
GET    /api/documents/           Lista documentos
POST   /api/documents/           Envia documento
GET    /api/documents/{id}/      Consulta documento
DELETE /api/documents/{id}/      Remove documento
GET    /api/health/              Health check
```

## Testes

```powershell
docker compose exec backend pytest
docker compose exec backend ruff check .

cd frontend
npm run lint
npm run typecheck
```

Os testes cobrem autenticação, permissões, upload, filtros, isolamento entre usuários e transições da task Celery.

## Estrutura

```text
docflow/
├── backend/
│   ├── accounts/       autenticação e perfil
│   ├── core/           health check e paginação
│   ├── documents/      domínio de documentos e processamento
│   └── tests/          testes da API e das tasks
├── frontend/
│   ├── src/app/        páginas e layouts
│   ├── src/components/ componentes de interface
│   └── src/lib/        API client, autenticação e tipos
├── docker-compose.yml
└── .env.example
```

## Próximos passos

Para produção, usar `DJANGO_DEBUG=False`, secrets reais, Gunicorn, serviços gerenciados de Postgres e Redis e armazenamento externo para os arquivos.
