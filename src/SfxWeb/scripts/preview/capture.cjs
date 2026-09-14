const fs = require('node:fs/promises');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { parseStringPromise, Builder } = require('xml2js');
const { key } = require('../../src/preview/snapshot.js');

const root = path.resolve(__dirname, '../..');
const base = new URL(process.env.SFX_CAPTURE_URL || 'http://localhost:3002/api/');
if (!['localhost', '127.0.0.1', '[::1]'].includes(base.hostname) || base.username || base.password) {
  throw new Error('Capture must use an existing loopback connection; never supply credentials in the URL.');
}
const sensitive = /password|secret|connectionstring|accountkey|accesskey|privatekey|authorization|thumbprint|token|certificate/i;
const safeParameter = /^(IsEnabled|Enabled|TargetReplicaSetSize|MinReplicaSetSize|EventStoreServiceReplicatorAddress|DataDeletionAgeInDays|MaxResults|ApplicationTypeName|ServiceTypeName)$/i;
const stats = { redactions: 0, successful: 0, failed: 0 };
async function sanitize(value, field = '') {
  if (sensitive.test(field) && field !== 'ContinuationToken') {
    stats.redactions++;
    return '[redacted]';
  }
  if (field === 'Parameters' || field === 'ApplicationParameters') {
    stats.redactions++;
    return Array.isArray(value) ? [] : {};
  }
  if (Array.isArray(value)) return Promise.all(value.map(item => sanitize(item)));
  if (value && typeof value === 'object') {
    return Object.fromEntries(await Promise.all(Object.entries(value).map(async ([k, v]) => [k, await sanitize(v, k)])));
  }
  if (typeof value !== 'string') return value;
  if (field === 'Manifest' && value.trim().startsWith('<')) {
    const xml = await parseStringPromise(value);
    function scrub(item, element = '') {
      if (!item || typeof item !== 'object') return;
      if (item.$) {
        for (const attr of Object.keys(item.$)) {
          if (sensitive.test(attr) || ((element === 'Parameter' || element === 'EnvironmentVariable') && ['Value', 'DefaultValue'].includes(attr) && !safeParameter.test(item.$.Name || ''))) {
            item.$[attr] = '[redacted]'; stats.redactions++;
          }
        }
      }
      for (const [name, children] of Object.entries(item)) {
        if (name === '$') continue;
        if (Array.isArray(children)) children.forEach(child => scrub(child, name));
        else scrub(children, name);
      }
    }
    scrub(xml);
    return new Builder().buildObject(xml);
  }
  return value
    .replace(/-----BEGIN [^-]*PRIVATE KEY-----[\s\S]*?-----END [^-]*PRIVATE KEY-----/g, () => { stats.redactions++; return '[redacted]'; })
    .replace(/((?:AccountKey|SharedAccessSignature|Password|Secret|Token|Thumbprint)\s*[=:]\s*)[^\s;"<]+/gi, (_m, prefix) => { stats.redactions++; return prefix + '[redacted]'; })
    .replace(/https?:\/\/[^\s"<>]+/gi, () => { stats.redactions++; return 'https://snapshot.invalid'; })
    .replace(/\b(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?\b/g, match => {
      if (!/address|endpoint|description/i.test(field)) return match;
      stats.redactions++; return '192.0.2.1';
    });
}

async function capture() {
  const capturedAt = new Date().toISOString();
  const entries = {};
  const failures = [];
  const enc = encodeURIComponent;
  const items = data => Array.isArray(data) ? data : data?.Items || [];
  async function get(route, method = 'GET', body, required = false) {
    if (method !== 'GET' && !(method === 'POST' && route.split('?')[0] === '/$/GetClusterHealthChunk')) throw new Error('Read-only capture');
    const requestKey = key(method, route);
    if (entries[requestKey]) return entries[requestKey].data;
    const url = new URL(base.href.replace(/\/$/, '') + route);
    if (!url.searchParams.has('api-version')) url.searchParams.set('api-version', '6.0');
    try {
      let response = await fetch(url, { method, redirect: 'error', signal: AbortSignal.timeout(30000), headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      let data = await response.json();
      const seen = new Set();
      while (data.ContinuationToken) {
        if (seen.has(data.ContinuationToken) || seen.size >= 100) throw new Error('Pagination limit');
        seen.add(data.ContinuationToken);
        url.searchParams.set('ContinuationToken', data.ContinuationToken);
        response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(30000) });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const page = await response.json();
        data.Items.push(...page.Items);
        data.ContinuationToken = page.ContinuationToken;
      }
      entries[requestKey] = { status: 200, data };
      stats.successful++;
      return data;
    } catch (error) {
      if (required) throw new Error(`Required capture failed: ${route.split('?')[0]} (${error.message})`);
      failures.push({ key: requestKey, reason: error.message }); stats.failed++;
      return null;
    }
  }
  const manifest = await get('/$/GetClusterManifest', 'GET', undefined, true);
  const expected = process.env.SFX_CAPTURE_EXPECTED_CLUSTER || 'davidzhang-test';
  if (!manifest.Manifest?.includes(expected)) throw new Error('Connected cluster does not match expected cluster. Capture stopped.');
  const [nodes, apps, types] = await Promise.all([
    get('/Nodes', 'GET', undefined, true),
    get('/Applications', 'GET', undefined, true),
    get('/ApplicationTypes?api-version=3.0', 'GET', undefined, true)
  ]);
  entries[key('GET', '/Applications?ExcludeApplicationParameters=true')] = { status: 200, data: apps };
  const routes = ['/$/GetClusterHealth?NodesHealthStateFilter=65535&ApplicationsHealthStateFilter=65535&EventsHealthStateFilter=65535', '/$/GetUpgradeProgress?api-version=8.2', '/$/GetLoadInformation', '/$/GetClusterVersion', '/$/GetRepairTaskList', '/$/GetFailoverManagerManagerInformation?api-version=11.4', '/Applications/System/$/GetHealth'];
  await Promise.all(routes.map(route => get(route)));
  await get('/$/GetClusterHealthChunk', 'POST', {
    NodeFilters: [{ HealthStateFilter: 65535 }],
    ApplicationFilters: [{ HealthStateFilter: 65535, ServiceFilters: [{ HealthStateFilter: 65535, PartitionFilters: [{ HealthStateFilter: 65535, ReplicaFilters: [{ HealthStateFilter: 65535 }] }] }], DeployedApplicationFilters: [{ HealthStateFilter: 65535, DeployedServicePackageFilters: [{ HealthStateFilter: 65535 }] }] }]
  }, true);
  const end = new Date(capturedAt), start = new Date(end.getTime() - 7 * 86400000);
  const eventQuery = `?api-version=8.0&starttimeutc=${start.toISOString().slice(0, 19)}Z&endtimeutc=${end.toISOString().slice(0, 19)}Z`;
  for (const kind of ['Cluster', 'Nodes', 'Applications', 'Services', 'Partitions']) await get(`/EventsStore/${kind}/Events${eventQuery}`);
  for (const node of items(nodes)) {
    const n = enc(node.Name);
    entries[key('GET', `/Nodes/${n}`)] = { status: 200, data: node };
    await Promise.all([get(`/Nodes/${n}/$/GetHealth`), get(`/Nodes/${n}/$/GetLoadInformation`), get(`/Nodes/${n}/$/GetApplications`), get(`/EventsStore/Nodes/${n}/$/Events${eventQuery}`)]);
  }
  for (const type of items(types)) {
    const t = enc(type.Name);
    entries[key('GET', `/ApplicationTypes/${t}`)] = { status: 200, data: items(types).filter(item => item.Name === type.Name) };
    await get(`/ApplicationTypes/${t}/$/GetApplicationManifest?ApplicationTypeVersion=${enc(type.Version)}`);
    const serviceTypes = await get(`/ApplicationTypes/${t}/$/GetServiceTypes?ApplicationTypeVersion=${enc(type.Version)}`);
    for (const serviceType of items(serviceTypes)) {
      if (serviceType.ServiceManifestName) await get(`/ApplicationTypes/${t}/$/GetServiceManifest?ApplicationTypeVersion=${enc(type.Version)}&ServiceManifestName=${enc(serviceType.ServiceManifestName)}`);
    }
  }
  for (const app of [...items(apps), { Id: 'System', Name: 'fabric:/System' }]) {
    const a = enc(app.Id);
    if (app.Id !== 'System') {
      entries[key('GET', `/Applications/${a}`)] = { status: 200, data: app };
      await Promise.all([get(`/Applications/${a}/$/GetHealth`), get(`/Applications/${a}/$/GetUpgradeProgress`), get(`/EventsStore/Applications/${a}/$/Events${eventQuery}`)]);
    }
    const services = await get(`/Applications/${a}/$/GetServices`, 'GET', undefined, true);
    for (const service of items(services)) {
      const s = enc(service.Id), prefix = `/Applications/${a}/$/GetServices/${s}`;
      entries[key('GET', prefix)] = { status: 200, data: service };
      await Promise.all([get(`${prefix}/$/GetHealth`), get(`${prefix}/$/GetDescription`), get(`/EventsStore/Services/${s}/$/Events${eventQuery}`)]);
      const partitions = await get(`${prefix}/$/GetPartitions`, 'GET', undefined, true);
      for (const partition of items(partitions)) {
        const id = enc(partition.PartitionInformation.Id), p = `${prefix}/$/GetPartitions/${id}`;
        entries[key('GET', p)] = { status: 200, data: partition };
        entries[key('GET', `/Partitions/${id}`)] = { status: 200, data: partition };
        await Promise.all([get(`${p}/$/GetHealth`), get(`${p}/$/GetLoadInformation`), get(`/EventsStore/Partitions/${id}/$/Events${eventQuery}`)]);
        if (service.Name === 'fabric:/System/NamingService') {
          await get(`/EventsStore/Partitions/${id}/$/Replicas/Events${eventQuery}`, 'GET', undefined, true);
        }
        const replicas = await get(`${p}/$/GetReplicas`);
        for (const replica of items(replicas)) {
          const r = enc(replica.ReplicaId || replica.InstanceId);
          entries[key('GET', `${p}/$/GetReplicas/${r}`)] = { status: 200, data: replica };
          await get(`${p}/$/GetReplicas/${r}/$/GetHealth`);
        }
      }
    }
  }
  const build = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim() + (execFileSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' }).trim() ? '-working-tree' : '');
  // Top-level request keys are routes, not payload fields; preserve them verbatim.
  const safeEntries = Object.fromEntries(await Promise.all(Object.entries(entries).map(async ([route, entry]) => [route, { status: entry.status, data: await sanitize(entry.data) }])));
  const snapshot = { schemaVersion: 1, capturedAt, build, source: 'Dedicated test-cluster snapshot', entries: safeEntries };
  const directory = path.join(root, 'preview-data');
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, 'snapshot.json'), JSON.stringify(snapshot));
  await fs.writeFile(path.join(directory, 'capture-report.json'), JSON.stringify({ capturedAt, build, ...stats, entryCount: Object.keys(entries).length, failures }, null, 2));
  console.log(JSON.stringify({ ...stats, entryCount: Object.keys(entries).length, output: 'preview-data/snapshot.json' }));
}
if (require.main === module) capture().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { sanitize };
