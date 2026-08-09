import { describe, expect, it } from 'vitest';
import { parseCommand } from './parser.js';

describe('parseCommand', () => {
  it('parses a single-word command', () => {
    expect(parseCommand('!명령어')).toEqual({ name: '명령어' });
  });

  it('parses a multi-word command', () => {
    expect(parseCommand('!상태 봇')).toEqual({ name: '상태 봇' });
  });

  it('collapses multiple spaces between command words', () => {
    expect(parseCommand('!상태    봇')).toEqual({ name: '상태 봇' });
  });

  it('allows leading/trailing whitespace around the whole message', () => {
    expect(parseCommand(' !명령어 ')).toEqual({ name: '명령어' });
  });

  it('ignores a normal chat message', () => {
    expect(parseCommand('안녕하세요')).toBeNull();
  });

  it('ignores a message that only contains the prefix', () => {
    expect(parseCommand('!')).toBeNull();
    expect(parseCommand('!   ')).toBeNull();
  });

  it('returns the joined name for an unregistered command (registry decides unknown handling)', () => {
    expect(parseCommand('!없는명령어')).toEqual({ name: '없는명령어' });
  });
});
