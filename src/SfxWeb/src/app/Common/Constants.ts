// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { ITab } from '../shared/component/navbar/navbar.component';


export class Constants {

    // The name of the SFX app itself.  Used in bootstrapping processes.
    public static sfxAppName = 'sfx';
    public static FabricPrefix = 'fabric:/';

    // Storage key names
    public static AutoRefreshIntervalStorageKey = 'sfxAutoRefreshIntervalV2';
    public static SplitterLeftWidth = 'sfxSplitterleftWidth';
    public static ThemeNameStorageKey = 'sfxThemeName';
    public static PaginationLimitStorageKey = 'sfxPaginationLimit';
    public static AdvancedModeKey = 'sfxAdvancedMode';

    // Default values for storage keys
    public static DefaultThemeName = 'dark';
    public static DefaultAutoRefreshInterval = 15;
    // Keep this in sync with $left-panel-width in _config.scss
    public static DefaultSplitterLeftWidth = 400;
    public static DefaultPaginationLimit = 100;

    // System app constants
    public static SystemAppId = 'System';
    public static SystemAppName = 'fabric:/System';
    public static SystemAppTypeName = 'System';
    public static InfrastructureServiceType = 'InfrastructureServiceType';

    // Version header
    public static SfxVersionMetadataName = 'SFX-Version';
    public static SfxBuildMetadataName = 'SFX-Build';

    // telemetry header
    public static SfxTelemetryMetadataName = 'X-ServiceFabricClientType';
    public static SfxTelemetryHeaderValue = 'SFX';

    // Custom headers
    public static SfxReadonlyHeaderName = 'SFX-Readonly';
    public static SfxClusterNameHeaderName = 'SFX-ClusterName';
    public static SfxReadonlyMetadataName = 'SFXReadonly';
    public static SfxClusterNameMetadataName = 'SFXClusterName';

    // Theming
    public static ThemeSourceQueryStringName = 'theme_source';
    public static ThemeNameQueryStringName = 'theme_name';
    public static ThemeNameMonitorPropertyName = 'ThemeName';

    // Items per page limit
    public static PaginationLimitMin = 5;
    public static PaginationLimitMax = 200;

    public static InvalidTimestamp = 'N/A';
    public static DurationInfinity = 'Infinity';

    public static ServiceKindStateful = 'Stateful';
    public static ServiceKindStateless = 'Stateless';

    public static ComposeApplicationDefinitionKind = 'Compose';

    public static ContainerHostTypeName = 'ContainerHost';

    // Directive names
    public static DirectiveNameActionsRow = 'sfx-actions-row';
    public static DirectiveNameUpgradeProgress = 'sfx-upgrade-progress';

    // Misc
    public static Empty = '(empty)';
    public static SvgTransitionDuration = 250;
    public static SvgTransitionDurationSlow = 600;

    public static readonly EventsTab: ITab = {
      name: 'events',
      route: './events'
    };
}

export class FabricEnumValues {
    public static ServiceCorrelationSchemes = [
        'Invalid',
        'Affinity',
        'AlignedAffinity',
        'NonAlignedAffinity'
    ];

    public static ServiceLoadMetricWeights = [
        'Zero',
        'Low',
        'Medium',
        'High'
    ];

    public static PlacementPolicies = [
        'Invalid',
        'InvalidDomain',
        'RequiredDomain',
        'PreferredPrimaryDomain',
        'RequiredDomainDistribution',
        'NonPartiallyPlaceService'
    ];

    public static ServicePartitionKinds = [
        'Invalid',
        'Singleton',
        'Int64Range',
        'Named'
    ];

    public static ServicePackageActivationModes = [
        'SharedProcess',
        'ExclusiveProcess'
    ];
}

export class BadgeConstants {
    public static BadgeOK = 'badge-ok';
    public static BadgeError = 'badge-error';
    public static BadgeWarning = 'badge-warning';
    public static BadgeUnknown = 'badge-unknown';
}

export class AppStatusConstants {
    public static Upgrading = 'Upgrading';
}

export class NodeStatusConstants {
    public static Invalid = 'Invalid';
    public static Up = 'Up';
    public static Down = 'Down';
    public static Enabling = 'Enabling';
    public static Disabling = 'Disabling';
    public static Disabled = 'Disabled';
    public static Unknown = 'Unknown';
}

export class HealthStateConstants {
    public static Invalid = 'Invalid';
    public static OK = 'OK';
    public static Warning = 'Warning';
    public static Error = 'Error';
    public static Unknown = 'Unknown';

    public static Values = {
        Invalid: 0,
        OK: 1,
        Warning: 2,
        Error: 3,
        Unknown: 4
    };
}

