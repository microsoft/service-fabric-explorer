/// <reference types="cypress" />

import { addDefaultFixtures, addRoute, apiUrl, nodes_route } from './util.cy';

const editor = 'app-command-editor';
const catalog = 'nav[aria-label="Choose a command"]';
const search = 'input[aria-label="Find a command"]';
const script = `${editor} [data-cy=copy-text]`;
const copy = `${editor} [data-cy=clipboard] button`;
const dialog = 'app-action-dialog .action-modal';
const appName = 'VisualObjectsApplicationType';
const serviceName = 'VisualObjects.ActorService';
const serviceApi = `/Applications/${appName}/$/GetServices/${appName}%2F${serviceName}`;

const field = name => cy.get(`${editor} [id$="-${name}"]`);

const selectCommand = name => {
  cy.contains(`${catalog} button strong`, new RegExp(`^${Cypress._.escapeRegExp(name)}$`))
    .closest('button').click().should('have.attr', 'aria-pressed', 'true');
  cy.get(editor).should('have.length', 1);
  cy.get(`${editor} h2`).should('have.text', name);
};

const visitCommands = (path = '/#/commands', readyRequests = []) => {
  cy.visit(path, {
    onBeforeLoad(win) {
      win.localStorage.setItem('sfxNewExperience', 'true');
    },
  });
  cy.get('body').should('have.class', 'sfx-new');
  if (readyRequests.length) {
    cy.wait(readyRequests);
    cy.contains('[data-cy=navtabs] a', /^commands$/i).should('be.visible').click();
  }
  cy.location('hash').should('match', /\/commands$/);
  cy.get(editor).should('be.visible');
  cy.get('[data-cy=safeCommands]').should('have.attr', 'aria-selected', 'true');
};

const acknowledge = message => {
  cy.get(dialog).should('be.visible').and('contain.text', message);
  // This button only acknowledges viewing a safety group, never executes a command.
  cy.contains(`${dialog} [data-cy=submit]`, /^Acknowledge$/).click();
  cy.get(dialog).should('not.exist');
};

