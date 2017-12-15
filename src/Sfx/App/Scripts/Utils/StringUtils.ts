//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

module Sfx {

    export class StringUtils {

        /**
         * Ensure the string ends with the specified suffix
         */
        public static EnsureEndsWith(str: string, suffix: string): string {
            if (!_.endsWith(str, suffix)) {
                return str + suffix;
            }
            return str;
        }
    }
}
