/**
 * Internal API가 다루는 Domain 개념 정의.
 *
 * GETI Server → Internal API로 전달되는 Transport DTO와, Renderer/Discord
 * Message Service가 소비할 Domain Command를 명확히 분리하기 위한 타입이다.
 */

export const TARGET_TYPES = ['JOB', 'PROGRAM', 'INQUIRY'] as const;
export type TargetType = (typeof TARGET_TYPES)[number];

export const ACTIONS = ['CREATE', 'UPDATE', 'CLOSE_NOTICE', 'DELETE_NOTICE'] as const;
export type Action = (typeof ACTIONS)[number];

export const TEMPLATES = [
  'JOB_PUBLISHED',
  'JOB_UPDATED',
  'JOB_CLOSED',
  'JOB_DELETED',
  'PROGRAM_PUBLISHED',
  'PROGRAM_UPDATED',
  'PROGRAM_CLOSED',
  'PROGRAM_DELETED',
  'INQUIRY_CREATED',
] as const;
export type Template = (typeof TEMPLATES)[number];

/**
 * Template이 어떤 TargetType/Action 조합에서만 유효한지 정의한다.
 * targetType/action/template 세 값이 서로 모순되지 않는지 검증하는 데 사용한다.
 */
export const TEMPLATE_INFO: Record<Template, { targetType: TargetType; action: Action }> = {
  JOB_PUBLISHED: { targetType: 'JOB', action: 'CREATE' },
  JOB_UPDATED: { targetType: 'JOB', action: 'UPDATE' },
  JOB_CLOSED: { targetType: 'JOB', action: 'CLOSE_NOTICE' },
  JOB_DELETED: { targetType: 'JOB', action: 'DELETE_NOTICE' },
  PROGRAM_PUBLISHED: { targetType: 'PROGRAM', action: 'CREATE' },
  PROGRAM_UPDATED: { targetType: 'PROGRAM', action: 'UPDATE' },
  PROGRAM_CLOSED: { targetType: 'PROGRAM', action: 'CLOSE_NOTICE' },
  PROGRAM_DELETED: { targetType: 'PROGRAM', action: 'DELETE_NOTICE' },
  INQUIRY_CREATED: { targetType: 'INQUIRY', action: 'CREATE' },
};

/**
 * CREATE 요청(POST)이 매핑되는 Domain Command.
 * 최초 성공 시에만 Mention이 허용되므로 roleIds를 포함한다.
 */
export interface CreateDiscordMessageCommand {
  action: 'CREATE';
  targetType: TargetType;
  template: Template;
  channelId: string;
  roleIds: string[];
  data: Record<string, unknown>;
  requestId: string;
  idempotencyKey: string;
}

/**
 * 기존 Message 변경(PATCH) 요청이 매핑되는 Domain Command.
 * UPDATE / CLOSE_NOTICE / DELETE_NOTICE 모두 Mention을 포함하지 않는다.
 */
export interface PatchDiscordMessageCommand {
  action: Exclude<Action, 'CREATE'>;
  targetType: TargetType;
  template: Template;
  channelId: string;
  messageId: string;
  data: Record<string, unknown>;
  requestId: string;
}

export type DiscordMessageCommand = CreateDiscordMessageCommand | PatchDiscordMessageCommand;
