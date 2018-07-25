#-----------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation.  All rights reserved.
# Licensed under the MIT License. See License file under the project root for license information.
#-----------------------------------------------------------------------------

param([string]$XmlPath)

$Xml = [xml](Get-Content -Path $XmlPath)
Select-Xml -XPath '//wix:Component[@Guid="*"]' -Xml $Xml -Namespace @{"wix"="http://schemas.microsoft.com/wix/2006/wi"} | foreach {$_.Node.Guid = [Guid]::NewGuid().ToString().ToUpper(); }
Select-Xml -XPath '//wix:*[@Id="*"]' -Xml $Xml -Namespace @{"wix"="http://schemas.microsoft.com/wix/2006/wi"} | foreach {$_.Node.Id = $_.Node.Name.ToLower() + [Guid]::NewGuid().ToString("N").ToUpper(); }
$Xml.Save($XmlPath)