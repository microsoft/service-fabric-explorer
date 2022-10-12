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
  public static longExecutingMessage = "This update can prevent other updates from going through. Please reach out to the Azure Compute teams (“Compute Manager/Blackbird”) to figure out why the platform updates are not completing.";
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

