/* Shared by the browser preview and Node capture/tests. No network fallback. */
(function (root) {
  'use strict';
  // All application parameters are removed during capture, so both read-only query forms are equivalent.
  const ignored = new Set(['api-version', '_cachetoken', 'timeout', 'starttimeutc', 'endtimeutc', 'eventstypesfilter', 'excludeapplicationparameters']);
  function key(method, input) {
    const url = new URL(input, 'https://snapshot.invalid');
    const params = [...url.searchParams].filter(([name]) => !ignored.has(name.toLowerCase()) && !name.toLowerCase().endsWith('healthstatefilter'));
    params.sort(([a, av], [b, bv]) => a.localeCompare(b) || av.localeCompare(bv));
    const query = new URLSearchParams(params).toString();
    const pathname = url.pathname.replace(/^\/api(?=\/)/, '').replace(/\/+$/, '')
      .replace(/(\/Applications\/System\/\$\/GetServices\/System)%2F/gi, '$1~');
    return method.toUpperCase() + ' ' + pathname + (query ? '?' + query : '');
  }
  function createHandler(snapshot, now = Date.now()) {
    if (snapshot.schemaVersion !== 1 || !snapshot.entries || !Number.isFinite(Date.parse(snapshot.capturedAt))) {
      throw new Error('Invalid snapshot');
    }
    const offset = now - Date.parse(snapshot.capturedAt);
    function shift(value, field = '') {
      if (Array.isArray(value)) return value.map(item => shift(item));
      if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, shift(v, k)]));
      if (typeof value === 'string' && /(?:timestamp|timeutc|atutc)$/i.test(field) && /^20\d\d-\d\d-\d\dT/.test(value) && Number.isFinite(Date.parse(value))) {
        return new Date(Date.parse(value) + offset).toISOString();
      }
      return value;
    }
    const entries = shift(snapshot.entries);
    const missing = new Set();
    async function request(req) {
      const requestKey = key(req.method, req.url);
      const read = req.method === 'GET' || requestKey === 'POST /$/GetClusterHealthChunk';
      const entry = read && Object.hasOwn(entries, requestKey) ? entries[requestKey] : null;
      if (!entry) missing.add(requestKey);
      let data = entry ? JSON.parse(JSON.stringify(entry.data)) : { Error: { Code: 'SNAPSHOT_UNAVAILABLE', Message: read ? 'This page or query was not captured in the preview.' : 'Cluster changes are disabled in the snapshot preview.' } };
      // Existing snapshots contain v6 paged application types; SFX's v3 consumer expects an array.
      if (/^GET \/ApplicationTypes(?:\/[^/?]+)?$/.test(requestKey) && Array.isArray(data.Items)) data = data.Items;
      // System pages look up v3 IDs by name, while saved v6 responses use '~'.
      if (requestKey === 'GET /Applications/System/$/GetServices' && Array.isArray(data.Items)) {
        for (const service of data.Items) {
          if (service.Name?.startsWith('fabric:/System/')) service.Id = service.Name.substring('fabric:/'.length);
        }
      }
      if (entry && requestKey.includes('/EventsStore/') && Array.isArray(data)) {
        const params = new URL(req.url, 'https://snapshot.invalid').searchParams;
        const start = Date.parse(params.get('starttimeutc'));
        const end = Date.parse(params.get('endtimeutc'));
        const types = (params.get('eventsTypesFilter') || '').split(',').filter(Boolean);
        data = data.filter(event => (!Number.isFinite(start) || Date.parse(event.TimeStamp) >= start) && (!Number.isFinite(end) || Date.parse(event.TimeStamp) <= end) && (!types.length || types.includes(event.Kind)));
      }
      return { httpVersion: '1.1', statusCode: entry ? entry.status : read ? 404 : 403, statusMessage: entry ? 'Snapshot' : 'Unavailable in snapshot', data, headers: [], body: [] };
    }
    return { request, missing };
  }
  const api = { key, createHandler };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SfxSnapshot = api;
})(typeof window === 'undefined' ? globalThis : window);
