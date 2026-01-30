// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

/// <reference types="cypress" />

export const apiUrl = (url) => {
    return `/${Cypress.env("API_PREFIX")}${url}`;
}

export const fixtureRefFormatter = (fixture_ref_name) => {
    return `@${fixture_ref_name}`;
}

const fixtureRequestFormatter = (fixture_reqest_ref_name) => {
    return `get${fixture_reqest_ref_name}`;
}

const exportFormat = (fixture_ref_name) => {
    return fixtureRefFormatter(fixtureRequestFormatter(fixture_ref_name));
}

export const FIXTURE_AAD ="aad";
export const FIXTURE_REF_AAD = exportFormat(FIXTURE_AAD);
export const aad_route = apiUrl('/$/GetAadMetadata/*');

export const FIXTURE_APPS ="apps";
export const FIXTURE_REF_APPS = exportFormat(FIXTURE_APPS);
export const apps_route = apiUrl('/Applications/?*');

export const FIXTURE_APPTYPES ="appTypess";
export const FIXTURE_REF_APPTYPES = exportFormat(FIXTURE_APPTYPES);
export const apptypes_route = apiUrl('/ApplicationTypes/?*');

export const FIXTURE_CLUSTERHEALTH ="clusterHealth";
export const FIXTURE_REF_CLUSTERHEALTH = exportFormat(FIXTURE_CLUSTERHEALTH);
export const clusterHealth_route = apiUrl('/$/GetClusterHealth?*');

export const FIXTURE_CLUSTERHEALTHCHUNK ="clusterHealthChunk";
export const FIXTURE_REF_CLUSTERHEALTHCHUNK = exportFormat(FIXTURE_CLUSTERHEALTHCHUNK);
export const clusterHealthChunk_route = apiUrl('/$/GetClusterHealthChunk?*');

export const FIXTURE_MANIFEST ="manifest";
export const FIXTURE_REF_MANIFEST = exportFormat(FIXTURE_MANIFEST);
export const manifest_route = apiUrl('/$/GetClusterManifest*');

export const FIXTURE_NODES ="nodes";
export const FIXTURE_REF_NODES = exportFormat(FIXTURE_NODES);
export const nodes_route = apiUrl('/Nodes/?*');

export const FIXTURE_SYSTEMAPPLICATIONS_HEALTH ="systemAppHealth";
export const FIXTURE_REF_SYSTEMAPPLICATIONS_HEALTH = exportFormat(FIXTURE_SYSTEMAPPLICATIONS_HEALTH);
export const systemApplicationHealth_route = apiUrl('/Applications/System/$/GetHealth*');

export const FIXTURE_UPGRADEPROGRESS ="upgradeProgress";
export const FIXTURE_REF_UPGRADEPROGRESS = exportFormat(FIXTURE_UPGRADEPROGRESS);
export const upgradeProgress_route = apiUrl('/$/GetUpgradeProgress*');

export const FIXTURE_UPGRADEREPAIRTASK ="GetRepairTaskList";
export const FIXTURE_REF_UPGRADEREPAIRTASK = exportFormat(FIXTURE_UPGRADEPROGRESS);
export const repairTask_route = apiUrl('/$/GetRepairTaskList?*');

export const FIXTURE_SYSTEMAPPS ="getSystemApps";
export const FIXTURE_REF_SYSTEMAPPS = exportFormat(FIXTURE_UPGRADEPROGRESS);
export const systemApps_route = apiUrl('/Applications/System/$/GetServices?*');

export const addRoute = (fixtureName, fixtureFileName, route, requestType = 'GET') => {
    cy.intercept(requestType, route, {fixture: fixtureFileName}).as(fixtureRequestFormatter(fixtureName))
}

