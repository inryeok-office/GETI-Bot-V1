import type { FastifyInstance } from 'fastify';
import type { Logger } from 'pino';
import type { Server, IncomingMessage, ServerResponse } from 'node:http';

/**
 * 이 프로젝트가 사용하는 구체적인 Fastify Instance 타입.
 *
 * Fastify를 pino Logger Instance(`loggerInstance`)와 함께 생성하면 Logger
 * Generic이 pino의 Logger로 고정된다. Route 등록 함수처럼 App Instance를
 * 매개변수로 받는 곳에서 기본 `FastifyInstance`(FastifyBaseLogger 기준) 타입을
 * 쓰면 구조적으로 호환되지 않으므로, 실제 타입을 이 파일에서 한 곳에 정의해
 * 공유한다.
 */
export type AppInstance = FastifyInstance<Server, IncomingMessage, ServerResponse, Logger>;
