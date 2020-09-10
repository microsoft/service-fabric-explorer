import { DataService } from 'src/app/services/data.service';
import { Injector, Directive } from '@angular/core';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { ActivatedRouteSnapshot } from '@angular/router';
import { IdUtils } from 'src/app/Utils/IdUtils';
import { BaseController } from 'src/app/ViewModels/BaseController';
import { Node } from 'src/app/Models/DataModels/Node';

@Directive()
export class NodeBaseController extends BaseController {
    nodeName: string;
    node: Node;

    constructor(protected data: DataService, injector: Injector) {
      super(injector);
    }

    common(messageHandler?: IResponseMessageHandler): Observable<any> {
        return this.data.getNode(this.nodeName, true, messageHandler).pipe(mergeMap( node => {
                this.node = node;
                return this.node.health.refresh(messageHandler).pipe(map( () => console.log(this)));
            }));
    }

    getParams(route: ActivatedRouteSnapshot): void {
        this.nodeName = IdUtils.getNodeName(route);
    }
}
