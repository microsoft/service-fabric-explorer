// Descriptive text for ESE copy-detail fields (ComCopyOperationEnumerator.cpp / FabricTypes.h) --
// kept alongside, not on, the component so these SFX-authored descriptions of runtime behavior
// are easy to find and audit for drift if the runtime semantics they describe change.

export const contextFieldInfo: Record<string, string> = {
  'Copy Context Valid': "Whether the secondary's copy context is valid.",
  'Store Format Version': 'On-disk ESE store format used for the copy.',
  'Primary Epoch': 'Epoch (DataLossVersion:ConfigurationVersion) reported at copy negotiation.',
  'Secondary Epoch': 'Epoch (DataLossVersion:ConfigurationVersion) reported at copy negotiation.',
  'Primary Last Operation LSN': 'Last applied operation LSN reported at copy negotiation.',
  'Secondary Last Operation LSN': 'Last applied operation LSN reported at copy negotiation.',
};

export const copyTypeInfoText = 'Full or partial copy, decided by comparing primary and secondary state.';
export const copyModeInfoText = 'Physical (raw file) or logical (record-by-record) copy.';

// Per-value reasons (ComCopyOperationEnumerator.cpp) -- looked up by the mapped display string.
export const copyTypeReasonInfoText: Record<string, string> = {
  Unknown: 'No reason recorded.',
  InvalidSecondaryEpoch: "Secondary's reported copy context epoch is invalid; forces a full copy immediately, before any progress-vector or tombstone check runs.",
  EmptySecondary: 'Secondary reports no operations at all (LastOperationLSN <= 0) -- a fresh/empty secondary; forces a full copy immediately.',
  FalseProgress: "Secondary's reported LSN/epoch is ahead of what the primary's progress vector recorded for that epoch -- an impossible history; forces a full copy.",
  MatchedConfigurationNumber: "Secondary's epoch matches an entry in the primary's progress vector by configuration number; partial copy starts from the secondary's last committed LSN + 1.",
  EpochNotFound: "No entry in the primary's progress vector matches the secondary's epoch at all; forces a full copy.",
  StaleSecondary: "Secondary already matched a configuration number, but its LSN is below the primary's tombstone low-watermark; downgrades the copy from partial to full.",
  PrimaryTombstonesNotTruncated: 'Partial copy already matched by configuration number; the tombstone-staleness check was skipped because the primary has never truncated tombstones.',
};

export const copyModeReasonInfoText: Record<string, string> = {
  DefaultPhysicalCopy: 'Full copy with data to send, secondary supports file-stream copy, physical copy is enabled by configuration, and neither probability nor format mismatch forced logical -- physical (file-stream) copy is used.',
  LogicalCopyProbability: 'Selected via a probability sample against the configured LogicalCopyProbabilityInPercent, which periodically exercises the logical-copy path even when physical would otherwise qualify.',
  IncompatibleStoreFormatVersion: "Secondary's on-disk store format isn't compatible with the primary's (e.g. mid-upgrade/downgrade across ESE format versions); forces logical copy.",
  EmptyDatabase: "Primary has no operations to copy; physical file-stream copy isn't attempted.",
  FileStreamFullCopyNotSupportedBySecondary: "Secondary doesn't support receiving a file-stream full copy.",
  FullCopyModeConfiguredAsLogical: 'Physical full copy is disabled and the store is explicitly configured with FullCopyMode::Logical.',
  EnableFileStreamFullCopySetToFalse: 'Physical full copy is disabled via the EnableFileStreamFullCopy config flag (general case).',
};
