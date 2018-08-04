//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IDictionary } from "sfx.common";
import { IDataInfo } from "./data-info";

import * as uuidv4 from "uuid/v4";

import * as utils from "../../utilities/utils";

export class ReferenceNode {
    private readonly symbol_refId: symbol;

    private readonly symbol_dataInfo: symbol;

    private readonly _root: ReferenceNode;

    private readonly _id: string;

    private _target: Object | Function;

    private referees: IDictionary<ReferenceNode>;

    private referers: IDictionary<ReferenceNode>;

    private get internalRoot(): ReferenceNode {
        return this._root || this;
    }

    public get root(): ReferenceNode {
        return this._root;
    }

    public get id(): string {
        return this._id;
    }

    public get target(): Object | Function {
        return this._target;
    }

    public static createRoot(): ReferenceNode {
        return new ReferenceNode(undefined, undefined);
    }

    public getRefereeIds(): Array<string> {
        return Object.values(this.referees).map((ref) => ref.id);
    }

    public addReferee(target: Object | Function, newRefId?: string): ReferenceNode {
        if (!Object.isObject(target) && !Function.isFunction(target)) {
            throw new Error("target cannot be null/undefined or types other than Object or Function.");
        }

        if (!utils.isNullOrUndefined(newRefId)
            && (newRefId === "" || !String.isString(newRefId))) {
            throw new Error("newRefId must be non-empty string.");
        }

        const referee = this.create(target, newRefId);

        this.addRefereeById(referee.id);
        return referee;
    }

    public addRefereeById(refereeId: string): void {
        const referee = this.internalRoot.referees[refereeId];

        if (!referee) {
            throw new Error(`unknown refereeId '${refereeId}'.`);
        }

        referee.internallyAddReferer(this);
        this.internallyAddReferee(referee);
    }

    public removeRefereeById(refereeId: string): void {
        const referee = this.internalRoot.referees[refereeId];

        if (!referee) {
            return;
        }

        referee.internallyRemoveReferer(this);
        this.internallyRemoveReferee(referee);
    }

    public addReferer(target: Object | Function, newRefId?: string): ReferenceNode {
        if (!Object.isObject(target) && !Function.isFunction(target)) {
            throw new Error("target cannot be null/undefined or types other than Object or Function.");
        }

        if (!utils.isNullOrUndefined(newRefId)
            && (newRefId === "" || !String.isString(newRefId))) {
            throw new Error("newRefId must be non-empty string.");
        }

        const referer = this.create(target, newRefId);

        this.addRefererById(referer.id);
        return referer;
    }

    public addRefererById(refererId: string): void {
        const referer = this.internalRoot.referees[refererId];

        if (!referer) {
            throw new Error(`unknown refererId '${refererId}'.`);
        }

        referer.internallyAddReferee(this);
        this.internallyAddReferer(referer);
    }

    public removeRefererById(refererId: string): void {
        const referer = this.internalRoot.referees[refererId];

        if (!referer) {
            return;
        }

        referer.internallyRemoveReferee(this);
        this.internallyRemoveReferer(referer);
    }

    public referById(refereeId: string, refererId?: string): ReferenceNode {
        const referee = this.internalRoot.referees[refereeId];

        if (!referee) {
            return undefined;
        }

        if (refererId) {
            referee.addRefererById(refererId);
        }

        return referee;
    }

    public refer(target: Object | Function, refererId?: string): ReferenceNode {
        if (!Object.isObject(target) && !Function.isFunction(target)) {
            throw new Error("target cannot be null/undefined or types other than Object or Function.");
        }

        const existingRefId = this.getRefId(target);
        let referee: ReferenceNode;

        if (existingRefId) {
            referee = this.internalRoot.referees[existingRefId];

            if (!referee) {
                throw new Error(`The target already been referenced but refId: ${existingRefId} is unknown.`);
            }
        } else {
            referee = this.create(target);
        }

        if (refererId) {
            referee.addRefererById(refererId);
        }

        return referee;
    }

    public getRefId(target: Object | Function): string {
        if (!Object.isObject(target) && !Function.isFunction(target)) {
            return undefined;
        }

        return target[this.symbol_refId];
    }

    public setRefDataInfo(target: Object | Function, dataInfo: IDataInfo): IDataInfo {
        if (!Object.isObject(target) && !Function.isFunction(target)) {
            throw new Error("target cannot be null/undefined or types other than Object or Function.");
        }

        return target[this.symbol_dataInfo] = dataInfo;
    }

    public getRefDataInfo(target: Object | Function): IDataInfo {
        if (!Object.isObject(target) && !Function.isFunction(target)) {
            return undefined;
        }
        
        return target[this.symbol_dataInfo];
    }

    private constructor(root: ReferenceNode, target: Object | Function, refId?: string) {
        if (utils.isNullOrUndefined(root) !== utils.isNullOrUndefined(target)) {
            throw new Error("root and target must be provided togehter or none are provided.");
        }

        refId = refId || uuidv4();

        this._root = root;
        this._id = refId;
        this._target = target;
        this.referees = Object.create(null);

        if (!utils.isNullOrUndefined(root)) {
            this.symbol_refId = this.internalRoot.symbol_refId;
            this.symbol_dataInfo = this.internalRoot.symbol_dataInfo;
            this.referers = Object.create(null);

            this.internalRoot.internallyAddReferee(this);
            this.target[this.symbol_refId] = this._id;
        } else {
            // When this is a root node.
            this.symbol_refId = Symbol("refId");
            this.symbol_dataInfo = Symbol("dataInfo");
            this.referers = undefined;
            this.referees[this._id] = this;
        }
    }

    private create(target: Object | Function, newRefId?: string): ReferenceNode {
        const refId = target[this.symbol_refId];

        if (refId) {
            throw new Error(`target has already been referenced. refId=${refId}`);
        }

        return new ReferenceNode(this.internalRoot, target, newRefId);
    }

    private isOrphan(): boolean {
        return Object.isEmpty(this.referers);
    }

    private internallyAddReferee(referee: ReferenceNode): void {
        this.referees[referee.id] = referee;
    }

    private internallyRemoveReferee(referee: ReferenceNode): void {
        delete this.referees[referee.id];
    }

    private internallyAddReferer(referer: ReferenceNode): void {
        this.referers[referer.id] = referer;
    }

    private internallyRemoveReferer(referer: ReferenceNode): void {
        delete this.referers[referer.id];

        if (this.isOrphan()) {
            this.release();
        }
    }

    private release(): void {
        Object.values(this.referees).forEach(referee => referee.removeRefererById(this._id));

        if (this._target) {
            delete this._target[this.symbol_refId];
            delete this._target[this.symbol_dataInfo];
            this._target = undefined;
        }

        delete this._root.referees[this._id];

        this.referees = undefined;
        this.referers = undefined;
    }
}
