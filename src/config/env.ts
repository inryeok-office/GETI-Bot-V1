import { z } from 'zod';

/**
 * 애플리케이션 실행에 필요한 환경변수 Schema.
 *
 * DISCORD_BOT_TOKEN / DISCORD_APPLICATION_ID / GETI_INTERNAL_API_KEY는
 * Health 서버 개발/테스트를 막지 않기 위해 development/test 환경에서는
 * 필수 값으로 강제하지 않는다. 다만 production 환경에서는 Container가
 * RUNNING 상태이지만 실제로는 아무 기능도 하지 못하는 상태(Discord 미연결,
 * Internal API 비활성화)로 오인되지 않도록 DISCORD_BOT_TOKEN과
 * GETI_INTERNAL_API_KEY를 필수로 요구한다. DISCORD_APPLICATION_ID는 현재
 * Runtime에서 사용하지 않으므로 필수화하지 않는다.
 */
const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),

    DISCORD_BOT_TOKEN: z.string().optional(),
    DISCORD_APPLICATION_ID: z.string().optional(),

    GETI_INTERNAL_API_KEY: z.string().optional(),

    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  })
  .superRefine((value, ctx) => {
    if (value.NODE_ENV !== 'production') return;

    if (!value.DISCORD_BOT_TOKEN) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['DISCORD_BOT_TOKEN'],
        message: 'DISCORD_BOT_TOKEN is required when NODE_ENV=production',
      });
    }

    if (!value.GETI_INTERNAL_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['GETI_INTERNAL_API_KEY'],
        message: 'GETI_INTERNAL_API_KEY is required when NODE_ENV=production',
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

/**
 * process.env를 검증하고 파싱된 Env 객체를 반환한다.
 * 검증 실패 시 원인을 포함하여 즉시 예외를 던진다.
 */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(source);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ');
    throw new Error(`Invalid environment variables: ${issues}`);
  }

  return parsed.data;
}
