param([Parameter(Mandatory)][string]$Package)
$ErrorActionPreference = 'Stop'
$root = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$destination = Join-Path $root 'preview-data/snapshot.json'
if (!(Test-Path -LiteralPath (Split-Path $destination))) { throw 'Snapshot directory is missing.' }
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path -LiteralPath $Package))
try {
    $entry = $archive.GetEntry('preview/snapshot.json')
    if (!$entry) { $entry = $archive.GetEntry('preview\snapshot.json') }
    if (!$entry) { throw 'Package does not contain a snapshot.' }
    [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $destination, $true)
} finally { $archive.Dispose() }
'Restored snapshot from the selected preview package. Capture report is unchanged.'
