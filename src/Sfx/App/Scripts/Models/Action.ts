//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    export class Action {
        private _running: boolean;

        public get running(): boolean {
            return this._running;
        }

        public get displayTitle(): string {
            return this._running ? this.runningTitle : this.title;
        }

        constructor(
            public name: string,
            public title: string,
            public runningTitle: string,
            protected execute: (...params: any[]) => angular.IPromise<any>,
            public canRun: () => boolean) {

            this._running = false;
        }

        public run(...params: any[]): angular.IPromise<any> {
            return this.runInternal(ng.noop, ng.noop, params);
        }

        public runWithCallbacks(success: (result: any) => void, error: (reason: string) => void, ...params: any[]): angular.IPromise<any> {
            return this.runInternal(success, error, params);
        }

        protected runInternal(success: (result: any) => void, error: (reason: string) => void, ...params: any[]): angular.IPromise<any> {
            if (this.canRun()) {
                this._running = true;
                return this.execute(params)
                    .then(success, error)
                    .finally(() => {
                        this._running = false;
                    });
            }
        }
    }

    export class ActionWithDialog extends Action {
        /**
         * Creates an action with dialog support
         * @param name The action name
         * @param title The action display title
         * @param runningTitle The action display title when running
         * @param execute The execute function
         * @param canRun The query to see if the action is runnable
         * @param modalSettings The dialog settings
         * @param beforeOpen The function runs before dialog is opened
         */
        constructor(
            public $uibModal: ng.ui.bootstrap.IModalService,
            public $q: ng.IQService,
            public name: string,
            public title: string,
            public runningTitle: string,
            protected execute: (...params: any[]) => angular.IPromise<any>,
            public canRun: () => boolean,
            public modalSettings: angular.ui.bootstrap.IModalSettings,
            public beforeOpen?: () => angular.IPromise<any>) {

            super(name, title, runningTitle, execute, canRun);
        }

        protected runInternal(success: (result: any) => void, error: (reason: string) => void, ...params: any[]): angular.IPromise<any> {
            if (this.canRun()) {
                return this.$q.when(this.beforeOpen ? this.beforeOpen() : true).then(() => {
                    return this.$uibModal.open(this.modalSettings).result.then(() => {
                        return super.runInternal(success, error, params);
                    });
                });
            }
        }
    }

    export class ActionWithConfirmationDialog extends ActionWithDialog {
        constructor(
            public $uibModal: ng.ui.bootstrap.IModalService,
            public $q: ng.IQService,
            public name: string,
            public title: string,
            public runningTitle: string,
            protected execute: (...params: any[]) => angular.IPromise<any>,
            public canRun: () => boolean,
            public confirmationDialogTitle?: string,
            public confirmationDialogMessage?: string,
            public confirmationKeyword?: string) {

            super($uibModal, $q, name, title, runningTitle, execute, canRun, {
                templateUrl: "partials/action-confirmation-dialog.html",
                controller: ActionController,
                resolve: {
                    action: () => this
                }
            });
        }
    }
}
