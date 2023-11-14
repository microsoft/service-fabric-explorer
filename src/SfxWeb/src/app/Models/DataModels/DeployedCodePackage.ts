import { DataModelBase } from './Base';
import { IRawDeployedCodePackage, IRawCodePackageEntryPoint, IRawCodePackageEntryPointStatistics, IRawContainerLogs } from '../RawDataTypes';
import { IdGenerator } from 'src/app/Utils/IdGenerator';
import { DataService } from 'src/app/services/data.service';
import { DeployedServicePackage } from './DeployedServicePackage';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TimeUtils } from 'src/app/Utils/TimeUtils';
import { ActionWithConfirmationDialog } from '../Action';
import { RoutesService } from 'src/app/services/routes.service';

// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

export class DeployedCodePackage extends DataModelBase<IRawDeployedCodePackage> {
    public mainEntryPoint: CodePackageEntryPoint;
    public setupEntryPoint: CodePackageEntryPoint;
    public containerLogs: ContainerLogs;
    public containerLogsTail: string;

    public constructor(data: DataService, raw: IRawDeployedCodePackage, public parent: DeployedServicePackage) {
        super(data, raw, parent);

        this.containerLogsTail = '100';
        this.updateInternal();
        if (this.data.actionsEnabled()) {
            this.setUpActions();
        }
    }

    public get servicePackageActivationId(): string {
        return this.raw.ServicePackageActivationId;
    }

    public get uniqueId(): string {
        return IdGenerator.deployedCodePackage(this.name);
    }

    public get viewPath(): string {
        return RoutesService.getCodePackageViewPath(this.parent.parent.parent.name, this.parent.parent.id, this.parent.id, this.parent.servicePackageActivationId, this.name);
    }

    protected retrieveNewData(messageHandler?: IResponseMessageHandler): Observable<IRawDeployedCodePackage> {
        return this.data.restClient.getDeployedCodePackage(this.parent.parent.parent.name, this.parent.parent.id, this.parent.name, this.name, messageHandler)
            .pipe(map(response => {
                return response.find(raw => raw.ServicePackageActivationId === this.parent.servicePackageActivationId);
            }));
    }

    protected updateInternal(): Observable<any> | void {
        this.mainEntryPoint = new CodePackageEntryPoint(this.data, this.raw.MainEntryPoint, this);
        this.setupEntryPoint = new CodePackageEntryPoint(this.data, this.raw.SetupEntryPoint, this);
        this.containerLogs = new ContainerLogs(this.data, this);
    }

    private restart(): Observable<any> {
        return this.data.restClient.restartCodePackage(
            this.parent.parent.parent.name, this.parent.parent.id, this.raw.ServiceManifestName, this.name, this.raw.MainEntryPoint.InstanceId, this.servicePackageActivationId);
    }

    private setUpActions(): void {
        this.actions.add(new ActionWithConfirmationDialog(
            this.data.dialog,
            'restartCodePackage',
            'Restart',
            'Restarting',
            () => this.restart(),
            () => true,
            {
                title: 'Confirm Code Package Restart'
            },
            {
                inputs: {
                    message: `Restart code package ${this.name}?`,
                    confirmationKeyword: this.name
                }
            }
        ));
    }
}

export class CodePackageEntryPoint extends DataModelBase<IRawCodePackageEntryPoint> {
    public codePackageEntryPointStatistics: CodePackageEntryPointStatistics;

    public constructor(data: DataService, raw: IRawCodePackageEntryPoint, public parent: DeployedCodePackage) {
        super(data, raw, parent);

        this.codePackageEntryPointStatistics = new CodePackageEntryPointStatistics(data, this.raw.CodePackageEntryPointStatistics, this);
    }

    public get nextActivationTime(): string {
        return TimeUtils.timestampToUTCString(this.raw.NextActivationTime);
    }
}

export class CodePackageEntryPointStatistics extends DataModelBase<IRawCodePackageEntryPointStatistics> {
    public get lastActivationTime(): string {
        return TimeUtils.timestampToUTCString(this.raw.LastActivationTime);
    }

    public get lastExitTime(): string {
        return TimeUtils.timestampToUTCString(this.raw.LastExitTime);
    }

    public get lastSuccessfulActivationTime(): string {
        return TimeUtils.timestampToUTCString(this.raw.LastSuccessfulActivationTime);
    }

    public get lastSuccessfulExitTime(): string {
        return TimeUtils.timestampToUTCString(this.raw.LastSuccessfulExitTime);
    }

    public constructor(data: DataService, raw: IRawCodePackageEntryPointStatistics, public parent: CodePackageEntryPoint) {
        super(data, raw, parent);
    }
}

export class ContainerLogs extends DataModelBase<IRawContainerLogs> {

    public constructor(data: DataService, public parent: DeployedCodePackage) {
        super(data, null, parent);
    }

    protected retrieveNewData(messageHandler?: IResponseMessageHandler): Observable<IRawContainerLogs> {
        const deployedCodePackage = (this.parent) as DeployedCodePackage;
        return this.data.restClient.getDeployedContainerLogs(deployedCodePackage.parent.parent.parent.name, deployedCodePackage.parent.parent.id,
            deployedCodePackage.parent.name, deployedCodePackage.name, deployedCodePackage.servicePackageActivationId, deployedCodePackage.containerLogsTail, messageHandler);
    }
}


