import { describe, it, expect } from 'vitest';
import { shuffleArray } from './random';

describe('shuffleArray', () => {
  it('should return an array of the same length', () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffleArray(input);
    expect(result).toHaveLength(input.length);
  });

  it('should contain all the same elements as the input', () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffleArray(input);
    expect(result).toEqual(expect.arrayContaining(input));
    expect(input).toEqual(expect.arrayContaining(result));
  });

  it('should return an empty array when given an empty array', () => {
    const input: number[] = [];
    const result = shuffleArray(input);
    expect(result).toEqual([]);
  });

  it('should return the same single element array', () => {
    const input = [1];
    const result = shuffleArray(input);
    expect(result).toEqual([1]);
  });

  it('should not modify the input array (immutability)', () => {
    const input = [1, 2, 3, 4, 5];
    const inputCopy = [...input];
    shuffleArray(input);
    expect(input).toEqual(inputCopy);
  });

  it('should shuffle the elements (likely to be different)', () => {
    const input = Array.from({ length: 100 }, (_, i) => i);
    const result = shuffleArray(input);
    // While it's mathematically possible for it to be the same,
    // for 100 elements it's extremely unlikely (1/100!)
    expect(result).not.toEqual(input);
  });
});
