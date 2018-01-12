//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

interface IPackageInfo {
    x86?: string;
    x64?: string;
}

interface IVersionInfo {
    version: string;
    description?: string;

    linux?: IPackageInfo | string;
    windows?: IPackageInfo | string;
    macos?: IPackageInfo | string;
}
