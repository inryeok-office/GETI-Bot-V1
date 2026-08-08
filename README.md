# GETI Discord Bot

GETI Server의 공고(Job), 프로그램(Program), 문의(Inquiry) 데이터를 Discord
메시지로 전달하는 독립 서비스입니다.

GETI 원본 데이터와 비즈니스 판단은 Spring Boot 기반 GETI Server가 소유하며,
이 Bot은 전달받은 요청을 Discord 메시지로 렌더링/전송하는 역할만 담당합니다.
자세한 내용은 [docs/architecture.md](docs/architecture.md)를 참고하세요.

> 현재는 Internal API(인증/Request Validation/Command Mapping), Discord
> Embed Renderer, Discord 메시지 생성/수정(Delivery), CREATE 중복 방지
> (In-memory Idempotency)까지 구현된 단계입니다. `GET /health`와
> Internal API 2종을 제공합니다.

## Architecture 요약

```
GETI Server → Internal REST API → GETI Discord Bot → Discord API
```

## Tech Stack

- Node.js 22
- TypeScript
- pnpm
- Fastify
- discord.js
- Zod
- Pino
- Vitest
- ESLint / Prettier

## Requirements

- Node.js >= 22
- pnpm

## Install

```bash
pnpm install
```

## Environment

`.env.example`을 복사해 `.env`를 만들고 값을 채워주세요.

```bash
cp .env.example .env
```

| 변수                     | 설명                                              | 필수 여부                                                  |
| ------------------------ | ------------------------------------------------- | ---------------------------------------------------------- |
| `NODE_ENV`               | 실행 환경 (`development` / `test` / `production`) | 아니오 (기본값 `development`)                              |
| `PORT`                   | HTTP 서버 포트                                    | 아니오 (기본값 `3000`)                                     |
| `DISCORD_BOT_TOKEN`      | Discord Bot Token                                 | 아니오 (없으면 Discord 연결을 건너뛰고 Health 서버만 기동) |
| `DISCORD_APPLICATION_ID` | Discord Application ID                            | 아니오                                                     |
| `GETI_INTERNAL_API_KEY`  | GETI Server 연동용 Internal API Key               | `production`에서는 필수 (없으면 기동 실패)                 |
| `LOG_LEVEL`              | Pino 로그 레벨                                    | 아니오 (기본값 `info`)                                     |

Discord Bot Token은 [Discord Developer Portal](https://discord.com/developers/applications)에서
Application을 생성한 뒤 Bot 탭에서 발급받을 수 있습니다.

## Local Run

```bash
pnpm dev
```

기본적으로 `http://localhost:3000/health`에서 상태를 확인할 수 있습니다.

## Internal API

GETI Server가 Discord 메시지 생성/수정을 요청하는 내부 전용 API입니다.
자세한 계약은 [docs/architecture.md](docs/architecture.md)를 참고하세요.

```
POST  /internal/v1/discord/messages              # CREATE
PATCH /internal/v1/discord/messages/{messageId}  # UPDATE / CLOSE_NOTICE / DELETE_NOTICE
```

요청에는 `X-Internal-Api-Key` Header가 필요하며, CREATE 요청에는
`X-Idempotency-Key` Header가 추가로 필요합니다.

`DISCORD_BOT_TOKEN`이 설정되어 Discord Client가 연결된 경우에만 실제로
Discord 메시지를 생성/수정합니다. Token이 없거나 연결에 실패하면 요청
검증과 Command Mapping까지만 수행하고 `INTERNAL_ERROR`를 반환하는
Placeholder Handler로 안전하게 대체합니다.

> 동일한 `X-Idempotency-Key`로 CREATE를 다시 호출하면 Discord 메시지를
> 다시 전송하지 않고 기존 성공 결과를 재사용합니다. 단, 이 dedup은
> **동일 Bot Process 생명주기 안에서만** 유효합니다(In-memory 구현,
> Process 재시작 시 초기화). Redis 등 Durable Store는 사용하지
> 않습니다.

CREATE/PATCH Command 처리에는 기본 10초 Timeout이 적용되며, 초과 시
`DISCORD_UNAVAILABLE`(retryable)로 응답합니다. Request Body는
256KB로 제한됩니다.

## Test

```bash
pnpm test
```

## Lint / Format / Typecheck

```bash
pnpm lint
pnpm format:check
pnpm typecheck
```

## Build

```bash
pnpm build
pnpm start
```

## Docker

```bash
docker build -t geti-discord-bot .
docker run --rm -p 3000:3000 --env-file .env geti-discord-bot
```

## Git Flow

이 저장소는 1인 개발이라도 Git Flow 기반으로 관리합니다.

- `main`: 운영/배포 가능한 안정 버전
- `develop`: 현재 개발 통합 브랜치
- `feature/{issue-number}-{description}`: 기능/작업 브랜치
- `fix/{issue-number}-{description}`: 버그 수정 브랜치

작업 흐름: Issue 생성 → `develop` 최신화 → `feature/*` 브랜치 → 구현 →
검증 → Self Review → Commit → Push → Draft PR → `develop`으로 Squash Merge.

## Project Structure

```
src/
├─ app/
│  ├─ server.ts            # Fastify Application 생성
│  ├─ fastify-instance.ts  # 공유 Fastify Instance 타입
│  └─ discord.ts           # Discord Client 생성/연결/종료
├─ config/
│  └─ env.ts                # 환경변수 검증
├─ common/
│  ├─ logger.ts              # Pino Logger 생성
│  └─ request-id.ts          # X-Request-Id 해석
├─ internal-api/
│  ├─ types.ts       # TargetType/Action/Template/Command 타입
│  ├─ schema.ts      # Zod Request Schema
│  ├─ command.ts     # Transport DTO → Domain Command 매핑
│  ├─ auth.ts        # Internal API Key 인증
│  ├─ error.ts       # ErrorCode/ApiError/Error Response
│  ├─ handler.ts     # DiscordMessageCommandHandler 계약
│  └─ routes.ts      # Internal API Route 등록
├─ renderer/
│  ├─ types.ts    # RenderedDiscordMessage/RenderError 타입
│  ├─ limits.ts   # Discord Embed 제한 상수/truncate
│  ├─ colors.ts   # Embed 강조 색상
│  ├─ schemas.ts  # Template별 data Zod Schema
│  ├─ job.ts      # JOB_* Renderer
│  ├─ program.ts  # PROGRAM_* Renderer
│  ├─ inquiry.ts  # INQUIRY_CREATED Renderer
│  └─ registry.ts # Template → Renderer Registry
├─ discord-delivery/
│  ├─ types.ts           # DiscordMessageAdapter 계약
│  ├─ error-mapping.ts   # discord.js 오류 → Bot ErrorCode
│  ├─ adapter.ts          # discord.js Client 기반 Adapter 구현
│  └─ command-handler.ts  # Renderer + Adapter를 조합하는 실제 Command Handler
├─ idempotency/
│  ├─ store.ts              # IdempotencyStore / InMemoryIdempotencyStore
│  └─ idempotent-handler.ts # CREATE 중복 방지 Decorator
└─ index.ts       # Bootstrap / Graceful Shutdown
```

## AI-assisted Development

이 저장소에서 AI Coding Agent로 작업할 때는 아래 문서를 따릅니다.

- Claude Code → [CLAUDE.md](CLAUDE.md)
- Codex / 기타 Agent → [AGENTS.md](AGENTS.md)
- 공통 작업 흐름 → [docs/ai-workflow.md](docs/ai-workflow.md)
