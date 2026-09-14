const { test } = require('node:test');
const assert = require('node:assert/strict');
const { sanitize } = require('./capture.cjs');
test('redacts credentials, parameters, embedded URLs and XML configuration', async () => {
  const data = await sanitize({ Password: 'secret-value', Parameters: [{ Key: 'secret', Value: 'secret-value' }], Address: 'https://cluster.example/api?sig=secret-value', Manifest: '<ClusterManifest><FabricSettings><Section Name="Secrets"><Parameter Name="StorageConnectionString" Value="secret-value"/><Parameter Name="IsEnabled" Value="true"/></Section></FabricSettings></ClusterManifest>' });
  assert.ok(!JSON.stringify(data).includes('secret-value'));
  assert.deepEqual(data.Parameters, []);
  assert.match(data.Manifest, /Value="true"/);
});
