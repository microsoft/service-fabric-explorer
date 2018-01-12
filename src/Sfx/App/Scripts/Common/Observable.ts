//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    export class Observable {
        private observers: ((key: string, oldValue: any, newValue: any) => void)[] = [];

        public subscribe(observer: (key, oldValue, newValue) => void): void {
            this.observers.push(observer);
        }

        protected notify(key: string, oldValue: any, newValue: any) {
            if (this.observers && this.observers.length > 0) {
                this.observers.forEach(observer => {
                    observer(key, oldValue, newValue);
                });
            }
        }
    }

}
