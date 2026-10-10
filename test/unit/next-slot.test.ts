import { describe, expect, it } from 'vitest';
import { formatBerlin, nextSlot } from '../../scripts/next-slot.mjs';
import { execFileSync } from 'node:child_process';

const slot = (now: string, dates: string[] = []) => nextSlot({ now, dates }).slot;

describe('nextSlot', () => {
  it('picks Tuesday 07:00 Berlin from a weekend', () => {
    expect(slot('2026-10-10T08:00:00Z')).toBe('2026-10-13T07:00:00+02:00');
  });

  it('picks Thursday after a Tuesday slot has passed', () => {
    expect(slot('2026-10-13T06:00:00Z')).toBe('2026-10-15T07:00:00+02:00');
  });

  it('is strictly after now: at the slot instant itself the next slot is returned', () => {
    expect(slot('2026-10-13T05:00:00Z')).toBe('2026-10-15T07:00:00+02:00');
    expect(slot('2026-10-13T04:59:59Z')).toBe('2026-10-13T07:00:00+02:00');
  });

  it('uses the same day when now is before 07:00 Berlin on a slot day', () => {
    expect(slot('2026-10-15T00:30:00+02:00')).toBe('2026-10-15T07:00:00+02:00');
  });

  it('skips to the next week after Thursday', () => {
    expect(slot('2026-10-15T08:00:00Z')).toBe('2026-10-20T07:00:00+02:00');
  });

  it('is queue-aware: returns the first slot after the latest scheduled post', () => {
    const queued = ['2026-10-13T07:00:00+02:00', '2026-10-15T07:00:00+02:00', '2026-10-20T07:00:00+02:00'];
    expect(slot('2026-10-10T08:00:00Z', queued)).toBe('2026-10-22T07:00:00+02:00');
  });

  it('never reuses a slot, also when posts are listed in any order and as pairs', () => {
    const queued = ['2026-10-20T07:00:00+02:00', '2026-10-13T07:00:00+02:00', '2026-10-20T05:00:00Z'];
    expect(slot('2026-10-10T08:00:00Z', queued)).toBe('2026-10-22T07:00:00+02:00');
  });

  it('ignores old posts', () => {
    expect(slot('2026-10-10T08:00:00Z', ['2026-08-18T09:00:00Z', '2026-10-09T12:00:00Z'])).toBe('2026-10-13T07:00:00+02:00');
  });

  it('after a post on a non-slot day continues with the next slot day', () => {
    expect(slot('2026-10-01T00:00:00Z', ['2026-10-17T10:00:00+02:00'])).toBe('2026-10-20T07:00:00+02:00');
  });

  it('switches the offset when summer time ends (2026-10-25)', () => {
    expect(slot('2026-10-22T08:00:00Z')).toBe('2026-10-27T07:00:00+01:00');
    expect(nextSlot({ now: '2026-10-22T08:00:00Z', dates: [] }).instant).toBe('2026-10-27T06:00:00.000Z');
  });

  it('switches the offset when summer time starts (2027-03-28)', () => {
    expect(slot('2027-03-25T08:00:00Z')).toBe('2027-03-30T07:00:00+02:00');
    expect(slot('2027-03-23T08:00:00Z')).toBe('2027-03-25T07:00:00+01:00');
  });

  it('crosses the year boundary', () => {
    expect(slot('2026-12-31T12:00:00Z')).toBe('2027-01-05T07:00:00+01:00');
    expect(slot('2026-12-29T12:00:00Z')).toBe('2026-12-31T07:00:00+01:00');
  });

  it('judges the Berlin calendar day, not the UTC day', () => {
    // 23:30 UTC on Monday is already Tuesday 01:30 in Berlin; 07:00 that day is still ahead.
    expect(slot('2026-10-12T23:30:00Z')).toBe('2026-10-13T07:00:00+02:00');
  });

  it('reports weekday and UTC instant', () => {
    expect(nextSlot({ now: '2026-10-10T08:00:00Z', dates: [] })).toEqual({
      slot: '2026-10-13T07:00:00+02:00',
      instant: '2026-10-13T05:00:00.000Z',
      weekday: 'Tuesday',
    });
  });

  it('rejects invalid input', () => {
    expect(() => nextSlot({ now: 'tomorrow', dates: [] })).toThrow(/invalid now/);
    expect(() => nextSlot({ now: '2026-10-10T00:00:00Z', dates: ['soon'] })).toThrow(/invalid post date/);
  });
});

describe('formatBerlin', () => {
  it('writes the offset of the day', () => {
    expect(formatBerlin(Date.parse('2026-07-01T05:00:00Z'))).toBe('2026-07-01T07:00:00+02:00');
    expect(formatBerlin(Date.parse('2026-01-01T06:00:00Z'))).toBe('2026-01-01T07:00:00+01:00');
  });
});

describe('CLI', () => {
  const run = (...args: string[]) =>
    execFileSync('node', ['scripts/next-slot.mjs', ...args], { encoding: 'utf8' });

  it('prints JSON for the real posts with a fake now', () => {
    const out = JSON.parse(run('--json', '--now', '2026-10-10T08:00:00Z'));
    expect(out).toMatchObject({ now: '2026-10-10T08:00:00Z' });
    expect(['Tuesday', 'Thursday']).toContain(out.weekday);
    expect(out.slot).toMatch(/^\d{4}-\d{2}-\d{2}T07:00:00\+0[12]:00$/);
    expect(Date.parse(out.slot)).toBeGreaterThan(Date.parse('2026-10-10T08:00:00Z'));
    expect(out.posts).toBeGreaterThan(0);
  });

  it('reads the queue from --dir, including a scheduled fixture pair', () => {
    const out = run('--now', '2026-10-10T08:00:00Z', '--dir', 'test/fixtures/scheduled-pair');
    expect(out.trim()).toBe('2026-10-15T07:00:00+02:00');
  });

  it('fails on unknown arguments', () => {
    expect(() => execFileSync('node', ['scripts/next-slot.mjs', '--bogus'], { stdio: 'pipe' })).toThrow();
  });
});
