# Project

GETI Discord Bot

프로젝트 역할:

- GETI Server의 명령을 Discord로 전달하는 독립 Service

Codex 등 다른 AI Coding Agent를 위한 공통 지침은 [AGENTS.md](AGENTS.md)에
있다. 두 문서는 같은 규칙을 공유하며, Claude Code는 이 CLAUDE.md를 우선
읽는다. 공통 작업 흐름 요약은 [docs/ai-workflow.md](docs/ai-workflow.md)를
참고한다.

# Source of Truth

우선순위:

1. 현재 작업 중인 Issue / PR의 요구사항
2. CLAUDE.md / AGENTS.md
3. docs/architecture.md
4. 기존 코드 및 테스트
5. README

규칙과 현재 Issue/PR 요구사항이 충돌하면 더 구체적인 현재 요구사항을
우선한다.

# Tech Stack

- Node.js 22
- TypeScript
- pnpm
- Fastify
- discord.js
- Zod
- Pino
- Vitest
- ESLint
- Prettier

# Architecture Rules

- GETI DB 직접 접근 금지
- Discord Bot에 비즈니스 판단 금지
- GETI Server가 원본 데이터 소유
- Discord Bot은 렌더링/전송 담당
- Secret 코드 저장 금지
- 최소 Discord Permission
- 기능별 책임 분리
- over-engineering 금지

# Git Flow

main
develop
feature/*
fix/*

- 작업 전 develop 최신화
- Issue 생성
- Issue 기반 branch
- Draft PR
- Squash Merge

# Development Workflow

매 작업:

1. 저장소 상태 확인
2. develop 최신화
3. Issue 확인/생성
4. feature branch
5. 요구사항 분석
6. 최소 구현
7. Unit Test
8. lint/typecheck/test/build
9. Self Review
10. Commit
11. Push
12. Draft PR

# Before Editing

- 현재 Issue/PR 요구사항을 정확히 확인했는가
- 관련 기존 코드/문서를 읽었는가
- 이번 작업이 기존 Issue/PR 범위 안에 있는가

# After Editing

- lint/format:check/typecheck/test/build 모두 실행했는가
- git diff로 의도하지 않은 변경이 없는가
- Secret이 포함되지 않았는가
- Self Review 2회를 수행했는가

# Working PR Discipline

- 이미 진행 중인 Issue/Branch/PR이 있다면 새 Issue/Branch/PR을 임의로
  만들지 않고 그 안에서 작업을 이어간다.
- CI가 실패하면 이번 변경 때문인지 먼저 확인한다. 이번 변경이 원인이면
  수정 후 재확인하고, GitHub 인프라 등 외부 요인이면 코드를 억지로
  바꾸지 않고 그대로 보고한다.
- 현재 Issue 범위 밖의 "미래에 필요할 기능"을 미리 구현하지 않는다.

# Scope Control

요청되지 않은 기능 추가 금지.

"나중에 필요할 것 같다"는 이유로
Redis, DB, Queue, Slash Command 등을 임의 추가 금지.

# Testing

새 기능에는 해당 Unit Test 추가.

외부 Discord API는 CI Unit Test에서 호출하지 않는다.

# Security

- Bot Token Commit 금지
- API Key Commit 금지
- 로그 Secret 출력 금지
- Administrator Permission 금지
- Privileged Intent 최소화

# Code Style

- 단순한 구조
- 명확한 Naming
- 함수 한 책임
- any 지양
- 불필요한 추상화 금지

# Self Review

Commit 전 최소 2회 검토:

Review 1:
기능/테스트/버그

Review 2:
보안/구조/불필요 코드/범위 초과

Self Review에서 발견한 문제는 Commit 전에 수정한다.

# Prohibited

- 사용자 승인 없는 Merge
- 사용자 기존 작업 삭제
- main 직접 기능 개발
- develop 직접 기능 개발
- Force Push
- Secret Commit
- 범위 밖 기능 추가
