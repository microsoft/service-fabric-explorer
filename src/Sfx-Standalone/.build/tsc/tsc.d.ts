//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { CompilerOptions, Diagnostic } from "typescript";

declare namespace tsc {
    function compile(options: CompilerOptions, files?: Array<string>): void;
    function logDiagnostic(diagnostic: Diagnostic, basePath?: string): void;
}

export = tsc;
