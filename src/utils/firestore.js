/**
 * Recursively removes properties with `undefined` values from an object.
 * Firestore does not support `undefined`. It also converts `undefined` in arrays to `null`.
 * This function mimics that behavior for consistency.
 * @param {any} obj The object to sanitize.
 * @returns {any} The sanitized object.
 */
export const sanitizeForFirestore = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => {
        if (item === undefined) {
            return null; // Firestore converts undefined array elements to null
        }
        return sanitizeForFirestore(item);
    });
  }

  const newObj = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      if (value !== undefined) {
        newObj[key] = sanitizeForFirestore(value);
      }
    }
  }

  return newObj;
};
