$ErrorActionPreference = 'Stop'
$root = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$source = Join-Path $root 'dist-preview'
$artifacts = Join-Path $root 'preview-artifacts'
if (!(Test-Path -LiteralPath (Join-Path $source 'preview/snapshot.json')) -or !(Test-Path -LiteralPath (Join-Path $source 'web.config'))) {
    throw 'Build the snapshot preview before packaging.'
}
$null = [System.IO.Directory]::CreateDirectory($artifacts)
$destination = Join-Path $artifacts ('snapshot-preview-' + [DateTime]::UtcNow.ToString('yyyyMMdd-HHmmss') + '.zip')
# Package only the standalone build, never local capture settings or certificates.
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($source, $destination)
$destination
