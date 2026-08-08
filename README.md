# GETI Discord Bot

GETI Server의 공고(Job), 프로그램(Program), 문의(Inquiry) 데이터를 Discord
메시지로 전달하는 독립 서비스입니다.

GETI 원본 데이터와 비즈니스 판단은 Spring Boot 기반 GETI Server가 소유하며,
이 Bot은 전달받은 요청을 Discord 메시지로 렌더링/전송하는 역할만 담당합니다.
자세한 내용은 [docs/architecture.md](docs/architecture.md)를 참고하세요.

> 현재는 초기 프로젝트 세팅 단계이며, 실제 Discord 메시지 전송/GETI 연동
> 기능은 아직 구현되어 있지 않습니다. `GET /health`만 제공합니다.

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

| 변수                     | 설명                                                 | 필수 여부                                                  |
| ------------------------ | ---------------------------------------------------- | ---------------------------------------------------------- |
| `NODE_ENV`               | 실행 환경 (`development` / `test` / `production`)    | 아니오 (기본값 `development`)                              |
| `PORT`                   | HTTP 서버 포트                                       | 아니오 (기본값 `3000`)                                     |
| `DISCORD_BOT_TOKEN`      | Discord Bot Token                                    | 아니오 (없으면 Discord 연결을 건너뛰고 Health 서버만 기동) |
| `DISCORD_APPLICATION_ID` | Discord Application ID                               | 아니오                                                     |
| `GETI_INTERNAL_API_KEY`  | GETI Server 연동용 API Key (향후 기능에서 사용 예정) | 아니오                                                     |
| `LOG_LEVEL`              | Pino 로그 레벨                                       | 아니오 (기본값 `info`)                                     |

Discord Bot Token은 [Discord Developer Portal](https://discord.com/developers/applications)에서
Application을 생성한 뒤 Bot 탭에서 발급받을 수 있습니다.

## Local Run

```bash
pnpm dev
```

기본적으로 `http://localhost:3000/health`에서 상태를 확인할 수 있습니다.

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
│  ├─ server.ts     # Fastify Application 생성
│  └─ discord.ts    # Discord Client 생성/연결/종료
├─ config/
│  └─ env.ts        # 환경변수 검증
├─ common/
│  └─ logger.ts     # Pino Logger 생성
└─ index.ts         # Bootstrap / Graceful Shutdown
```

## AI-assisted Development

이 저장소에서 AI Coding Agent로 작업할 때는 아래 문서를 따릅니다.

- Claude Code → [CLAUDE.md](CLAUDE.md)
- Codex / 기타 Agent → [AGENTS.md](AGENTS.md)
- 공통 작업 흐름 → [docs/ai-workflow.md](docs/ai-workflow.md)
