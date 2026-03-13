// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

/// <reference types="cypress" />
// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

/**
 * @type {Cypress.PluginConfig}
 */
 const cypressTypeScriptPreprocessor = require("./cy-ts-preprocessor");
 const registerCodeCoverageTasks = require("@cypress/code-coverage/task");

 module.exports = (on, config) => {
   on("file:preprocessor", cypressTypeScriptPreprocessor);

   // enable code coverage collection
   return registerCodeCoverageTasks(on, config);
 };
