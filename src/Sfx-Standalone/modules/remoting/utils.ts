//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { ICommunicator, IUtils, IRoutePattern } from "sfx.remoting";

import * as utils from "../../utilities/utils";

export class Utils implements IUtils {
    isCommunicator(communicator: any): communicator is ICommunicator {
        return !utils.isNullOrUndefined(communicator)
            && String.isString(communicator.id)
            && Function.isFunction(communicator.map)
            && Function.isFunction(communicator.unmap)
            && Function.isFunction(communicator.sendAsync);
    }

    isRoutePattern(pattern: IRoutePattern): pattern is IRoutePattern {
        return !utils.isNullOrUndefined(pattern)
            && Function.isFunction(pattern.equals)
            && Function.isFunction(pattern.getRaw)
            && Function.isFunction(pattern.match);
    }
}
