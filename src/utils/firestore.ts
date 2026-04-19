/**
 * Removes undefined fields from an object to prevent Firestore errors.
 * Firestore does not allow undefined values in documents.
 */
export function removeUndefinedFields<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
