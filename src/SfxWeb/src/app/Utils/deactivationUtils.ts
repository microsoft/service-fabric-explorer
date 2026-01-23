// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { IRawNodeDeactivationInfo } from "../Models/RawDataTypes";

export class DeactivationUtils {
  public static hasSeedNodeSafetyCheck(deactivationInfo: IRawNodeDeactivationInfo) {
    return deactivationInfo.PendingSafetyChecks.some(safetyCheckDescription => safetyCheckDescription.SafetyCheck.Kind === 'EnsureSeedNodeQuorum');
  }
}