export class SortPriorities {
    public static ReplicaRolesToSortPriorities = {
        Unknown: 0,
        None: 1,
        Primary: 2,
        ActiveSecondary: 3,
        IdleSecondary: 4,
        PrimaryAuxiliary: 5,
        ActiveAuxiliary: 6,
        IdleAuxiliary: 7,
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
    public static Failed: RegExp = /Failed/i;
}

export class ClusterUpgradeStates {
    public static RollingForwardPending = 'RollingForwardPending';
}

export class UpgradeDomainStateNames {
    public static InProgress = 'InProgress';
    public static Completed = 'Completed';
    public static Pending = 'Pending';
    public static Failed = 'Failed';
}

export class StatusWarningLevel {
    public static Warning = 'warning';
    public static Error = 'error';
    public static Info = 'info';
}

export class BannerWarningID {
    public static ClusterDegradedState = 'degradedClusterState';
    public static OneNodeCluster = 'oneNodeCluster';
    public static ExpiringClusterCert = 'CertificateClusterExpiring';
}

export class CertExpiraryHealthEventProperty {
    public static Client = 'Certificate_client';
    public static Cluster = 'Certificate_cluster';
    public static Server = 'Certificate_server';
}


export class TelemetryEventNames {
  public static RepairChart = 'show repair job chart';
  public static CombinedEventStore = 'combined event store';
  public static SortByHealth = 'sort by health in tree';
  public static TroubleShootingGuides = 'go to service fabric troubleshooting guides';
  public static supressMessage = 'supress messages';
  public static listSize = 'set list size';
  public static advancedMode = 'enable advanced mode';
}


export class RepairTaskMessages {
  public static longExecutingMessage = "This update can prevent other updates from going through. Please reach out to Azure VMSS to figure out why the updates are not completing.";
  public static longExecutingId = "longExecuting";
  public static seedNodeChecks = "Disabling a seed node can get stuck indefinitely. This is blocked by design to prevent any risk to the cluster availability. There are multiple options available to come out of this state. read more here https://aka.ms/sfseednodequoromtsg";
  public static seedNodeChecksId = "seedNode";
  public static safetyChecks = `This usually happens due to the following reasons:
                                Service health related issues. This is expected when the preparing/restoring health checks have been enabled in this cluster and there is any entity which is not healthy.
                                Please ensure all entities in the cluster like nodes and services are healthy for this check to pass and allow the updates to proceed.`
  public static safetyChecksId = "safetychecks";
  public static clusterHealthCheck = `This is due to cluster health related issues. This is expected when the restoring or preparing health checks have been enabled in this cluster and there is any
                                      entity which is not healthy. Please ensure all entities in the cluster like nodes and services are healthy
                                      for this check to pass and allow the updates to proceed.`;
  public static clusterHealthCheckId = "clusterhealthcheck";

  public static messageMap(id: string) {
    const map = {};
    map[RepairTaskMessages.longExecutingId] = "Repair jobs in the executing state for too long can cause issues. " +RepairTaskMessages.longExecutingMessage;
    map[RepairTaskMessages.seedNodeChecksId] = RepairTaskMessages.seedNodeChecks;
    map[RepairTaskMessages.safetyChecksId] = RepairTaskMessages.safetyChecks;
    map[RepairTaskMessages.clusterHealthCheckId] = RepairTaskMessages.clusterHealthCheck;
    return map[id];
  }
}

export class UnicodeConstants {
    public static RightArrow = '\u279c';
}

export interface IPregeneratedColor {
  color: string,
  hex: string
}

//pregenerated safe colors for the timeline to use
export const pregeneratedColors: IPregeneratedColor[] = [
    {
        "color": "809900",
        "hex": "#809900"
    },
    {
        "color": "E6B3B3",
        "hex": "#E6B3B3"
    },
    {
        "color": "6680B3",
        "hex": "#6680B3"
    },
    {
        "color": "66991A",
        "hex": "#66991A"
    },
    {
        "color": "FF99E6",
        "hex": "#FF99E6"
    },
    {
        "color": "CCFF1A",
        "hex": "#CCFF1A"
    },
    {
        "color": "33FFCC",
        "hex": "#33FFCC"
    },
    {
        "color": "66994D",
        "hex": "#66994D"
    },
    {
        "color": "B366CC",
        "hex": "#B366CC"
    },
    {
        "color": "4D8000",
        "hex": "#4D8000"
    },
    {
        "color": "CC80CC",
        "hex": "#CC80CC"
    },
    {
        "color": "66664D",
        "hex": "#66664D"
    },
    {
        "color": "991AFF",
        "hex": "#991AFF"
    },
    {
        "color": "E666FF",
        "hex": "#E666FF"
    },
    {
        "color": "4DB3FF",
        "hex": "#4DB3FF"
    },
    {
        "color": "1AB399",
        "hex": "#1AB399"
    },
    {
        "color": "E666B3",
        "hex": "#E666B3"
    },
    {
        "color": "33991A",
        "hex": "#33991A"
    },
    {
        "color": "CC9999",
        "hex": "#CC9999"
    },
    {
        "color": "B3B31A",
        "hex": "#B3B31A"
    },
    {
        "color": "00E680",
        "hex": "#00E680"
    },
    {
        "color": "4D8066",
        "hex": "#4D8066"
    },
    {
        "color": "809980",
        "hex": "#809980"
    },
    {
        "color": "E6FF80",
        "hex": "#E6FF80"
    },
    {
        "color": "1AFF33",
        "hex": "#1AFF33"
    },
    {
        "color": "999933",
        "hex": "#999933"
    },
    {
        "color": "CCCC00",
        "hex": "#CCCC00"
    },
    {
        "color": "66E64D",
        "hex": "#66E64D"
    },
    {
        "color": "4D80CC",
        "hex": "#4D80CC"
    },
    {
        "color": "9900B3",
        "hex": "#9900B3"
    },
    {
        "color": "4DB380",
        "hex": "#4DB380"
    },
    {
        "color": "99E6E6",
        "hex": "#99E6E6"
    },
    {
        "color": "6666FF",
        "hex": "#6666FF"
    },
    {
        "color": "FFB399",
        "hex": "#FFB399"
    },
    {
        "color": "2f7ed8",
        "hex": "#2f7ed8"
    },
    {
        "color": "0d233a",
        "hex": "#0d233a"
    },
    {
        "color": "8bbc21",
        "hex": "#8bbc21"
    },
    {
        "color": "910000",
        "hex": "#910000"
    },
    {
        "color": "1aadce",
        "hex": "#1aadce"
    },
    {
        "color": "492970",
        "hex": "#492970"
    },
    {
        "color": "f28f43",
        "hex": "#f28f43"
    },
    {
        "color": "77a1e5",
        "hex": "#77a1e5"
    },
    {
        "color": "a6c96a",
        "hex": "#a6c96a"
    },
]
