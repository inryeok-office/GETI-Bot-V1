import type { BotStatusQuery } from './bot-status-query.js';
import type { CommandContext, DiscordTextCommand } from './types.js';
import { formatUptime } from './uptime.js';
import { BOT_VERSION } from './version.js';

const NORMAL_EMBED_COLOR = 0x2ecc71;
const DEGRADED_EMBED_COLOR = 0xe74c3c;
const FOOTER = 'GETI Discord Bot';
const PING_UNAVAILABLE = '확인 불가';

export interface BotStatusCommandOptions {
  statusQuery: BotStatusQuery;
  /** NODE_ENV. Secret이 아닌 공개 가능한 값만 표시한다. */
  nodeEnv: string;
}

/**
 * `!상태 봇`: 현재 실행 중인 Discord Bot 자체 상태를 확인한다.
 * GETI Server 상태는 조회하지 않는다(범위 제외, `!상태 서버`는 후속 작업).
 */
export function createBotStatusCommand(options: BotStatusCommandOptions): DiscordTextCommand {
  const { statusQuery, nodeEnv } = options;

  return {
    name: '상태 봇',
    usage: '!상태 봇',
    description: '현재 Discord Bot의 동작 상태를 확인합니다.',
    async execute(context: CommandContext): Promise<void> {
      const snapshot = statusQuery.getSnapshot();

      await context.reply({
        title: 'GETI Bot 상태',
        color: snapshot.connected ? NORMAL_EMBED_COLOR : DEGRADED_EMBED_COLOR,
        fields: [
          { name: '상태', value: snapshot.connected ? '🟢 정상' : '🔴 연결 끊김' },
          { name: 'Discord', value: snapshot.connected ? 'CONNECTED' : 'DISCONNECTED' },
          { name: 'Uptime', value: formatUptime(process.uptime()) },
          {
            name: 'Gateway Ping',
            value: snapshot.ping !== null ? `${snapshot.ping}ms` : PING_UNAVAILABLE,
          },
          { name: '연결 서버', value: `${snapshot.guildCount}개` },
          { name: 'Version', value: BOT_VERSION },
          { name: 'Environment', value: nodeEnv },
        ],
        footer: FOOTER,
        timestamp: new Date().toISOString(),
      });
    },
  };
}
