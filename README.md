# Ariadna

A backend for a **Kanban board** application — boards, columns, and cards with drag-and-drop reordering, board membership, an activity feed, and real-time updates over WebSocket.

Built as a study project to work through a modern Spring backend end to end: schema design, migrations, layered architecture, DTO mapping, and live collaboration.

## Features

- **Boards, columns, cards** — full CRUD with a clean REST API.
- **Drag-and-drop ordering** — items use a fractional `position` (double precision), so reordering a card only updates the moved item instead of reindexing the whole column.
- **Optimistic locking** — board items carry a `version` column to guard against conflicting concurrent edits.
- **Board membership & roles** — users are attached to boards; a `USER` / `ADMIN` role model is in place.
- **Activity feed** — every board action is recorded (`action_type` + `jsonb` payload) and served through a time-ordered endpoint.
- **Real-time updates** — board changes are broadcast to subscribers over STOMP WebSocket, so open clients stay in sync without polling.
- **Interactive API docs** — OpenAPI / Swagger UI generated from the controllers.

## Tech stack

| Layer | Choice |
|---|---|
| Language / runtime | Java 25 |
| Framework | Spring Boot 4 (Web MVC, Data JPA, WebSocket, Validation) |
| Database | PostgreSQL |
| Migrations | Flyway |
| Mapping | MapStruct |
| API docs | springdoc-openapi |
| Build | Gradle (Kotlin DSL) |
| Local infra | Docker Compose (auto-provisioned via Spring Boot Docker Compose support) |

## Architecture

The code follows a straightforward layered structure:

```
controller  → REST endpoints, request/response DTOs
service     → business logic, publishes domain events
repo        → Spring Data JPA repositories
data/model  → JPA entities
data/dto    → request/response DTOs (mapped with MapStruct)
data/event  → domain events (board / activity)
listener    → event listeners → WebSocket broadcast + activity logging
config      → Security (BCrypt), WebSocket, Async
```

Board items (columns and cards) share a common `board_item` table with a `position` for ordering and a `version` for optimistic locking. When a board changes, the service layer publishes an event; a listener persists it to the activity log and pushes the update to `/topic/board/{boardId}` so connected clients update live.

## Getting started

### Prerequisites

- JDK 25
- Docker (used to run PostgreSQL locally; Spring Boot starts the container automatically in dev)

### 1. Configure environment

Copy the example env file and fill in your Postgres credentials:

```bash
cp .env.example .env
```

```env
POSTGRES_DB=ariadna
POSTGRES_USER=ariadna
POSTGRES_PASSWORD=your_password
```

### 2. Run

```bash
./gradlew bootRun
```

On startup, Spring Boot's Docker Compose support reads `compose.yaml`, launches the PostgreSQL container (exposed on host port `5433`), and Flyway applies the migrations. The app then starts on `http://localhost:8080`.

### 3. Explore the API

Open the Swagger UI:

```
http://localhost:8080/swagger-ui/index.html
```

## API overview

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/board/{boardId}/column` | Create a column |
| `GET` | `/api/board/{boardId}/column` | List a board's columns |
| `PUT` / `DELETE` | `/api/column/{id}` | Update / delete a column |
| `POST` | `/api/card/column/{columnId}` | Create a card in a column |
| `GET` | `/api/card/column/{columnId}` | List cards in a column |
| `PATCH` | `/api/card/{id}/assignee` | Assign a card to a board member |
| `PATCH` | `/api/card/{id}/position` | Move / reorder a card |
| `PUT` / `DELETE` | `/api/card/{id}` | Update / delete a card |
| `GET` | `/api/board/{boardId}/activity` | Board activity feed |
| `POST` | `/api/boardUser/board/{boardId}/user/{userId}` | Add a user to a board |

See Swagger UI for the complete, always-up-to-date list.

## Real-time updates

Connect a STOMP client to the WebSocket endpoint and subscribe to a board's topic:

- **Endpoint:** `/ws`
- **Subscribe:** `/topic/board/{boardId}`

Any change to that board (card moved, column added, etc.) is pushed to all subscribers.

## Roadmap

TODOs:

- [ ] Authentication & authorization (BCrypt password hashing is wired; login flow and endpoint protection are next)
- [ ] Expand automated test coverage (service and integration tests)
- [ ] Card labels / tags and filtering
- [ ] Pagination for the activity feed
