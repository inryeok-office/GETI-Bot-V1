# AI Development Workflow

이 저장소에서 AI Coding Agent가 작업할 때 따르는 공통 흐름이다.

- Claude Code → [CLAUDE.md](../CLAUDE.md) 우선
- Codex / 기타 Agent → [AGENTS.md](../AGENTS.md) 우선
- 공통 참고 → [docs/architecture.md](architecture.md), 이 문서

## 1. Prepare

- git status
- develop 최신화
- Issue 확인
- feature branch 확인

## 2. Understand

- Issue 요구사항
- Architecture
- 관련 코드
- Test

## 3. Implement

- 최소 변경
- 기존 Pattern 재사용
- 범위 밖 변경 금지

## 4. Validate

```
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
```

## 5. Review

Self Review 2회 (기능/테스트 관점, 보안/구조/범위 관점).

## 6. Deliver

- Commit
- Push
- PR 내용 최신화
- CI 확인