export const addDefaultFixtures = (prefix = "") => {
    addRoute(FIXTURE_AAD, prefix + 'aad.json', aad_route)
    addRoute(FIXTURE_APPS, prefix + 'applications.json', apps_route)
    addRoute(FIXTURE_APPTYPES, prefix + 'appType.json', apptypes_route)
    addRoute(FIXTURE_CLUSTERHEALTH, prefix + 'clusterHealth.json', clusterHealth_route)
    addRoute(FIXTURE_CLUSTERHEALTHCHUNK, prefix + 'clusterHealthChunk.json', clusterHealthChunk_route, 'POST')
    addRoute(FIXTURE_MANIFEST, prefix + 'clusterManifest.json', manifest_route)
    addRoute(FIXTURE_NODES, prefix + 'nodes.json', nodes_route)
    addRoute(FIXTURE_SYSTEMAPPLICATIONS_HEALTH, prefix + 'systemApplicationHealth.json', systemApplicationHealth_route)
    addRoute(FIXTURE_UPGRADEPROGRESS, prefix + 'upgradeProgress.json', upgradeProgress_route)
    addRoute(FIXTURE_REF_SYSTEMAPPS, prefix + 'systemApps.json', systemApps_route)
    addRoute(FIXTURE_UPGRADEREPAIRTASK, prefix + 'emptyRepairJobs.json', repairTask_route)
    addRoute('visualObjectsApplicationType', prefix + 'visualObjectsApplicationType.json', apiUrl('/Applications/VisualObjectsApplicationType/?*'))
}


export const addDefaultAppTypeFixtures = () => {
    addDefaultFixtures();
}

/**
Cause an SFX refresh by pressing the refresh button in page.
*/
export const refresh = () => {
    cy.get("[data-cy=refresh]").click();
}

export const turnOffRefresh = () => {
    cy.get("[data-cy=refreshrate]").within( () => {
        cy.contains("Off").click();
    })
}

/*
Get the number of rows in a table.
This should be used when there is only one table within scope.
*/
export const checkTableSize = (size) => {
    return cy.get('tbody > tr').should('have.length', size);
}

/*
Checks if the table within scope only has a row and it displays the message.
Used to validate detail lists on the events page.
*/
export const checkTableErrorMessage = (message) => {
    checkTableSize(1);
    cy.get('tbody').first().within(() => {
       cy.contains(message)
    });
}

export const EMPTY_LIST_TEXT = "No items to display.";
export const FAILED_LOAD_TEXT = "Some items failed to load.";
export const FAILED_TABLE_TEXT = "Items failed to load.";

export const checkActions = (actionsText) => {
    cy.get('[data-cy=actions]').within(() => {
      cy.contains("Actions").click();

      actionsText.forEach( actionName => {
        cy.contains(actionName)
      })
  })
}

export const typeIntoInput = (inputRef, text = "") => {
  cy.get(inputRef).within(() => {
    if(text.length === 0) {
      cy.get('input').clear()
    }else {
      cy.get('input').type(text);
    }
  })
}

export const checkCheckBox = (inputRef) => {
  cy.get(inputRef).within(() => {
      cy.get('input').check()
  })
}

export const checkCommand = (numSafeCommands, numUnsafeCommands = 0) => {

  cy.get('[data-cy=navtabs]').within(() => {
    cy.contains('commands').click();
  })

  cy.url().should('include', 'commands');

  cy.wait(500);

  cy.get('[data-cy=safeCommands]');

  cy.get('[data-cy=command]').should('have.length', numSafeCommands);

  if (numUnsafeCommands) {

    cy.get('[data-cy=unsafeCommands]');
    cy.get('[data-cy=commandNav]').within(() => {
      cy.contains('Unsafe Commands').click();
    })

    cy.get('[data-cy=submit]').click();

    cy.get('[data-cy=command]').should('have.length', numUnsafeCommands);
  }
}

export const watchForAlert = (func)  => {
  const stub = cy.stub()
  cy.on('window:alert', stub)
  func();
  cy.wait(4000).then(() => {
    expect(stub).not.called;
  })
}

export const xssPrefix = "xss/"

export const xssHtml = `xss%22%3C%3Cimg%20src%3D1%20onerror%3Dalert%28document.domain%29%3Exss`;
export const partialXssDecoding = `xss%22%3C%3Cimg%20src%3D1%20onerror%3Dwindow.alert(document.domain)%3Exss`
export const renderedSanitizedXSS = `xss"<<img src="1">xss`;
export const plaintextXSS = "<<img src='1' onerror='window.alert(document.domain)'>";

export const plaintextXSS2 = "<img src='1' onerror='window.alert(document.domain)'>";
export const xssEncoded = "%253Cimg%2520src%253D'1'%2520onerror%253D'window.alert%28document.domain%29'%253E";
export const windowAlertText = "window.alert";

// Tabs names
export const OPTION_PICKER = '[data-cy=option-picker]'
export const SELECT_EVENT_TYPES = '[sectionName=select-event-types]'

export const REPAIR_TASK_TAB_NAME = "Repair Tasks";
export const CLUSTER_TAB_NAME = "Cluster";
