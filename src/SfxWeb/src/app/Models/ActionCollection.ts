import { TelemetryService } from '../services/telemetry.service';
import { Action } from './Action';
import { of, throwError, Observable } from 'rxjs';

//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

export class ActionCollection {
    public collection: Action[] = [];

    constructor(private telemetry: TelemetryService) {
    }

    public runWithTelemetry(action: Action, source: string): Observable<any> {
        if (!action.canRun || action.running) {
            return of(true);
        }
        return this.runInternal(action, source);
    }

    public get length(): number {
        return this.collection.length;
    }

    public add(action: Action) {
        this.collection.push(action);
    }

    public get anyRunning(): boolean {
        return _.some(this.collection, "running");
    }

    public get title(): string {
        let runningAction = _.find(this.collection, a => a.running);
        if (runningAction) {
            return runningAction.runningTitle;
        } else {
            return "Actions";
        }
    }

    private runInternal(action: Action, source: string): Observable<any> {
        let params: any[] = [
            // success handler
            (result: any) => {
                this.telemetry.trackActionEvent(action.name, source, true);
            },
            // error handler
            (reason: any) => {
                let result = reason && reason.statusText && reason.status && reason.status + ": " + reason.statusText || false;
                this.telemetry.trackActionEvent(action.name, source, result);
                return throwError(reason);
            }];

        return action.runWithCallbacks.apply(action, params);
    }
}

