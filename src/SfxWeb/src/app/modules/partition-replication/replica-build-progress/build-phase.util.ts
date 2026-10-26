import { IRawRemoteInbuildReplicaStatus } from 'src/app/Models/RawDataTypes';
import { IProgressStatus } from 'src/app/shared/component/phase-diagram/phase-diagram.component';
import { TimeUtils } from 'src/app/Utils/TimeUtils';

// Position of each InbuildPhase enum value in the build pipeline.
const inbuildPhaseOrder: Record<string, number> = {
  CopyContext: 1,
  CopyState: 2,
  Copy: 3,
  CopyCatchup: 4,
  CopyComplete: 5
};

// Duration of a phase = time between its start and the next phase's start, or "now" if the
// next phase (or the phase itself) hasn't started yet. "0001-01-01..." is SF's zero-DateTime
// sentinel for "not yet reached".
function phaseDuration(startTimestamp: string, nextStartTimestamp: string | undefined): string {
  const start = parseValidTime(startTimestamp);
  if (start === undefined) {
    return '';
  }

  const end = parseValidTime(nextStartTimestamp) ?? Date.now();
  const seconds = Math.max(0, (end - start) / 1000);
  return TimeUtils.getDurationFromSeconds(seconds.toString());
}

function parseValidTime(timestamp: string | undefined): number | undefined {
  if (!timestamp) {
    return undefined;
  }
  const time = new Date(timestamp).getTime();
  return (!isFinite(time) || time <= 0) ? undefined : time;
}

export interface IBuildPhases {
  phases: IProgressStatus[];
  currentIndex: number;
}

// Shared by app-replica-build-progress and app-replicas-in-build's header stepper -- both need
// the exact same phases/currentIndex, computed up front rather than one deriving it from the
// other's rendered output (that ordering caused an NG0100 ExpressionChangedAfterItHasBeenChecked,
// since the header renders before the sibling that used to compute this value).
export function computeBuildPhases(buildStatus: IRawRemoteInbuildReplicaStatus | undefined): IBuildPhases {
  if (!buildStatus) {
    return { phases: [], currentIndex: 0 };
  }

  const currentIndex = inbuildPhaseOrder[buildStatus.InbuildPhase] || 0;

  // Phase progression, with each phase's duration shown alongside it (same pattern as the
  // repair jobs stepper) -- no duration on Copy Complete itself, it's the terminal phase.
  const phases: IProgressStatus[] = [
    {
      name: 'Copy Context',
      textRight: phaseDuration(buildStatus.CopyContextPhaseStartTimeUtc, buildStatus.CopyStatePhaseStartTimeUtc),
    },
    { name: 'Copy State', textRight: phaseDuration(buildStatus.CopyStatePhaseStartTimeUtc, buildStatus.CopyPhaseStartTimeUtc) },
    { name: 'Copy', textRight: phaseDuration(buildStatus.CopyPhaseStartTimeUtc, buildStatus.CopyCatchupPhaseStartTimeUtc) },
    { name: 'Copy Catchup', textRight: phaseDuration(buildStatus.CopyCatchupPhaseStartTimeUtc, undefined) },
    { name: 'Copy Complete' },
  ];

  return { phases, currentIndex };
}
