import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

interface PackageJson {
  version: string;
}

// src(/dist)/commands/version.ts 기준 두 단계 위가 항상 package.json이 있는
// 프로젝트 Root다 (build 후에도 src→dist 구조가 그대로 유지된다).
const packageJsonPath = fileURLToPath(new URL('../../package.json', import.meta.url));
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as PackageJson;

/** `!상태 봇`에 표시할 Bot Version. package.json을 Source of Truth로 사용한다. */
export const BOT_VERSION: string = packageJson.version;
