import { describe, expect, it } from 'vitest';
import { hasShape, isArrayOf, isBoolean, isNumber, isOptional, isRecord, isString } from './type-guards';

describe('primitive guards', () => {
  it('isRecord accepts plain objects only', () => {
    expect(isRecord({ a: 1 })).toBe(true);
    expect(isRecord(null)).toBe(false);
    expect(isRecord([])).toBe(false);
    expect(isRecord('x')).toBe(false);
  });

  it('isNumber rejects NaN and Infinity (they are not usable data)', () => {
    expect(isNumber(4.5)).toBe(true);
    expect(isNumber(Number.NaN)).toBe(false);
    expect(isNumber(Infinity)).toBe(false);
    expect(isNumber('4')).toBe(false);
  });

  it('isString / isBoolean check the runtime type', () => {
    expect(isString('')).toBe(true);
    expect(isString(0)).toBe(false);
    expect(isBoolean(false)).toBe(true);
    expect(isBoolean('false')).toBe(false);
  });
});

describe('composed guards', () => {
  interface Player {
    name: string;
    score: number;
    nickname?: string;
  }

  const isPlayer = hasShape<Player>({ name: isString, score: isNumber, nickname: isOptional(isString) });

  it('hasShape accepts an object with every declared property valid', () => {
    expect(isPlayer({ name: 'Ann', score: 10 })).toBe(true);
    expect(isPlayer({ name: 'Ann', score: 10, nickname: 'A' })).toBe(true);
  });

  it('hasShape allows extra properties added by the backend', () => {
    expect(isPlayer({ name: 'Ann', score: 10, level: 99 })).toBe(true);
  });

  it('hasShape rejects a missing or wrongly typed property', () => {
    expect(isPlayer({ name: 'Ann' })).toBe(false);
    expect(isPlayer({ name: 'Ann', score: '10' })).toBe(false);
    expect(isPlayer({ name: 'Ann', score: 10, nickname: 5 })).toBe(false);
    expect(isPlayer('Ann')).toBe(false);
  });

  it('isArrayOf checks every item', () => {
    const isPlayers = isArrayOf(isPlayer);
    expect(isPlayers([])).toBe(true);
    expect(isPlayers([{ name: 'Ann', score: 1 }])).toBe(true);
    expect(isPlayers([{ name: 'Ann', score: 1 }, { name: 'Bob' }])).toBe(false);
    expect(isPlayers({ length: 0 })).toBe(false);
  });
});
