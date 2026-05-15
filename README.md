# Iron Forge — Premium Gym Management System

A complete, production-grade gym management platform built for premium gyms and fitness centers. Built with **Angular 17** (standalone components, signals), **ASP.NET Core 8 Web API** (Clean Architecture), and **PostgreSQL**.

> Modern. Luxurious. Commercial-grade.

---

## 🚀 One-click EXE deployment

Want to ship this as a standalone Windows app — **no .NET, no Node, no Postgres needed on the target machine**?

```cmd
build-exe.bat            ← on Windows
./build-exe.sh           ← on macOS / Linux  (still produces a Windows EXE)
```

You get `dist/IronForge.GymManagement.exe` (~95 MB) that bundles the API, the Angular UI, and a SQLite database in a single file. Double-click and it opens your browser ready to use.

📖 **Full guide (Arabic + English):** see [`EXE-BUILD.md`](./EXE-BUILD.md).

---

## Highlights

- **Premium dark UI** — matte black, metallic silver gradients, glassmorphism, soft glows, smooth animations
- **Complete RBAC** — Owner, Admin, Reception, Coach roles with route- and action-level guards
- **JWT authentication** with BCrypt-hashed passwords
- **Members, Memberships, Payments, Attendance, Reports, Settings** — full lifecycle
- **Real-time dashboard** with 8 KPI stat cards and Chart.js analytics (revenue, attendance, plan popularity, status distribution)
- **Invoice generation** (HTML, browser-printable to PDF) and CSV exports for members/payments/attendance
- **Notifications** with expiry-soon alerts
- **Auto-migration + auto-seed** on first run (4 users, 4 plans, 24 demo members with payments and attendance)

---

## Tech Stack

| Layer       | Technology                                                                 |
| ----------- | -------------------------------------------------------------------------- |
| Frontend    | Angular 17, standalone components, Signals, Reactive Forms, Chart.js       |
| Backend     | ASP.NET Core 8 Web API, Clean Architecture (Domain/Application/Infra/Api)  |
| ORM         | Entity Framework Core 8 + Npgsql                                           |
| Database    | PostgreSQL 14+                                                             |
| Auth        | JWT bearer tokens, BCrypt password hashing                                 |
| Validation  | FluentValidation                                                           |
| Mapping     | AutoMapper                                                                 |
| API docs    | Swagger / OpenAPI                                                          |

---

## Repository structure

```
gym/
├── backend/
│   ├── GymManagement.sln
│   ├── Directory.Build.props
│   ├── db/schema.sql                          # Reference SQL schema
│   └── src/
│       ├── GymManagement.Domain/              # Entities, enums, base types
│       ├── GymManagement.Application/         # DTOs, services, validators, mapping
│       ├── GymManagement.Infrastructure/      # EF Core, JWT, seed, persistence
│       └── GymManagement.Api/                 # Controllers, middleware, Program.cs
└── frontend/
    ├── package.json
    ├── angular.json
    ├── tsconfig.json
    └── src/
        ├── main.ts
        ├── styles.scss                        # Premium design system
        └── app/
            ├── app.config.ts
            ├── app.component.ts
            ├── app.routes.ts
            ├── core/
            │   ├── guards/                    # auth.guard, role.guard
            │   ├── interceptors/              # auth + error
            │   ├── models/                    # TS DTOs mirroring API
            │   └── services/                  # Auth, Toast, Api
            ├── layout/                        # Shell, Sidebar, Topbar, Notifications
            ├── pages/                         # auth, dashboard, members, memberships,
            │                                  # payments, attendance, reports, settings
            └── shared/components/             # toast-host, stat-card, chart-card, ...
```

---

## Prerequisites

