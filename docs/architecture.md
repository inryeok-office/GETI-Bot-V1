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

## Internal API

GETI Server가 Discord 메시지 생성/수정을 요청하는 Endpoint는 v1에서
다음 두 개만 사용한다.

```
POST  /internal/v1/discord/messages              # CREATE
PATCH /internal/v1/discord/messages/{messageId}  # UPDATE / CLOSE_NOTICE / DELETE_NOTICE
```

`/close`, `/delete-notice` 같은 별도 Endpoint는 만들지 않는다. 기존
Message에 대한 변경은 모두 PATCH의 `action` 값(`UPDATE` /
`CLOSE_NOTICE` / `DELETE_NOTICE`)으로 구분한다.

### Header Contract

| Header               | 역할                                 |
| -------------------- | ------------------------------------ |
| `X-Internal-Api-Key` | 내부 서비스 인증                     |
| `X-Request-Id`       | 분산 요청 추적 (없으면 자동 생성)    |
| `X-Idempotency-Key`  | CREATE 중복 방지용 Key (CREATE 필수) |

`X-Internal-Api-Key`는 `GETI_INTERNAL_API_KEY` 환경변수 값과
Constant-time 비교로 검증한다. `production` 환경에서는
`GETI_INTERNAL_API_KEY`가 없으면 기동 시점에 즉시 실패한다.
`GET /health`에는 이 인증을 적용하지 않는다.

### Target Type / Action / Template

- Target Type: `JOB`, `PROGRAM`, `INQUIRY`
- Action: `CREATE`, `UPDATE`, `CLOSE_NOTICE`, `DELETE_NOTICE`
- Template(9종): `JOB_PUBLISHED`, `JOB_UPDATED`, `JOB_CLOSED`,
  `JOB_DELETED`, `PROGRAM_PUBLISHED`, `PROGRAM_UPDATED`,
  `PROGRAM_CLOSED`, `PROGRAM_DELETED`, `INQUIRY_CREATED`

targetType/action/template 세 값이 서로 모순되면(예: template은
`JOB_PUBLISHED`인데 targetType이 `PROGRAM`) `INVALID_REQUEST`로
거부한다.

### Transport와 Domain Command 분리

```
HTTP Request → Zod Validation → Transport DTO → Command Mapping
→ DiscordMessageCommand → (Renderer → Discord Message Service, 이후 Phase)
```

Renderer/Discord Message Service는 `DiscordMessageCommand`만 알고
Fastify Request나 Zod 스키마를 알지 못한다.

### Error Contract

```json
{
  "code": "CHANNEL_NOT_FOUND",
  "message": "...",
  "retryable": false,
  "requestId": "..."
}
```

ErrorCode: `INVALID_REQUEST`, `UNAUTHORIZED`, `CHANNEL_NOT_FOUND`,
`MESSAGE_NOT_FOUND`, `MISSING_PERMISSION`, `RATE_LIMITED`,
`DISCORD_UNAVAILABLE`, `DISCORD_API_ERROR`, `INTERNAL_ERROR`. Discord
SDK의 Raw Error나 Stack Trace는 응답에 포함하지 않는다.

### 현재 구현 상태

Internal API는 인증/Request Validation/Command Mapping까지 정상
동작한다. 하지만 실제 Discord 메시지 Renderer와 Discord Message
Service는 아직 구현되지 않았으므로(이후 Phase 예정), 현재는 모든 요청이
`INTERNAL_ERROR`(재시도 불가)로 응답한다. GETI Server 실 연동 전에
Renderer/Delivery 구현이 선행되어야 한다.

## 향후 Renderer (예정, 이번 PR 범위 아님)

메시지 종류별 Embed Renderer도 향후 범위로 문서화만 해둔다.

- `JOB_*` (공고 관련 이벤트)
- `PROGRAM_*` (프로그램 관련 이벤트)
- `INQUIRY_CREATED` (문의 생성 이벤트)

## 현재 구현 범위

- 프로젝트 기본 구조
- 환경변수 검증
- Discord Client Bootstrap (로그인 여부와 무관하게 안전하게 기동)
- Health Check API (`GET /health`)
- Graceful Shutdown
- Internal API 인증/Request Validation/Command Mapping

실제 Discord 메시지 송수신, Embed Renderer, Idempotency 저장소는
포함하지 않는다.

## Development Rules

AI Coding Agent를 포함한 개발 규칙은 [AGENTS.md](../AGENTS.md) /
[CLAUDE.md](../CLAUDE.md)를 참고한다.
