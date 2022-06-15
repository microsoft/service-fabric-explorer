import { DataService } from 'src/app/services/data.service';
import { Injector, Directive } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';
import { IdUtils } from 'src/app/Utils/IdUtils';
import { BaseControllerDirective } from 'src/app/ViewModels/BaseController';

@Directive()
export class NodeTypeBaseControllerDirective extends BaseControllerDirective {
    nodeType: string;

    constructor(protected data: DataService, injector: Injector) {
      super(injector);
    }

    getParams(route: ActivatedRouteSnapshot): void {
        this.nodeType = IdUtils.getNodeType(route);
    }
}