// KV keys. Kept out of the Worker entry module: workerd treats every named export
// of the entry as a handler and rejects plain values.
export const CATALOG_KEY = 'catalog:v1';
export const HISTORY_KEY = 'history:daily:v1';
export const IDS_KEY = 'itad:ids:v1';
