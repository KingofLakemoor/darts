import { describe, it, expect } from 'vitest';
import { removeUndefinedFields } from './firestore';

describe('removeUndefinedFields', () => {
  it('should remove undefined fields from a shallow object', () => {
    const input = { a: 1, b: undefined, c: 'test' };
    const expected = { a: 1, c: 'test' };
    expect(removeUndefinedFields(input)).toEqual(expected);
  });

  it('should remove undefined fields from a nested object', () => {
    const input = { a: 1, b: { c: 2, d: undefined }, e: undefined };
    const expected = { a: 1, b: { c: 2 } };
    expect(removeUndefinedFields(input)).toEqual(expected);
  });

  it('should handle arrays correctly', () => {
    const input = { a: [1, undefined, 2], b: [{ c: 3, d: undefined }] };
    // JSON.stringify converts undefined in arrays to null
    const expected = { a: [1, null, 2], b: [{ c: 3 }] };
    expect(removeUndefinedFields(input)).toEqual(expected);
  });

  it('should return the same object if no undefined fields exist', () => {
    const input = { a: 1, b: 'test', c: { d: 3 } };
    expect(removeUndefinedFields(input)).toEqual(input);
  });
});
