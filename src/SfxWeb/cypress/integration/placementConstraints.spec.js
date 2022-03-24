/// <reference types="cypress" />

import { addDefaultFixtures, apiUrl, checkTableSize, EMPTY_LIST_TEXT, FIXTURE_REF_MANIFEST, addRoute } from './util';

const serviceName = "VisualObjects.ActorService";
const partitionId = "28bfaf73-37b0-467d-9d47-d011b0aedbc0";
const appName = "VisualObjectsApplicationType";

const primaryReplica = "132429154475414363";

const waitRequest = "@getpartitionInfo";

const routeFormatter = (appName, serviceName) => `/Applications/${appName}/$/GetServices/${appName}%2F${serviceName}/$/GetDescription?`;
const urlFormatter = (app, service) => `/#/apptype/${app}/app/${app}/service/${app}%252F${service}/placement`;

describe("Go to placement constraint page",() => {
    beforeEach(() => {
        addRoute('manifest','placement-page/clusterManifest-placement.json',apiUrl(`/$/GetClusterManifest?`));
        addRoute('nodes','placement-page/nodes-placement.json',apiUrl(`/Nodes/?`));
        addRoute('constraints','placement-page/service-description-placement.json',apiUrl(routeFormatter(appName,serviceName)));
        
        //addRoute("partitions", "partition-page/partitions.json", apiUrl(`${routeFormatter(appName, serviceName)}?*`));
        cy.visit(urlFormatter(appName, serviceName));
    });
    it("go to placement page",() => {
        console.log('OK');
    })
})