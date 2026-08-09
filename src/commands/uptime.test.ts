import { describe, expect, it } from 'vitest';
import { formatUptime } from './uptime.js';

describe('formatUptime', () => {
  it('formats days, hours and minutes together', () => {
    const seconds = 3 * 86400 + 4 * 3600 + 12 * 60;
    expect(formatUptime(seconds)).toBe('3일 4시간 12분');
  });

  it('omits the day part when it is zero', () => {
    const seconds = 5 * 3600 + 21 * 60;
    expect(formatUptime(seconds)).toBe('5시간 21분');
  });

  it('omits day and hour parts when only minutes have elapsed', () => {
    expect(formatUptime(12 * 60)).toBe('12분');
  });

  it('shows 0분 when uptime is zero', () => {
    expect(formatUptime(0)).toBe('0분');
  });

  it('shows 0분 for a sub-minute uptime', () => {
    expect(formatUptime(30)).toBe('0분');
  });
});
