//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import * as util from "util";

export function getEither<T>(arg: T, defaultValue: T): T {
  return util.isNullOrUndefined(arg) ? defaultValue : arg;
}
