//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import * as realElectron from "electron";
import * as utils from "donuts.node/utils";

export const isRemote = utils.isObject(realElectron.remote);

export const remote: realElectron.Remote = realElectron.remote;

export const electron: realElectron.AllElectron = (() => {
    if (isRemote) {
        const remoteElectron: any = Object.create(null);
        const mergeProperties = (target: Object, propertyDescriptors) =>
            Object.keys(propertyDescriptors).forEach((propertyName) => {
                if (!Object.prototype.hasOwnProperty.call(remoteElectron, propertyName)) {
                    Object.defineProperty(target, propertyName, propertyDescriptors[propertyName]);
                }
            });

        mergeProperties(remoteElectron, Object.getOwnPropertyDescriptors<Object>(realElectron.remote));
        mergeProperties(remoteElectron, Object.getOwnPropertyDescriptors<Object>(realElectron));

        return remoteElectron;
    }

    return realElectron;
})();
