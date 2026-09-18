# DocFlow

Aplicação web para upload e processamento assíncrono de documentos. A API é feita com
Django REST Framework e o frontend com Next.js. O processamento acontece em um worker
Celery usando Redis como broker.

## Features

- Cadastro e login com JWT (SimpleJWT), incluindo refresh token
- Upload de documentos com validação de extensão e tamanho
- Processamento assíncrono com Celery + Redis (`PENDING → PROCESSING → COMPLETED | FAILED`)
- Listagem paginada, ordenada por data e filtrável por status
- Isolamento por usuário garantido no backend (queryset + permission)
- Dashboard com totais por status e documentos recentes
- Documentação automática da API com drf-spectacular (Swagger)
- Health check em `/api/health/`
- Testes com pytest cobrindo autenticação, documentos e a task Celery
- Ambiente completo em Docker Compose

## Como funciona

Fluxo da requisição:

```
Next.js (App Router, TypeScript)
        ↓  fetch + JWT
Django REST Framework
        ↓  ORM
PostgreSQL
```

Fluxo assíncrono:

```
Django (POST /api/documents/)
        ↓  publica a task após o commit
Celery (worker)
        ↓  consome a fila
Redis (broker)
        ↓
atualiza o status do documento no PostgreSQL
```

O upload responde `201` com status `PENDING`. Depois do commit da transação, o Celery
processa o arquivo e atualiza o status para `COMPLETED` ou `FAILED`. O frontend consulta
os documentos enquanto houver itens pendentes.

## Stack

**Backend**
Python 3.11, Django 5, Django REST Framework, SimpleJWT, drf-spectacular, django-filter,
django-cors-headers, Celery, Redis, psycopg 3.

**Frontend**
Next.js 14 (App Router), TypeScript, Tailwind CSS, React Hook Form, Zod, lucide-react.

**Infraestrutura**
Docker, Docker Compose, PostgreSQL 16, Redis 7.

**Qualidade**: pytest, pytest-django, Ruff, ESLint e TypeScript.

## Executar localmente

Pré-requisitos: Docker Desktop e Git. Comandos testados no PowerShell (Windows 11).

```powershell
git clone <url-do-repositorio> docflow
cd docflow
Copy-Item .env.example .env
docker compose up --build
```

As migrations rodam automaticamente na subida do container `backend`. Se quiser
executá-las manualmente:

```powershell
docker compose exec backend python manage.py migrate
```

Criar um superusuário para acessar o admin:

```powershell
docker compose exec backend python manage.py createsuperuser
```

Endereços:

| Serviço      | URL                                |
| ------------ | ---------------------------------- |
| Frontend     | http://localhost:3000              |
| API          | http://localhost:8000              |
| Swagger      | http://localhost:8000/api/docs/    |
| Schema       | http://localhost:8000/api/schema/  |
| Health check | http://localhost:8000/api/health/  |
| Admin        | http://localhost:8000/admin/       |

Parar tudo e limpar volumes:

```powershell
docker compose down -v
```

### Rodando sem Docker (opcional)

Postgres e Redis continuam em container; só a API roda local.

```powershell
docker compose up -d db redis
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
python manage.py migrate
python manage.py runserver
```

Em outro terminal, o worker:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
celery -A config worker --loglevel=info --pool=solo
```

> No Windows, use `--pool=solo`: o pool padrão (prefork) não funciona bem fora do Linux.

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

## Variáveis de ambiente

Copie `.env.example` para `.env` na raiz do projeto. Nenhum segredo entra no Git.

```env
DJANGO_SECRET_KEY=troque-esta-chave-em-producao
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,backend
DJANGO_TIME_ZONE=America/Sao_Paulo

POSTGRES_DB=docflow
POSTGRES_USER=docflow
POSTGRES_PASSWORD=docflow
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

JWT_ACCESS_MINUTES=30
JWT_REFRESH_DAYS=7

CORS_ALLOWED_ORIGINS=http://localhost:3000
CSRF_TRUSTED_ORIGINS=http://localhost:3000

CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/1
DOCUMENT_PROCESSING_DELAY_SECONDS=3

MAX_UPLOAD_SIZE_MB=10
ALLOWED_UPLOAD_EXTENSIONS=pdf,txt,md,csv,docx,xlsx,png,jpg,jpeg

NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## API principal

| Método | Endpoint                    | Descrição                             | Auth |
| ------ | --------------------------- | ------------------------------------- | ---- |
| POST   | `/api/auth/register/`       | Cria uma conta                        | não  |
| POST   | `/api/auth/token/`          | Login, retorna access e refresh        | não  |
| POST   | `/api/auth/token/refresh/`  | Renova o access token                  | não  |
| GET    | `/api/accounts/me/`         | Perfil do usuário autenticado          | sim  |
| GET    | `/api/documents/`           | Lista documentos do usuário            | sim  |
| POST   | `/api/documents/`           | Envia documento (multipart)            | sim  |
| GET    | `/api/documents/{id}/`      | Detalhe de um documento                | sim  |
| DELETE | `/api/documents/{id}/`      | Remove um documento                    | sim  |
| GET    | `/api/health/`              | Health check                           | não  |

Parâmetros da listagem: `?status=COMPLETED`, `?ordering=-created_at`, `?page=2`,
`?page_size=20`.

Exemplo de upload:

```powershell
$token = (Invoke-RestMethod -Uri http://localhost:8000/api/auth/token/ -Method Post `
  -ContentType "application/json" `
  -Body '{"username":"alice","password":"SenhaForte!234"}').access

curl.exe -X POST http://localhost:8000/api/documents/ `
  -H "Authorization: Bearer $token" `
  -F "file=@C:\caminho\para\arquivo.pdf"
```

## Testes

```powershell
docker compose exec backend pytest
docker compose exec backend pytest -v
docker compose exec backend ruff check .
```

Frontend:

```powershell
cd frontend
npm run lint
npm run typecheck
```

O que é testado:

- **Auth**: registro com hash de senha, senhas divergentes, login com tokens, rota
  protegida sem token, token inválido
- **Documents**: upload autenticado, upload sem token, extensão não permitida, listagem
  só com os próprios documentos, acesso e exclusão de documento de outro usuário (404),
  exclusão do próprio documento, filtro por status, ordenação
- **Celery**: task publicada após o commit, sucesso muda para `COMPLETED` com
  `processed_at`, falha muda para `FAILED` com mensagem, task ignora documento inexistente

## Estrutura

```
docflow/
├── backend/
│   ├── config/            # settings, urls, celery, wsgi
│   ├── core/              # health check e paginação padrão
│   ├── accounts/          # registro, JWT, perfil
│   ├── documents/         # model, serializers, views, permissions, services, tasks
│   ├── tests/             # pytest (auth, documents, tasks)
│   ├── Dockerfile
│   ├── manage.py
│   ├── pyproject.toml     # Ruff + pytest
│   └── requirements.txt
├── frontend/
│   ├── src/app/           # App Router: (auth) e (app)
│   ├── src/components/    # UI e componentes de domínio
│   ├── src/lib/api/       # camada única de acesso à API
│   ├── src/lib/types.ts   # User, Document, DocumentStatus, PaginatedResponse
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

## Próximos passos para produção

- Usar `DJANGO_DEBUG=False` e variáveis de ambiente seguras.
- Trocar o `runserver` por Gunicorn.
- Usar Postgres, Redis e armazenamento de arquivos gerenciados.
- Publicar o frontend com `NEXT_PUBLIC_API_URL` apontando para a API.
