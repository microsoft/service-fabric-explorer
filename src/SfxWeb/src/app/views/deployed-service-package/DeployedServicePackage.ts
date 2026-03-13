// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { DataService } from 'src/app/services/data.service';
import { Injector, Directive } from '@angular/core';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { ActivatedRouteSnapshot } from '@angular/router';
import { IdUtils } from 'src/app/Utils/IdUtils';
import { BaseControllerDirective } from 'src/app/ViewModels/BaseController';
import { DeployedServicePackage } from 'src/app/Models/DataModels/DeployedServicePackage';

@Directive()
export class DeployedServicePackageBaseControllerDirective extends BaseControllerDirective {
    public serviceId: string;
    public activationId: string;
    public appId: string;
    public nodeName: string;

    servicePackage: DeployedServicePackage;

    constructor(protected data: DataService, injector: Injector) {
      super(injector);
    }

    common(messageHandler?: IResponseMessageHandler): Observable<any> {
        return this.data.getDeployedServicePackage(this.nodeName, this.appId, this.serviceId, this.activationId, true, messageHandler)
                .pipe(mergeMap(servicePackage => {
                    this.servicePackage = servicePackage;

                    return this.servicePackage.health.refresh(messageHandler);
                }));
    }

    getParams(route: ActivatedRouteSnapshot): void {
        this.nodeName = IdUtils.getNodeName(route);
        this.serviceId = IdUtils.getServiceId(route);
        this.activationId = IdUtils.getServicePackageActivationId(route);
        this.appId = IdUtils.getAppId(route);
    }
}
