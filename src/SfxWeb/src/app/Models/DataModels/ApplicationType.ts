import { DataModelBase } from './Base';
import { IRawApplicationType } from '../RawDataTypes';
import { ServiceTypeCollection, ApplicationCollection } from './collections/Collections';
import { DataService } from 'src/app/services/data.service';
import { HealthStateConstants, Constants } from 'src/app/Common/Constants';
import { CollectionUtils } from 'src/app/Utils/CollectionUtils';
import { Observable, forkJoin} from 'rxjs';
import { Application } from './Application';
import { ITextAndBadge, ValueResolver } from 'src/app/Utils/ValueResolver';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { map, mergeMap } from 'rxjs/operators';
import { Utils } from 'src/app/Utils/Utils';
import { ActionWithConfirmationDialog, IsolatedAction } from '../Action';
import { CreateApplicationComponent } from 'src/app/views/application-type/create-application/create-application.component';
import { RoutesService } from 'src/app/services/routes.service';

// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

export class ApplicationType extends DataModelBase<IRawApplicationType> {
    /*IsInUse is only set on the AppType on the appType Essential page*/
    public isInUse: boolean = null;
    public serviceTypes: ServiceTypeCollection;

    public constructor(data: DataService, raw?: IRawApplicationType) {
        super(data, raw);
        this.serviceTypes = new ServiceTypeCollection(this.data, this);

        if (this.data.actionsEnabled()) {
            this.setUpActions();
        }
    }

    public get id(): string {
        return this.raw.Name + ' ' + this.raw.Version;
    }

    public get viewPath(): string {
        return RoutesService.getAppTypeViewPath(this.name);
    }

    public unprovision(): Observable<any> {
        return this.data.restClient.unprovisionApplicationType(this.name, this.raw.Version);
    }

    public createInstance(newInstanceUri: string): Observable<any> {
        return this.data.restClient.provisionApplication(newInstanceUri, this.raw.Name, this.raw.Version);
    }

    private setUpActions() {

        this.actions.add(new ActionWithConfirmationDialog(
            this.data.dialog,
            'unprovisionAppType',
            'Unprovision',
            'Unprovisioning',
            () => this.unprovision(),
            () => true,
            'Confirm Type Unprovision',
            `Unprovision application type ${this.name}@${this.raw.Version} from cluster ${window.location.host}?`,
            `${this.name}@${this.raw.Version}`
        ));

        this.actions.add(new IsolatedAction(
            this.data.dialog,
            'createAppInstance',
            'Create',
            'Creating',
            {
                appType: this,
            },
            CreateApplicationComponent,
            () => true)
            );
    }
}

// ApplicationTypes are organized in group indexed by type name.
// In each group, there are different versions of the application types.
export class ApplicationTypeGroup extends DataModelBase<IRawApplicationType> {
    public apps: Application[] = [];
    public appTypes: ApplicationType[] = [];
    public activeAppTypes: ApplicationType[] = [];
    public inactiveAppTypes: ApplicationType[] = [];
    public appsHealthState: ITextAndBadge = ValueResolver.healthStatuses[4];

    public constructor(data: DataService, appTypes: ApplicationType[]) {
        super(data, appTypes[0].raw);
        this.appTypes = appTypes;

        if (this.data.actionsEnabled()) {
            this.setUpActions();
        }
    }

    public get viewPath(): string {
        return RoutesService.getAppTypeViewPath(this.name);
    }

    // Whenever the data.apps get refreshed, it will call this method to
    // update all applications for all application type group to keep the
    // applications in sync.
    public refreshAppTypeApps(apps: ApplicationCollection): void {
      this.apps = apps.collection.filter(app => app.raw.TypeName === this.name);

      if (this.apps.length > 0) {
        this.appsHealthState = this.valueResolver.resolveHealthStatus(Utils.max(this.apps.map(app => HealthStateConstants.Values[app.healthState.text])).toString());
      } else {
        // When there are no apps in this apptype, treat it as healthy
        this.appsHealthState = ValueResolver.healthStatuses[1];
      }

      this.activeAppTypes = [];
      this.inactiveAppTypes = [];
      this.appTypes.forEach(appType => {
        const used = this.apps.some(app => app.raw.TypeVersion === appType.raw.Version);
        appType.isInUse = used;
        if(used) {
          this.activeAppTypes.push(appType);
        }
        else{
            this.inactiveAppTypes.push(appType);
        }
      });
    }

    protected retrieveNewData(messageHandler?: IResponseMessageHandler): Observable<IRawApplicationType> {
        return this.data.restClient.getApplicationTypes(this.name, messageHandler).pipe(map(response => {
            this.appTypes = CollectionUtils.updateDataModelCollection(this.appTypes, response.map( rawAppType => new ApplicationType(this.data, rawAppType)));
            return response[0];
            }));
    }


    private setUpActions() {
        // TODO
        this.actions.add(new ActionWithConfirmationDialog(
            this.data.dialog,
            'unprovisionType',
            'Unprovision Type',
            'Unprovisioning',
            () => this.unprovision(),
            () => true,
            'Confirm Type Unprovision',
            `Unprovision all versions of application type ${this.name} from cluster ${window.location.host}?`,
            this.name
        ));
    }

    private unprovision(): Observable<any> {
        return this.data.getAppTypeGroup(this.name, true).pipe(mergeMap(appTypeGroup => {
            const unprovisonPromises = [];
            appTypeGroup.appTypes.forEach(applicationType => {
                unprovisonPromises.push(applicationType.unprovision());
            });
            return forkJoin(unprovisonPromises);
        }));
    }
}
