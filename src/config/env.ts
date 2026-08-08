import { z } from 'zod';

/**
 * 애플리케이션 실행에 필요한 환경변수 Schema.
 *
 * DISCORD_BOT_TOKEN / DISCORD_APPLICATION_ID / GETI_INTERNAL_API_KEY는
 * Health 서버 개발/테스트를 막지 않기 위해 development/test 환경에서는
 * 필수 값으로 강제하지 않는다. 다만 GETI_INTERNAL_API_KEY는 production
 * 환경에서 Internal API가 무방비로 노출되지 않도록 필수로 요구한다.
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
    if (value.NODE_ENV === 'production' && !value.GETI_INTERNAL_API_KEY) {
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
