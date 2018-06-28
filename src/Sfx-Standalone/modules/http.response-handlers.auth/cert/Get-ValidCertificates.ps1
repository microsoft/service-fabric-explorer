#-----------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License file under the project root for license information.
#-----------------------------------------------------------------------------

Function ConvertTo-CertJson([System.Security.Cryptography.X509Certificates.X509Certificate2]$Certificate) {
    return @{
        "subjectName" = $Certificate.Subject;
        "issuerName" = $Certificate.Issuer;
        "serialNumber" = $Certificate.SerialNumber;
        "validStart" = $Certificate.NotBefore.ToUniversalTime().ToString("yyyy-MM-ddThh:mm:ss.fffZ");
        "validExpiry" = $Certificate.NotAfter.ToUniversalTime().ToString("yyyy-MM-ddThh:mm:ss.fffZ");
        "thumbprint" = $Certificate.Thumbprint;
    };
}

$certs = Get-ChildItem Cert:\CurrentUser\My | Where { $_.HasPrivateKey }
$certJsonObjects = @()

foreach ($cert in $certs) {
    $certJsonObjects+=
        @{
            "subjectName" = $cert.Subject;
            "issuerName" = $cert.Issuer;
            "serialNumber" = $cert.SerialNumber;
            "validStart" = $cert.NotBefore.ToUniversalTime().ToString("yyyy-MM-ddThh:mm:ss.fffZ");
            "validExpiry" = $cert.NotAfter.ToUniversalTime().ToString("yyyy-MM-ddThh:mm:ss.fffZ");
            "thumbprint" = $cert.Thumbprint;
        }
}

Write-Output (ConvertTo-Json $certJsonObjects)