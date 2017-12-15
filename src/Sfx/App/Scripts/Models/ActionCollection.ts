//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

module Sfx {

    export class ActionCollection {
        public collection: Action[] = [];

        constructor(
            private telemetry: TelemetryService,
            private $q: angular.IQService) {
        }

        public runWithTelemetry(action: Action, source: string): angular.IPromise<any> {
            if (!action.canRun || action.running) {
                return this.$q.when(true);
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

        private runInternal(action: Action, source: string): angular.IPromise<any> {
            let params: any[] = [
                // success handler
                (result: any) => {
                    this.telemetry.trackActionEvent(action.name, source, true);
                },
                // error handler
                (reason: any) => {
                    let result = reason && reason.statusText && reason.status && reason.status + ": " + reason.statusText || false;
                    this.telemetry.trackActionEvent(action.name, source, result);
                    return this.$q.reject(reason);
                }];

            return action.runWithCallbacks.apply(action, params);
        }
    }
}
