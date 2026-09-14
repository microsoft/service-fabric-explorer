const { test } = require('node:test');
const assert = require('node:assert/strict');
const { key, createHandler } = require('../../src/preview/snapshot.js');
const snapshot = { schemaVersion: 1, capturedAt: '2026-01-01T00:00:00Z', entries: {
  'GET /Nodes': { status: 200, data: { Items: [{ Name: 'node-1' }], ContinuationToken: '' } },
  'POST /$/GetClusterHealthChunk': { status: 200, data: { HealthState: 'Ok' } },
  'GET /EventsStore/Cluster/Events': { status: 200, data: [{ Kind: 'Upgrade', TimeStamp: '2025-12-31T23:00:00Z' }] }
} };
test('normalizes cache/version but retains entity selectors and continuation tokens', () => {
  assert.equal(key('GET', '/api/Nodes/?_cacheToken=1&api-version=3.0'), 'GET /Nodes');
  assert.notEqual(key('GET', '/Nodes?ContinuationToken=one'), key('GET', '/Nodes?ContinuationToken=two'));
  assert.notEqual(key('GET', '/Types?ApplicationTypeVersion=1'), key('GET', '/Types?ApplicationTypeVersion=2'));
});
test('returns independent copies and blocks mutations and uncaptured GETs', async () => {
  const handler = createHandler(snapshot);
  const result = await handler.request({ method: 'GET', url: '/Nodes' });
  result.data.Items.pop();
  assert.equal((await handler.request({ method: 'GET', url: '/Nodes' })).data.Items.length, 1);
  assert.equal((await handler.request({ method: 'POST', url: '/Nodes/n/$/Restart' })).statusCode, 403);
  assert.equal((await handler.request({ method: 'GET', url: '/Unknown' })).statusCode, 404);
  assert.equal((await handler.request({ method: 'POST', url: '/$/GetClusterHealthChunk' })).statusCode, 200);
});
test('shifts event dates once and honors date and type filters', async () => {
  const handler = createHandler(snapshot, Date.parse('2026-02-01T00:00:00Z'));
  const result = await handler.request({ method: 'GET', url: '/EventsStore/Cluster/Events?starttimeutc=2026-01-31T22:00:00Z&endtimeutc=2026-02-01T00:00:00Z' });
  assert.equal(result.data[0].TimeStamp, '2026-01-31T23:00:00.000Z');
  assert.equal((await handler.request({ method: 'GET', url: '/EventsStore/Cluster/Events?eventsTypesFilter=Other' })).data.length, 0);
});
test('rejects malformed snapshots', () => assert.throws(() => createHandler({ schemaVersion: 0 })));
test('matches Naming Viewer system IDs to captured v6 routes', async () => {
  const handler = createHandler({ ...snapshot, entries: {
    'GET /Applications/System/$/GetServices': { status: 200, data: { Items: [{ Id: 'System~NamingService', Name: 'fabric:/System/NamingService' }] } },
    'GET /Applications/System/$/GetServices/System~NamingService/$/GetPartitions': { status: 200, data: { Items: [{ PartitionInformation: { Id: 'p1' } }] } }
  } });
  const services = await handler.request({ method: 'GET', url: '/Applications/System/$/GetServices' });
  assert.equal(services.data.Items[0].Id, 'System/NamingService');
  const partitions = await handler.request({ method: 'GET', url: '/Applications/System/$/GetServices/System%2FNamingService/$/GetPartitions' });
  assert.equal(partitions.statusCode, 200);
  assert.equal(partitions.data.Items.length, 1);
});
test('adapts captured application types without unwrapping application or service collections', async () => {
  const paged = { Items: [{ Name: 'SampleType' }], ContinuationToken: '' };
  const handler = createHandler({ ...snapshot, entries: {
    'GET /ApplicationTypes': { status: 200, data: paged },
    'GET /Applications/Sample': { status: 200, data: { Id: 'Sample', Parameters: [] } },
    'GET /Applications/Sample/$/GetServices': { status: 200, data: paged }
  } });
  assert.deepEqual((await handler.request({ method: 'GET', url: '/ApplicationTypes/?api-version=3.0' })).data, paged.Items);
  assert.deepEqual((await handler.request({ method: 'GET', url: '/Applications/Sample/$/GetServices' })).data, paged);
  const app = await handler.request({ method: 'GET', url: '/Applications/Sample?ExcludeApplicationParameters=true&api-version=3.0' });
  assert.equal(app.statusCode, 200);
  assert.equal(app.data.Id, 'Sample');
});
