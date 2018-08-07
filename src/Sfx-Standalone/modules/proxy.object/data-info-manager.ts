//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IDictionary, IDisposable } from "sfx.common";

import { IDataInfo, DataType, dataTypeOf } from "./data-info";
import { ReferenceNode } from "./reference-node";
import { IDelegation } from "./delegate";

interface IObjectDataInfo extends IDataInfo {
    memberInfos: IDictionary<IDataInfo>;
}

const FuncName_DisposeAsync = "disposeAsync";

export class DataInfoManager implements IDisposable {
    private refRoot: ReferenceNode;

    private delegation: IDelegation;

    constructor(delegation: IDelegation) {
        if (!Object.isObject(delegation) || delegation === null) {
            throw new Error("delegate must be supplied.");
        }

        this.delegation = delegation;
        this.refRoot = ReferenceNode.createRoot();
    }

    public get disposed(): boolean {
        return this.refRoot === undefined || this.delegation === undefined;
    }

    public get(refId: string): Object | Function {
        this.validateDisposal();

        const referee = this.refRoot.referById(refId);

        if (!referee) {
            return undefined;
        }

        return referee.target;
    }

    public async disposeAsync(): Promise<void> {
        if (!this.disposed) {
            const promises =
                this.refRoot.getRefereeIds().map(
                    (refId) => refId === this.refRoot.id ? Promise.resolve() : this.releaseByIdAsync(refId));
            await Promise.all(promises);

            this.refRoot = undefined;
            this.delegation = undefined;
        }
    }

    public AddReferenceById(refereeId: string, parentId?: string): void {
        this.validateDisposal();

        const referee = this.refRoot.referById(refereeId);

        if (!referee) {
            throw new Error(`refereeId (${refereeId}) doesn't exist.`);
        }

        parentId = parentId || this.refRoot.id;
        referee.addRefererById(parentId);
    }

    public ReferAsDataInfo(target: any, parentId?: string): IDataInfo {
        this.validateDisposal();

        return this.toDataInfo(target, parentId);
    }

    public realizeDataInfo(dataInfo: IDataInfo, parentId?: string): any & IDisposable {
        this.validateDisposal();

        if (dataInfo.id) {
            parentId = parentId || this.refRoot.id;

            const existingRef = this.refRoot.referById(dataInfo.id, parentId);

            if (existingRef) {
                return existingRef.target;
            }

            if (dataInfo.type === DataType.Object) {
                return this.realizeObjectDataInfo(<IObjectDataInfo>dataInfo, parentId);
            } else if (dataInfo.type === DataType.Function) {
                return this.realizeFunctionDataInfo(dataInfo, parentId);
            } else {
                // Log Error [BUG].
            }
        }

        if (dataInfo.type === DataType.Buffer) {
            return Buffer.from(dataInfo.value.data);
        }

        return dataInfo.value;
    }

    public async releaseByIdAsync(refId: string, parentId?: string, locally?: boolean): Promise<void> {
        this.validateDisposal();

        const referee = this.refRoot.referById(refId);

        if (referee) {
            if (locally !== true) {
                await this.delegation.disposeAsync(refId, parentId);
            }

            parentId = parentId || this.refRoot.id;
            referee.removeRefererById(parentId);
        }
    }

    private validateDisposal(): void {
        if (this.disposed) {
            throw new Error("DataInfoManager already disposed.");
        }
    }

    private toDataInfo(target: any, parentId?: string, recursive?: boolean): IDataInfo {
        const dataInfo: IDataInfo = {
            type: dataTypeOf(target)
        };
        const existingRefId = this.refRoot.getRefId(target);

        parentId = parentId || this.refRoot.id;
        recursive = !(recursive === false);

        if (existingRefId) {
            dataInfo.id = existingRefId;
            this.refRoot.referById(existingRefId, parentId);
        } else if (Object.isSerializable(target)) {
            dataInfo.value = target;
        } else if (recursive && dataInfo.type === DataType.Object) {
            return this.toObjectDataInfo(target, parentId);
        } else {
            const ref = this.refRoot.refer(target, parentId);

            dataInfo.id = ref.id;
        }

        return dataInfo;
    }

