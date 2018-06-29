#-----------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License file under the project root for license information.
#-----------------------------------------------------------------------------

Param([string]$Thumbprint)

$certs = Get-ChildItem "Cert:\CurrentUser" -Recurse | Where { $_.Thumbprint -ieq $Thumbprint }

If ($certs.Count -le 0) {
    Write-Output "undefined"
} Else {
    Write-Output ([System.Convert]::ToBase64String($certs[0].Export("Pfx")))
}