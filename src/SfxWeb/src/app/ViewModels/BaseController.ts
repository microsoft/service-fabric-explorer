import { OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';

export abstract class BaseController implements OnDestroy {

    subscriptions: Subscription;

    constructor() {}

    

    ngOnDestroy(){
        this.subscriptions.unsubscribe();
    }

}