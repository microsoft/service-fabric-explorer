//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import * as utils from "../../utilities/utils";

export function isCommunicator(communicator: any): communicator is ICommunicator {
    return !utils.isNullOrUndefined(communicator)
        && String.isString(communicator.id)
        && Function.isFunction(communicator.map)
        && Function.isFunction(communicator.unmap)
        && Function.isFunction(communicator.sendAsync);
}