describe('New Commands experience (fixtures only)', () => {
  let blockedMutations;

  beforeEach(() => {
    blockedMutations = [];
    expect(Cypress.expose('API_PREFIX'), 'run against the static server, not a live proxy').to.equal('');

    // Registered first so explicit fixtures win. No unmatched XHR/fetch can leave the browser.
    cy.intercept({ url: '**', resourceType: /^(xhr|fetch)$/ }, { statusCode: 501, body: {} })
      .as('unmatchedApi');
    addDefaultFixtures();
    addRoute('commandClusterLoad', 'cluster-page/upgrade/get-load-information.json', apiUrl('/$/GetLoadInformation?*'));

    // GetClusterHealthChunk is a read-only POST supplied by addDefaultFixtures.
    // Middleware prevents any other mutation from being masked by a later fixture.
    cy.intercept({ url: '**', resourceType: /^(xhr|fetch)$/, middleware: true }, request => {
      const healthQuery = request.method === 'POST'
        && new URL(request.url).pathname.replace(/\/{2,}/g, '/') === '/$/GetClusterHealthChunk';
      if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method) && !healthQuery) {
        blockedMutations.push(`${request.method} ${request.url}`);
        request.reply({ statusCode: 403, body: {} });
      }
    });
  });

  afterEach(() => {
    cy.then(() => {
      expect(blockedMutations, 'no command mutations were attempted').to.deep.equal([]);
    });
    cy.get('@unmatchedApi.all').should(requests => {
      expect(requests.map(({ request }) => `${request.method} ${request.url}`), 'unmatched API requests')
        .to.deep.equal([]);
    });
  });

  it('searches command names and PowerShell names, selects one editor, and recovers from no matches', () => {
    visitCommands();
    cy.get(`${catalog} button`).should('have.length', 3);
    cy.get(dialog).should('not.exist');
    cy.get(`${editor} .risk[data-risk=safe]`).should('have.text', 'Safe');

    selectCommand('Get Cluster Health');
    cy.get(`${catalog} button[aria-pressed=true]`).should('have.length', 1);
    cy.get(script).should('have.text', 'Get-ServiceFabricClusterHealth ');

    cy.get(search).type('  CLUSTER UPGRADE  ');
    cy.get(`${catalog} button`).should('have.length', 1).and('contain.text', 'Get Cluster Upgrade');
    cy.get(`${editor} h2`).should('have.text', 'Get Cluster Upgrade');
    cy.get(search).clear().type('get-servicefabricrepairtask');
    cy.get(`${catalog} button`).should('have.length', 1).and('contain.text', 'Get Repair Task');
    cy.get(script).should('have.text', 'Get-ServiceFabricRepairTask ');

    cy.get(search).clear().type('no-such-command');
    cy.get(`${catalog} button`).should('not.exist');
    cy.get('.catalog-empty').should('have.text', 'No matching commands.');
    cy.get('.editor-empty').should('have.text', 'Try another command name.');
    cy.get(editor).should('not.exist');
    cy.get(search).clear();
    cy.get(`${catalog} button`).should('have.length', 3);
    cy.get(`${editor} h2`).should('have.text', 'Get Cluster Health');
  });

  it('generates numeric zero, boolean values and switch flags, then omits toggles when cleared', () => {
    visitCommands();
    selectCommand('Get Cluster Health');
    cy.get(`${editor} details.optional`).should('not.have.attr', 'open');
    cy.get(`${editor} details.optional summary`).click();
    cy.get(`${editor} details.optional`).should('have.attr', 'open');
    field('MaxPercentUnhealthyNodes').should('have.attr', 'type', 'number').type('0');
    field('TimeoutSec').type('0');
    field('ExcludeHealthStatistics').should('not.be.checked').check();
    field('ConsiderWarningAsError').should('not.be.checked').check();
    cy.get(script).should('have.text', 'Get-ServiceFabricClusterHealth -MaxPercentUnhealthyNodes 0 -ExcludeHealthStatistics -ConsiderWarningAsError $True -TimeoutSec 0');
    cy.get(copy).should('be.enabled');

    field('ExcludeHealthStatistics').uncheck();
    field('ConsiderWarningAsError').uncheck();
    cy.get(script).should('have.text', 'Get-ServiceFabricClusterHealth -MaxPercentUnhealthyNodes 0 -TimeoutSec 0');
    field('TimeoutSec').clear();
    cy.get(script).should('have.text', 'Get-ServiceFabricClusterHealth -MaxPercentUnhealthyNodes 0');
    selectCommand('Get Cluster Upgrade');
    cy.get(script).should('have.text', 'Get-ServiceFabricClusterUpgrade ');
    selectCommand('Get Cluster Health');
    field('MaxPercentUnhealthyNodes').should('have.value', '0');
    cy.get(script).should('have.text', 'Get-ServiceFabricClusterHealth -MaxPercentUnhealthyNodes 0');
  });

  it('disables copy until every required health-report field is valid and revalidates cleared values', () => {
    visitCommands();
    cy.get('[data-cy=unsafeCommands]').click();
    acknowledge('potentially unsafe');
    selectCommand('Send Health Report');
    cy.get(`${editor} [data-cy=requiredInput]`).should('have.length', 3);
    cy.get(copy).should('be.disabled')
      .and('have.attr', 'aria-label', 'Complete the required parameters before copying');
    cy.get(`${editor} .validation[role=status]`).should('contain.text', 'Complete all required parameters');

    field('HealthState').select('OK');
    cy.get(copy).should('be.disabled');
    field('SourceId').type('e2e-source');
    cy.get(copy).should('be.disabled');
    field('HealthProperty').type('e2e-property');
    cy.get(copy).should('be.enabled').and('have.attr', 'aria-label', 'Copy PowerShell');
    cy.get(`${editor} .validation`).should('not.exist');
    cy.get(script).should('have.text', 'Send-ServiceFabricClusterHealthReport  -HealthState OK -SourceId "e2e-source" -HealthProperty "e2e-property"');

    field('SourceId').clear().blur().should('have.attr', 'aria-invalid', 'true');
    cy.get(`${editor} .field-help`).should('contain.text', 'Enter a value for SourceId.');
    cy.get(copy).should('be.disabled');
    cy.get(script).should('not.contain.text', '-SourceId');
    field('SourceId').type('restored-source');
    field('HealthState').select('');
    cy.get(copy).should('be.disabled');
    field('HealthState').select('Warning');
    cy.get(copy).should('be.enabled');
    cy.get(script).should('contain.text', '-HealthState Warning -SourceId "restored-source"');
  });

  it('keeps unsafe node commands behind acknowledgement, supports cancellation and remembers consent', () => {
    addRoute('commandNodes', 'node-page/Ok-nodes-list.json', nodes_route);
    addRoute('commandNode', 'node-page/node-info.json', apiUrl('/Nodes/_nt_0/?*'));
    addRoute('commandNodeHealth', 'node-page/health.json', apiUrl('/Nodes/_nt_0/$/GetHealth?*'));
    addRoute('commandNodeApps', 'node-page/apps.json', apiUrl('/Nodes/_nt_0/$/GetApplications?*'));
    addRoute('commandNodeLoad', 'node-load/get-node-load-information.json', apiUrl('/Nodes/_nt_0/$/GetLoadInformation?*'));
    visitCommands('/#/node/_nt_0', ['@getcommandNode', '@getcommandNodeHealth', '@getcommandNodeApps', '@getcommandNodeLoad']);
    cy.get(script).should('contain.text', 'Get-ServiceFabricNodeHealth -NodeName "_nt_0"');
    cy.get('[data-cy=unsafeCommands]').click();
    cy.get(dialog).should('be.visible').and('contain.text', 'potentially unsafe');
    cy.get('[data-cy=safeCommands]').should('have.attr', 'aria-selected', 'true');
    cy.contains(`${dialog} button`, /^Cancel$/).click();
    cy.get(dialog).should('not.exist');
    cy.get(`${editor} .risk`).should('have.attr', 'data-risk', 'safe');

    cy.get('[data-cy=unsafeCommands]').click();
    acknowledge('potentially unsafe');
    cy.get('[data-cy=unsafeCommands]').should('have.attr', 'aria-selected', 'true');
    selectCommand('Restart Node');
    cy.get(`${editor} .risk[data-risk=unsafe]`).should('have.text', 'Unsafe');
    cy.get(`${editor} .admin`).should('have.text', 'Admin only');
    cy.get(`${editor} .risk-notice`).should('contain.text', 'can change cluster state');
    cy.get(editor).should('contain.text', 'No additional parameters are needed.');
    cy.get(script).should('have.text', 'Restart-ServiceFabricNode -NodeName "_nt_0" -NodeInstanceId 132428526792306088 ');
    cy.get(copy).should('be.enabled');

    cy.get('[data-cy=safeCommands]').click();
    cy.get(`${editor} .risk`).should('have.attr', 'data-risk', 'safe');
    cy.get('[data-cy=unsafeCommands]').click();
    cy.get(dialog).should('not.exist');
    cy.get(`${editor} h2`).should('have.text', 'Restart Node');
  });

  it('shows resource-specific service scripts, documentation and the copy-only footer', () => {
    addRoute('commandServices', 'app-page/services.json', apiUrl(`/Applications/${appName}/$/GetServices?*`));
    addRoute('commandService', 'service-page/service-info.json', apiUrl(`${serviceApi}?*`));
    addRoute('commandServiceDescription', 'service-page/service-description.json', apiUrl(`${serviceApi}/$/GetDescription?*`));
    addRoute('commandServiceHealth', 'service-page/service-health.json', apiUrl(`${serviceApi}/$/GetHealth?*`));
    addRoute('commandPartitions', 'service-page/service-partitions.json', apiUrl(`${serviceApi}/$/GetPartitions?*`));
    addRoute('commandApp', 'app-page/app-type.json', apiUrl(`/Applications/${appName}/?*`));
    addRoute('commandAppHealth', 'app-page/app-health.json', apiUrl(`/Applications/${appName}/$/GetHealth?*`));
    addRoute('commandServiceTypes', 'app-page/service-types.json', apiUrl(`/ApplicationTypes/${appName}/$/GetServiceTypes?*`));
    addRoute('commandAppManifest', 'app-page/app-manifest.json', apiUrl(`/ApplicationTypes/${appName}/$/GetApplicationManifest?*`));
    addRoute('commandServiceManifest', 'service-page/service-manifest.json', apiUrl(`/ApplicationTypes/${appName}/$/GetServiceManifest?*`));
    visitCommands(`/#/apptype/${appName}/app/${appName}/service/${appName}%252F${serviceName}/commands`);
    selectCommand('Get Service');
    cy.get(script).should('have.text', `Get-ServiceFabricService -ApplicationName fabric:/${appName} -ServiceName fabric:/${appName}/${serviceName} `);
    cy.get('.command-intro').should('contain.text', 'Commands are not executed in Service Fabric Explorer.');
    cy.get(`${editor} .editor-footer`).should('contain.text', 'Configure parameters and copy the generated PowerShell.');
    cy.contains(`${editor} .editor-footer a`, /^Documentation$/)
      .should('have.attr', 'href', 'https://docs.microsoft.com/powershell/module/servicefabric/get-servicefabricservice')
      .and('have.attr', 'target', '_blank').and('have.attr', 'rel', 'noopener noreferrer');
    selectCommand('Get Partitions');
    cy.get(script).should('have.text', `Get-ServiceFabricPartition -ServiceName fabric:/${appName}/${serviceName} `);
    cy.contains(`${editor} .editor-footer a`, /^Documentation$/)
      .should('have.attr', 'href', 'https://docs.microsoft.com/powershell/module/servicefabric/get-servicefabricpartition');
    cy.get(`${editor} button`).should('have.length', 1);
    cy.get(copy).should('be.enabled').and('have.attr', 'aria-label', 'Copy PowerShell');
  });

  it('generates the real idle-secondary force-remove command only after unsafe acknowledgement', () => {
    const partitionId = '28bfaf73-37b0-467d-9d47-d011b0aedbc0';
    const replicaId = '132429154475414363';
    const partitionApi = `${serviceApi}/$/GetPartitions/${partitionId}`;
    const replicaApi = `${partitionApi}/$/GetReplicas/${replicaId}`;
    const removeScript = `Remove-ServiceFabricReplica -ForceRemove -ServiceName fabric:/${appName}/${serviceName} -ReplicaOrInstanceId ${replicaId}`;

    addRoute('commandReplicaServices', 'app-page/services.json', apiUrl(`/Applications/${appName}/$/GetServices?*`));
    addRoute('commandReplicaPartitions', 'replica-page/stateful-service-partitions.json', apiUrl(`${serviceApi}/$/GetPartitions?*`));
    addRoute('commandReplicaPartition', 'replica-page/stateful-partition-info.json', apiUrl(`${partitionApi}?*`));
    addRoute('commandIdleReplica', 'replica-page/stateful-idle-secondary-replica-info.json', apiUrl(`${replicaApi}?*`));
    addRoute('commandReplicaHealth', 'replica-page/health.json', apiUrl(`${replicaApi}/$/GetHealth?*`));
    addRoute('commandReplicaDetail', 'replica-page/stateful-replica-detail.json', apiUrl(`/Nodes/_nt_1/$/GetPartitions/${partitionId}/$/GetReplicas/${replicaId}/$/GetDetail?api-version=6.0`));
    cy.fixture('replica-page/stateful-replicas-list.json').then(replicas => {
      // Keep collection refreshes consistent with the existing idle-secondary detail fixture.
      cy.intercept('GET', apiUrl(`${partitionApi}/$/GetReplicas?*`), {
        ...replicas,
        Items: replicas.Items.map(replica => replica.ReplicaId === replicaId
          ? { ...replica, ReplicaRole: 'IdleSecondary' } : replica),
      }).as('commandReplicas');
    });
    visitCommands(`/#/apptype/${appName}/app/${appName}/service/${appName}%252F${serviceName}/partition/${partitionId}/replica/${replicaId}`,
      ['@getcommandIdleReplica', '@getcommandReplicaHealth', '@getcommandReplicaDetail']);
    cy.get(script).should('have.text', `Get-ServiceFabricReplicaHealth -PartitionId ${partitionId} -ReplicaOrInstanceId ${replicaId} `);

    // The shipped factory classifies force-remove as unsafe. No real factory
    // registers danger, so commented dangerous output is not reachable in E2E.
    cy.get('[data-cy=dangerousCommands]').should('not.exist');
    cy.contains(`${catalog} button`, 'Force Remove Replica/Instance').should('not.exist');
    cy.get('[data-cy=unsafeCommands]').click();
    cy.get(dialog).should('be.visible').and('contain.text', 'potentially unsafe');
    cy.get('[data-cy=safeCommands]').should('have.attr', 'aria-selected', 'true');
    cy.contains(`${dialog} button`, /^Cancel$/).click();
    cy.get(dialog).should('not.exist');
    cy.get(`${editor} .risk`).should('have.attr', 'data-risk', 'safe');
    cy.get('[data-cy=unsafeCommands]').click();
    acknowledge('potentially unsafe');
    selectCommand('Force Remove Replica/Instance');
    cy.get(`${editor} .risk[data-risk=unsafe]`).should('have.text', 'Unsafe');
    cy.get(`${editor} .admin`).should('have.text', 'Admin only');
    cy.get(`${editor} .risk-notice`).should('contain.text', 'can change cluster state');
    cy.get(script).should('have.text', `${removeScript} `);
    cy.get(`${editor} details.optional summary`).click();
    field('CommandCompletionMode').select('Verify');
    field('TimeoutSec').type('0');
    cy.get(script).should('have.text', `${removeScript} -CommandCompletionMode Verify -TimeoutSec 0`);
    cy.get(copy).should('be.enabled');
    cy.contains(`${editor} .editor-footer a`, /^Documentation$/)
      .should('have.attr', 'href', 'https://docs.microsoft.com/powershell/module/servicefabric/remove-servicefabricreplica');

    cy.get('[data-cy=safeCommands]').click();
    cy.get('[data-cy=unsafeCommands]').click();
    cy.get(dialog).should('not.exist');
    cy.get(script).should('have.text', `${removeScript} -CommandCompletionMode Verify -TimeoutSec 0`);
  });
});
