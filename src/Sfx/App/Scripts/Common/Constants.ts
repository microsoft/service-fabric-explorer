//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    export class Constants {

        // The name of the SFX app itself.  Used in bootstrapping processes.
        public static sfxAppName: string = "sfx";
        public static FabricPrefix: string = "fabric:/";

        // Storage key names
        public static AutoRefreshIntervalStorageKey: string = "sfxAutoRefreshInterval";
        public static SplitterLeftWidth: string = "sfxSplitterleftWidth";
        public static ThemeNameStorageKey: string = "sfxThemeName";
        public static PaginationLimitStorageKey: string = "sfxPaginationLimit";

        // Default values for storage keys
        public static DefaultThemeName: string = "dark";
        public static DefaultAutoRefreshInterval: number = 15;
        // Keep this in sync with $left-panel-width in _config.scss
        public static DefaultSplitterLeftWidth: number = 400;
        public static DefaultPaginationLimit: number = 10;

        // System app constants
        public static SystemAppId: string = "System";
        public static SystemAppName: string = "fabric:/System";
        public static SystemAppTypeName: string = "System";

        // Version header
        public static SfxVersionMetadataName: string = "SFX-Version";
        public static SfxBuildMetadataName: string = "SFX-Build";

        // Custom headers
        public static SfxReadonlyHeaderName: string = "SFX-Readonly";
        public static SfxClusterNameHeaderName: string = "SFX-ClusterName";
        public static SfxReadonlyMetadataName: string = "SFXReadonly";
        public static SfxClusterNameMetadataName: string = "SFXClusterName";

        // Theming
        public static ThemeSourceQueryStringName: string = "theme_source";
        public static ThemeNameQueryStringName: string = "theme_name";
        public static ThemeNameMonitorPropertyName: string = "ThemeName";

        // Items per page limit
        public static PaginationLimitMin: number = 5;
        public static PaginationLimitMax: number = 200;

        public static InvalidTimestamp: string = "N/A";
        public static DurationInfinity: string = "Infinity";

        public static ServiceKindStateful: string = "Stateful";
        public static ServiceKindStateless: string = "Stateless";

        public static ComposeApplicationDefinitionKind: string = "Compose";

        public static ContainerHostTypeName: string = "ContainerHost";

        // Directive names
        public static DirectiveNameActionsRow = "sfx-actions-row";
        public static DirectiveNameUpgradeProgress = "sfx-upgrade-progress";

        // Misc
        public static Empty = "(empty)";
        public static SvgTransitionDuration = 250;
        public static SvgTransitionDurationSlow = 600;
    }

    export class FabricEnumValues {
        public static ServiceCorrelationSchemes = [
            "Invalid",
            "Affinity",
            "AlignedAffinity",
            "NonAlignedAffinity"
        ];

        public static ServiceLoadMetricWeights = [
            "Zero",
            "Low",
            "Medium",
            "High"
        ];

        public static PlacementPolicies = [
            "Invalid",
            "InvalidDomain",
            "RequiredDomain",
            "PreferredPrimaryDomain",
            "RequiredDomainDistribution",
            "NonPartiallyPlaceService"
        ];

        public static ServicePartitionKinds = [
            "Invalid",
            "Singleton",
            "Int64Range",
            "Named"
        ];

        public static ServicePackageActivationModes = [
            "SharedProcess",
            "ExclusiveProcess"
        ];
    }

    export class BadgeConstants {
        public static BadgeOK: string = "badge-ok";
        public static BadgeError: string = "badge-error";
        public static BadgeWarning: string = "badge-warning";
        public static BadgeUnknown: string = "badge-unknown";
    }

    export class AppStatusConstants {
        public static Upgrading: string = "Upgrading";
    }

    export class NodeStatusConstants {
        public static Invalid: string = "Invalid";
        public static Up: string = "Up";
        public static Down: string = "Down";
        public static Enabling: string = "Enabling";
        public static Disabling: string = "Disabling";
        public static Disabled: string = "Disabled";
        public static Unknown: string = "Unknown";
    }

    export class HealthStateConstants {
        public static Invalid: string = "Invalid";
        public static OK: string = "OK";
        public static Warning: string = "Warning";
        public static Error: string = "Error";
        public static Unknown: string = "Unknown";

        public static Values = {
            "Invalid": 0,
            "OK": 1,
            "Warning": 2,
            "Error": 3,
            "Unknown": 4
        };
    }

    export class SortPriorities {
        public static ReplicaRolesToSortPriorities = {
            "Unknown": 0,
            "None": 1,
            "Primary": 2,
            "ActiveSecondary": 3,
            "IdleSecondary": 4
        };
    }

    export class ServicePartitionKindRegexes {
        public static Int64Range: RegExp = /Int64/i;
        public static Named: RegExp = /Named/i;
    }

    export class ServiceKindRegexes {
        public static Stateless: RegExp = /Stateless/i;
        public static Stateful: RegExp = /Stateful/i;
    }

    export class UpgradeDomainStateRegexes {
        public static InProgress: RegExp = /In.*Progress/i;
        public static Completed: RegExp = /Completed/i;
    }

    export class UpgradeDomainStateNames {
        public static InProgress: string = "InProgress";
        public static Completed: string = "Completed";
        public static Pending: string = "Pending";
    }

    export class StatusWarningLevel {
        public static Warning: string = "warning";
        public static Error: string = "danger";
        public static Info: string = "info";
    }
}
