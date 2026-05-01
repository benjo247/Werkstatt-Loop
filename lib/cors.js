/**
 * CORS-Header für öffentliche API-Routes (Buchungs-Widget auf externen Werkstatt-Webseiten).
 * In Production später auf konkrete Workshop-Domains einschränken.
 */
export const PUBLIC_CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export function corsResponse(body, init = {}) {
  return Response.json(body, {
    ...init,
    headers: { ...PUBLIC_CORS, ...(init.headers || {}) },
  });
}
