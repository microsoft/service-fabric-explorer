#-----------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License file under the project root for license information.
#-----------------------------------------------------------------------------

Param([string]$StoreName)

$certs = Get-ChildItem "Cert:\CurrentUser\$StoreName"
$certJsonObjects = @()

foreach ($cert in $certs) {
    $certJsonObjects+=
        @{
            "subjectName" = $cert.Subject;
            "issuerName" = $cert.Issuer;
            "serialNumber" = $cert.SerialNumber;
            "hasPrivateKey" = $cert.HasPrivateKey -and ($cert.PrivateKey -ne $null) -and ($cert.PrivateKey.CspKeyContainerInfo.Exportable -eq $true);
            "validStart" = $cert.NotBefore.ToUniversalTime().ToString("yyyy-MM-ddThh:mm:ss.fffZ");
            "validExpiry" = $cert.NotAfter.ToUniversalTime().ToString("yyyy-MM-ddThh:mm:ss.fffZ");
            "thumbprint" = $cert.Thumbprint;
        }
}

Write-Output (ConvertTo-Json $certJsonObjects)