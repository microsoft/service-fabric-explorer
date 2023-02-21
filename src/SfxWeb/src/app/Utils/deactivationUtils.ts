import { IRawNodeDeactivationInfo } from "../Models/RawDataTypes";

export class DeactivationUtils {
  public static hasSeedNodeSafetyCheck(deactivationInfo: IRawNodeDeactivationInfo) {
    return deactivationInfo.PendingSafetyChecks.some(safetyCheckDescription => safetyCheckDescription.SafetyCheck.Kind === 'EnsureSeedNodeQuorum');
  }
}