- [.NET SDK 8.0+](https://dotnet.microsoft.com/download)
- [Node.js 18+](https://nodejs.org/) (and npm)
- [PostgreSQL 14+](https://www.postgresql.org/download/) running locally (or accessible via connection string)

---

## Quick start

### 1. Database

Create an empty PostgreSQL database (the API will auto-create tables on first run):

```bash
createdb gym_management
```

> Default connection string: `Host=localhost;Port=5432;Database=gym_management;Username=postgres;Password=postgres`
> Override it in `backend/src/GymManagement.Api/appsettings.json` or via the `ConnectionStrings__DefaultConnection` environment variable.

### 2. Backend

```bash
cd backend
dotnet restore
dotnet run --project src/GymManagement.Api
```

The API starts on **http://localhost:5080**.
Open Swagger at **http://localhost:5080/swagger**.

On first run the API will:
1. Apply EF Core migrations (creating all tables and indexes).
2. Seed roles, default users, plans, and 24 sample members with memberships, payments, and attendance.

> **Important:** Set a long random `Jwt:Secret` in `appsettings.json` before deploying.

### 3. Frontend

```bash
cd frontend
npm install
npm start
```

The app starts on **http://localhost:4200**.

The Angular app talks to the API at `http://localhost:5080/api` by default — change this in `src/environments/environment.ts` if needed.

---

## Demo accounts

These are seeded automatically on first run:

| Role        | Username     | Password         | Capabilities                            |
| ----------- | ------------ | ---------------- | --------------------------------------- |
| Owner       | `owner`      | `Owner@123`      | Everything (incl. delete staff)         |
| Admin       | `admin`      | `Admin@123`      | All operational + management features   |
| Reception   | `reception`  | `Reception@123`  | Members, memberships, payments, check-in|
| Coach       | `coach`      | `Coach@123`      | View members, attendance check-in       |

> Change all default passwords before going to production.

---

## Configuration

### Backend (`backend/src/GymManagement.Api/appsettings.json`)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=gym_management;Username=postgres;Password=postgres"
  },
  "Jwt": {
    "Issuer": "GymManagement",
    "Audience": "GymManagement.Web",
    "Secret": "CHANGE_ME_TO_A_LONG_RANDOM_SECRET_AT_LEAST_32_CHARS_!!",
    "ExpiryMinutes": 480
  },
  "Cors": {
    "AllowedOrigins": [ "http://localhost:4200" ]
  }
}
```

### Frontend (`frontend/src/environments/environment.ts`)

```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5080/api'
};
```

---

## API surface

| Group         | Endpoints                                                                              |
| ------------- | -------------------------------------------------------------------------------------- |
| Auth          | `POST /api/auth/login`, `POST /api/auth/forgot-password`, `POST /api/auth/change-password`, `GET /api/auth/me` |
| Dashboard     | `GET /api/dashboard/stats`, `GET /api/dashboard/charts`, `GET /api/dashboard/recent-payments`, `GET /api/dashboard/recent-members` |
| Members       | `GET/POST /api/members`, `GET/PUT/DELETE /api/members/{id}`, `POST /api/members/{id}/archive` |
| Memberships   | Full plan CRUD; create/renew/freeze/unfreeze/cancel memberships; `POST /api/memberships/refresh-expired` |
| Payments      | Paginated list, by-member, create, fetch invoice JSON or HTML                         |
| Attendance    | Check-in (rejects expired members), paginated list, by-member                         |
| Notifications | List, mark read, mark all read, generate expiry alerts                                |
| Reports       | `GET /api/reports/members.csv`, `payments.csv`, `attendance.csv`                      |
| Settings      | Gym info, staff CRUD                                                                  |

All non-auth endpoints require `Authorization: Bearer <token>`. Role gates enforced server-side.

---

## Architecture

### Backend — Clean Architecture

```
Domain        — entities + enums (no dependencies)
Application   — DTOs, interfaces, validators, AutoMapper, services
Infrastructure — EF Core DbContext, JWT, BCrypt, seed
Api           — Controllers, middleware, DI, Swagger
```

- **Inversion of control:** Application defines `IApplicationDbContext`; Infrastructure provides `ApplicationDbContext` implementation, keeping persistence concerns out of the application layer.
- **Result wrapper** standardises error/status codes across services.
- **FluentValidation** auto-runs on every controller action via `AddFluentValidationAutoValidation`.
- **Global exception middleware** turns validation errors into 400 + structured payload, and all other exceptions into safe 500 responses.

### Frontend — Standalone Angular

- **Signals everywhere** for component state.
- **Lazy-loaded standalone components** for every route — small initial bundle.
- **Functional interceptors and guards** (`provideHttpClient(withInterceptors([...]))`).
- **Reusable building blocks:** `StatCardComponent`, `ChartCardComponent`, `ConfirmDialogComponent`, `ToastHostComponent`.
- **Premium design system** in `src/styles.scss` — design tokens, glassmorphism cards, metallic buttons, badges, table, dialog, and form primitives.

---

## Common tasks

### Add a new staff user
Settings → Staff & Roles → New User. Owner/Admin only.

### Print an invoice as PDF
Members → open profile → Payment History → click the print icon. The backend serves a styled HTML invoice — use the browser's "Save as PDF" to export.

### Generate expiring-membership notifications
`POST /api/notifications/generate-expiry-alerts` (Owner/Admin). Schedule this hourly/daily via your favourite cron / Hangfire / Azure Scheduler.

### Mark expired memberships as Expired
`POST /api/memberships/refresh-expired` (Owner/Admin). Schedule it daily.

---

## Production deployment

1. Build:
   ```bash
   dotnet publish backend/src/GymManagement.Api -c Release -o publish/api
   cd frontend && npm install && npm run build
   ```
   The Angular build is at `frontend/dist/gym-frontend`.
2. Serve the Angular `browser` output behind nginx (or any static host).
3. Run the API behind nginx/Kestrel with HTTPS.
4. Set environment variables: `ConnectionStrings__DefaultConnection`, `Jwt__Secret`, `Cors__AllowedOrigins__0`.
5. Run a real Postgres (managed: AWS RDS, Azure Postgres Flexible, etc.) and apply migrations.
6. Replace seeded passwords. Disable seeder for production by removing/skipping `DataSeeder.SeedAsync` if you don't want demo data.

---

## License

This project is provided as a complete commercial-grade reference — adapt and brand it for your gym.