    private toObjectDataInfo(target: Object, parentId?: string): IDataInfo {
        const currentObjDataInfo: IObjectDataInfo = {
            type: DataType.Object,
            id: this.refRoot.refer(target, parentId).id,
            memberInfos: Object.create(null)
        };

        const memberInfos: IDictionary<IDataInfo> = currentObjDataInfo.memberInfos;

        let currentObj = target;

        while (currentObj && currentObj !== Object.prototype) {
            const propertyDescriptors = Object.getOwnPropertyDescriptors(currentObj);

            for (const propertyName in propertyDescriptors) {
                const propertyDescriptor = propertyDescriptors[propertyName];

                if (propertyName in memberInfos) {
                    continue;
                }
 
                if (!propertyDescriptor.enumerable
                    || !propertyDescriptor.writable
                    && !propertyDescriptor.get
                    && !propertyDescriptor.set) {
                    memberInfos[propertyName] = this.toDataInfo(propertyDescriptor.value, currentObjDataInfo.id, false);
                }
            }

            currentObj = Object.getPrototypeOf(currentObj);
        }

        return currentObjDataInfo;
    }

    private generateDisposeFunc(refId: string, parentId?: string, superDisposeFunc?: () => Promise<void>): () => Promise<void> {
        return async () => {
            if (superDisposeFunc) {
                await superDisposeFunc();
            }

            await this.releaseByIdAsync(refId, parentId, false);
        };
    }

    private realizeFunctionDataInfo(dataInfo: IDataInfo, parentId?: string): any {
        const base = () => undefined;

        base[FuncName_DisposeAsync] = this.generateDisposeFunc(dataInfo.id, parentId);

        const handlers: ProxyHandler<Function> = {
            apply: async (target, thisArg, args): Promise<any> => {
                const refId = this.refRoot.getRefId(target);
                const thisArgDataInfo = this.toDataInfo(thisArg, refId);
                const argsDataInfos: Array<IDataInfo> = [];

                for (const arg of args) {
                    argsDataInfos.push(this.toDataInfo(arg, refId));
                }

                const resultDataInfo = await this.delegation.applyAsync(refId, thisArgDataInfo, argsDataInfos);

                return this.realizeDataInfo(resultDataInfo, refId);
            }
        };

        const funcProxy = new Proxy(base, handlers);
        const parentRef = this.refRoot.referById(parentId);

        parentRef.addReferee(funcProxy, dataInfo.id);

        return funcProxy;
    }

    private realizeObjectDataInfo(dataInfo: IObjectDataInfo, parentId?: string): any & IDisposable {
        const base = Object.create(null);
        const handlers: ProxyHandler<Function> = {
            get: (target, property, receiver): any | Promise<any> => {
                const baseValue = target[property];

                if (baseValue || typeof property === "symbol") {
                    return baseValue;
                }

                const refId = this.refRoot.getRefId(target);

                const resultDataInfoPromise = this.delegation.getPropertyAsync(refId, property);

                return resultDataInfoPromise.then((resultDataInfo) => this.realizeDataInfo(resultDataInfo, refId));
            },

            set: (target, property, value, receiver) => {
                if (typeof property === "symbol") {
                    target[property] = value;
                    return true;
                }

                if (property in target) {
                    return false;
                }

                const refId = this.refRoot.getRefId(target);
                const valueDataInfo = this.toDataInfo(value, refId);

                this.delegation.setPropertyAsync(refId, property, valueDataInfo);
                return true;
            },

            has: (target, prop): boolean => {
                return true;
            }
        };

        const objProxy = new Proxy(base, handlers);
        const parentRef = this.refRoot.referById(parentId);

        // Register the dataInfo before initialize the members.
        parentRef.addReferee(objProxy, dataInfo.id);

        if (dataInfo.memberInfos) {
            for (const propertyName of Object.getOwnPropertyNames(dataInfo.memberInfos)) {
                Object.defineProperty(base, propertyName, {
                    enumerable: false,
                    configurable: false,
                    writable: propertyName === FuncName_DisposeAsync,
                    value: this.realizeDataInfo(dataInfo.memberInfos[propertyName], dataInfo.id)
                });
            }
        }

        base[FuncName_DisposeAsync] = this.generateDisposeFunc(dataInfo.id, parentId, base[FuncName_DisposeAsync]);

        return objProxy;
    }
}
