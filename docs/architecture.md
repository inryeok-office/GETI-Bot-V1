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

Internal API는 인증/Request Validation/Command Mapping/Renderer/
Discord Message 전송까지 정상 동작한다. `DISCORD_BOT_TOKEN`이 설정되어
Discord Client가 연결된 경우에만 실제 Delivery Handler를 사용하며, 그
외의 경우(Token 미설정/연결 실패)에는 요청 검증/Command 매핑까지만
수행하고 `INTERNAL_ERROR`를 반환하는 Placeholder Handler로 안전하게
대체한다.

## Renderer

`DiscordMessageCommand`를 Discord Embed로 변환하는 책임은 전부 Bot이
소유한다. GETI Server는 Embed JSON을 직접 보내지 않고 의미 데이터만
전달한다.

```
DiscordMessageCommand → Renderer Registry(Template별 dispatch)
→ Template Data Zod Schema 검증 → RenderedDiscordMessage(순수 데이터)
```

- `RenderedDiscordMessage` / `RenderedEmbed`는 discord.js에 의존하지
  않는 순수 데이터 타입이다. Discord 전송 시점(Phase 3)에 얇은 Adapter로
  discord.js가 요구하는 형태로 변환한다.
- 9개 Template(`JOB_*` 4종, `PROGRAM_*` 4종, `INQUIRY_CREATED`)마다
  전용 Zod data schema가 있으며, 모두 `.strict()`로 선언되어 명시되지
  않은 필드는 요청 자체가 거부된다.
- Discord Embed 제한(title 256자 / description 4096자 / field value
  1024자)을 넘는 텍스트는 Renderer가 자동으로 truncate한다.
- `INQUIRY_CREATED`는 관리자 Alert 용도로, data schema에 전화번호/
  이메일/Token/파일 다운로드 URL/문의 전문 필드를 아예 선언하지 않아
  이런 정보가 Discord로 렌더링될 수 없다.
- Renderer는 잘못된 data에 대해 `RenderError`(Renderer 내부 오류
  타입)를 던진다. Discord Message Service가 이를 `INVALID_REQUEST`로
  변환해 Internal API Error Contract에 맞춘다.

## Discord Message Delivery

`DiscordMessageCommandHandler`(Phase 1)의 실제 구현이다.
`DiscordDeliveryCommandHandler`가 Renderer를 호출해 Embed를 만들고,
`DiscordMessageAdapter`를 통해 실제 Discord 메시지를 생성/수정한다.

```
DiscordMessageCommand → Renderer → RenderedDiscordMessage
→ DiscordMessageAdapter(discord.js Client 호출) → Discord API
```

- discord.js Client 호출은 `DiscordJsMessageAdapter` 안에서만 이뤄진다.
  Command Handler는 `DiscordMessageAdapter` Interface에만 의존하므로
  discord.js 없이 Fake Adapter로 Unit Test할 수 있다.
- CREATE: Channel fetch → Message send → messageId 반환.
- UPDATE / CLOSE_NOTICE / DELETE_NOTICE: 기존 Channel/Message fetch →
  edit → messageId 반환. Discord Message를 물리적으로 삭제하지 않는다
  (`message.delete()` 사용 안 함) — Renderer가 만든 "마감"/"삭제됨"
  표현으로 기존 Message를 수정할 뿐이다.
- Mention: CREATE 최초 성공에서만 `roleIds`를 Mention 문자열
  (`<@&roleId>`)과 `allowedMentions.roles`로 전달한다. PATCH(UPDATE /
  CLOSE_NOTICE / DELETE_NOTICE)는 Mention 문자열을 만들지 않고
  `allowedMentions`는 항상 `{ parse: [], roles: [] }`로 고정해 재알림을
  막는다. `@everyone` / `@here`는 사용하지 않는다.
- Discord Channel이 없거나 텍스트 채널이 아니면 `CHANNEL_NOT_FOUND`로
  응답한다.
- discord.js 오류(Unknown Channel/Message, Missing Access/Permissions,
  Rate Limit, 5xx 등)는 `mapDiscordError`가 Bot Error Contract의
  ErrorCode로 변환한다. Raw discord.js Error 객체나 Stack Trace는
  응답에 포함하지 않는다.
- discord.js SDK가 처리하는 기본 Rate Limit 재시도를 그대로 신뢰하며,
  별도의 Rate Limiter를 구현하지 않는다.
- 실제 Discord Guild/Token을 사용하는 통합 Test는 하지 않는다. Fake
  Adapter/Mock Client로 Command Handler와 Adapter를 각각 Unit Test한다.

## 현재 구현 범위

- 프로젝트 기본 구조
- 환경변수 검증
- Discord Client Bootstrap (로그인 여부와 무관하게 안전하게 기동)
- Health Check API (`GET /health`)
- Graceful Shutdown
- Internal API 인증/Request Validation/Command Mapping
- Discord Embed Renderer (9개 Template, Template Data Validation)
- Discord Message 생성/수정 (`DiscordJsMessageAdapter`), Mention 정책,
  Discord API Error Mapping

Idempotency 저장소는 포함하지 않는다(다음 Phase 예정). 동일
`X-Idempotency-Key`로 CREATE를 다시 호출해도 현재는 중복 전송을 막지
않는다.

## Development Rules

AI Coding Agent를 포함한 개발 규칙은 [AGENTS.md](../AGENTS.md) /
[CLAUDE.md](../CLAUDE.md)를 참고한다.
