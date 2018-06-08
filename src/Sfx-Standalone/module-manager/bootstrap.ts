//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { ModuleManager } from "./module-manager";
import { NodeCommunicator } from "../modules/ipc/communicator.node";

global["sfxModuleManager"] = new ModuleManager(process.argv0, new NodeCommunicator(process));
