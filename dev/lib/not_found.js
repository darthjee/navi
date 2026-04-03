/**
 * Sends a 404 JSON response with `{ error: 'Not found' }`.
 * @param {import('express').Response} res - Express response object.
 * @returns {void}
 */
export const notFound = (res) => res.status(404).json({ error: 'Not found' });
