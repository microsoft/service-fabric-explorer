//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import * as util from "util";

export default function error(messageOrFormat: string, ...params: Array<any>): Error {
    if (!util.isArray(params)) {
        return new Error(messageOrFormat);
    }

    return new Error(util.format(messageOrFormat, ...params));
}
