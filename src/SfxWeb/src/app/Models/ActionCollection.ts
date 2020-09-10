import { TelemetryService } from '../services/telemetry.service';
import { Action } from './Action';
import { of, throwError, Observable } from 'rxjs';

// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

export class ActionCollection {
    public collection: Action[] = [];

    constructor(private telemetry: TelemetryService) {
    }

    public runWithTelemetry(action: Action, source: string) {
        if (!action.canRun || action.running) {
            return of(true);
        }
        this.runInternal(action, source).subscribe();
    }

    public get length(): number {
        return this.collection.length;
    }

    public add(action: Action) {
        this.collection.push(action);
    }

    public get anyRunning(): boolean {
        return this.collection.some(action  => action.running);
    }

    public get title(): string {
        const runningAction = this.collection.find(a => a.running);
        if (runningAction) {
            return runningAction.runningTitle;
        } else {
            return 'Actions';
        }
    }

    private runInternal(action: Action, source: string): Observable<any> {
        const params: any[] = [
            // success handler
            (result: any) => {
                this.telemetry.trackActionEvent(action.name, source, true);
            },
            // error handler
            (reason: any) => {
                const result = reason && reason.statusText && reason.status && reason.status + ': ' + reason.statusText || false;
                this.telemetry.trackActionEvent(action.name, source, result);
                return throwError(reason);
            }];

        return action.runWithCallbacks.apply(action, params);
    }
}

