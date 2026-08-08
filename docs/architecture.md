# Architecture

## 전체 흐름

```
GETI Server  →  Internal REST API  →  GETI Discord Bot  →  Discord API
(Spring Boot)                          (this repository)
```

GETI Server가 원본 데이터와 비즈니스 판단을 소유하고, GETI Discord Bot은
전달받은 요청을 Discord 메시지로 변환/전송하는 역할만 담당한다.

## 역할 분리

### GETI Discord Bot (이 저장소)

- GETI Server로부터 Internal API 요청 수신
- 요청 Validation
- Discord Embed Rendering
- Discord 메시지 생성/수정
- Discord API 오류를 표준 오류 응답으로 변환(Error Mapping)

### GETI Server (Spring Boot, 별도 저장소)

- Job / Program / Inquiry 등 원본 데이터 관리
- Business Rules 판단
- 메시지를 보낼 대상 Channel 결정
- 메시지에서 Mention할 대상 Role 결정
- 실패 시 Retry 정책
- Delivery 상태 관리
- Idempotency Key 생성

## Discord Bot이 하지 않는 것

- GETI DB에 직접 접근하지 않는다.
- Job / Program 상태를 판단하지 않는다.
- Application(지원) 권한을 판단하지 않는다.
- Business Rule을 소유하지 않는다.

이 모든 판단은 GETI Server의 책임이며, Discord Bot은 전달받은 값을
그대로 렌더링/전송한다.

## 향후 Internal API (예정, 이번 PR 범위 아님)

다음 API는 향후 별도 Issue에서 구현될 예정이며, 이번 초기 세팅 PR에는
포함되지 않는다.

```
POST  /internal/v1/discord/messages
PATCH /internal/v1/discord/messages/{messageId}
```

인증, Request Validation, Idempotency 처리 방식도 해당 Issue에서 함께
설계한다.

## 향후 Renderer (예정, 이번 PR 범위 아님)

메시지 종류별 Embed Renderer도 향후 범위로 문서화만 해둔다.

- `JOB_*` (공고 관련 이벤트)
- `PROGRAM_*` (프로그램 관련 이벤트)
- `INQUIRY_CREATED` (문의 생성 이벤트)

## 현재 구현 범위 (이번 PR)

- 프로젝트 기본 구조
- 환경변수 검증
- Discord Client Bootstrap (로그인 여부와 무관하게 안전하게 기동)
- Health Check API (`GET /health`)
- Graceful Shutdown

실제 메시지 전송, Embed Renderer, Internal API는 포함하지 않는다.

## Development Rules

AI Coding Agent를 포함한 개발 규칙은 [AGENTS.md](../AGENTS.md) /
[CLAUDE.md](../CLAUDE.md)를 참고한다.
