//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

module Sfx {

    export class VersionInfo {

        // Whether current service fabric runtime is a preview version
        public static IsPreview: boolean = false;

        // Keep this align with Service Fabric platform version when integrating SFX into runtime.
        public static Version: string = "5.7";

        // This variable will be replaced as real build number on build agent.
        public static Build: string = "[Dev]";
    }
}
