# Project

GETI Discord Bot

목적:
GETI Server가 전달한 명령을 Discord 메시지로 렌더링/전송하는 독립 서비스.

이 문서는 Codex 등 범용 AI Coding Agent를 위한 공통 Repository 지침이다.
Claude Code는 [CLAUDE.md](CLAUDE.md)를 우선 읽되, 두 문서는 같은 규칙을
공유한다. 자세한 공통 작업 흐름은 [docs/ai-workflow.md](docs/ai-workflow.md)를 참고한다.

# Source of Truth

우선순위:

1. 현재 Issue / PR 요구사항
2. AGENTS.md / CLAUDE.md
3. docs/architecture.md
4. 기존 코드 및 테스트
5. README

규칙 충돌 시 더 구체적인 현재 작업 요구사항을 우선한다.

# Architecture

- GETI DB 직접 접근 금지
- GETI Server가 비즈니스 규칙 소유
- Bot은 Discord Rendering/Delivery 담당
- 실제 Discord 기능 외 범위 확장 금지
- DB/Redis/Queue는 명시적 요구 전 추가 금지
- 최소 Discord Intent/Permission 사용

# Workflow

작업 시작 전:

- git status
- 현재 branch 확인
- 관련 Issue/PR 확인
- 관련 코드 확인

작업 중:

- 현재 Issue 범위만 구현
- 기존 Style 유지
- 필요한 Test 작성
- 불필요한 Refactor 금지

작업 완료 전:

- pnpm lint
- pnpm format:check
- pnpm typecheck
- pnpm test
- pnpm build
- git diff --check

# Self Review

최소 두 번:

Review 1:

- 요구사항 누락
- 기능 오류
- Test
- Edge Case

Review 2:

- Security
- Architecture
- Scope Creep
- Dead Code
- Secret
- 불필요 Dependency

# Git

- main 직접 Commit 금지
- develop 직접 기능 개발 금지
- feature/fix Branch 사용
- Conventional Commit
- Squash Merge
- Force Push 금지
- 사용자 승인 없이 Merge 금지
- 진행 중인 Issue/PR이 있으면 새 Issue/Branch/PR을 임의로 만들지 않는다

# Safety

절대 실행 금지:

- git reset --hard
- git clean -fd
- git push --force

사용자 작업을 삭제하거나 덮어쓰지 않는다.

# Secrets

Commit 금지:

- .env
- Bot Token
- Internal API Key
- Bearer Token
- Credential

# Done Definition

- Issue 완료 조건 충족
- Test PASS
- CI PASS
- Self Review 완료
- PR 본문 최신화
