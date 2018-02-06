//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { ModuleManagerAgent } from "../../module-manager/module-manager-host";

global["exports"] = exports;
global["moduleManager"] = new ModuleManagerAgent();
