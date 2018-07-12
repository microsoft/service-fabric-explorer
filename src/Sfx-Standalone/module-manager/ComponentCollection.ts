//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IComponentCollection, Component, IComponentInfo } from "sfx.module-manager";
import { IDictionary } from "sfx.common";

export default class ComponentCollection implements IComponentCollection {
    private readonly collection: IDictionary<IComponentInfo<any>>;

    constructor() {
        this.collection = Object.create(null);
    }

    public register<T extends TComponent, TComponent = Component<TComponent>>(componentInfo: IComponentInfo<T>): IComponentCollection {
        if (!componentInfo || !Object.isObject(componentInfo)) {
            throw new Error("componentInfo must be provided.");
        }

        if (!String.isString(componentInfo.name) || String.isEmptyOrWhitespace(componentInfo.name)) {
            throw new Error("componentInfo.name must be provided. (non-empty/whitespaces)");
        }

        if (!Function.isFunction(componentInfo.descriptor)) {
            throw new Error("componentInfo.descriptor function must be provided.");
        }

        if (this.collection[componentInfo.name]) {
            throw new Error(`component, "${componentInfo.name}", has already registered.`);
        }

        this.collection[componentInfo.name] = componentInfo;

        return this;
    }

    public getComponents(): Array<IComponentInfo<any>> {
        return Object.values(this.collection);
    }
}
