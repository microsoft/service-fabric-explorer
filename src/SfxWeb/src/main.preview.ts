// Bootstrap only after the local snapshot handler is installed.
async function startPreview() {
  const response = await fetch(new URL('preview/snapshot.json', document.baseURI), { credentials: 'omit' });
  if (!response.ok) throw new Error('The preview snapshot is missing. Run preview:capture before building.');
  const snapshot = await response.json();
  const previewWindow = window as any;
  const handler = previewWindow.SfxSnapshot.createHandler(snapshot);
  previewWindow.sfxSnapshotRequest = handler.request;
  previewWindow.sfxSnapshotMissing = handler.missing;
  previewWindow.SFXintegrationConfiguration = {
    windowPath: 'sfxSnapshotRequest',
    isReadOnlyMode: true,
    clusterInfo: 'Snapshot preview (not live)',
    handleAsCallBack: false,
    passObjectAsString: false
  };
  localStorage.setItem('sfxAutoRefreshIntervalV2', '0');
  localStorage.setItem('sfx-telemetry-enabled', 'false');
  localStorage.setItem('sfx-telemetry-prompted', 'true');
  const banner = document.createElement('div');
  banner.id = 'snapshot-banner';
  banner.setAttribute('role', 'note');
  banner.textContent = `Read-only snapshot | ${snapshot.capturedAt.substring(0, 10)} | ${snapshot.build} | Event dates shifted for review; some pages are not captured`;
  banner.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:1000;background:#172b46;color:#e6edf3;padding:2px 8px;font:15px/20px system-ui;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
  banner.title = banner.textContent;
  document.body.appendChild(banner);
  await import('./main');
}
startPreview().catch(() => {
  document.body.textContent = 'Snapshot preview could not start. Verify the snapshot package and reload.';
});
