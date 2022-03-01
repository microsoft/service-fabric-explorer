/// <reference types="angular" />
/// <reference types="angular-ui-bootstrap" />
/// <reference types="lodash" />
/// <reference types="angular-route" />
/// <reference types="angular-sanitize" />
declare module Sfx {
}
declare module Sfx {
    class VersionInfo {
        static IsPreview: boolean;
        static Version: string;
        static Build: string;
    }
}
declare module Sfx {
    class Constants {
        static sfxAppName: string;
        static FabricPrefix: string;
        static AutoRefreshIntervalStorageKey: string;
        static SplitterLeftWidth: string;
        static ThemeNameStorageKey: string;
        static PaginationLimitStorageKey: string;
        static AdvancedModeKey: string;
        static DefaultThemeName: string;
        static DefaultAutoRefreshInterval: number;
        static DefaultSplitterLeftWidth: number;
        static DefaultPaginationLimit: number;
        static SystemAppId: string;
        static SystemAppName: string;
        static SystemAppTypeName: string;
        static SfxVersionMetadataName: string;
        static SfxBuildMetadataName: string;
        static SfxTelemetryMetadataName: string;
        static SfxTelemetryHeaderValue: string;
        static SfxReadonlyHeaderName: string;
        static SfxClusterNameHeaderName: string;
        static SfxReadonlyMetadataName: string;
        static SfxClusterNameMetadataName: string;
        static ThemeSourceQueryStringName: string;
        static ThemeNameQueryStringName: string;
        static ThemeNameMonitorPropertyName: string;
        static PaginationLimitMin: number;
        static PaginationLimitMax: number;
        static InvalidTimestamp: string;
        static DurationInfinity: string;
        static ServiceKindStateful: string;
        static ServiceKindStateless: string;
        static ComposeApplicationDefinitionKind: string;
        static ContainerHostTypeName: string;
        static DirectiveNameActionsRow: string;
        static DirectiveNameUpgradeProgress: string;
        static Empty: string;
        static SvgTransitionDuration: number;
        static SvgTransitionDurationSlow: number;
    }
    class FabricEnumValues {
        static ServiceCorrelationSchemes: string[];
        static ServiceLoadMetricWeights: string[];
        static PlacementPolicies: string[];
        static ServicePartitionKinds: string[];
        static ServicePackageActivationModes: string[];
    }
    class BadgeConstants {
        static BadgeOK: string;
        static BadgeError: string;
        static BadgeWarning: string;
        static BadgeUnknown: string;
    }
    class AppStatusConstants {
        static Upgrading: string;
    }
    class NodeStatusConstants {
        static Invalid: string;
        static Up: string;
        static Down: string;
        static Enabling: string;
        static Disabling: string;
        static Disabled: string;
        static Unknown: string;
    }
    class HealthStateConstants {
        static Invalid: string;
        static OK: string;
        static Warning: string;
        static Error: string;
        static Unknown: string;
        static Values: {
            "Invalid": number;
            "OK": number;
            "Warning": number;
            "Error": number;
            "Unknown": number;
        };
    }
    class SortPriorities {
        static ReplicaRolesToSortPriorities: {
            "Unknown": number;
            "None": number;
            "Primary": number;
            "ActiveSecondary": number;
            "IdleSecondary": number;
        };
    }
    class ServicePartitionKindRegexes {
        static Int64Range: RegExp;
        static Named: RegExp;
    }
    class ServiceKindRegexes {
        static Stateless: RegExp;
        static Stateful: RegExp;
    }
    class UpgradeDomainStateRegexes {
        static InProgress: RegExp;
        static Completed: RegExp;
    }
    class ClusterUpgradeStates {
        static RollingForwardPending: string;
    }
    class UpgradeDomainStateNames {
        static InProgress: string;
        static Completed: string;
        static Pending: string;
    }
    class StatusWarningLevel {
        static Warning: string;
        static Error: string;
        static Info: string;
    }
    class BannerWarningID {
        static ClusterDegradedState: string;
        static OneNodeCluster: string;
        static ExpiringClusterCert: string;
    }
    class CertExpiraryHealthEventProperty {
        static Client: string;
        static Cluster: string;
        static Server: string;
    }
}
declare module Sfx {
    class Observable {
        private observers;
        subscribe(observer: (key: any, oldValue: any, newValue: any) => void): void;
        protected notify(key: string, oldValue: any, newValue: any): void;
    }
}
declare module Sfx {
    interface IResponseMessageHandler {
        getSuccessMessage(apiDesc: string, response: ng.IHttpPromiseCallbackArg<any>): string;
        getErrorMessage(apiDesc: string, response: ng.IHttpPromiseCallbackArg<any>): string;
    }
    class GetResponseMessageHandler implements IResponseMessageHandler {
        getSuccessMessage(apiDesc: string, response: ng.IHttpPromiseCallbackArg<any>): string;
        getErrorMessage(apiDesc: string, response: ng.IHttpPromiseCallbackArg<any>): string;
        protected getErrorMessageInternal(apiDesc: string, response: ng.IHttpPromiseCallbackArg<any>): string;
    }
    class PostResponseMessageHandler extends GetResponseMessageHandler {
        getSuccessMessage(apiDesc: string, response: ng.IHttpPromiseCallbackArg<any>): string;
        getErrorMessage(apiDesc: string, response: ng.IHttpPromiseCallbackArg<any>): string;
    }
    class PutResponseMessageHandler extends GetResponseMessageHandler {
        getSuccessMessage(apiDesc: string, response: ng.IHttpPromiseCallbackArg<any>): string;
        getErrorMessage(apiDesc: string, response: ng.IHttpPromiseCallbackArg<any>): string;
    }
    class DeleteResponseMessageHandler extends GetResponseMessageHandler {
        getSuccessMessage(apiDesc: string, response: ng.IHttpPromiseCallbackArg<any>): string;
        getErrorMessage(apiDesc: string, response: ng.IHttpPromiseCallbackArg<any>): string;
    }
    class SilentResponseMessageHandler implements IResponseMessageHandler {
        getSuccessMessage(apiDesc: string, response: ng.IHttpPromiseCallbackArg<any>): string;
        getErrorMessage(apiDesc: string, response: ng.IHttpPromiseCallbackArg<any>): string;
    }
    class ResponseMessageHandlers {
        static getResponseMessageHandler: IResponseMessageHandler;
        static postResponseMessageHandler: IResponseMessageHandler;
        static putResponseMessageHandler: IResponseMessageHandler;
        static silentResponseMessageHandler: IResponseMessageHandler;
        static deleteResponseMessageHandler: IResponseMessageHandler;
    }
    class EventsStoreResponseMessageHandler implements IResponseMessageHandler {
        private innerHandler?;
        constructor(innerHandler?: IResponseMessageHandler);
        getSuccessMessage(apiDesc: string, response: ng.IHttpPromiseCallbackArg<any>): string;
        getErrorMessage(apiDesc: string, response: ng.IHttpPromiseCallbackArg<any>): string;
    }
}
declare module Sfx {
    namespace Standalone.http {
        type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "CONNECT" | "OPTIONS" | "TRACE";
        interface IHttpHeader {
            name: string;
            value: string;
        }
        interface IHttpResponse {
            httpVersion: string;
            statusCode: number;
            statusMessage: string;
            data: any;
            headers: Array<IHttpHeader>;
            body: Array<number>;
        }
        interface IHttpRequest {
            method: HttpMethod;
            url: string;
            headers?: Array<IHttpHeader>;
            body?: any;
        }
        interface IHttpClient {
            getRequestTemplateAsync(): Promise<IHttpRequest>;
            setRequestTemplateAsync(template: IHttpRequest): Promise<void>;
            getAsync<T>(url: string): Promise<T>;
            postAsync<T>(url: string, data: any): Promise<T>;
            putAsync<T>(url: string, data: any): Promise<T>;
            patchAsync<T>(url: string, data: any): Promise<T>;
            deleteAsync<T>(url: string): Promise<T>;
            headAsync<T>(url: string): Promise<T>;
            optionsAsync<T>(url: string, data: any): Promise<T>;
            traceAsync<T>(url: string, data: any): Promise<T>;
            requestAsync(request: IHttpRequest): Promise<IHttpResponse>;
        }
    }
    class StandaloneIntegration {
        private static _clusterUrl;
        static isStandalone(): boolean;
        static readonly clusterUrl: string;
        static getHttpClient(): Promise<Standalone.http.IHttpClient>;
        private static extractQueryItem;
    }
}
declare module Sfx {
    class IdGenerator {
        static cluster(): string;
        static appGroup(): string;
        static nodeGroup(): string;
        static networkGroup(): string;
        static network(networkName: string): string;
        static node(nodeName: string): string;
        static app(appId: string): string;
        static systemAppGroup(): string;
        static appType(appTypeName: string): string;
        static service(serviceId: string): string;
        static partition(partitionId: string): string;
        static replica(replicaId: string): string;
        static deployedApp(appId: string): string;
        static deployedServicePackage(serviceId: string, servicePackageActivationId: string): string;
        static deployedCodePackageGroup(): string;
        static deployedReplicaGroup(): string;
        static deployedCodePackage(codePackageName: string): string;
        static deployedReplica(partitionId: string): string;
    }
}
declare module Sfx {
    class Utils {
        private static SingleUrlRegExp;
        static isNumeric(value: any): boolean;
        static getHttpResponseData<T>(promise: angular.IHttpPromise<T>): angular.IPromise<T>;
        static result(item: any, propertyPath: string): any;
        static isBadge(item: any): any;
        static getParsedHealthEvaluations(rawUnhealthyEvals: IRawUnhealthyEvaluation[], level: number, parent: HealthEvaluation, data: DataService): HealthEvaluation[];
        static getViewPathUrl(healthEval: IRawHealthEvaluation, data: DataService, parentUrl?: string): {
            viewPathUrl: string;
            displayName: string;
        };
        static injectLink(textToReplace: string, replaceText: string, url: string, title: string): string;
        static parseReplicaAddress(address: string): any;
        static isSingleURL(str: string): boolean;
        static hexToBytes(hex: any): any[];
        static bytesToHex(bytes: number[], maxLength?: number): string;
        static getFriendlyFileSize(fileSizeinBytes: number): string;
    }
}
declare module Sfx {
    class TimeUtils {
        static MaxDurationInMilliseconds: number;
        static AddSeconds(toDate: Date, seconds: number): Date;
        static AddDays(toDate: Date, days: number): Date;
        static getDuration(duration: any): string;
        static getDurationFromSeconds(duration: string): string;
        static datetimeToString(datetime: string): string;
        static timestampToUTCString(timestamp: string): string;
        private static formatDurationAsAspNetTimespan;
    }
}
declare module Sfx {
    class StringUtils {
        static EnsureEndsWith(str: string, suffix: string): string;
    }
}
declare module Sfx {
    class IdUtils {
        static getAppId(routeParams: any): string;
        static getPartitionId(routeParams: any): string;
        static getReplicaId(routeParams: any): string;
        static getServiceId(routeParams: any): string;
        static getServicePackageActivationId(routeParams: any): string;
        static getAppTypeName(routeParams: any): string;
        static getCodePackageName(routeParams: any): string;
        static getContainerLogs(routeParams: any): string;
        static getNodeName(routeParams: any): string;
        static getBackupPolicyName(routeParams: any): string;
        static getNetworkName(routeParams: any): string;
        static idToName(id: string): string;
        static nameToId(name: string): string;
    }
}
declare module Sfx {
    class EventTypesUtil {
        private WarningEventTypes;
        private ErrorEventTypes;
        private ResolvedEventTypes;
        private warningEventsRegExp;
        private errorEventsRegExp;
        private resolvedEventsRegExp;
        private static constructRegExp;
        private static isEventMatching;
        private static isPropertyMatching;
        constructor();
        isWarning(event: FabricEventBase): boolean;
        isError(event: FabricEventBase): boolean;
        isResolved(event: FabricEventBase): boolean;
    }
    class HtmlUtils {
        static eventTypesUtil: EventTypesUtil;
        static repositionContextMenu(): void;
        static isHtml(text: string): boolean;
        static getSpanWithCustomClass(className: string, text: string): string;
        static getSpanWithLink(className: string, text: string, url: string): string;
        static getSpanWithTitleHtml(text: string): string;
        static getUpgradeProgressHtml(upgradeDomainsPropertyPath: string): string;
        static getLinkHtml(text: string, url: string, targetBlank?: boolean): string;
        static getBadgeHtml(badge: ITextAndBadge): string;
        static getBadgeOnlyHtml(badge: ITextAndBadge): string;
        static getEventNameHtml(event: FabricEventBase): string;
        static getEventSecondRowHtml(event: FabricEventBase): string;
        static getEventDetailsViewLinkHtml(event: FabricEventBase): string;
    }
}
declare module Sfx {
    class CollectionUtils {
        static updateCollection<T, P>(collection: T[], newCollection: P[], keySelector: (item: T) => any, newKeySelector: (item: P) => any, create: (item: T, newItem: P) => T, update: (item: T, newItem: P) => void, appendOnly?: boolean): void;
        static compareCollectionsByKeys<T, P>(collection: T[], newCollection: P[], keySelector: (item: T) => any, newKeySelector: (item: P) => any): boolean;
        static updateDataModelCollection<T>(collection: IDataModel<T>[], newCollection: IDataModel<T>[], appendOnly?: boolean): void;
    }
}
declare module Sfx {
    interface ITextAndBadge {
        text: string;
        badgeId: string;
        badgeClass?: string;
    }
    class ValueResolver {
        static unknown: ITextAndBadge;
        static readonly healthStatuses: ITextAndBadge[];
        private static healthStatus;
        resolveHealthStatus(value: string): ITextAndBadge;
        resolve(value: string, options: ITextAndBadge[], defaultValue?: ITextAndBadge): ITextAndBadge;
        private resolveEnumValue;
    }
}
declare module Sfx {
    class Action {
        name: string;
        title: string;
        runningTitle: string;
        protected execute: (...params: any[]) => angular.IPromise<any>;
        canRun: () => boolean;
        private _running;
        readonly running: boolean;
        readonly displayTitle: string;
        constructor(name: string, title: string, runningTitle: string, execute: (...params: any[]) => angular.IPromise<any>, canRun: () => boolean);
        run(...params: any[]): angular.IPromise<any>;
        runWithCallbacks(success: (result: any) => void, error: (reason: string) => void, ...params: any[]): angular.IPromise<any>;
        protected runInternal(success: (result: any) => void, error: (reason: string) => void, ...params: any[]): angular.IPromise<any>;
    }
    class ActionWithDialog extends Action {
        $uibModal: ng.ui.bootstrap.IModalService;
        $q: ng.IQService;
        name: string;
        title: string;
        runningTitle: string;
        protected execute: (...params: any[]) => angular.IPromise<any>;
        canRun: () => boolean;
        modalSettings: angular.ui.bootstrap.IModalSettings;
        beforeOpen?: () => angular.IPromise<any>;
        constructor($uibModal: ng.ui.bootstrap.IModalService, $q: ng.IQService, name: string, title: string, runningTitle: string, execute: (...params: any[]) => angular.IPromise<any>, canRun: () => boolean, modalSettings: angular.ui.bootstrap.IModalSettings, beforeOpen?: () => angular.IPromise<any>);
        protected runInternal(success: (result: any) => void, error: (reason: string) => void, ...params: any[]): angular.IPromise<any>;
    }
    class ActionWithConfirmationDialog extends ActionWithDialog {
        $uibModal: ng.ui.bootstrap.IModalService;
        $q: ng.IQService;
        name: string;
        title: string;
        runningTitle: string;
        protected execute: (...params: any[]) => angular.IPromise<any>;
        canRun: () => boolean;
        confirmationDialogTitle?: string;
        confirmationDialogMessage?: string;
        confirmationKeyword?: string;
        constructor($uibModal: ng.ui.bootstrap.IModalService, $q: ng.IQService, name: string, title: string, runningTitle: string, execute: (...params: any[]) => angular.IPromise<any>, canRun: () => boolean, confirmationDialogTitle?: string, confirmationDialogMessage?: string, confirmationKeyword?: string);
    }
}
declare module Sfx {
    class ActionCollection {
        private telemetry;
        private $q;
        collection: Action[];
        constructor(telemetry: TelemetryService, $q: angular.IQService);
        runWithTelemetry(action: Action, source: string): angular.IPromise<any>;
        readonly length: number;
        add(action: Action): void;
        readonly anyRunning: boolean;
        readonly title: string;
        private runInternal;
    }
}
declare module Sfx {
    interface IUserProfile {
        name: string;
        email: string;
    }
    interface IUserInfo {
        isAuthenticated: boolean;
        userName: string;
        loginError: string;
        profile: IUserProfile;
    }
    interface IAdalAuthenticationService {
        userInfo: IUserInfo;
        login(): void;
        logOut(): void;
    }
}
declare module Sfx {
    enum HealthStateFilterFlags {
        Default = 0,
        None = 1,
        Ok = 2,
        Warning = 4,
        Error = 8,
        All = 65535
    }
    interface IHealthStateChunk {
        HealthState: string;
    }
    interface IHealthStateChunkList<T> {
        TotalCount: number;
        Items: T[];
    }
    interface IClusterHealthChunk extends IHealthStateChunk {
        NodeHealthStateChunks: IHealthStateChunkList<INodeHealthStateChunk>;
        ApplicationHealthStateChunks: IHealthStateChunkList<IApplicationHealthStateChunk>;
        SystemApplicationHealthStateChunk: IApplicationHealthStateChunk;
    }
    interface INodeHealthStateChunk extends IHealthStateChunk {
        NodeName: string;
        DeployedApplicationHealthStateChunks: IHealthStateChunkList<IDeployedApplicationHealthStateChunk>;
    }
    interface IApplicationHealthStateChunk extends IHealthStateChunk {
        ApplicationName: string;
        ApplicationTypeName: string;
        ServiceHealthStateChunks: IHealthStateChunkList<IServiceHealthStateChunk>;
        DeployedApplicationHealthStateChunks: IHealthStateChunkList<IDeployedApplicationHealthStateChunk>;
    }
    interface IDeployedApplicationHealthStateChunk extends IHealthStateChunk {
        NodeName: string;
        DeployedServicePackageHealthStateChunks: IHealthStateChunkList<IDeployedServicePackageHealthStateChunk>;
        ApplicationName: string;
    }
    interface IDeployedServicePackageHealthStateChunk extends IHealthStateChunk {
        ServiceManifestName: string;
        ServicePackageActivationId: string;
    }
    interface IServiceHealthStateChunk extends IHealthStateChunk {
        ServiceName: string;
        PartitionHealthStateChunks: IHealthStateChunkList<IPartitionHealthStateChunk>;
    }
    interface IPartitionHealthStateChunk extends IHealthStateChunk {
        PartitionId: string;
        ReplicaHealthStateChunks: IHealthStateChunkList<IReplicaHealthStateChunk>;
    }
    interface IReplicaHealthStateChunk extends IHealthStateChunk {
        ReplicaOrInstanceId: string;
    }
    interface IClusterHealthChunkQueryDescription {
        ApplicationFilters: IApplicationHealthStateFilter[];
        NodeFilters: INodeHealthStateFilter[];
    }
    interface IHealthStateFilter {
        HealthStateFilter?: HealthStateFilterFlags;
    }
    interface IApplicationHealthStateFilter extends IHealthStateFilter {
        ApplicationNameFilter?: string;
        ApplicationTypeNameFilter?: string;
        ServiceFilters?: IServiceHealthStateFilter[];
        DeployedApplicationFilters?: IDeployedApplicationHealthStateFilter[];
    }
    interface IServiceHealthStateFilter extends IHealthStateFilter {
        ServiceNameFilter?: string;
        PartitionFilters?: IPartitionHealthStateFilter[];
    }
    interface IPartitionHealthStateFilter extends IHealthStateFilter {
        PartitionIdFilter?: string;
        ReplicaFilters?: IReplicaHealthStateFilter[];
    }
    interface IReplicaHealthStateFilter extends IHealthStateFilter {
        ReplicaOrInstanceIdFilter?: string;
    }
    interface INodeHealthStateFilter extends IHealthStateFilter {
        NodeNameFilter?: string;
    }
    interface IDeployedApplicationHealthStateFilter extends IHealthStateFilter {
        NodeNameFilter?: string;
        DeployedServicePackageFilters?: IDeployedServicePackageHealthStateFilter[];
    }
    interface IDeployedServicePackageHealthStateFilter extends IHealthStateFilter {
        ServiceManifestNameFilter?: string;
    }
}
declare module Sfx {
    class ListSettings {
        limit: number;
        defaultSortPropertyPaths: string[];
        columnSettings: ListColumnSetting[];
        secondRowColumnSettings: ListColumnSetting[];
        secondRowCollapsible: boolean;
        showSecondRow: (item: any) => boolean;
        searchable: boolean;
        search: string;
        sortPropertyPaths: string[];
        sortReverse: boolean;
        private _currentPage;
        private _itemCount;
        count: number;
        currentPage: number;
        readonly hasEnabledFilters: boolean;
        readonly begin: number;
        readonly pageCount: number;
        setPageWithIndex(index: number): void;
        constructor(limit: number, defaultSortPropertyPaths: string[], columnSettings: ListColumnSetting[], secondRowColumnSettings?: ListColumnSetting[], secondRowCollapsible?: boolean, showSecondRow?: (item: any) => boolean, searchable?: boolean);
        sort(sortPropertyPaths: string[]): void;
        isSortedByColumn(columnSetting: ListColumnSetting): boolean;
        reset(): void;
        getPluckedObject(item: any): any;
        filterContextMenuToggled(open: boolean): void;
    }
    class FilterValue {
        value: string;
        isChecked: boolean;
        constructor(value: string);
    }
    class ListColumnSetting {
        propertyPath: string;
        displayName: string;
        sortPropertyPaths: string[];
        enableFilter?: boolean;
        getDisplayHtml?: (item: any, property: any) => string;
        colspan: number;
        clickEvent: (item: any) => void;
        filterValues: FilterValue[];
        fixedWidthPx?: number;
        readonly hasFilters: boolean;
        readonly hasEffectiveFilters: boolean;
        readonly sortable: boolean;
        constructor(propertyPath: string, displayName: string, sortPropertyPaths?: string[], enableFilter?: boolean, getDisplayHtml?: (item: any, property: any) => string, colspan?: number, clickEvent?: (item: any) => void);
        reset(): void;
        getProperty(item: any): any;
        isBadge(item: any): boolean;
        getTextValue(item: any): string;
        getDisplayContentsInHtml(item: any): string;
    }
    class ListColumnSettingForBadge extends ListColumnSetting {
        constructor(propertyPath: string, displayName: string, sortPropertyPaths?: string[]);
        getTextValue(item: any): string;
    }
    class ListColumnSettingWithFilter extends ListColumnSetting {
        constructor(propertyPath: string, displayName: string, sortPropertyPaths?: string[]);
    }
    class ListColumnSettingForLink extends ListColumnSetting {
        constructor(propertyPath: string, displayName: string, href: (item: any) => string);
    }
}
declare module Sfx {
    interface IRawCollection<T> {
        ContinuationToken: string;
        Items: T[];
    }
    interface IRawList<T> extends Array<T> {
    }
    interface IRawApplication {
        Id: string;
        Name: string;
        TypeName: string;
        TypeVersion: string;
        Parameters: IRawParameter[];
        Status: string;
        HealthState: string;
        ApplicationDefinitionKind: string;
    }
    interface IRawBackupConfigurationInfo {
        Kind: string;
        PolicyName: string;
        PolicyInheritedFrom: string;
        SuspensionInfo: IRawSuspensionInfo;
    }
    interface IRawPartitionBackup {
        BackupId: string;
        BackupChainId: string;
        ApplicationName: string;
        ServiceManifestVersion: string;
        ServiceName: string;
        BackupLocation: string;
        BackupType: string;
        LsnOfLastBackupRecord: string;
        CreationTimeUtc: string;
        EpochOfLastBackupRecord: IRawEpochOfLastBackupRecord;
    }
    interface IRawEpochOfLastBackupRecord {
        DataLossVersion: string;
        ConfigurationVersion: string;
    }
    interface IRawApplicationBackupConfigurationInfo extends IRawPartitionBackupConfigurationInfo {
        ApplicationName: string;
    }
    interface IRawServiceBackupConfigurationInfo extends IRawPartitionBackupConfigurationInfo {
        ServiceName: string;
    }
    interface IRawPartitionBackupConfigurationInfo extends IRawBackupConfigurationInfo {
        PartitionId: string;
    }
    interface IRawBackupProgressInfo {
        RestoreState: string;
        TimeStampUtc: string;
        RestoredEpoch: IRawEpochOfLastBackupRecord;
        RestoredLsn: string;
    }
    interface IRawRestoreProgressInfo {
        BackupState: string;
        TimeStampUtc: string;
        BackupId: string;
        BackupLocation: string;
        EpochOfLastBackupRecord: IRawEpochOfLastBackupRecord;
        LsnOfLastBackupRecord: string;
    }
    interface IRawSuspensionInfo {
        IsSuspended: boolean;
        SuspensionInheritedFrom: string;
    }
    interface IRawApplicationManifest {
        Manifest: string;
    }
    interface IRawServiceManifest {
        Manifest: string;
    }
    interface IRawHealth {
        HealthEvents: IRawHealthEvent[];
        AggregatedHealthState: string;
        UnhealthyEvaluations: IRawUnhealthyEvaluation[];
    }
    interface IRawApplicationHealth extends IRawHealth {
        Name: string;
        ServiceHealthStates: IRawServiceHealthState[];
        DeployedApplicationHealthStates: IRawDeployedApplicationHealthState[];
    }
    interface IRawApplicationHealthState {
        Name: string;
        AggregatedHealthState: string;
    }
    interface IRawApplicationType {
        Name: string;
        Version: string;
        Status: string;
        StatusDetails: string;
        DefaultParameterList: IRawParameter[];
    }
    interface IRawUpgradeDomain {
        Name: string;
        State: string;
    }
    interface IRawMonitoringPolicy {
        FailureAction: string;
        HealthCheckWaitDurationInMilliseconds: string;
        HealthCheckStableDurationInMilliseconds: string;
        HealthCheckRetryTimeoutInMilliseconds: string;
        UpgradeTimeoutInMilliseconds: string;
        UpgradeDomainTimeoutInMilliseconds: string;
    }
    interface IRawUpgradeDescription {
        Name: string;
        TargetApplicationTypeVersion: string;
        Parameters: IRawParameter[];
        UpgradeKind: string;
        RollingUpgradeMode: string;
        UpgradeReplicaSetCheckTimeoutInSeconds: string;
        ForceRestart: boolean;
        MonitoringPolicy: IRawMonitoringPolicy;
    }
    interface IRawUnhealthyEvaluation {
        HealthEvaluation: IRawHealthEvaluation;
    }
    interface IRawHealthEvaluation {
        Kind: string;
        Description: string;
        AggregatedHealthState: string;
        UnhealthyEvent: IRawUnhealthyEvent;
        UnhealthyEvaluations: IRawUnhealthyEvaluation[];
        ConsiderWarningAsError: boolean;
    }
    interface IRawUnhealthyEvent {
        SourceId: string;
        Property: string;
        HealthState: string;
        TimeToLiveInMilliSeconds: string;
        Description: string;
        SequenceNumber: string;
        RemoveWhenExpired: boolean;
        SourceUtcTimestamp: string;
        LastModifiedUtcTimestamp: string;
        IsExpired: boolean;
    }
    interface IRawApplicationUpgradeProgress {
        Name: string;
        TypeName: string;
        TargetApplicationTypeVersion: string;
        UpgradeDomains: IRawUpgradeDomain[];
        UpgradeState: string;
        NextUpgradeDomain: string;
        RollingUpgradeMode: string;
        UpgradeDescription: IRawUpgradeDescription;
        UpgradeDurationInMilliseconds: string;
        UpgradeDomainDurationInMilliseconds: string;
        UnhealthyEvaluations: IRawUnhealthyEvaluation[];
        CurrentUpgradeDomainProgress: IRawUpgradeDomainProgress;
        StartTimestampUtc: string;
        FailureTimestampUtc: string;
        FailureReason: string;
        UpgradeDomainProgressAtFailure: IRawUpgradeDomainProgress;
        UpgradeStatusDetails: string;
    }
    interface IRawClusterHealth extends IRawHealth {
        NodeHealthStates: IRawNodeHealthState[];
        ApplicationHealthStates: IRawApplicationHealthState[];
        HealthStatistics: IRawHealthStatistics;
    }
    interface IRawClusterManifest {
        Manifest: string;
    }
    interface IRawClusterUpgradeProgress {
        CodeVersion: string;
        ConfigVersion: string;
        UpgradeDomains: IRawUpgradeDomain[];
        UpgradeState: string;
        NextUpgradeDomain: string;
        RollingUpgradeMode: string;
        UpgradeDescription: IRawUpgradeDescription;
        UpgradeDurationInMilliseconds: string;
        UpgradeDomainDurationInMilliseconds: string;
        UnhealthyEvaluations: IRawUnhealthyEvaluation[];
        CurrentUpgradeDomainProgress: IRawUpgradeDomainProgress;
        StartTimestampUtc: string;
        FailureTimestampUtc: string;
        FailureReason: string;
        UpgradeDomainProgressAtFailure: IRawUpgradeDomainProgress;
    }
    interface IRawClusterLoadInformation {
        LastBalancingStartTimeUtc: string;
        LastBalancingEndTimeUtc: string;
        LoadMetricInformation: IRawLoadMetricInformation[];
    }
    interface IRawLoadMetricInformation {
        Name: string;
        IsBalancedBefore: boolean;
        IsBalancedAfter: boolean;
        DeviationBefore: string;
        DeviationAfter: string;
        BalancingThreshold: string;
        Action: string;
        ActivityThreshold: string;
        ClusterCapacity: number;
        ClusterLoad: number;
        CurrentClusterLoad: number;
        RemainingUnbufferedCapacity: number;
        NodeBufferPercentage: number;
        BufferedCapacity: number;
        RemainingBufferedCapacity: number;
        IsClusterCapacityViolation: boolean;
        MinNodeLoadValue: number;
        MinNodeLoadId: IRawId;
        MaxNodeLoadValue: number;
        MaxNodeLoadId: IRawId;
    }
    interface IRawDeployedApplicationHealthState {
        ApplicationName: string;
        NodeName: string;
        AggregatedHealthState: string;
    }
    interface IRawHealthEvent {
        SourceId: string;
        Property: string;
        HealthState: string;
        Description: string;
        TimeToLiveInMilliSeconds: string;
        SequenceNumber: string;
        RemoveWhenExpired: boolean;
        IsExpired: boolean;
        SourceUtcTimestamp: string;
        LastModifiedUtcTimestamp: string;
    }
    interface IRawId {
        Id: string;
    }
    interface IRawNetwork {
        name: string;
        properties: IRawNetworkProperties;
    }
    interface IRawNetworkProperties {
        kind: string;
        networkAddressPrefix: string;
        networkStatus: string;
    }
    interface IRawNetworkOnApp {
        networkName: string;
    }
    interface IRawNetworkOnNode {
        NetworkName: string;
    }
    interface IRawAppOnNetwork {
        ApplicationName: string;
    }
    interface IRawNodeOnNetwork {
        nodeName: string;
    }
    interface IRawDeployedContainerOnNetwork {
        ApplicationName: string;
        NetworkName: string;
        CodePackageName: string;
        CodePackageVersion: string;
        ServiceManifestName: string;
        ServicePackageActivationId: string;
        ContainerAddress: string;
        ContainerId: string;
    }
    interface IRawNode {
        Name: string;
        IpAddressOrFQDN: string;
        Type: string;
        CodeVersion: string;
        ConfigVersion: string;
        NodeStatus: string;
        NodeUpTimeInSeconds: string;
        HealthState: string;
        IsSeedNode: boolean;
        UpgradeDomain: string;
        FaultDomain: string;
        Id: IRawId;
        InstanceId: string;
        NodeDeactivationInfo: IRawNodeDeactivationInfo;
        IsStopped: boolean;
    }
    interface IRawBackupPolicy {
        Name: string;
        AutoRestoreOnDataLoss: boolean;
        MaxIncrementalBackups: number;
        Schedule: IRawSchedule;
        Storage: IRawStorage;
    }
    interface IRawRetentionPolicy {
        RetentionPolicyType: string;
        MinimumNumberOfBackups: number;
        RetentionDuration: string;
    }
    interface IRawNodeDeactivationInfo {
        NodeDeactivationIntent: string;
        NodeDeactivationStatus: string;
        NodeDeactivationTask: IRawNodeDeactivationTask[];
    }
    interface IRawNodeDeactivationTask {
        NodeDeactivationTaskId: IRawNodeDeactivationTaskId;
        NodeDeactivationIntent: string;
    }
    interface IRawSchedule {
        ScheduleKind: string;
        ScheduleFrequencyType: string;
        RunDays: string[];
        RunTimes: string[];
        Interval: string;
    }
    interface IRawStorage {
        StorageKind: string;
        FriendlyName: string;
        Path: string;
        ConnectionString: string;
        ContainerName: string;
        PrimaryUserName: string;
        PrimaryPassword: string;
        SecondaryUserName: string;
        SecondaryPassword: string;
    }
    interface IRawNodeDeactivationTaskId {
        Id: string;
        NodeDeactivationTaskType: string;
    }
    interface IRawNodeHealthState {
        Name: string;
        Id: IRawId;
        AggregatedHealthState: string;
    }
    interface IRawNodeHealth extends IRawHealth {
        Name: string;
    }
    interface IRawNodeLoadInformation {
        NodeName: string;
        NodeLoadMetricInformation: IRawNodeLoadMetricInformation[];
    }
    interface IRawNodeLoadMetricInformation {
        Name: string;
        NodeCapacity: number;
        NodeLoad: number;
        NodeRemainingCapacity: number;
        IsCapacityViolation: boolean;
        NodeBufferedCapacity: number;
        NodeRemainingBufferedCapacity: number;
    }
    interface IRawParameter {
        Key: string;
        Value: string;
    }
    interface IRawPartition {
        ServiceKind: string;
        PartitionInformation: IRawPartitionInformation;
        TargetReplicaSetSize: number;
        MinReplicaSetSize: number;
        InstanceCount: number;
        HealthState: string;
        PartitionStatus: string;
        CurrentConfigurationEpoch: IRawConfigurationEpoch;
    }
    interface IRawPartitionDescription {
        PartitionScheme: string;
        Count: number;
        Names: string[];
        LowKey: string;
        HighKey: string;
    }
    interface IRawPartitionHealth extends IRawHealth {
        PartitionId: string;
        ReplicaHealthStates: IRawReplicaHealthState[];
    }
    interface IRawPartitionHealthState {
        PartitionId: string;
        AggregatedHealthState: string;
    }
    interface IRawPartitionInformation {
        Id: string;
        ServicePartitionKind: string;
        HighKey: string;
        LowKey: string;
        Name: string;
    }
    interface IRawPartitionLoadInformation {
        PartitionId: string;
        PrimaryLoadMetricReports: IRawLoadMetricReport[];
        SecondaryLoadMetricReports: IRawLoadMetricReport[];
    }
    interface IRawLoadMetricReport {
        Name: string;
        Value: string;
        LastReportedUtc: string;
    }
    interface IRawConfigurationEpoch {
        ConfigurationVersion: number;
        DataLossVersion: number;
    }
    interface IRawReplicaHealth extends IRawHealth {
        Kind: string;
        PartitionId: string;
        ReplicaId: string;
        InstanceId: string;
    }
    interface IRawDeployedReplica {
        Address: string;
        CodePackageName: string;
        InstanceId: string;
        LastInBuildDurationInSeconds: string;
        ReplicaId: string;
        PartitionId: string;
        ReplicaRole: string;
        ReplicaStatus: string;
        ServiceKind: string;
        ServiceManifestVersion: string;
        ServiceName: string;
        ServiceTypeName: string;
        ServicePackageActivationId: string;
    }
    interface IRawDeployedReplicaDetail {
        PartitionId: string;
        InstanceId: string;
        ReplicaId: string;
        ReadStatus: string;
        WriteStatus: string;
        CurrentServiceOperation: string;
        CurrentServiceOperationStartTimeUtc: string;
        CurrentReplicatorOperation: string;
        ReportedLoad: IRawLoadMetricReport[];
        ReplicatorStatus: IRawReplicatorStatus;
        ReplicaStatus: IRawDeployedReplicaStatus;
    }
    interface IRawDeployedReplicaStatus {
        Kind: string;
        DatabaseRowCountEstimate: string;
        DatabaseLogicalSizeEstimate: string;
        StatusDetails: string;
    }
    class IRawReplicatorStatus {
        Kind: string;
        IsInBuild: boolean;
        LastCopyOperationReceivedTimeUtc: string;
        LastReplicationOperationReceivedTimeUtc: string;
        LastAcknowledgementSentTimeUtc: string;
        ReplicationQueueStatus: IRawReplicatorQueueStatus;
        CopyQueueStatus: IRawReplicatorQueueStatus;
        RemoteReplicators: IRawRemoteReplicatorStatus[];
    }
    class IRawReplicatorQueueStatus {
        QueueUtilizationPercentage: string;
        QueueMemorySize: boolean;
        FirstSequenceNumber: string;
        CompletedSequenceNumber: string;
        CommmittedSequenceNumber: string;
        LastSequenceNumber: string;
    }
    class IRawRemoteReplicatorStatus {
        ReplicaId: string;
        IsInBuild: boolean;
        LastAcknowledgementProcessedTimeUtc: string;
        LastReceivedReplicationSequenceNumber: string;
        LastAppliedReplicationSequenceNumber: string;
        LastReceivedCopySequenceNumber: string;
        LastAppliedCopySequenceNumber: string;
    }
    interface IRawReplicaOnPartition {
        Address: string;
        HealthState: string;
        ReplicaId: string;
        ReplicaRole: string;
        InstanceId: string;
        LastInBuildDurationInSeconds: string;
        NodeName: string;
        ReplicaStatus: string;
        ServiceKind: string;
    }
    interface IRawReplicaHealthState {
        ServiceKind: string;
        PartitionId: string;
        ReplicaId: string;
        AggregatedHealthState: string;
    }
    interface IRawService {
        Id: string;
        ServiceKind: string;
        Name: string;
        TypeName: string;
        ManifestVersion: string;
        ServiceStatus: string;
        HasPersistedState: boolean;
        HealthState: string;
        IsServiceGroup: boolean;
    }
    interface IRawServiceCorrelationDescription {
        ServiceName: string;
        Scheme: string;
    }
    interface IRawServicePlacementPolicy {
        Type: string;
        DomainName?: string;
    }
    interface IRawServiceDescription {
        ServiceKind: string;
        ApplicationName: string;
        ServiceName: string;
        ServiceTypeName: string;
        InitializationData: number[];
        PartitionDescription: IRawPartitionDescription;
        InstanceCount: number;
        TargetReplicaSetSize: number;
        MinReplicaSetSize: number;
        HasPersistedState: boolean;
        PlacementConstraints: string;
        CorrelationScheme: IRawServiceCorrelationDescription[];
        ReplicaRestartWaitDurationSeconds: number;
        ServiceLoadMetrics: IRawServiceLoadMetricDescription[];
        ServicePlacementPolicies: IRawServicePlacementPolicy[];
        Flags: string;
        DefaultMoveCost: string;
        IsDefaultMoveCostSpecified: boolean;
        ServicePackageActivationMode: string;
        ServiceDnsName: string;
    }
    interface IRawServiceHealth extends IRawHealth {
        Name: string;
        PartitionHealthStates: IRawPartitionHealthState[];
    }
    interface IRawServiceHealthState {
        ServiceName: string;
        AggregatedHealthState: string;
    }
    interface IRawServiceLoadMetricDescription {
        Name: string;
        Weight: string;
        PrimaryDefaultLoad: number;
        SecondaryDefaultLoad: number;
    }
    interface IRawServiceType {
        ServiceTypeDescription: IRawServiceTypeDescription;
        ServiceManifestVersion: string;
        ServiceManifestName: string;
        IsServiceGroup: boolean;
    }
    interface IRawServiceTypeDescription {
        IsStateful: boolean;
        ServiceTypeName: string;
        PlacementConstraints: string;
        HasPersistedState: boolean;
        UseImplicitHost: boolean;
    }
    interface IRawUpgradeDomainProgress {
        DomainName: string;
        NodeUpgradeProgressList: IRawNodeUpgradeProgress[];
    }
    interface IRawNodeUpgradeProgress {
        NodeName: string;
        UpgradePhase: string;
        PendingSafetyChecks: IRawSafetyCheckDescription[];
    }
    interface IRawSafetyCheckDescription {
        Kind: string;
        PartitionId: string;
    }
    interface IRawApplicationEvent {
        PartitionKey: string;
        RowKey: string;
        EventType: string;
        targetversion: string;
        TaskName: string;
        Timestamp: string;
    }
    interface IRawDeployedServicePackage {
        Name: string;
        Version: string;
        Status: string;
        ServicePackageActivationId: string;
    }
    interface IRawDeployedApplication {
        Id: string;
        LogDirectory: string;
        Name: string;
        Status: string;
        TempDirectory: string;
        TypeName: string;
        WorkDirectory: string;
    }
    interface IRawDeployedServicePackageHealth extends IRawHealth {
        ApplicationName: string;
        ServiceManifestName: string;
        NodeName: string;
        ServicePackageActivationId: string;
    }
    interface IRawContainerLogs {
        Content: string;
    }
    interface IRawDeployedCodePackage {
        Name: string;
        Version: string;
        ServiceManifestName: string;
        ServicePackageActivationId: string;
        Status: string;
        RunFrequencyInterval: number;
        SetupEntryPoint: IRawCodePackageEntryPoint;
        MainEntryPoint: IRawCodePackageEntryPoint;
        HasSetupEntryPoint: boolean;
        HostType: string;
        HostIsolationMode: string;
    }
    interface IRawCodePackageEntryPoint {
        EntryPointLocation: string;
        InstanceId: string;
        ProcessId: string;
        RunAsUserName: string;
        Status: string;
        NextActivationTime: string;
        CodePackageEntryPointStatistics: IRawCodePackageEntryPointStatistics;
    }
    interface IRawCodePackageEntryPointStatistics {
        LastExitCode: number;
        LastActivationTime: string;
        LastExitTime: string;
        LastSuccessfulActivationTime: string;
        LastSuccessfulExitTime: string;
        ActivationCount: number;
        ActivationFailureCount: number;
        ContinuousActivationFailureCount: number;
        ExitCount: number;
        ExitFailureCount: number;
        ContinuousExitFailureCount: number;
    }
    interface IRawAadMetadata {
        type: string;
        metadata: IRawAadMetadataMetadata;
    }
    interface IRawAadMetadataMetadata {
        login: string;
        authority: string;
        client: string;
        cluster: string;
        redirect: string;
        tenant: string;
    }
    interface IRawCreateServiceFromTemplateDescription {
        ServiceName: string;
        ServiceTypeName: string;
        ApplicationName: string;
        ServicePackageActivationMode: string;
        InitializationData: any[];
    }
    interface IRawUpdateServiceDescription {
        ServiceKind: number;
        Flags: number;
        TargetReplicaSetSize: number;
        MinReplicaSetSize: number;
        InstanceCount: number;
        ReplicaRestartWaitDurationSeconds: number;
        QuorumLossWaitDurationSeconds: number;
        StandByReplicaKeepDurationSeconds: number;
    }
    interface IRawCreateServiceDescription extends IRawCreateServiceFromTemplateDescription, IRawUpdateServiceDescription {
        PartitionDescription: IRawPartitionDescription;
        TargetReplicaSetSize: number;
        HasPersistedState: boolean;
        PlacementConstraints: string;
        CorrelationScheme: IRawServiceCorrelationDescription[];
        ServiceLoadMetrics: IRawServiceLoadMetricDescription[];
        ServicePlacementPolicies: IRawServicePlacementPolicy[];
        ServiceDnsName: string;
    }
    interface IRawHealthStatistics {
        HealthStateCountList: IRawHealthStatisticsItem[];
    }
    interface IRawHealthStatisticsItem {
        EntityKind: string;
        HealthStateCount: IRawHealthStateCount;
    }
    interface IRawHealthStateCount {
        OkCount: number;
        ErrorCount: number;
        WarningCount: number;
    }
    interface IRawRepositoryCredential {
        RepositoryUserName?: string;
        RepositoryPassword?: string;
        PasswordEncrypted?: boolean;
    }
    interface IRawCreateComposeDeploymentDescription {
        DeploymentName: string;
        ComposeFileContent: string;
        RepositoryCredential?: IRawRepositoryCredential;
    }
    interface IRawImageStoreContent {
        StoreFiles: IRawStoreFile[];
        StoreFolders: IRawStoreFolder[];
    }
    interface IRawStoreFile {
        FileSize: string;
        FileVersion: IRawFileVersion;
        ModifiedDate: string;
        StoreRelativePath: string;
    }
    interface IRawFileVersion {
        VersionNumber: string;
    }
    interface IRawStoreFolder {
        StoreRelativePath: string;
        FileCount: string;
    }
    interface IRawStoreFolderSize {
        StoreRelativePath: string;
        FolderSize: string;
    }
    interface IRawClusterVersion {
        Version: string;
    }
    interface INodesStatusDetails {
        nodeType: string;
        statusTypeCounts: Record<string, number>;
        warningCount: number;
        errorCount: number;
    }
    class NodeStatusDetails implements INodesStatusDetails {
        nodeType: string;
        statusTypeCounts: Record<string, number>;
        warningCount: number;
        errorCount: number;
        totalCount: number;
        constructor(nodeType: string);
        add(node: Node): void;
    }
}
declare module Sfx {
    interface IDataModel<T> {
        raw: T;
        isInitialized: boolean;
        isRefreshing: boolean;
        parent: any;
        uniqueId: string;
        id: string;
        name: string;
        healthState: ITextAndBadge;
        viewPath: string;
        actions: ActionCollection;
        refresh(messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
        ensureInitialized(forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
        update(raw: T): angular.IPromise<any>;
        mergeHealthStateChunk(healthChunk: IHealthStateChunk): angular.IPromise<any>;
        addHealthStateFiltersForChildren(clusterHealthChunkQueryDescription: IClusterHealthChunkQueryDescription): IHealthStateFilter;
    }
    interface IDecorator {
        displayName?: (name: string) => string;
        displayValueInHtml?: (value: any) => string;
    }
    interface IDecorators {
        showList?: string[];
        hideList?: string[];
        decorators?: _.Dictionary<IDecorator>;
    }
    class DataModelBase<T> implements IDataModel<T> {
        data: DataService;
        isInitialized: boolean;
        actions: ActionCollection;
        raw: T;
        parent: any;
        protected valueResolver: ValueResolver;
        private refreshingPromise;
        readonly isRefreshing: boolean;
        readonly uniqueId: string;
        readonly id: string;
        readonly name: string;
        readonly viewPath: string;
        readonly healthState: ITextAndBadge;
        constructor(data: DataService, raw?: T, parent?: any);
        refresh(messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
        update(raw: T): angular.IPromise<any>;
        ensureInitialized(forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
        addHealthStateFiltersForChildren(clusterHealthChunkQueryDescription: IClusterHealthChunkQueryDescription): IHealthStateFilter;
        mergeHealthStateChunk(healthChunk: IHealthStateChunk): angular.IPromise<any>;
        protected readonly rawAny: any;
        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<T>;
        protected updateInternal(): angular.IPromise<any> | void;
        protected refreshFromHealthChunkInternal(healthChunk: IHealthStateChunk): angular.IPromise<any>;
    }
    class HealthBase<T extends IRawHealth> extends DataModelBase<T> {
        healthEvents: HealthEvent[];
        unhealthyEvaluations: HealthEvaluation[];
        constructor(data: DataService, parent?: any);
        mergeHealthStateChunk(healthChunk: IHealthStateChunk): angular.IPromise<any>;
        protected updateInternal(): angular.IPromise<any> | void;
        protected parseCommonHealthProperties(): angular.IPromise<object>;
    }
}
declare module Sfx {
    class HealthEvent extends DataModelBase<IRawHealthEvent> {
        constructor(data: DataService, raw: IRawHealthEvent);
        readonly uniqueId: string;
        readonly description: string;
        readonly sourceUtcTimestamp: string;
        readonly TTL: string;
    }
    class HealthEvaluation extends DataModelBase<IRawHealthEvaluation> {
        level: number;
        viewPathUrl: string;
        children: any[];
        displayName: string;
        constructor(raw: IRawHealthEvaluation, level?: number, parent?: HealthEvaluation, viewPathUrl?: string);
        readonly viewPath: string;
        readonly kind: string;
        readonly uniqueId: string;
        readonly description: string;
    }
    class LoadMetricInformation extends DataModelBase<IRawLoadMetricInformation> {
        decorators: IDecorators;
        selected: boolean;
        readonly minNodeLoadId: string;
        readonly maxNodeLoadId: string;
        readonly hasCapacity: boolean;
        readonly isResourceGovernanceMetric: boolean;
        readonly isSystemMetric: boolean;
        readonly isLoadMetric: boolean;
        readonly loadCapacityRatio: number;
        readonly loadCapacityRatioString: string;
        readonly displayName: string;
        constructor(data: DataService, raw: IRawLoadMetricInformation);
    }
    class UpgradeDescription extends DataModelBase<IRawUpgradeDescription> {
        decorators: IDecorators;
        monitoringPolicy: MonitoringPolicy;
        constructor(data: DataService, raw: IRawUpgradeDescription);
    }
    class MonitoringPolicy extends DataModelBase<IRawMonitoringPolicy> {
        decorators: IDecorators;
        constructor(data: DataService, raw: IRawMonitoringPolicy);
    }
    class UpgradeDomain extends DataModelBase<IRawUpgradeDomain> {
        constructor(data: DataService, raw: IRawUpgradeDomain);
        readonly stateName: string;
        readonly badgeClass: string;
    }
}
declare module Sfx {
    interface IDataModelCollection<T extends IDataModel<any>> {
        collection: T[];
        length: number;
        isInitialized: boolean;
        isRefreshing: boolean;
        viewPath: string;
        find(uniqueId: string): T;
        refresh(messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
        ensureInitialized(forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
        mergeClusterHealthStateChunk(clusterHealthChunk: IClusterHealthChunk): angular.IPromise<any>;
    }
    class CancelablePromise<T> {
        private $q;
        private defer;
        constructor($q: angular.IQService);
        load(loadHandler: () => angular.IPromise<T>): angular.IPromise<T>;
        hasPromise(): boolean;
        getPromise(): angular.IPromise<T>;
        cancel(): void;
        private executeInternal;
    }
    class DataModelCollectionBase<T extends IDataModel<any>> implements IDataModelCollection<T> {
        data: DataService;
        isInitialized: boolean;
        parent: any;
        collection: T[];
        protected valueResolver: ValueResolver;
        private appendOnly;
        private hash;
        private refreshingLoadPromise;
        private refreshingPromise;
        readonly viewPath: string;
        readonly length: number;
        readonly isRefreshing: boolean;
        protected readonly indexPropery: string;
        constructor(data: DataService, parent?: any, appendOnly?: boolean);
        refresh(messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
        clear(): angular.IPromise<any>;
        protected cancelLoad(): void;
        protected update(collection: T[]): angular.IPromise<any>;
        ensureInitialized(forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
        find(uniqueId: string): T;
        mergeClusterHealthStateChunk(clusterHealthChunk: IClusterHealthChunk): angular.IPromise<any>;
        protected retrieveNewCollection(messageHandler?: IResponseMessageHandler): angular.IPromise<T[]>;
        protected updateInternal(): angular.IPromise<any> | void;
        protected updateCollectionFromHealthChunkList<P extends IHealthStateChunk>(healthChunkList: IHealthStateChunkList<P>, newIdSelector: (item: P) => string): angular.IPromise<any>;
        protected getDetailsList(item: any): IDataModelCollection<any>;
    }
    class NodeCollection extends DataModelCollectionBase<Node> {
        private static checkedOneNodeScenario;
        healthState: ITextAndBadge;
        upgradeDomains: string[];
        faultDomains: string[];
        healthySeedNodes: string;
        disabledNodes: string;
        seedNodeCount: number;
        constructor(data: DataService);
        readonly viewPath: string;
        mergeClusterHealthStateChunk(clusterHealthChunk: IClusterHealthChunk): angular.IPromise<any>;
        getNodeStateCounts(): INodesStatusDetails[];
        setAdvancedMode(state: boolean): void;
        protected readonly indexPropery: string;
        protected retrieveNewCollection(messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
        protected updateInternal(): angular.IPromise<any> | void;
        checkSeedNodeCount(expected: number): void;
        private checkOneNodeScenario;
        private updateNodesHealthState;
    }
    class BackupPolicyCollection extends DataModelCollectionBase<BackupPolicy> {
        protected retrieveNewCollection(messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
    }
    class NetworkCollection extends DataModelCollectionBase<Network> {
        constructor(data: DataService);
        readonly viewPath: string;
        protected retrieveNewCollection(messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
    }
    class NetworkOnAppCollection extends DataModelCollectionBase<NetworkOnApp> {
        appId: string;
        constructor(data: DataService, appId: string);
        protected retrieveNewCollection(messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
    }
    class NetworkOnNodeCollection extends DataModelCollectionBase<NetworkOnNode> {
        nodeName: string;
        constructor(data: DataService, nodeName: string);
        protected retrieveNewCollection(messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
    }
    class AppOnNetworkCollection extends DataModelCollectionBase<AppOnNetwork> {
        networkName: string;
        constructor(data: DataService, networkName: string);
        protected retrieveNewCollection(messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
    }
    class NodeOnNetworkCollection extends DataModelCollectionBase<NodeOnNetwork> {
        networkName: string;
        constructor(data: DataService, networkName: string);
        protected retrieveNewCollection(messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
    }
    class DeployedContainerOnNetworkCollection extends DataModelCollectionBase<DeployedContainerOnNetwork> {
        networkName: string;
        constructor(data: DataService, networkName: string);
        protected retrieveNewCollection(messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
    }
    class ApplicationCollection extends DataModelCollectionBase<Application> {
        upgradingAppCount: number;
        healthState: ITextAndBadge;
        constructor(data: DataService);
        readonly viewPath: string;
        mergeClusterHealthStateChunk(clusterHealthChunk: IClusterHealthChunk): angular.IPromise<any>;
        protected retrieveNewCollection(messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
        protected updateInternal(): angular.IPromise<any> | void;
        private updateAppsHealthState;
        private refreshAppTypeGroups;
    }
    class ApplicationTypeGroupCollection extends DataModelCollectionBase<ApplicationTypeGroup> {
        constructor(data: DataService);
        readonly viewPath: string;
        protected retrieveNewCollection(messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
    }
    class ApplicationBackupConfigurationInfoCollection extends DataModelCollectionBase<ApplicationBackupConfigurationInfo> {
        parent: Application;
        constructor(data: DataService, parent: Application);
        protected retrieveNewCollection(messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
    }
    class ServiceBackupConfigurationInfoCollection extends DataModelCollectionBase<ServiceBackupConfigurationInfo> {
        parent: Service;
        constructor(data: DataService, parent: Service);
        protected retrieveNewCollection(messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
    }
    class PartitionBackupCollection extends DataModelCollectionBase<PartitionBackup> {
        parent: PartitionBackupInfo;
        startDate: Date;
        endDate: Date;
        constructor(data: DataService, parent: PartitionBackupInfo);
        retrieveNewCollection(messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
    }
    class SinglePartitionBackupCollection extends DataModelCollectionBase<PartitionBackup> {
        parent: PartitionBackupInfo;
        constructor(data: DataService, parent: PartitionBackupInfo);
        retrieveNewCollection(messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
    }
    class ServiceTypeCollection extends DataModelCollectionBase<ServiceType> {
        parent: ApplicationType | Application;
        constructor(data: DataService, parent: ApplicationType | Application);
        protected retrieveNewCollection(messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
    }
    class ServiceCollection extends DataModelCollectionBase<Service> {
        parent: Application;
        constructor(data: DataService, parent: Application);
        mergeClusterHealthStateChunk(clusterHealthChunk: IClusterHealthChunk): angular.IPromise<any>;
        protected retrieveNewCollection(messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
    }
    class PartitionCollection extends DataModelCollectionBase<Partition> {
        parent: Service;
        constructor(data: DataService, parent: Service);
        mergeClusterHealthStateChunk(clusterHealthChunk: IClusterHealthChunk): angular.IPromise<any>;
        protected retrieveNewCollection(messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
    }
    class ReplicaOnPartitionCollection extends DataModelCollectionBase<ReplicaOnPartition> {
        parent: Partition;
        constructor(data: DataService, parent: Partition);
        readonly isStatefulService: boolean;
        readonly isStatelessService: boolean;
        protected retrieveNewCollection(messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
    }
    class DeployedApplicationCollection extends DataModelCollectionBase<DeployedApplication> {
        parent: Node;
        constructor(data: DataService, parent: Node);
        mergeClusterHealthStateChunk(clusterHealthChunk: IClusterHealthChunk): angular.IPromise<any>;
        protected retrieveNewCollection(messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
        protected updateInternal(): angular.IPromise<any> | void;
    }
    class DeployedServicePackageCollection extends DataModelCollectionBase<DeployedServicePackage> {
        parent: DeployedApplication;
        constructor(data: DataService, parent: DeployedApplication);
        mergeClusterHealthStateChunk(clusterHealthChunk: IClusterHealthChunk): angular.IPromise<any>;
        protected retrieveNewCollection(messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
        protected updateInternal(): angular.IPromise<any> | void;
    }
    class DeployedCodePackageCollection extends DataModelCollectionBase<DeployedCodePackage> {
        parent: DeployedServicePackage;
        constructor(data: DataService, parent: DeployedServicePackage);
        readonly viewPath: string;
        protected retrieveNewCollection(messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
    }
    class DeployedReplicaCollection extends DataModelCollectionBase<DeployedReplica> {
        parent: DeployedServicePackage;
        constructor(data: DataService, parent: DeployedServicePackage);
        readonly viewPath: string;
        readonly isStatefulService: boolean;
        readonly isStatelessService: boolean;
        protected retrieveNewCollection(messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
    }
    abstract class EventListBase<T extends FabricEventBase> extends DataModelCollectionBase<FabricEventInstanceModel<T>> {
        readonly settings: ListSettings;
        readonly detailsSettings: ListSettings;
        readonly minimumRefreshTimeInSecs: number;
        readonly pageSize: number;
        readonly defaultDateWindowInDays: number;
        readonly latestRefreshPeriodInSecs: number;
        protected readonly optionalColsStartIndex: number;
        private lastRefreshTime?;
        private _startDate;
        private _endDate;
        readonly startDate: Date;
        readonly endDate: Date;
        readonly queryStartDate: Date;
        readonly queryEndDate: Date;
        constructor(data: DataService, startDate?: Date, endDate?: Date);
        setDateWindow(startDate?: Date, endDate?: Date): boolean;
        resetDateWindow(): boolean;
        reload(messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
        protected retrieveNewCollection(messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
        protected getDetailsList(item: any): IDataModelCollection<any>;
        protected retrieveEvents(messageHandler?: IResponseMessageHandler): angular.IPromise<FabricEventInstanceModel<T>[]>;
        private createListSettings;
        private setNewDateWindowInternal;
    }
    class ClusterEventList extends EventListBase<ClusterEvent> {
        constructor(data: DataService, partitionId?: string);
        protected retrieveEvents(messageHandler?: IResponseMessageHandler): angular.IPromise<FabricEventInstanceModel<ClusterEvent>[]>;
    }
    class NodeEventList extends EventListBase<NodeEvent> {
        private nodeName?;
        constructor(data: DataService, nodeName?: string);
        protected retrieveEvents(messageHandler?: IResponseMessageHandler): angular.IPromise<FabricEventInstanceModel<NodeEvent>[]>;
    }
    class ApplicationEventList extends EventListBase<ApplicationEvent> {
        private applicationId?;
        constructor(data: DataService, applicationId?: string);
        protected retrieveEvents(messageHandler?: IResponseMessageHandler): angular.IPromise<FabricEventInstanceModel<ApplicationEvent>[]>;
    }
    class ServiceEventList extends EventListBase<ServiceEvent> {
        private serviceId?;
        constructor(data: DataService, serviceId?: string);
        protected retrieveEvents(messageHandler?: IResponseMessageHandler): angular.IPromise<FabricEventInstanceModel<ServiceEvent>[]>;
    }
    class PartitionEventList extends EventListBase<PartitionEvent> {
        private partitionId?;
        constructor(data: DataService, partitionId?: string);
        protected retrieveEvents(messageHandler?: IResponseMessageHandler): angular.IPromise<FabricEventInstanceModel<PartitionEvent>[]>;
    }
    class ReplicaEventList extends EventListBase<ReplicaEvent> {
        private partitionId;
        private replicaId?;
        constructor(data: DataService, partitionId: string, replicaId?: string);
        protected retrieveEvents(messageHandler?: IResponseMessageHandler): angular.IPromise<FabricEventInstanceModel<ReplicaEvent>[]>;
    }
    class CorrelatedEventList extends EventListBase<FabricEvent> {
        private eventInstanceId;
        constructor(data: DataService, eventInstanceId: string);
        protected retrieveEvents(messageHandler?: IResponseMessageHandler): angular.IPromise<FabricEventInstanceModel<FabricEvent>[]>;
    }
}
declare module Sfx {
    class Node extends DataModelBase<IRawNode> {
        decorators: IDecorators;
        deployedApps: DeployedApplicationCollection;
        loadInformation: NodeLoadInformation;
        health: NodeHealth;
        private expectedNodeStatus;
        constructor(data: DataService, raw?: IRawNode);
        readonly nodeStatus: string;
        readonly nodeUpTime: string;
        readonly id: string;
        readonly viewPath: string;
        readonly tooltip: string;
        readonly upgradeDomain: string;
        readonly faultDomain: string;
        addHealthStateFiltersForChildren(clusterHealthChunkQueryDescription: IClusterHealthChunkQueryDescription): IHealthStateFilter;
        removeAdvancedActions(): void;
        setAdvancedActions(): void;
        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawNode>;
        private setUpActions;
        private activate;
        private deactivate;
        private removeNodeState;
        private restart;
    }
    class NodeLoadInformation extends DataModelBase<IRawNodeLoadInformation> {
        parent: Node;
        decorators: IDecorators;
        nodeLoadMetricInformation: NodeLoadMetricInformation[];
        readonly name: string;
        constructor(data: DataService, parent: Node);
        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawNodeLoadInformation>;
        protected updateInternal(): angular.IPromise<any> | void;
    }
    class NodeLoadMetricInformation extends DataModelBase<IRawNodeLoadMetricInformation> {
        parent: NodeLoadInformation;
        readonly hasCapacity: boolean;
        readonly isSystemMetric: boolean;
        readonly loadCapacityRatio: number;
        readonly loadCapacityRatioString: string;
        constructor(data: DataService, raw: IRawNodeLoadMetricInformation, parent: NodeLoadInformation);
    }
    class NodeHealth extends HealthBase<IRawNodeHealth> {
        parent: Node;
        protected eventsHealthStateFilter: HealthStateFilterFlags;
        constructor(data: DataService, parent: Node, eventsHealthStateFilter: HealthStateFilterFlags);
        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawNodeHealth>;
    }
}
declare module Sfx {
    class Partition extends DataModelBase<IRawPartition> {
        parent: Service;
        partitionInformation: PartitionInformation;
        replicas: ReplicaOnPartitionCollection;
        loadInformation: PartitionLoadInformation;
        health: PartitionHealth;
        partitionBackupInfo: PartitionBackupInfo;
        constructor(data: DataService, raw: IRawPartition, parent: Service);
        readonly isStatefulService: boolean;
        readonly isStatelessService: boolean;
        readonly id: string;
        readonly name: string;
        readonly viewPath: string;
        readonly IsStatefulServiceAndSystemService: Boolean;
        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawPartition>;
        removeAdvancedActions(): void;
        setAdvancedActions(): void;
    }
    class PartitionHealth extends HealthBase<IRawPartitionHealth> {
        parent: Partition;
        protected eventsHealthStateFilter: HealthStateFilterFlags;
        protected replicasHealthStateFilter: HealthStateFilterFlags;
        constructor(data: DataService, parent: Partition, eventsHealthStateFilter: HealthStateFilterFlags, replicasHealthStateFilter: HealthStateFilterFlags);
        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawPartitionHealth>;
    }
    class PartitionInformation extends DataModelBase<IRawPartitionInformation> {
        constructor(data: DataService, raw: IRawPartitionInformation);
        readonly isPartitionKindInt64Range: boolean;
        readonly isPartitionKindNamed: boolean;
    }
    class PartitionLoadInformation extends DataModelBase<IRawPartitionLoadInformation> {
        parent: Partition;
        decorators: IDecorators;
        primaryLoadMetricReports: LoadMetricReport[];
        secondaryLoadMetricReports: LoadMetricReport[];
        constructor(data: DataService, parent: Partition);
        readonly isValid: boolean;
        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawPartitionLoadInformation>;
        protected updateInternal(): angular.IPromise<any> | void;
    }
    class LoadMetricReport extends DataModelBase<IRawLoadMetricReport> {
        constructor(data: DataService, raw: IRawLoadMetricReport);
        readonly lastReportedUtc: string;
    }
}
declare module Sfx {
    class Application extends DataModelBase<IRawApplication> {
        decorators: IDecorators;
        upgradeProgress: ApplicationUpgradeProgress;
        services: ServiceCollection;
        manifest: ApplicationManifest;
        health: ApplicationHealth;
        serviceTypes: ServiceTypeCollection;
        applicationBackupConfigurationInfoCollection: ApplicationBackupConfigurationInfoCollection;
        backupPolicyName: string;
        cleanBackup: boolean;
        constructor(data: DataService, raw?: IRawApplication);
        readonly isUpgrading: boolean;
        readonly viewPath: string;
        readonly appTypeViewPath: string;
        delete(): angular.IPromise<any>;
        addHealthStateFiltersForChildren(clusterHealthChunkQueryDescription: IClusterHealthChunkQueryDescription): IApplicationHealthStateFilter;
        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawApplication>;
        removeAdvancedActions(): void;
        private setUpActions;
        private setAdvancedActions;
        private cleanUpApplicationReplicas;
    }
    class SystemApplication extends Application {
        constructor(data: DataService);
        readonly status: ITextAndBadge;
        readonly viewPath: string;
        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawApplication>;
    }
    class ApplicationHealth extends HealthBase<IRawApplicationHealth> {
        parent: Application;
        protected eventsHealthStateFilter: HealthStateFilterFlags;
        protected servicesHealthStateFilter: HealthStateFilterFlags;
        protected deployedApplicationsHealthStateFilter: HealthStateFilterFlags;
        deployedApplicationHealthStates: DeployedApplicationHealthState[];
        constructor(data: DataService, parent: Application, eventsHealthStateFilter: HealthStateFilterFlags, servicesHealthStateFilter: HealthStateFilterFlags, deployedApplicationsHealthStateFilter: HealthStateFilterFlags);
        readonly deploymentsHealthState: ITextAndBadge;
        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawApplicationHealth>;
        protected updateInternal(): angular.IPromise<any> | void;
    }
    class DeployedApplicationHealthState extends DataModelBase<IRawDeployedApplicationHealthState> {
        parent: ApplicationHealth;
        readonly viewPath: string;
        constructor(data: DataService, raw: IRawDeployedApplicationHealthState, parent: ApplicationHealth);
    }
    class ApplicationManifest extends DataModelBase<IRawApplicationManifest> {
        parent: Application;
        constructor(data: DataService, parent: Application);
        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
    }
    class ApplicationUpgradeProgress extends DataModelBase<IRawApplicationUpgradeProgress> {
        parent: Application;
        decorators: IDecorators;
        unhealthyEvaluations: HealthEvaluation[];
        upgradeDomains: UpgradeDomain[];
        upgradeDescription: UpgradeDescription;
        constructor(data: DataService, parent: Application);
        readonly viewPath: string;
        readonly uniqueId: string;
        readonly startTimestampUtc: string;
        readonly failureTimestampUtc: string;
        readonly upgradeDuration: string;
        readonly upgradeDomainDuration: string;
        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawApplicationUpgradeProgress>;
        protected updateInternal(): angular.IPromise<any> | void;
    }
    class ApplicationBackupConfigurationInfo extends DataModelBase<IRawApplicationBackupConfigurationInfo> {
        parent: Application;
        decorators: IDecorators;
        action: ActionWithDialog;
        constructor(data: DataService, raw: IRawApplicationBackupConfigurationInfo, parent: Application);
    }
}
declare module Sfx {
    class DeployedApplication extends DataModelBase<IRawDeployedApplication> {
        parent: Node;
        decorators: IDecorators;
        deployedServicePackages: DeployedServicePackageCollection;
        health: DeployedApplicationHealth;
        constructor(data: DataService, raw: IRawDeployedApplication, parent: Node);
        readonly viewPath: string;
        readonly appTypeViewPath: string;
        readonly diskLocation: string;
        addHealthStateFiltersForChildren(clusterHealthChunkQueryDescription: IClusterHealthChunkQueryDescription): IDeployedApplicationHealthStateFilter;
        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawDeployedApplication>;
        protected refreshFromHealthChunkInternal(healthChunk: IDeployedApplicationHealthStateChunk): angular.IPromise<any>;
    }
    class DeployedApplicationHealth extends HealthBase<IRawApplicationHealth> {
        parent: DeployedApplication;
        protected eventsHealthStateFilter: HealthStateFilterFlags;
        protected deployedServicePackagesHealthFilter: HealthStateFilterFlags;
        constructor(data: DataService, parent: DeployedApplication, eventsHealthStateFilter: HealthStateFilterFlags, deployedServicePackagesHealthFilter: HealthStateFilterFlags);
        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawApplicationHealth>;
    }
}
declare module Sfx {
    class DeployedReplica extends DataModelBase<IRawDeployedReplica> {
        parent: DeployedServicePackage;
        decorators: IDecorators;
        address: any;
        detail: DeployedReplicaDetail;
        partition: IRawPartition;
        constructor(data: DataService, raw: IRawDeployedReplica, parent: DeployedServicePackage);
        readonly servicePackageActivationId: string;
        readonly serviceViewPath: string;
        readonly isStatefulService: boolean;
        readonly isStatelessService: boolean;
        readonly uniqueId: string;
        readonly id: string;
        readonly name: string;
        readonly role: string;
        readonly viewPath: string;
        readonly lastInBuildDuration: string;
        readonly replicaRoleSortPriority: number;
        restartReplica(): angular.IPromise<any>;
        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawDeployedReplica>;
        protected updateInternal(): angular.IPromise<any> | void;
        private setUpActions;
    }
    class DeployedReplicaDetail extends DataModelBase<IRawDeployedReplicaDetail> {
        parent: DeployedReplica | ReplicaOnPartition;
        decorators: IDecorators;
        replicatorStatus: ReplicatorStatus;
        reportedLoad: LoadMetricReport[];
        readonly currentServiceOperationStartTimeUtc: string;
        constructor(data: DataService, parent: DeployedReplica | ReplicaOnPartition);
        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawDeployedReplicaDetail>;
        protected updateInternal(): angular.IPromise<any> | void;
    }
    class ReplicatorStatus extends DataModelBase<IRawReplicatorStatus> {
        remoteReplicators: RemoteReplicatorStatus[];
        readonly LastCopyOperationReceivedTimeUtc: string;
        readonly LastReplicationOperationReceivedTimeUtc: string;
        readonly LastAcknowledgementSentTimeUtc: string;
        constructor(data: DataService, raw: IRawReplicatorStatus);
    }
    class RemoteReplicatorStatus extends DataModelBase<IRawRemoteReplicatorStatus> {
        readonly lastAcknowledgementProcessedTimeUtc: string;
        constructor(data: DataService, raw: IRawRemoteReplicatorStatus);
    }
}
declare module Sfx {
    class ReplicaOnPartition extends DataModelBase<IRawReplicaOnPartition> {
        parent: Partition;
        decorators: IDecorators;
        health: ReplicaHealth;
        detail: DeployedReplicaDetail;
        address: any;
        constructor(data: DataService, raw: IRawReplicaOnPartition, parent: Partition);
        restartReplica(): angular.IPromise<any>;
        deleteInstance(): angular.IPromise<any>;
        readonly isStatefulService: boolean;
        readonly isStatelessService: boolean;
        readonly id: string;
        readonly name: string;
        readonly role: string;
        readonly viewPath: string;
        readonly nodeViewPath: string;
        readonly lastInBuildDuration: string;
        readonly replicaRoleSortPriority: number;
        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
        protected updateInternal(): angular.IPromise<any> | void;
        private setUpActions;
    }
    class ReplicaHealth extends HealthBase<IRawReplicaHealth> {
        parent: ReplicaOnPartition;
        protected eventsHealthStateFilter: HealthStateFilterFlags;
        constructor(data: DataService, parent: ReplicaOnPartition, eventsHealthStateFilter: HealthStateFilterFlags);
        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawReplicaHealth>;
    }
}
declare module Sfx {
    class DeployedServicePackage extends DataModelBase<IRawDeployedServicePackage> {
        parent: DeployedApplication;
        deployedCodePackages: DeployedCodePackageCollection;
        deployedReplicas: DeployedReplicaCollection;
        health: DeployedServicePackageHealth;
        manifest: ServiceManifest;
        constructor(data: DataService, raw: IRawDeployedServicePackage, parent: DeployedApplication);
        readonly servicePackageActivationId: string;
        readonly uniqueId: string;
        readonly viewPath: string;
        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawDeployedServicePackage>;
        protected refreshFromHealthChunkInternal(healthChunk: IDeployedServicePackageHealthStateChunk): angular.IPromise<any>;
    }
    class DeployedServicePackageHealth extends HealthBase<IRawDeployedServicePackageHealth> {
        parent: DeployedServicePackage;
        protected eventsHealthStateFilter: HealthStateFilterFlags;
        constructor(data: DataService, parent: DeployedServicePackage, eventsHealthStateFilter: HealthStateFilterFlags);
        readonly servicePackageActivationId: string;
        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
    }
}
declare module Sfx {
    class DeployedCodePackage extends DataModelBase<IRawDeployedCodePackage> {
        parent: DeployedServicePackage;
        mainEntryPoint: CodePackageEntryPoint;
        setupEntryPoint: CodePackageEntryPoint;
        containerLogs: ContainerLogs;
        containerLogsTail: string;
        constructor(data: DataService, raw: IRawDeployedCodePackage, parent: DeployedServicePackage);
        readonly servicePackageActivationId: string;
        readonly uniqueId: string;
        readonly viewPath: string;
        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawDeployedCodePackage>;
        protected updateInternal(): angular.IPromise<any> | void;
        private restart;
        private setUpActions;
    }
    class CodePackageEntryPoint extends DataModelBase<IRawCodePackageEntryPoint> {
        parent: DeployedCodePackage;
        codePackageEntryPointStatistics: CodePackageEntryPointStatistics;
        constructor(data: DataService, raw: IRawCodePackageEntryPoint, parent: DeployedCodePackage);
        readonly nextActivationTime: string;
    }
    class CodePackageEntryPointStatistics extends DataModelBase<IRawCodePackageEntryPointStatistics> {
        parent: CodePackageEntryPoint;
        readonly lastActivationTime: string;
        readonly lastExitTime: string;
        readonly lastSuccessfulActivationTime: string;
        readonly lastSuccessfulExitTime: string;
        constructor(data: DataService, raw: IRawCodePackageEntryPointStatistics, parent: CodePackageEntryPoint);
    }
    class ContainerLogs extends DataModelBase<IRawContainerLogs> {
        parent: DeployedCodePackage;
        constructor(data: DataService, parent: DeployedCodePackage);
        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawContainerLogs>;
    }
}
declare module Sfx {
    enum HealthStatisticsEntityKind {
        Node = 0,
        Application = 1,
        Service = 2,
        Partition = 3,
        Replica = 4,
        DeployedApplication = 5,
        DepoyedServicePackage = 6
    }
    class ClusterHealth extends HealthBase<IRawClusterHealth> {
        protected eventsHealthStateFilter: HealthStateFilterFlags;
        protected nodesHealthStateFilter: HealthStateFilterFlags;
        protected applicationsHealthStateFilter: HealthStateFilterFlags;
        private static certExpirationChecked;
        private emptyHealthStateCount;
        constructor(data: DataService, eventsHealthStateFilter: HealthStateFilterFlags, nodesHealthStateFilter: HealthStateFilterFlags, applicationsHealthStateFilter: HealthStateFilterFlags);
        checkExpiredCertStatus(): void;
        getHealthStateCount(entityKind: HealthStatisticsEntityKind): IRawHealthStateCount;
        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
        private setMessage;
        private containsCertExpiringHealthEvent;
        private checkNodesContinually;
    }
    class ClusterManifest extends DataModelBase<IRawClusterManifest> {
        clusterManifestName: string;
        isSfrpCluster: boolean;
        isBRSEnabled: boolean;
        private _imageStoreConnectionString;
        private _isNetworkInventoryManagerEnabled;
        constructor(data: DataService);
        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawClusterManifest>;
        protected updateInternal(): angular.IPromise<any> | void;
        readonly isNetworkInventoryManagerEnabled: boolean;
        readonly imageStoreConnectionString: string;
    }
    class ClusterUpgradeProgress extends DataModelBase<IRawClusterUpgradeProgress> {
        decorators: IDecorators;
        unhealthyEvaluations: HealthEvaluation[];
        upgradeDomains: UpgradeDomain[];
        upgradeDescription: UpgradeDescription;
        readonly isUpgrading: boolean;
        readonly startTimestampUtc: string;
        readonly failureTimestampUtc: string;
        readonly upgradeDuration: string;
        readonly upgradeDomainDuration: string;
        getCompletedUpgradeDomains(): number;
        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawClusterUpgradeProgress>;
        protected updateInternal(): angular.IPromise<any> | void;
    }
    class ClusterLoadInformation extends DataModelBase<IRawClusterLoadInformation> {
        loadMetricInformation: LoadMetricInformation[];
        readonly lastBalancingStartTimeUtc: string;
        readonly lastBalancingEndTimeUtc: string;
        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawClusterLoadInformation>;
        protected updateInternal(): angular.IPromise<any> | void;
    }
    class BackupPolicy extends DataModelBase<IRawBackupPolicy> {
        decorators: IDecorators;
        action: ActionWithDialog;
        updatePolicy: ActionWithDialog;
        constructor(data: DataService, raw?: IRawBackupPolicy);
        updateBackupPolicy(): void;
        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawBackupPolicy>;
    }
}
declare module Sfx {
    class Service extends DataModelBase<IRawService> {
        parent: Application;
        decorators: IDecorators;
        partitions: PartitionCollection;
        health: ServiceHealth;
        description: ServiceDescription;
        serviceBackupConfigurationInfoCollection: ServiceBackupConfigurationInfoCollection;
        backupPolicyName: string;
        cleanBackup: boolean;
        constructor(data: DataService, raw: IRawService, parent: Application);
        readonly isStatefulService: boolean;
        readonly isStatelessService: boolean;
        readonly serviceKindInNumber: number;
        readonly viewPath: string;
        addHealthStateFiltersForChildren(clusterHealthChunkQueryDescription: IClusterHealthChunkQueryDescription): IServiceHealthStateFilter;
        updateService(updateServiceDescription: IRawUpdateServiceDescription): angular.IPromise<any>;
        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawService>;
        removeAdvancedActions(): void;
        private setUpActions;
        private setAdvancedActions;
        private delete;
    }
    class ServiceHealth extends HealthBase<IRawServiceHealth> {
        parent: Service;
        protected eventsHealthStateFilter: HealthStateFilterFlags;
        protected partitionsHealthStateFilter: HealthStateFilterFlags;
        constructor(data: DataService, parent: Service, eventsHealthStateFilter: HealthStateFilterFlags, partitionsHealthStateFilter: HealthStateFilterFlags);
        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawServiceHealth>;
    }
    class ServiceDescription extends DataModelBase<IRawServiceDescription> {
        parent: Service;
        decorators: IDecorators;
        constructor(data: DataService, parent: Service);
        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawServiceDescription>;
    }
    class ServiceType extends DataModelBase<IRawServiceType> {
        parent: ApplicationType | Application;
        manifest: ServiceManifest;
        constructor(data: DataService, raw: IRawServiceType, parent: ApplicationType | Application);
        readonly serviceKind: string;
        readonly serviceKindInNumber: number;
        readonly name: string;
        createService(description: CreateServiceDescription): angular.IPromise<any>;
        private setUpActions;
    }
    class ServiceManifest extends DataModelBase<IRawServiceManifest> {
        parent: DeployedServicePackage | ServiceType;
        packages: ServiceTypePackage[];
        constructor(data: DataService, parent: DeployedServicePackage | ServiceType);
        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawServiceManifest>;
        protected updateInternal(): angular.IPromise<any> | void;
        private getServiceManifest;
    }
    class ServiceTypePackage extends DataModelBase<any> {
        Type: string;
        Name: string;
        Version: string;
        constructor(data: DataService, Type: string, Name: string, Version: string);
        readonly id: string;
    }
    class ActionCreateService extends ActionWithDialog {
        serviceType: ServiceType;
        description: CreateServiceDescription;
        constructor($uibModal: ng.ui.bootstrap.IModalService, $q: ng.IQService, serviceType: ServiceType);
    }
    class ActionScaleService extends ActionWithDialog {
        updateServiceDescription: IRawUpdateServiceDescription;
        constructor($uibModal: ng.ui.bootstrap.IModalService, $q: ng.IQService, service: Service);
    }
    class CreateServiceDescription {
        serviceType: ServiceType;
        application: Application;
        raw: IRawCreateServiceDescription;
        initializationData: string;
        createFromTemplate: boolean;
        isAdvancedOptionCollapsed: boolean;
        readonly createDescription: IRawCreateServiceDescription;
        readonly createFromTemplateDescription: IRawCreateServiceFromTemplateDescription;
        readonly servicePartitionKinds: string[];
        readonly servicePackageActivationModes: string[];
        readonly placementPolicies: string[];
        readonly serviceCorrelationSchemes: string[];
        readonly serviceLoadMetricWeights: string[];
        readonly serviceNamePattern: string;
        constructor(serviceType: ServiceType, application: Application);
        toggleAdvancedOptions(): void;
        addName(): void;
        addPlacementPolicy(): void;
        addServiceCorrelation(): void;
        addLoadMetric(): void;
        reset(): void;
    }
    class ServiceBackupConfigurationInfo extends DataModelBase<IRawServiceBackupConfigurationInfo> {
        parent: Service;
        decorators: IDecorators;
        action: ActionWithDialog;
        constructor(data: DataService, raw: IRawServiceBackupConfigurationInfo, parent: Service);
    }
}
declare module Sfx {
    class ApplicationType extends DataModelBase<IRawApplicationType> {
        serviceTypes: ServiceTypeCollection;
        constructor(data: DataService, raw?: IRawApplicationType);
        readonly id: string;
        readonly viewPath: string;
        unprovision(): angular.IPromise<any>;
        createInstance(newInstanceUri: string): angular.IPromise<any>;
        private setUpActions;
    }
    class ApplicationTypeGroup extends DataModelBase<IRawApplicationType> {
        apps: Application[];
        appTypes: ApplicationType[];
        appsHealthState: ITextAndBadge;
        constructor(data: DataService, appTypes: ApplicationType[]);
        readonly viewPath: string;
        refreshAppTypeApps(apps: ApplicationCollection): void;
        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawApplicationType>;
        private setUpActions;
        private unprovision;
    }
    class ActionCreateAppInstance extends ActionWithDialog {
        private appType;
        readonly typeName: string;
        readonly typeVersion: string;
        newInstanceUri: string;
        constructor($uibModal: ng.ui.bootstrap.IModalService, $q: ng.IQService, appType: ApplicationType);
    }
}
declare module Sfx {
    class AuthenticationBootstrapConstants {
        static GetAadMetadataUriPart: string;
        static AadAuthType: string;
        static AdalCacheType: string;
    }
    class AadMetadata extends DataModelBase<IRawAadMetadata> {
        constructor(raw: IRawAadMetadata);
        readonly metadata: IRawAadMetadataMetadata;
        readonly isAadAuthType: boolean;
    }
}
declare module Sfx {
    interface IFabricEventMetadata {
        kind: string;
        eventInstanceId: string;
        timeStamp: string;
        hasCorrelatedEvents?: boolean;
    }
    interface IEventPropertiesCollection {
        eventProperties: {
            [key: string]: any;
        };
    }
    abstract class FabricEventBase implements IFabricEventMetadata, IEventPropertiesCollection {
        raw: {
            [key: string]: any;
        };
        private _kind;
        private _category?;
        private _eventInstanceId;
        private _timeStamp;
        private _hasCorrelatedEvents?;
        private _eventProperties;
        readonly kind: string;
        readonly category: string;
        readonly eventInstanceId: string;
        readonly timeStamp: string;
        readonly timeStampString: string;
        readonly hasCorrelatedEvents: boolean;
        readonly eventProperties: {
            [key: string]: any;
        };
        fillFromJSON(responseItem: any): void;
        protected extractField(name: string, value: any): boolean;
    }
    class FabricEventInstanceModel<T extends FabricEventBase> extends DataModelBase<T> {
        isSecondRowCollapsed: boolean;
        constructor(data: DataService, raw: T);
        readonly uniqueId: string;
        readonly id: string;
        readonly name: string;
    }
    class FabricEvent extends FabricEventBase {
    }
    class ClusterEvent extends FabricEventBase {
    }
    class NodeEvent extends FabricEventBase {
        private _nodeName;
        readonly nodeName: string;
        protected extractField(name: string, value: any): boolean;
    }
    class ApplicationEvent extends FabricEventBase {
        private _applicationId;
        readonly applicationId: string;
        protected extractField(name: string, value: any): boolean;
    }
    class ServiceEvent extends FabricEventBase {
        private _serviceId;
        readonly serviceId: string;
        protected extractField(name: string, value: any): boolean;
    }
    class PartitionEvent extends FabricEventBase {
        private _partitionId;
        readonly partitionId: string;
        protected extractField(name: string, value: any): boolean;
    }
    class ReplicaEvent extends FabricEventBase {
        private _partitionId;
        private _replicaId;
        readonly partitionId: string;
        readonly replicaId: string;
        protected extractField(name: string, value: any): boolean;
    }
    class EventsResponseAdapter<T extends FabricEventBase> {
        private eventType;
        constructor(eventType: new () => T);
        getEvents(responseItems: any[]): T[];
    }
}
declare module Sfx {
    interface ITimelineData {
        groups: vis.DataSet<vis.DataGroup>;
        items: vis.DataSet<vis.DataItem>;
        start?: Date;
        end?: Date;
    }
    interface ITimelineDataGenerator<T extends FabricEventBase> {
        consume(events: T[], startOfRange: Date, endOfRange: Date): ITimelineData;
    }
    class EventStoreUtils {
        static tooltipFormat: (data: Record<string, any>, start: string, end?: string, title?: string) => string;
        static parseUpgradeAndRollback(rollbackCompleteEvent: FabricEventBase, rollbackStartedEvent: ClusterEvent, items: vis.DataSet<vis.DataItem>, startOfRange: Date, group: string, targetVersionProperty: string): void;
        static parseUpgradeDomain(event: FabricEventBase, items: vis.DataSet<vis.DataItem>, group: string, targetVersionProperty: string): void;
        static parseUpgradeStarted(event: FabricEventBase, items: vis.DataSet<vis.DataItem>, endOfRange: Date, group: string, targetVersionProperty: string): void;
        static parseUpgradeCompleted(event: FabricEventBase, items: vis.DataSet<vis.DataItem>, group: string, targetVersionProperty: string): void;
        static addSubGroups(groups: vis.DataSet<vis.DataGroup>): void;
    }
    abstract class TimeLineGeneratorBase<T extends FabricEventBase> {
        consume(events: T[], startOfRange: Date, endOfRange: Date): ITimelineData;
        generateTimeLineData(events: T[], startOfRange: Date, endOfRange: Date): ITimelineData;
    }
    class ClusterTimelineGenerator extends TimeLineGeneratorBase<ClusterEvent> {
        static readonly upgradeDomainLabel: string;
        static readonly clusterUpgradeLabel: string;
        static readonly seedNodeStatus: string;
        consume(events: ClusterEvent[], startOfRange: Date, endOfRange: Date): ITimelineData;
        parseSeedNodeStatus(event: ClusterEvent, items: vis.DataSet<vis.DataItem>, previousClusterHealthReport: ClusterEvent, endOfRange: Date): void;
    }
    class NodeTimelineGenerator extends TimeLineGeneratorBase<NodeEvent> {
        static readonly NodesDownLabel: string;
        static readonly transitions: string[];
        consume(events: NodeEvent[], startOfRange: Date, endOfRange: Date): ITimelineData;
    }
    class ApplicationTimelineGenerator extends TimeLineGeneratorBase<ApplicationEvent> {
        static readonly upgradeDomainLabel: string;
        static readonly applicationUpgradeLabel: string;
        static readonly applicationPrcoessExitedLabel: string;
        consume(events: ApplicationEvent[], startOfRange: Date, endOfRange: Date): ITimelineData;
        parseApplicationProcessExited(event: FabricEventBase, items: vis.DataSet<vis.DataItem>, processExitedGroups: Record<string, vis.DataGroup>): void;
    }
    class PartitionTimelineGenerator extends TimeLineGeneratorBase<NodeEvent> {
        static readonly swapPrimaryLabel: string;
        static readonly swapPrimaryDurations: string;
        consume(events: NodeEvent[], startOfRange: Date, endOfRange: Date): ITimelineData;
    }
    function parseEventsGenerically(events: FabricEvent[], textSearch?: string): ITimelineData;
}
declare module Sfx {
    interface ITreeNode {
        displayName: () => string;
        nodeId?: string;
        childrenQuery?: () => angular.IPromise<ITreeNode[]>;
        selectAction?: () => void;
        badge?: () => ITextAndBadge;
        alwaysVisible?: boolean;
        startExpanded?: boolean;
        sortBy?: () => any[];
        listSettings?: ListSettings;
        actions?: ActionCollection;
        addHealthStateFiltersForChildren?: (clusterHealthChunkQueryDescription: IClusterHealthChunkQueryDescription) => void;
        mergeClusterHealthStateChunk?: (clusterHealthChunk: IClusterHealthChunk) => angular.IPromise<any>;
        canExpandAll?: boolean;
    }
}
declare module Sfx {
    class TreeNodeGroupViewModel {
        children: TreeNodeViewModel[];
        loadingChildren: boolean;
        childrenLoaded: boolean;
        owningNode: TreeNodeViewModel;
        childrenQuery: () => angular.IPromise<ITreeNode[]>;
        readonly displayedChildren: TreeNodeViewModel[];
        readonly hasChildren: boolean;
        readonly isExpanded: boolean;
        readonly isCollapsed: boolean;
        readonly paddingLeftPx: string;
        private _tree;
        private _isExpanded;
        private _currentGetChildrenPromise;
        constructor(tree: TreeViewModel, owningNode: TreeNodeViewModel, childrenQuery: () => angular.IPromise<ITreeNode[]>);
        toggle(): angular.IPromise<any>;
        expand(): angular.IPromise<any>;
        collapse(): void;
        pageDown(): void;
        pageUp(): void;
        pageFirst(): void;
        pageLast(): void;
        updateHealthChunkQueryRecursively(healthChunkQueryDescription: IClusterHealthChunkQueryDescription): void;
        updateDataModelFromHealthChunkRecursively(clusterHealthChunk: IClusterHealthChunk): angular.IPromise<any>;
        refreshExpandedChildrenRecursively(): angular.IPromise<any>;
        private getChildren;
        private exists;
    }
}
declare module Sfx {
    class TreeNodeViewModel {
        parent: TreeNodeViewModel;
        childGroupViewModel: TreeNodeGroupViewModel;
        displayName: () => string;
        sortBy: () => any[];
        listSettings: ListSettings;
        selected: boolean;
        leafNode: boolean;
        badge: () => ITextAndBadge;
        updateHealthChunkQueryDescription: (clusterHealthChunkQueryDescription: IClusterHealthChunkQueryDescription) => void;
        mergeClusterHealthStateChunk: (clusterHealthChunk: IClusterHealthChunk) => angular.IPromise<any>;
        actions: ActionCollection;
        canExpandAll: boolean;
        readonly depth: number;
        readonly paddingLeftPx: string;
        readonly hasChildren: boolean;
        readonly isExpanded: boolean;
        readonly isCollapsed: boolean;
        readonly isVisibleByBadge: boolean;
        readonly allChildrenInvisibleByBadge: boolean;
        readonly hasExpander: boolean;
        readonly displayHtml: string;
        private _tree;
        private _node;
        private _keyboardSelectActionDelayInMilliseconds;
        private readonly hasExpandedAndLoadedChildren;
        private readonly paddingLeft;
        constructor(tree: TreeViewModel, node: ITreeNode, parent: TreeNodeViewModel);
        update(node: ITreeNode): void;
        toggle(): void;
        toggleAll(): void;
        closeAll(): void;
        contextMenuToggled(open: boolean): void;
        handleClick(): void;
        select(actionDelay?: number, skipSelectAction?: boolean): void;
        readonly nodeId: string;
        selectNext(actionDelay?: number): void;
        selectPrevious(actionDelay?: number): void;
        expandOrMoveToChild(): void;
        collapseOrMoveToParent(): void;
        isParentOf(node: TreeNodeViewModel): boolean;
        private selectNextSibling;
        private getParentsChildren;
        private selectLast;
    }
}
declare module Sfx {
    class TreeViewModel {
        $q: angular.IQService;
        childGroupViewModel: TreeNodeGroupViewModel;
        selectedNode: TreeNodeViewModel;
        showOkItems: boolean;
        showWarningItems: boolean;
        showErrorItems: boolean;
        searchTerm: string;
        firstTreeSelect: boolean;
        readonly isLoading: boolean;
        readonly isEmpty: boolean;
        private _childrenQuery;
        private _selectTreeNodeOpId;
        constructor($q: angular.IQService, childrenQuery: () => angular.IPromise<ITreeNode[]>);
        refreshChildren(): void;
        selectNode(node: TreeNodeViewModel): boolean;
        onKeyDown(event: KeyboardEvent): void;
        refresh(): angular.IPromise<any>;
        selectTreeNode(path: string[], skipSelectAction?: boolean): angular.IPromise<void>;
        addHealthChunkFiltersRecursively(clusterHealthQueryDescription: IClusterHealthChunkQueryDescription): IClusterHealthChunkQueryDescription;
        mergeClusterHealthStateChunk(clusterHealthChunk: IClusterHealthChunk): angular.IPromise<any>;
        private selectTreeNodeInternal;
    }
}
declare module Sfx {
    interface IDashboardViewModel {
        displayTitle: string;
        largeTile: boolean;
        count: number;
        viewPath: string;
        dataPoints: IDashboardDataPointViewModel[];
        onClick(): void;
        getDataPointTooltip(dp: IDashboardDataPointViewModel): string;
    }
    interface IDashboardDataPointViewModel {
        state: ITextAndBadge;
        title: string;
        count: number;
        adjustedCount: number;
    }
    class DashboardViewModel implements IDashboardViewModel {
        private title;
        private titleInSingular;
        dataPoints: IDashboardDataPointViewModel[];
        largeTile: boolean;
        private routes?;
        count: number;
        viewPath: string;
        static fromHealthStateCount(title: string, titleInSingular: string, largeTile: boolean, healthStateCount: IRawHealthStateCount, routes?: RoutesService, viewPath?: string): DashboardViewModel;
        constructor(title: string, titleInSingular: string, dataPoints: IDashboardDataPointViewModel[], largeTile: boolean, routes?: RoutesService, viewPath?: string);
        readonly displayTitle: string;
        getDataPointTooltip(dp: IDashboardDataPointViewModel): string;
        onClick(): void;
        private adjustCount;
    }
    class DashboardDataPointViewModel implements IDashboardDataPointViewModel {
        title: string;
        count: number;
        state: ITextAndBadge;
        adjustedCount: number;
        constructor(title: string, count: number, state: ITextAndBadge);
    }
}
declare module Sfx {
    interface IMetricsViewScope extends angular.IScope {
        metrics: IMetricsViewModel;
        listSettings: SettingsService;
        tableSettings: ListSettings;
        tableData: any[];
    }
    interface IMetricsViewModel {
        filteredNodeLoadInformation: NodeLoadInformation[];
        selectedMetrics: LoadMetricInformation[];
        metrics: LoadMetricInformation[];
        filteredMetrics: LoadMetricInformation[];
        systemMetrics: LoadMetricInformation[];
        metricsWithCapacities: LoadMetricInformation[];
        metricsWithoutCapacities: LoadMetricInformation[];
        showResourceGovernanceMetrics: boolean;
        showLoadMetrics: boolean;
        showSystemMetrics: boolean;
        normalizeMetricsData: boolean;
        refreshToken: number;
        isExpanderEnabled: boolean;
        isFullScreen: boolean;
        refresh(): void;
        getLegendColor(value: string): string;
    }
    class MetricsViewModel implements IMetricsViewModel {
        private clusterLoadInformation;
        private nodesLoadInformation;
        _showResourceGovernanceMetrics: boolean;
        _showLoadMetrics: boolean;
        _showSystemMetrics: boolean;
        _normalizeMetricsData: boolean;
        refreshToken: number;
        isExpanderEnabled: boolean;
        isFullScreen: boolean;
        private _metrics;
        private legendColorPalette;
        private static ensureResourceGovernanceMetrics;
        readonly filteredNodeLoadInformation: NodeLoadInformation[];
        readonly metrics: LoadMetricInformation[];
        readonly filteredMetrics: LoadMetricInformation[];
        readonly metricsWithCapacities: LoadMetricInformation[];
        readonly metricsWithoutCapacities: LoadMetricInformation[];
        readonly systemMetrics: LoadMetricInformation[];
        readonly selectedMetrics: LoadMetricInformation[];
        showResourceGovernanceMetrics: boolean;
        showLoadMetrics: boolean;
        showSystemMetrics: boolean;
        normalizeMetricsData: boolean;
        refresh(): void;
        getLegendColor(value: string): string;
        toggleMetric(metric: LoadMetricInformation): void;
        toggleFullScreen(fullScreen: boolean): void;
        constructor(clusterLoadInformation: ClusterLoadInformation, nodesLoadInformation: NodeLoadInformation[]);
    }
}
declare module Sfx {
    class ControllerManagerService {
        private $q;
        firstPageLoad: boolean;
        private currentControllers;
        constructor($q: angular.IQService);
        registerMainController(controller: IControllerBase): void;
        registerController(controller: IControllerBase): void;
        refreshCurrentControllers(messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
    }
}
declare module Sfx {
    class ResponseHeadersService {
        private $rootScope;
        private $location;
        constructor($rootScope: angular.IRootScopeService, $location: angular.ILocationService);
        response: (response: any) => any;
    }
}
declare module Sfx {
    class AuthenticationService {
        private $rootScope;
        private clusterTree;
        private refreshSvc;
        private authenticationData;
        isApplicationBootstrapped: boolean;
        private adalAuthenticationService;
        constructor($injector: angular.auto.IInjectorService, $rootScope: IRootScopeServiceWithUserInfo, clusterTree: ClusterTreeService, refreshSvc: RefreshService, authenticationData: AadMetadata);
        readonly needAadAuthentication: boolean;
        readonly isAadAuthenticated: boolean;
        logOut(): void;
        bootstrapApplication(): void;
    }
}
declare module Sfx {
    class RefreshService {
        private $rootScope;
        private $interval;
        private $q;
        private $timeout;
        private controllerManager;
        private storage;
        private clusterTree;
        private data;
        isRefreshing: boolean;
        private autoRefreshInterval;
        private previousRefreshSetting;
        constructor($rootScope: angular.IRootScopeService, $interval: angular.IIntervalService, $q: angular.IQService, $timeout: angular.ITimeoutService, controllerManager: ControllerManagerService, storage: StorageService, clusterTree: ClusterTreeService, data: DataService);
        init(): void;
        refreshAll(): void;
        private updateRefreshInterval;
    }
}
declare module Sfx {
    class HttpClient {
        private $q;
        private $http;
        private httpClient;
        constructor($q: angular.IQService, $http: angular.IHttpService);
        getAsync<T>(url: string): angular.IHttpPromise<T>;
        postAsync<T>(url: string, data: any): angular.IHttpPromise<T>;
        putAsync<T>(url: string, data: any): angular.IHttpPromise<T>;
        patchAsync<T>(url: string, data: any): angular.IHttpPromise<T>;
        deleteAsync<T>(url: string): angular.IHttpPromise<T>;
        requestAsync<T>(request: Standalone.http.IHttpRequest): angular.IHttpPromise<T>;
    }
}
declare module Sfx {
    class RestClient {
        private httpClient;
        private message;
        private static defaultApiVersion;
        private static apiVersion40;
        private static apiVersion60;
        private static apiVersion62Preview;
        private static apiVersion64;
        private static apiVersion65;
        private static apiVersion72;
        private cacheAllowanceToken;
        private requestCount;
        private requestStarted;
        private requestEnded;
        private allRequestsComplete;
        constructor(httpClient: HttpClient, message: MessageService);
        invalidateBrowserRestResponseCache(): void;
        registerRequestStartedCallback(callback: (number: any) => void): RestClient;
        registerRequestEndedCallback(callback: (number: any) => void): RestClient;
        registerAllRequestsCompleteCallback(callback: () => void): void;
        getClusterHealth(eventsHealthStateFilter?: number, nodesHealthStateFilter?: number, applicationsHealthStateFilter?: number, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawClusterHealth>;
        getClusterManifest(messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawClusterManifest>;
        getClusterUpgradeProgress(messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawClusterUpgradeProgress>;
        getClusterLoadInformation(messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawClusterLoadInformation>;
        getClusterHealthChunk(healthDescriptor: IClusterHealthChunkQueryDescription, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<{}>;
        createNetwork(networkName: string, networkAddressPrefix: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<{}>;
        getNetwork(networkName: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawNetwork>;
        getNetworks(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawNetwork[]>;
        deleteNetwork(networkName: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<{}>;
        getNetworksOnApp(appId: string, messageHandler?: IResponseMessageHandler): angular.IPromise<IRawNetworkOnApp[]>;
        getNetworksOnNode(nodeName: string, messageHandler?: IResponseMessageHandler): angular.IPromise<IRawNetworkOnNode[]>;
        getAppsOnNetwork(networkName: string, messageHandler?: IResponseMessageHandler): angular.IPromise<IRawAppOnNetwork[]>;
        getNodesOnNetwork(networkName: string, messageHandler?: IResponseMessageHandler): angular.IPromise<IRawNodeOnNetwork[]>;
        getDeployedContainersOnNetwork(networkName: string, nodeName: string, messageHandler?: IResponseMessageHandler): angular.IPromise<IRawDeployedContainerOnNetwork[]>;
        getNodes(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawNode[]>;
        getNode(nodeName: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawNode>;
        getBackupPolicies(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawBackupPolicy[]>;
        getApplicationBackupConfigurationInfoCollection(applicationId: string, messageHandler?: IResponseMessageHandler): angular.IPromise<IRawApplicationBackupConfigurationInfo[]>;
        getServiceBackupConfigurationInfoCollection(serviceId: string, messageHandler?: IResponseMessageHandler): angular.IPromise<IRawServiceBackupConfigurationInfo[]>;
        getPartitionBackupProgress(partitionId: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawBackupProgressInfo>;
        getPartitionRestoreProgress(partitionId: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawRestoreProgressInfo>;
        getPartitionBackupConfigurationInfo(partitionId: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawPartitionBackupConfigurationInfo>;
        getLatestPartitionBackup(partitionId: string, messageHandler?: IResponseMessageHandler): angular.IPromise<IRawPartitionBackup[]>;
        getPartitionBackupList(partitionId: string, messageHandler?: IResponseMessageHandler, startDate?: Date, endDate?: Date, maxResults?: number): angular.IPromise<IRawPartitionBackup[]>;
        getBackupPolicy(backupName: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawBackupPolicy>;
        getNodeHealth(nodeName: string, eventsHealthStateFilter?: number, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawNodeHealth>;
        getNodeLoadInformation(nodeName: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawNodeLoadInformation>;
        restartNode(nodeName: string, nodeInstanceId: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<{}>;
        getDeployedApplications(nodeName: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawDeployedApplication[]>;
        getDeployedApplication(nodeName: string, applicationId: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawDeployedApplication>;
        getDeployedApplicationHealth(nodeName: string, applicationId: string, eventsHealthStateFilter?: number, deployedServicePackagesHealthStateFilter?: number, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawApplicationHealth>;
        getDeployedServicePackages(nodeName: string, applicationId: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawDeployedServicePackage[]>;
        getDeployedServicePackage(nodeName: string, applicationId: string, servicePackageName: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawDeployedServicePackage[]>;
        getDeployedServicePackageHealth(nodeName: string, applicationId: string, servicePackageName: string, servicePackageActivationId: string, eventsHealthStateFilter?: number, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawDeployedServicePackageHealth>;
        getServiceManifest(appTypeName: string, appTypeVersion: string, serviceManifestName: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawServiceManifest>;
        getServiceTypes(appTypeName: string, appTypeVersion: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawServiceType[]>;
        getDeployedReplicas(nodeName: string, applicationId: string, servicePackageName: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawDeployedReplica[]>;
        getDeployedCodePackages(nodeName: string, applicationId: string, servicePackageName: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawDeployedCodePackage[]>;
        getDeployedCodePackage(nodeName: string, applicationId: string, servicePackageName: string, codePackageName: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawDeployedCodePackage[]>;
        getDeployedContainerLogs(nodeName: string, applicationId: string, servicePackageName: string, codePackageName: string, servicePackageActivationId: string, tail: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawContainerLogs>;
        restartCodePackage(nodeName: string, applicationId: string, serviceManifestName: string, codePackageName: string, codePackageInstanceId: string, servicePackageActivationId?: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<{}>;
        getDeployedReplica(nodeName: string, applicationId: string, servicePackageName: string, partitionId: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawDeployedReplica[]>;
        getDeployedReplicaDetail(nodeName: string, partitionId: string, replicaId: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawDeployedReplicaDetail>;
        getApplicationTypes(appTypeName?: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawApplicationType[]>;
        getApplicationManifestForApplicationType(appTypeName: string, appTypeVersion: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawApplicationManifest>;
        provisionApplication(name: string, appTypeName: string, appTypeVersion: any, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<any>;
        activateNode(nodeName: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<{}>;
        deactivateNode(nodeName: string, intent: number, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<{}>;
        removeNodeState(nodeName: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<{}>;
        getApplications(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawApplication[]>;
        getServices(applicationId: string, messageHandler?: IResponseMessageHandler): angular.IPromise<IRawService[]>;
        getService(applicationId: string, serviceId: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawService>;
        createService(applicationId: string, serviceDescription: IRawCreateServiceDescription, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawService>;
        createServiceFromTemplate(applicationId: string, serviceDescription: IRawCreateServiceFromTemplateDescription, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawService>;
        updateService(applicationId: string, serviceId: string, updateServiceDescription: IRawUpdateServiceDescription, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawService>;
        enableApplicationBackup(application: Application, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<{}>;
        disableApplicationBackup(application: Application, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<{}>;
        enableServiceBackup(service: Service, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<{}>;
        disableServiceBackup(service: Service, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<{}>;
        enablePartitionBackup(partition: Partition, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<{}>;
        disablePartitionBackup(partition: Partition, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<{}>;
        suspendApplicationBackup(applicationId: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<{}>;
        resumeApplicationBackup(applicationId: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<{}>;
        suspendServiceBackup(serviceId: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<{}>;
        resumeServiceBackup(serviceId: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<{}>;
        suspendPartitionBackup(partitionId: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<{}>;
        resumePartitionBackup(partitionId: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<{}>;
        deleteBackupPolicy(backupPolicyName: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<{}>;
        updateBackupPolicy(backupPolicy: IRawBackupPolicy, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<{}>;
        createBackupPolicy(backupPolicy: IRawBackupPolicy, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<{}>;
        triggerPartitionBackup(partition: Partition, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<{}>;
        restorePartitionBackup(partition: Partition, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<{}>;
        getServiceDescription(applicationId: string, serviceId: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawServiceDescription>;
        getServiceHealth(applicationId: string, serviceId: string, eventsHealthStateFilter?: number, partitionsHealthStateFilter?: number, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawServiceHealth>;
        deleteService(applicationId: string, serviceId: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<{}>;
        unprovisionApplicationType(applicationTypeName: string, applicationTypeVersion: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<{}>;
        getApplication(applicationId: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawApplication>;
        getApplicationHealth(applicationId: string, eventsHealthStateFilter?: number, servicesHealthStateFilter?: number, deployedApplicationsHealthStateFilter?: number, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawApplicationHealth>;
        getApplicationUpgradeProgress(applicationId: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawApplicationUpgradeProgress>;
        deleteApplication(applicationId: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<{}>;
        createComposeDeployment(composeDeploymentDescription: IRawCreateComposeDeploymentDescription, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<{}>;
        deleteComposeApplication(applicationId: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<{}>;
        getPartitions(applicationId: string, serviceId: string, messageHandler?: IResponseMessageHandler): angular.IPromise<IRawPartition[]>;
        getPartition(applicationId: string, serviceId: string, partitionId: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawPartition>;
        getPartitionById(partitionId: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawPartition>;
        getPartitionHealth(applicationId: string, serviceId: string, partitionId: string, eventsHealthStateFilter?: number, replicasHealthStateFilter?: number, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawPartitionHealth>;
        getPartitionLoadInformation(applicationId: string, serviceId: string, partitionId: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawPartitionLoadInformation>;
        getReplicasOnPartition(applicationId: string, serviceId: string, partitionId: string, messageHandler?: IResponseMessageHandler): angular.IPromise<IRawReplicaOnPartition[]>;
        getReplicaOnPartition(applicationId: string, serviceId: string, partitionId: string, replicaId: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawReplicaOnPartition>;
        getReplicaHealth(applicationId: string, serviceId: string, partitionId: string, replicaId: string, eventsHealthStateFilter?: number, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawReplicaHealth>;
        getReplicasOnNode(nodeName: string, applicationId: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawDeployedReplica[]>;
        deleteReplica(nodeName: string, partitionId: string, replicaId: string, force?: boolean, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<{}>;
        getImageStoreContent(path?: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawImageStoreContent>;
        deleteImageStoreContent(path: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<{}>;
        getImageStoreFolderSize(path?: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawStoreFolderSize>;
        getClusterEvents(startTime: Date, endTime: Date, messageHandler?: IResponseMessageHandler): angular.IPromise<ClusterEvent[]>;
        getNodeEvents(startTime: Date, endTime: Date, nodeName?: string, messageHandler?: IResponseMessageHandler): angular.IPromise<NodeEvent[]>;
        getApplicationEvents(startTime: Date, endTime: Date, applicationId?: string, messageHandler?: IResponseMessageHandler): angular.IPromise<ApplicationEvent[]>;
        getServiceEvents(startTime: Date, endTime: Date, serviceId?: string, messageHandler?: IResponseMessageHandler): angular.IPromise<ServiceEvent[]>;
        getPartitionEvents(startTime: Date, endTime: Date, partitionId?: string, messageHandler?: IResponseMessageHandler): angular.IPromise<PartitionEvent[]>;
        getReplicaEvents(startTime: Date, endTime: Date, partitionId: string, replicaId?: string, messageHandler?: IResponseMessageHandler): angular.IPromise<ReplicaEvent[]>;
        getCorrelatedEvents(eventInstanceId: string, messageHandler?: IResponseMessageHandler): angular.IPromise<FabricEvent[]>;
        restartReplica(nodeName: string, partitionId: string, replicaId: string, messageHandler?: IResponseMessageHandler): angular.IPromise<{}>;
        getClusterVersion(messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawClusterVersion>;
        private getEvents;
        private getApiUrl;
        private getApiUrl2;
        private getFullCollection;
        private getFullCollection2;
        private get;
        private post;
        private put;
        private delete;
        private handleResponse;
        private wrapInCallbacks;
    }
}
declare module Sfx {
    class DataService {
        routes: RoutesService;
        message: MessageService;
        telemetry: TelemetryService;
        $location: angular.ILocationService;
        restClient: RestClient;
        warnings: StatusWarningService;
        storage: StorageService;
        $q: angular.IQService;
        $timeout: angular.ITimeoutService;
        $uibModal: angular.ui.bootstrap.IModalService;
        $route: angular.route.IRouteService;
        $sanitize: angular.sanitize.ISanitizeService;
        $rootScope: angular.IRootScopeService;
        systemApp: SystemApplication;
        clusterManifest: ClusterManifest;
        clusterUpgradeProgress: ClusterUpgradeProgress;
        clusterLoadInformation: ClusterLoadInformation;
        appTypeGroups: ApplicationTypeGroupCollection;
        apps: ApplicationCollection;
        nodes: NodeCollection;
        imageStore: ImageStore;
        networks: NetworkCollection;
        backupPolicies: BackupPolicyCollection;
        constructor(routes: RoutesService, message: MessageService, telemetry: TelemetryService, $location: angular.ILocationService, restClient: RestClient, warnings: StatusWarningService, storage: StorageService, $q: angular.IQService, $timeout: angular.ITimeoutService, $uibModal: angular.ui.bootstrap.IModalService, $route: angular.route.IRouteService, $sanitize: angular.sanitize.ISanitizeService, $rootScope: angular.IRootScopeService);
        actionsEnabled(): boolean;
        actionsAdvancedEnabled(): boolean;
        invalidateBrowserRestResponseCache(): void;
        getClusterHealth(eventsHealthStateFilter?: HealthStateFilterFlags, nodesHealthStateFilter?: HealthStateFilterFlags, applicationsHealthStateFilter?: HealthStateFilterFlags): ClusterHealth;
        getClusterManifest(forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<ClusterManifest>;
        getClusterUpgradeProgress(forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<ClusterUpgradeProgress>;
        getClusterLoadInformation(forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<ClusterLoadInformation>;
        getClusterHealthChunk(healthDescriptor: IClusterHealthChunkQueryDescription): angular.IPromise<IClusterHealthChunk>;
        getInitialClusterHealthChunkQueryDescription(): IClusterHealthChunkQueryDescription;
        getSystemApp(forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<SystemApplication>;
        getSystemServices(forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<ServiceCollection>;
        getApps(forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<ApplicationCollection>;
        getApp(id: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<Application>;
        getNodes(forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<NodeCollection>;
        getNode(name: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<Node>;
        getBackupPolicies(forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<BackupPolicyCollection>;
        getBackupPolicy(name: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<BackupPolicy>;
        getNetwork(networkName: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<Network>;
        getNetworks(forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<NetworkCollection>;
        getAppTypeGroups(forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<ApplicationTypeGroupCollection>;
        getAppTypeGroup(name: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<ApplicationTypeGroup>;
        getAppType(name: string, version: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<ApplicationType>;
        getServiceTypes(appTypeName: string, appTypeVersion: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<ServiceTypeCollection>;
        getServiceType(appTypeName: string, appTypeVersion: string, serviceTypeName: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<ServiceType>;
        getServices(appId: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<ServiceCollection>;
        getService(appId: string, serviceId: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<Service>;
        getPartitions(appId: string, serviceId: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<PartitionCollection>;
        getPartition(appId: string, serviceId: string, partitionId: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<Partition>;
        getReplicasOnPartition(appId: string, serviceId: string, partitionId: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<ReplicaOnPartitionCollection>;
        getReplicaOnPartition(appId: string, serviceId: string, partitionId: string, replicaId: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<ReplicaOnPartition>;
        getDeployedApplications(nodeName: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<DeployedApplicationCollection>;
        getDeployedApplication(nodeName: string, appId: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<DeployedApplication>;
        getDeployedServicePackages(nodeName: string, appId: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<DeployedServicePackageCollection>;
        getDeployedServicePackage(nodeName: string, appId: string, servicePackageName: string, servicePackageActivationId: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<DeployedServicePackage>;
        getDeployedCodePackages(nodeName: string, appId: string, servicePackageName: string, servicePackageActivationId: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<DeployedCodePackageCollection>;
        getDeployedCodePackage(nodeName: string, appId: string, servicePackageName: string, servicePackageActivationId: string, codePackageName: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<DeployedCodePackage>;
        getDeployedReplicas(nodeName: string, appId: string, servicePackageName: string, servicePackageActivationId: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<DeployedReplicaCollection>;
        getDeployedReplica(nodeName: string, appId: string, servicePackageName: string, servicePackageActivationId: string, partitionId: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<DeployedReplica>;
        createClusterEventList(): ClusterEventList;
        createNodeEventList(nodeName?: string): NodeEventList;
        createApplicationEventList(applicationId?: string): ApplicationEventList;
        createServiceEventList(serviceId?: string): ServiceEventList;
        createPartitionEventList(partitionId?: string): PartitionEventList;
        createReplicaEventList(partitionId: string, replicaId?: string): ReplicaEventList;
        createCorrelatedEventList(eventInstanceId: string): CorrelatedEventList;
        private tryGetValidItem;
        private preprocessHealthChunkData;
    }
}
declare module Sfx {
    class MessageService implements IMessageReceiver {
        private messageReceiver;
        registerMessageReceiver(messageReceiver: IMessageReceiver): MessageService;
        showMessage(message: string, severity: MessageSeverity, durationMs?: number): void;
    }
    class MessageController implements IMessageReceiver {
        private $interval;
        messages: IMessage[];
        constructor(message: MessageService, $interval: angular.IIntervalService);
        showMessage(message: string, severity: MessageSeverity, durationMs?: number): void;
        removeMsg(message: string): void;
    }
    interface IMessageReceiver {
        showMessage(message: string, severity: MessageSeverity, durationMs?: number): any;
    }
    enum MessageSeverity {
        Info = 0,
        Warn = 1,
        Err = 2
    }
    interface IMessage {
        message: string;
        severity: MessageSeverity;
        removeTimeout: angular.IPromise<any>;
    }
}
declare module Sfx {
    class StorageService extends Observable {
        getValueNumber(key: string, defaultValue: number): number;
        getValueString(key: string, defaultValue: string): string;
        getValueBoolean(key: string, defaultValue: boolean): boolean;
        getValueT<T>(key: string, convert: (item: any) => T, defaultValue: T): T;
        clear(key: string): void;
        isDefined(key: string): boolean;
        setValue(key: string, newValue: any): void;
    }
}
declare module Sfx {
    class RoutesService {
        private $interval;
        private $location;
        private _forceSingleEncode;
        constructor($interval: angular.IIntervalService, $location: angular.ILocationService);
        navigate(pathGetter: () => string): void;
        getTabViewPath(baseViewPath: string, tabId: string): string;
        getClusterViewPath(): string;
        getNodesViewPath(): string;
        getSystemAppsViewPath(): string;
        getAppsViewPath(): string;
        getAppTypesViewPath(): string;
        getNodeViewPath(nodeName: string): string;
        getNetworksViewPath(): string;
        getNetworkViewPath(networkName: string): string;
        getDeployedAppViewPath(nodeName: string, appId: string): string;
        getDeployedServiceViewPath(nodeName: string, appId: string, serviceId: string, activationId: string): string;
        getDeployedReplicasViewPath(nodeName: string, appId: string, serviceId: string, activationId: string): string;
        getDeployedCodePackagesViewPath(nodeName: string, appId: string, serviceId: string, activationId: string): string;
        getDeployedReplicaViewPath(nodeName: string, appId: string, serviceId: string, activationId: string, partitionId: string, replicaId: string): string;
        getCodePackageViewPath(nodeName: string, appId: string, serviceId: string, activationId: string, codePackageName: string): string;
        getAppTypeViewPath(appTypeName: string): string;
        getAppViewPath(appTypeName: string, appId: string): string;
        getServiceViewPath(appTypeName: string, appId: string, serviceId: string): string;
        getPartitionViewPath(appTypeName: string, appId: string, serviceId: string, partitionId: string): string;
        getReplicaViewPath(appTypeName: string, appId: string, serviceId: string, partitionId: string, replicaId: string): string;
        doubleEncode(str: string): string;
        private forceSingleEncode;
    }
}
declare module Sfx {
    class ClusterTreeService {
        private $q;
        private data;
        private routes;
        private settings;
        tree: TreeViewModel;
        private clusterHealth;
        private cm;
        private cachedTreeSelection;
        constructor($q: angular.IQService, data: DataService, routes: RoutesService, settings: SettingsService);
        init(): void;
        selectTreeNode(path: string[], skipSelectAction?: boolean): ng.IPromise<any>;
        setFirstVisit(): boolean;
        refresh(): angular.IPromise<any>;
        private getRootNode;
        private getGroupNodes;
        private getNodes;
        private getNetworks;
        private getApplicationTypes;
        private getDeployedApplications;
        private getDeployedServicePackages;
        private getDeployedServiceChildrenGroupNodes;
        private getDeployedCodePackages;
        private getDeployedReplicas;
        private getApplicationsForType;
        private getServices;
        private getPartitions;
        private getReplicas;
    }
}
declare module Sfx {
    interface ITelemetryService {
        isEnabled: boolean;
        trackPageView(): void;
        trackActionEvent(name: string, source: string, result: any): void;
        trackEvent(message: string): void;
    }
    class TelemetryService implements ITelemetryService {
        private $window;
        private $interval;
        private $location;
        private $route;
        private storage;
        static TelemetryEnabledHostsRegex: RegExp;
        private static DelayUpdateTimeInSeconds;
        isEnabled: boolean;
        private appInsights;
        private delayedUpdates;
        constructor($window: any, $interval: angular.IIntervalService, $location: angular.ILocationService, $route: angular.route.IRouteService, storage: StorageService);
        trackPageView(): void;
        trackActionEvent(name: string, source: string, result: any): void;
        trackEvent(message: string): void;
        private initialize;
        private shouldEnableTelemetry;
        private trackPropertyChangedEvent;
        private storageValueChanged;
        private noThrowWrapper;
    }
    class PropertyUpdatePromise {
        oldValue: any;
        newValue: any;
        promise: ng.IPromise<any>;
        constructor(oldValue: any, newValue: any, promise: ng.IPromise<any>);
    }
    class PageViewProperties {
        IsSecure: boolean;
        IsLocal: boolean;
        TabName: string;
    }
    class PageViewRecord {
        url: string;
        properites: PageViewProperties;
        constructor(location: ng.ILocationService, currentRoute: any);
    }
}
declare module Sfx {
    class ThemeService extends Observable {
        private storage;
        private currentThemeName;
        constructor(storage: StorageService);
        getActiveThemeName(): string;
        changeToTheme(name: string, saveAsUserPreference?: boolean): void;
        resolveAndChangeToTheme(themeSrc: string, themeName: string): void;
        private resolveVsTheme;
        private resolveAzureTheme;
    }
}
declare module Sfx {
    class SettingsService {
        private $location;
        private storage;
        private listSettings;
        private _paginationLimit;
        private _metricsViewModel;
        paginationLimit: number;
        constructor($location: angular.ILocationService, storage: StorageService);
        getNewOrExistingMetricsViewModel(clusterLoadInformation: ClusterLoadInformation, nodesLoadInformation: NodeLoadInformation[]): IMetricsViewModel;
        getNewOrExistingListSettings(listName: string, defaultSortProperties?: string[], columnSettings?: ListColumnSetting[], secondRowColumnSettings?: ListColumnSetting[], secondRowCollapsible?: boolean, showSecondRow?: (item: any) => boolean, searchable?: boolean): ListSettings;
        getNewOrExistingTreeNodeListSettings(listKey: string, defaultSortProperties?: string[], columnSettings?: ListColumnSetting[]): ListSettings;
        getNewOrExistingUnhealthyEvaluationsListSettings(listKey?: string): ListSettings;
        getNewOrExistingHealthEventsListSettings(listKey?: string): ListSettings;
        getNewOrExistingNodeStatusListSetting(listKey?: string): ListSettings;
        getNewOrExistingBackupPolicyListSettings(listKey?: string): ListSettings;
        private updatePaginationLimit;
    }
}
declare module Sfx {
    interface ISliderController {
        min: number;
        max: number;
        step: number;
        default: number;
        slide: (value: number) => void;
    }
    class SliderDirective implements ng.IDirective {
        restrict: string;
        require: string;
        link($scope: any, element: JQuery, attributes: any, ctrl: ISliderController): void;
    }
    class RefreshSliderController implements ISliderController {
        private storageService;
        private $rootScope;
        private static Stops;
        min: number;
        max: number;
        step: number;
        default: number;
        refreshRate: number;
        constructor(storageService: StorageService, $rootScope: angular.IRootScopeService);
        slide(value: number): void;
    }
}
declare module Sfx {
    interface ISplitterController {
        left: string;
        right: string;
        offset: number;
        SplitterLeftWidth: number;
    }
    class SplitterDirective implements ng.IDirective {
        restrict: string;
        require: string;
        link($scope: any, element: JQuery, attributes: ng.IAttributes, ctrl: ISplitterController): void;
    }
    class SplitterController implements ISplitterController {
        private storageService;
        left: string;
        right: string;
        offset: number;
        constructor(storageService: StorageService);
        SplitterLeftWidth: number;
    }
}
declare module Sfx {
    class DetailViewPartDirective implements ng.IDirective {
        restrict: string;
        replace: boolean;
        controller: typeof DetailViewPartController;
        controllerAs: string;
        templateUrl: string;
        scope: {
            data: string;
            title: string;
        };
        link($scope: any, element: JQuery, attributes: any, ctrl: DetailViewPartController): void;
    }
    class ResolvedObject {
        [index: string]: any;
    }
    class DetailViewPartController {
        getResolvedObjectSize(object: any): number;
        getResolvedPropertyType(value: any): string;
        getResolvedDataObject(data: any, preserveEmptyProperties?: boolean): any;
        private isResolvedObject;
        private isArray;
        private isHtml;
        private getResolvedDataObjectInternal;
    }
}
declare module Sfx {
    class DetailListDirective implements ng.IDirective {
        restrict: string;
        replace: boolean;
        controller: typeof DetailListController;
        controllerAs: string;
        templateUrl: string;
        scope: {
            list: string;
            listSettings: string;
            innerScroll: string;
            searchText: string;
        };
        transclude: boolean;
        link($scope: any, element: JQuery, attributes: any, ctrl: DetailListController): void;
    }
    class DetailListController {
        private $filter;
        $scope: any;
        static $inject: string[];
        constructor($filter: angular.IFilterService, $scope: any);
        updateList(): void;
        handleClickRow(item: any, event: any): void;
        private getSortedFilteredList;
        private filterOnColumns;
    }
}
declare module Sfx {
    class MetricsBarChartDirective implements ng.IDirective {
        $compile: angular.ICompileService;
        restrict: string;
        static factory(): ng.IDirectiveFactory;
        constructor($compile: angular.ICompileService);
        link: ng.IDirectiveLinkFn;
    }
    class NodeTypeMetricCapacity {
        nodeTypeName: string;
        metricName: string;
        capacity: number;
        nodeLoadMetrics: NodeLoadMetricInformation[];
        readonly firstNodeName: string;
        readonly lastNodeName: string;
        readonly isCapacityViolation: boolean;
        constructor(nodeTypeName: string, metricName: string, capacity: number);
    }
}
declare module Sfx {
    interface IDashboardChartViewModel extends angular.IScope {
        data: IDashboardViewModel;
    }
    class DashboardChartDirective implements ng.IDirective {
        restrict: string;
        replace: boolean;
        templateUrl: string;
        scope: {
            data: string;
        };
        static factory(): ng.IDirectiveFactory;
        link: ng.IDirectiveLinkFn;
    }
}
declare module Sfx {
}
declare module Sfx {
}
declare module Sfx {
    interface ITab {
        name: string;
        refresh?: (messageHandler?: IResponseMessageHandler) => angular.IPromise<any>;
        superscriptClass?: string;
        superscriptInHtml?: () => string;
    }
    interface ITabs {
        [id: string]: ITab;
    }
    interface IControllerBase {
        refresh(messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
    }
    class ControllerBase implements IControllerBase {
        protected $injector: angular.auto.IInjectorService;
        routes: RoutesService;
        message: MessageService;
        telemetry: TelemetryService;
        authSvc: AuthenticationService;
        settings: SettingsService;
        data: DataService;
        storage: StorageService;
        $location: angular.ILocationService;
        $q: angular.IQService;
        $route: ng.route.IRouteService;
        constructor($injector: angular.auto.IInjectorService);
        readonly routeParams: any;
        refresh(messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
    }
    class ControllerWithResolver extends ControllerBase {
        valueResolver: ValueResolver;
        constructor($injector: angular.auto.IInjectorService);
    }
    class TabController extends ControllerWithResolver {
        tabs: ITabs;
        private static LastVisitedTabId;
        private static LastVisitedTemplateUrl;
        activeTabId: string;
        basePath: string;
        private refreshingPromise;
        readonly hasTabs: boolean;
        private readonly firstTabId;
        constructor($injector: angular.auto.IInjectorService, tabs?: ITabs);
        navigateToTab(tabId: string): void;
        isActiveTab(tabId: string): boolean;
        refresh(messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
        protected refreshCommon(messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
        private setActiveTab;
        private getBasePath;
        private getTabViewPath;
    }
    class MainViewController extends TabController {
        private clusterTree;
        constructor($injector: angular.auto.IInjectorService, tabs?: ITabs);
        protected selectTreeNode(path: string[]): angular.IPromise<any>;
        private switchThemeIfDetected;
    }
}
declare module Sfx {
    interface IRootScopeServiceWithUserInfo extends angular.IRootScopeService {
        userInfo: IUserInfo;
    }
    class AuthenticationController extends ControllerWithResolver {
        private $rootScope;
        constructor($injector: angular.auto.IInjectorService, $rootScope: IRootScopeServiceWithUserInfo);
        readonly isApplicationBootstrapped: boolean;
        readonly isAadAuthenticated: boolean;
        readonly isStandalone: boolean;
        readonly userName: string;
        readonly brandTitle: string;
        logOut(): void;
    }
}
declare module Sfx {
    class SettingsController extends ControllerWithResolver {
        advancedModeState: boolean;
        constructor($injector: angular.auto.IInjectorService);
        setPaginationLimit(limit: number): void;
        setAdvancedMode(): void;
    }
}
declare module Sfx {
    class ThemeController extends ControllerWithResolver {
        private themeSvc;
        constructor($injector: angular.auto.IInjectorService, themeSvc: ThemeService);
        getActiveThemeName(): string;
        changeToTheme(name: string): void;
    }
}
declare module Sfx {
    interface IActionScope extends angular.IScope {
        action: Action;
        ok: () => void;
        cancel: () => void;
    }
    class ActionController {
        static $inject: string[];
        constructor($scope: IActionScope, $uibModalInstance: angular.ui.bootstrap.IModalServiceInstance, action: Action);
    }
}
declare module Sfx {
    class TreeViewController extends ControllerWithResolver {
        private treeService;
        private readonly tree;
        constructor($injector: angular.auto.IInjectorService);
        enterBeta(): void;
    }
}
declare module Sfx {
    interface IAppTypeViewScope extends angular.IScope {
        appTypeGroup: ApplicationTypeGroup;
        appsListSettings: ListSettings;
        appTypesListSettings: ListSettings;
    }
    class AppTypeViewController extends MainViewController {
        $scope: IAppTypeViewScope;
        appTypeName: string;
        constructor($injector: angular.auto.IInjectorService, $scope: IAppTypeViewScope);
        protected refreshCommon(messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
        private refreshEssentials;
        private refreshDetails;
    }
}
declare module Sfx {
    interface IAppViewScope extends angular.IScope {
        app: Application;
        upgradeProgress: ApplicationUpgradeProgress;
        listSettings: ListSettings;
        healthEventsListSettings: ListSettings;
        unhealthyEvaluationsListSettings: ListSettings;
        applicationBackupConfigurationInfoListSettings: ListSettings;
        upgradeProgressUnhealthyEvaluationsListSettings: ListSettings;
        deployedApplicationsHealthStatesListSettings: ListSettings;
        serviceTypesListSettings: ListSettings;
        deployedApplicationsHealthStates: DeployedApplicationHealthState[];
        appEvents: ApplicationEventList;
        networks: NetworkOnAppCollection;
        networkListSettings: ListSettings;
        clusterManifest: ClusterManifest;
        timelineGenerator: ApplicationTimelineGenerator;
    }
    class AppViewController extends MainViewController {
        $scope: IAppViewScope;
        appId: string;
        appTypeName: string;
        constructor($injector: angular.auto.IInjectorService, $scope: IAppViewScope);
        protected refreshCommon(messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
        private refreshEssentials;
        private refreshManifest;
        private refreshEvents;
    }
}
declare module Sfx {
    interface IClusterViewScope extends angular.IScope {
        clusterAddress: string;
        nodesDashboard: IDashboardViewModel;
        appsDashboard: IDashboardViewModel;
        servicesDashboard: IDashboardViewModel;
        partitionsDashboard: IDashboardViewModel;
        replicasDashboard: IDashboardViewModel;
        upgradesDashboard: IDashboardViewModel;
        nodes: NodeCollection;
        nodesStatuses: INodesStatusDetails[];
        nodeStatusListSettings: ListSettings;
        systemApp: SystemApplication;
        clusterHealth: ClusterHealth;
        clusterManifest: ClusterManifest;
        imageStore: ImageStore;
        clusterUpgradeProgress: ClusterUpgradeProgress;
        clusterLoadInformation: ClusterLoadInformation;
        healthEventsListSettings: ListSettings;
        unhealthyEvaluationsListSettings: ListSettings;
        upgradeProgressUnhealthyEvaluationsListSettings: ListSettings;
        backupPolicyListSettings: ListSettings;
        metricsViewModel: IMetricsViewModel;
        upgradeAppsCount: number;
        appsUpgradeTabViewPath: string;
        backupPolicies: BackupPolicyCollection;
        actions: ActionCollection;
        settings: SettingsService;
        clusterEvents: ClusterEventList;
        clusterTimelineGenerator: ClusterTimelineGenerator;
    }
    class ClusterViewController extends MainViewController {
        $scope: IClusterViewScope;
        constructor($injector: angular.auto.IInjectorService, $scope: IClusterViewScope);
        getNodesForDomains(upgradeDomain: string, faultDomain: string): Node[];
        private refreshEssentials;
        private refreshClusterMap;
        private refreshDetails;
        private refreshMetrics;
        private refreshManifest;
        private refreshEvents;
        private refreshImageStore;
        private refreshBackupPolicies;
        private setupActions;
    }
    class ActionCreateBackupPolicy extends ActionWithDialog {
        backupPolicy: IRawBackupPolicy;
        date: string;
        retentionPolicyRequired: boolean;
        RetentionPolicy: IRawRetentionPolicy;
        weekDay: string[];
        daySelectedMapping: Map<string, Boolean>;
        constructor(data: DataService);
        add(): void;
        deleteDate(index: number): void;
        private createBackupPolicy;
    }
    class ActionUpdateBackupPolicy extends ActionWithDialog {
        backupPolicy: IRawBackupPolicy;
        date: string;
        retentionPolicyRequired: boolean;
        RetentionPolicy: IRawRetentionPolicy;
        weekDay: string[];
        daySelectedMapping: Map<string, Boolean>;
        delete: any;
        constructor(data: DataService, raw: IRawBackupPolicy);
        add(): void;
        deleteDate(index: number): void;
        private updateBackupPolicy;
    }
}
declare module Sfx {
    interface IDeployedAppViewScope extends angular.IScope {
        deployedApp: DeployedApplication;
        deployedServicePackages: DeployedServicePackageCollection;
        listSettings: ListSettings;
        healthEventsListSettings: ListSettings;
        unhealthyEvaluationsListSettings: ListSettings;
    }
    class DeployedAppViewController extends MainViewController {
        $scope: IDeployedAppViewScope;
        appId: string;
        nodeName: string;
        constructor($injector: angular.auto.IInjectorService, $scope: IDeployedAppViewScope);
        protected refreshCommon(messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
        private refreshEssentials;
    }
}
declare module Sfx {
    interface IDeployedCodePackageViewScope extends angular.IScope {
        deployedCodePackage: DeployedCodePackage;
        containerLogs: string;
    }
    class DeployedCodePackageViewController extends MainViewController {
        $scope: IDeployedCodePackageViewScope;
        nodeName: string;
        appId: string;
        serviceId: string;
        activationId: string;
        codePackageName: string;
        constructor($injector: angular.auto.IInjectorService, $scope: IDeployedCodePackageViewScope);
        protected refreshCommon(messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
        private refreshContainerLogs;
    }
}
declare module Sfx {
    interface IDeployedReplicaViewScope extends angular.IScope {
        replica: DeployedReplica;
        appView: string;
    }
    class DeployedReplicaViewController extends MainViewController {
        $scope: IDeployedReplicaViewScope;
        replicaStatus: number;
        nodeName: string;
        applicationId: string;
        partitionId: string;
        serviceId: string;
        activationId: string;
        constructor($injector: angular.auto.IInjectorService, $scope: IDeployedReplicaViewScope);
        protected refreshCommon(messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
        private refreshDetails;
    }
}
declare module Sfx {
    interface IDeployedServiceViewScope extends angular.IScope {
        servicePackage: DeployedServicePackage;
        serviceManifest: string;
        healthEventsListSettings: ListSettings;
        unhealthyEvaluationsListSettings: ListSettings;
    }
    class DeployedServiceViewController extends MainViewController {
        $scope: IDeployedServiceViewScope;
        serviceId: string;
        activationId: string;
        appId: string;
        nodeName: string;
        constructor($injector: angular.auto.IInjectorService, $scope: IDeployedServiceViewScope);
        protected refreshCommon(messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
        private refreshManifest;
    }
}
declare module Sfx {
    interface IDeployedServiceReplicasViewScope extends angular.IScope {
        replicas: DeployedReplicaCollection;
        listSettings: ListSettings;
    }
    class DeployedServiceReplicasViewController extends MainViewController {
        $scope: IDeployedServiceReplicasViewScope;
        nodeName: string;
        appId: string;
        serviceId: string;
        activationId: string;
        constructor($injector: angular.auto.IInjectorService, $scope: IDeployedServiceReplicasViewScope);
        protected refreshCommon(messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
    }
}
declare module Sfx {
    interface IDeployedServiceCodePackagesViewScope extends angular.IScope {
        codePackages: DeployedCodePackageCollection;
        listSettings: ListSettings;
    }
    class DeployedServiceCodePackagesViewController extends MainViewController {
        $scope: IDeployedServiceCodePackagesViewScope;
        nodeName: string;
        appId: string;
        serviceId: string;
        activationId: string;
        constructor($injector: angular.auto.IInjectorService, $scope: IDeployedServiceCodePackagesViewScope);
        protected refreshCommon(messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
    }
}
declare module Sfx {
    class NavbarController {
        private refreshSvc;
        private routes;
        private $window;
        constructor(refreshSvc: RefreshService, routes: RoutesService, $window: angular.IWindowService);
        readonly isRefreshing: boolean;
        refreshAll(): void;
        navigateToCluster(): void;
    }
}
declare module Sfx {
    interface INodesViewScope extends angular.IScope {
        nodes: NodeCollection;
        listSettings: ListSettings;
        nodeEvents: NodeEventList;
        nodeEventTimelineGenerator: NodeTimelineGenerator;
    }
    class NodesViewController extends MainViewController {
        $scope: INodesViewScope;
        constructor($injector: angular.auto.IInjectorService, $scope: INodesViewScope);
        protected refreshCommon(messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
        private refreshEvents;
    }
}
declare module Sfx {
    enum NodeStatus {
        Invalid = 0,
        Up = 1,
        Down = 2,
        Enabling = 3,
        Disabling = 4,
        Disabled = 5
    }
    interface INodeViewScope extends angular.IScope {
        node: Node;
        deployedApps: DeployedApplicationCollection;
        listSettings: ListSettings;
        healthEventsListSettings: ListSettings;
        unhealthyEvaluationsListSettings: ListSettings;
        nodeEvents: NodeEventList;
        nodeEventTimelineGenerator: NodeTimelineGenerator;
        networks: NetworkOnNodeCollection;
        networkListSettings: ListSettings;
        clusterManifest: ClusterManifest;
    }
    class NodeViewController extends MainViewController {
        $scope: INodeViewScope;
        nodeName: string;
        constructor($injector: angular.auto.IInjectorService, $scope: INodeViewScope);
        protected refreshCommon(messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
        private refreshDetails;
        private refreshEssentials;
        private refreshEvents;
    }
}
declare module Sfx {
    interface IPartitionViewScope extends angular.IScope {
        partition: Partition;
        listSettings: ListSettings;
        healthEventsListSettings: ListSettings;
        unhealthyEvaluationsListSettings: ListSettings;
        partitionBackupListSettings: ListSettings;
        partitionEvents: PartitionEventList;
        partitionTimeLineGenerator: PartitionTimelineGenerator;
    }
    class PartitionViewController extends MainViewController {
        private $scope;
        appId: string;
        serviceId: string;
        partitionId: string;
        appTypeName: string;
        constructor($injector: angular.auto.IInjectorService, $scope: IPartitionViewScope);
        protected refreshCommon(messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
        private refreshDetails;
        private refreshEssentials;
        private refreshEvents;
        private refreshBackups;
    }
}
declare module Sfx {
    interface IReplicaViewScope extends angular.IScope {
        replica: ReplicaOnPartition;
        healthEventsListSettings: ListSettings;
        unhealthyEvaluationsListSettings: ListSettings;
        replicaEvents: ReplicaEventList;
        nodeView: string;
    }
    class ReplicaViewController extends MainViewController {
        private $scope;
        appId: string;
        serviceId: string;
        partitionId: string;
        replicaId: string;
        appTypeName: string;
        isSystem: boolean;
        constructor($injector: angular.auto.IInjectorService, $scope: IReplicaViewScope);
        protected refreshCommon(messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
        private refreshDetails;
        private refreshEvents;
    }
}
declare module Sfx {
    interface IServiceViewScope extends angular.IScope {
        service: Service;
        serviceManifest: string;
        listSettings: ListSettings;
        healthEventsListSettings: ListSettings;
        unhealthyEvaluationsListSettings: ListSettings;
        serviceEvents: ServiceEventList;
        serviceBackupConfigurationInfoListSettings: ListSettings;
    }
    class ServiceViewController extends MainViewController {
        $scope: IServiceViewScope;
        appTypeName: string;
        appId: string;
        serviceId: string;
        constructor($injector: angular.auto.IInjectorService, $scope: IServiceViewScope);
        protected refreshCommon(messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
        private refreshEssentials;
        private refreshManifest;
        private refreshEvents;
    }
}
declare module Sfx {
    interface IAppsViewScope extends angular.IScope {
        apps: ApplicationCollection;
        actions: ActionCollection;
        listSettings: ListSettings;
        upgradeAppsListSettings: ListSettings;
        upgradeProgresses: ApplicationUpgradeProgress[];
        appEvents: ApplicationEventList;
    }
    class AppsViewController extends MainViewController {
        $scope: IAppsViewScope;
        constructor($injector: angular.auto.IInjectorService, $scope: IAppsViewScope);
        protected refreshCommon(messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
        private refreshUpgradesTab;
        private setupActions;
        private refreshEvents;
    }
    class ActionCreateComposeApplication extends ActionWithDialog {
        applicationName: string;
        composeFileContent: string;
        hasRepositoryCredential: boolean;
        repositoryUserName: string;
        repositoryPassword: string;
        passwordEncrypted: boolean;
        composeFileName: string;
        loadComposeFile($event: ng.IAngularEvent): void;
        constructor(data: DataService);
        private reset;
        private createComposeDeploymentDescription;
    }
}
declare module Sfx {
    interface ISystemAppsViewScope extends angular.IScope {
        systemApp: SystemApplication;
        listSettings: ListSettings;
        healthEventsListSettings: ListSettings;
        unhealthyEvaluationsListSettings: ListSettings;
    }
    class SystemAppsViewController extends MainViewController {
        private $scope;
        constructor($injector: angular.auto.IInjectorService, $scope: ISystemAppsViewScope);
        protected refreshCommon(messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
        private refreshEssentials;
    }
}
declare module Sfx {
    class ImageStoreViewController {
        private $scope;
        private $timeout;
        private settings;
        static $inject: string[];
        constructor($scope: any, $timeout: any, settings: SettingsService);
        openFolder(relativePath: string): void;
    }
    class ImageStoreFileViewController {
        private $scope;
        private data;
        static $inject: string[];
        constructor($scope: any, data: DataService);
        deleteSelected(itemPath: string): void;
        deleteCanceled(): void;
        deleteConfirmed(): void;
    }
}
declare module Sfx {
}
declare module Sfx {
    class HeaderAlertController {
        private data;
        private $scope;
        static $inject: string[];
        clusterUpgradeProgress: ClusterUpgradeProgress;
        constructor(data: DataService, $scope: any);
        getUpgradeDomainProgress(): string;
    }
}
declare module Sfx {
    interface INetworkViewScope extends angular.IScope {
        network: Network;
        listSettings: ListSettings;
        apps: AppOnNetworkCollection;
        appListSettings: ListSettings;
        nodes: NodeOnNetworkCollection;
        nodeListSettings: ListSettings;
        containers: DeployedContainerOnNetworkCollection;
        containerListSettings: ListSettings;
    }
    class NetworkViewController extends MainViewController {
        $scope: INetworkViewScope;
        networkName: string;
        constructor($injector: angular.auto.IInjectorService, $scope: INetworkViewScope);
        protected refreshCommon(messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
        private refreshEssentials;
    }
}
declare module Sfx {
    interface INetworksViewScope extends angular.IScope {
        networks: NetworkCollection;
        listSettings: ListSettings;
        actions: ActionCollection;
    }
    class NetworksViewController extends MainViewController {
        $scope: INetworksViewScope;
        constructor($injector: angular.auto.IInjectorService, $scope: INetworksViewScope);
        protected refreshCommon(messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
        private addActions;
    }
    class ActionCreateIsolatedNetwork extends ActionWithDialog {
        networkName: string;
        networkAddressPrefix: string;
        constructor(data: DataService);
        private reset;
    }
}
declare module Sfx {
    class DatePickerDirective implements ng.IDirective {
        restrict: string;
        controller: typeof DatePickerController;
        controllerAs: string;
        templateUrl: string;
        scope: {
            ngModel: string;
            minDate: string;
            maxDate: string;
            initDate: string;
            readOnly: string;
            placeHolderText: string;
        };
        link($scope: any, element: JQuery, attributes: any): void;
    }
    class DatePickerController {
        private $scope;
        static $inject: string[];
        constructor($scope: any);
        popupClick(event: any): void;
        popupFocus(event: any): void;
    }
}
declare module Sfx {
    class DateTimePickerDirective implements ng.IDirective {
        restrict: string;
        controller: typeof DateTimePickerController;
        controllerAs: string;
        templateUrl: string;
        scope: {
            ngModel: string;
            minDate: string;
            maxDate: string;
            initDate: string;
            readOnly: string;
            placeHolderText: string;
        };
        link($scope: any, element: JQuery, attributes: any): void;
    }
    class DateTimePickerController {
        private $scope;
        static $inject: string[];
        constructor($scope: any);
        popupClick(event: any): void;
        popupFocus(event: any): void;
    }
}
declare module Sfx {
    class DetailListDetailsViewDirective implements ng.IDirective {
        restrict: string;
        templateUrl: string;
        scope: {
            detailsListSettings: string;
        };
        require: string;
        link($scope: any, element: JQuery, attributes: any, ctrl: DetailListController): void;
    }
}
declare module Sfx {
    class DoubleSliderDirective implements ng.IDirective {
        restrict: string;
        replace: boolean;
        templateUrl: string;
        scope: {
            startDate: string;
            endDate: string;
        };
        link($scope: any, element: JQuery, attributes: any): void;
    }
}
declare module Sfx {
    interface IEventsViewScope extends angular.IScope {
        eventsList: EventListBase<any>;
        timelineGenerator?: ITimelineDataGenerator<FabricEventBase>;
    }
    class EventsViewDirective implements ng.IDirective {
        restrict: string;
        templateUrl: string;
        scope: {
            eventsList: string;
            timelineGenerator: string;
        };
        link($scope: any, element: JQuery, attributes: any): void;
    }
}
declare module Sfx {
    class ImageStoreViewDirective implements ng.IDirective {
        restrict: string;
        replace: boolean;
        controller: typeof ImageStoreViewController;
        controllerAs: string;
        templateUrl: string;
        scope: {
            imagestoreroot: string;
        };
        link($scope: any, element: JQuery, attributes: any, ctrl: ImageStoreViewController): void;
    }
    class ImageStoreOptionsViewDirective implements ng.IDirective {
        restrict: string;
        controller: typeof ImageStoreFileViewController;
        controllerAs: string;
        templateUrl: string;
        scope: {
            item: string;
        };
    }
}
declare module Sfx {
    interface IEventsViewScope extends angular.IScope {
        dataService: DataService;
    }
    class StatusWarningsDirective implements ng.IDirective {
        restrict: string;
        templateUrl: string;
        controller: typeof StatusWarningController;
        controllerAs: string;
        scope: {
            dataService: string;
        };
        link($scope: any, element: JQuery, attributes: any): void;
    }
    class StatusWarningController {
        private $scope;
        private data;
        static $inject: string[];
        alerts: StatusWarningService;
        displayAll: boolean;
        constructor($scope: any, data: DataService);
        toggleViewed(): void;
        remove(alert: IStatusWarning, hidePermenantly?: boolean): void;
        removeWithConfirm(alert: IStatusWarning): void;
    }
}
declare module Sfx {
    interface ITextFileInputScope extends ng.IScope {
        loading: boolean;
        ngModel: string;
        accept: string;
        required: boolean;
    }
    class TextFileInputDirective implements ng.IDirective {
        restrict: string;
        templateUrl: string;
        scope: {
            ngModel: string;
        };
        link($scope: ITextFileInputScope, element: JQuery): void;
    }
}
declare module Sfx {
    class TimeLineChartDirective implements ng.IDirective {
        restrict: string;
        replace: boolean;
        controller: typeof TimeLineChartController;
        controllerAs: string;
        templateUrl: string;
        scope: {
            events: string;
        };
        transclude: boolean;
        link($scope: any, element: JQuery, attributes: any, ctrl: TimeLineChartController): void;
    }
    class TimeLineChartController {
        $scope: any;
        static $inject: string[];
        private _timeline;
        private _start;
        private _end;
        private _oldestEvent;
        private _mostRecentEvent;
        constructor($scope: any);
        fitData(): void;
        fitWindow(): void;
        moveStart(): void;
        moveEnd(): void;
        moveToOldestEvent(): void;
        moveToNewestEvent(): void;
        updateList(events: ITimelineData): void;
    }
}
declare module Sfx {
    class AppOnNetwork extends DataModelBase<IRawAppOnNetwork> {
        appDetail: Application;
        constructor(data: DataService, raw?: IRawAppOnNetwork);
        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
        readonly viewPath: string;
    }
}
declare module Sfx {
    class DeployedContainerOnNetwork extends DataModelBase<IRawDeployedContainerOnNetwork> {
        nodeName: string;
        constructor(data: DataService, nodeName: string, raw?: IRawDeployedContainerOnNetwork);
        readonly viewPath: string;
    }
}
declare module Sfx {
    class ImageStore extends DataModelBase<IRawImageStoreContent> {
        data: DataService;
        static reservedFileName: string;
        isAvailable: boolean;
        isNative: boolean;
        connectionString: string;
        root: ImageStoreFolder;
        cachedCurrentDirectoryFolderSizes: {
            [path: string]: {
                size: number;
                loading: boolean;
                date?: Date;
            };
        };
        currentFolder: ImageStoreFolder;
        pathBreadcrumbItems: IStorePathBreadcrumbItem[];
        private isLoadingFolderContent;
        private initialized;
        static slashDirection(path: string): boolean;
        static chopPath(path: string): string[];
        constructor(data: DataService);
        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawImageStoreContent>;
        protected updateInternal(): angular.IPromise<any> | void;
        protected expandFolder(path: string, clearCache?: boolean): angular.IPromise<IRawImageStoreContent>;
        deleteContent(path: string): angular.IPromise<any>;
        getCachedFolderSize(path: string): {
            size: number;
            loading: boolean;
        };
        getFolderSize(path: string): angular.IPromise<IRawStoreFolderSize>;
        private setCurrentFolder;
        private loadFolderContent;
    }
    class ImageStoreItem {
        isFolder: number;
        path: string;
        displayName: string;
        isReserved: boolean;
        displayedSize: string;
        size: number;
        uniqueId: string;
        constructor(path: string);
    }
    class ImageStoreFolder extends ImageStoreItem {
        isFolder: number;
        size: number;
        fileCount: number;
        isExpanded: boolean;
        childrenFolders: ImageStoreFolder[];
        childrenFiles: ImageStoreFile[];
        allChildren: ImageStoreItem[];
        constructor(raw?: IRawStoreFolder);
    }
    class ImageStoreFile extends ImageStoreItem {
        isFolder: number;
        version: string;
        modifiedDate: string;
        size: number;
        constructor(raw?: IRawStoreFile);
    }
    interface IStorePathBreadcrumbItem {
        path: string;
        name: string;
    }
}
declare module Sfx {
    class Network extends DataModelBase<IRawNetwork> {
        constructor(data: DataService, raw?: IRawNetwork);
        readonly name: string;
        readonly type: string;
        readonly addressPrefix: string;
        readonly status: string;
        readonly viewPath: string;
        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawNetwork>;
        private setUpActions;
        private delete;
    }
    class NetworkProperties extends DataModelBase<IRawNetworkProperties> {
        constructor(data: DataService, raw: IRawNetworkProperties);
    }
}
declare module Sfx {
    class NetworkOnApp extends DataModelBase<IRawNetworkOnApp> {
        networkDetail: Network;
        constructor(data: DataService, raw?: IRawNetworkOnApp);
        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
        readonly viewPath: string;
    }
}
declare module Sfx {
    class NetworkOnNode extends DataModelBase<IRawNetworkOnNode> {
        networkDetail: Network;
        constructor(data: DataService, raw?: IRawNetworkOnNode);
        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
        readonly viewPath: string;
    }
}
declare module Sfx {
    class NodeOnNetwork extends DataModelBase<IRawNodeOnNetwork> {
        nodeDetails: Node;
        constructor(data: DataService, raw?: IRawNodeOnNetwork);
        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
        readonly viewPath: string;
    }
}
declare module Sfx {
    class PartitionBackupInfo {
        parent: Partition;
        partitionBackupConfigurationInfo: PartitionBackupConfigurationInfo;
        partitionBackupList: PartitionBackupCollection;
        latestPartitionBackup: SinglePartitionBackupCollection;
        backupPolicyName: string;
        cleanBackup: boolean;
        storage: IRawStorage;
        backupId: string;
        backupLocation: string;
        partitionBackupProgress: PartitionBackupProgress;
        partitionRestoreProgress: PartitionRestoreProgress;
        BackupTimeout: number;
        RestoreTimeout: number;
        constructor(data: DataService, parent: Partition);
    }
    class PartitionBackupConfigurationInfo extends DataModelBase<IRawPartitionBackupConfigurationInfo> {
        parent: PartitionBackupInfo;
        decorators: IDecorators;
        constructor(data: DataService, parent: PartitionBackupInfo);
        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawPartitionBackupConfigurationInfo>;
    }
    class PartitionBackupProgress extends DataModelBase<IRawBackupProgressInfo> {
        parent: PartitionBackupInfo;
        constructor(data: DataService, parent: PartitionBackupInfo);
        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawBackupProgressInfo>;
    }
    class PartitionRestoreProgress extends DataModelBase<IRawRestoreProgressInfo> {
        parent: PartitionBackupInfo;
        constructor(data: DataService, parent: PartitionBackupInfo);
        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawRestoreProgressInfo>;
    }
    class PartitionBackup extends DataModelBase<IRawPartitionBackup> {
        parent: PartitionBackupInfo;
        decorators: IDecorators;
        action: ActionWithDialog;
        constructor(data: DataService, raw: IRawPartitionBackup, parent: PartitionBackupInfo);
    }
}
declare module Sfx {
    interface IStatusWarning {
        message: string;
        link?: string;
        linkText?: string;
        level: string;
        priority: number;
        id: string;
        confirmText?: string;
    }
    class StatusWarningService {
        notifications: IStatusWarning[];
        storage: StorageService;
        constructor(storage: StorageService);
        addNotification(notification: IStatusWarning): void;
        getIndex(notificationId: string): number;
        addOrUpdateNotification(notification: IStatusWarning): void;
        removeNotificationById(notificationId: string, hidePermanently?: boolean): void;
        private getStorageId;
    }
}
