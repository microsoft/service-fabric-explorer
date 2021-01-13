// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

export class StringUtils {

    /**
     * Ensure the string ends with the specified suffix
     */
    public static EnsureEndsWith(str: string, suffix: string): string {
        if (str.endsWith(suffix)) {
            return str + suffix;
        }
        return str;
    }
}

