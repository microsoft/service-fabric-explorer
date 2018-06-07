//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import * as uuidv4 from "uuid/v4";

import error from "../../utilities/errorUtil";
import * as utils from "../../utilities/utils";

export class ReferenceNode {
    private readonly symbol_refId: symbol;

    private readonly _root: ReferenceNode;

    private readonly _id: string;

    private _target: Object | Function;

    private referees: IDictionary<ReferenceNode>;

    private referers: IDictionary<ReferenceNode>;

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
            throw error("target cannot be null/undefined or types other than Object or Function.");
        }

        if (!utils.isNullOrUndefined(newRefId)
            && (newRefId === "" || !String.isString(newRefId))) {
            throw error("newRefId must be non-empty string.");
        }

        const referee = this.create(target, newRefId);

        this.addRefereeById(referee.id);
        return referee;
    }

    public addRefereeById(refereeId: string): void {
        const referee = this._root.referees[refereeId];

        if (!referee) {
            throw error("unknown refereeId '{}'.", refereeId);
        }

        referee.internallyAddReferer(this);
        this.internallyAddReferee(referee);
    }

    public removeRefereeById(refereeId: string): void {
        const referee = this._root.referees[refereeId];

        if (!referee) {
            return;
        }

        referee.internallyRemoveReferer(this);
        this.internallyRemoveReferee(referee);
    }

    public addReferer(target: Object | Function, newRefId?: string): ReferenceNode {
        if (!Object.isObject(target) && !Function.isFunction(target)) {
            throw error("target cannot be null/undefined or types other than Object or Function.");
        }

        if (!utils.isNullOrUndefined(newRefId)
            && (newRefId === "" || !String.isString(newRefId))) {
            throw error("newRefId must be non-empty string.");
        }

        const referer = this.create(target, newRefId);

        this.addRefererById(referer.id);
        return referer;
    }

    public addRefererById(refererId: string): void {
        const referer = this._root.referees[refererId];

        if (!referer) {
            throw error("unknown refererId '{}'.", refererId);
        }

        referer.internallyAddReferee(this);
        this.internallyAddReferer(referer);
    }

    public removeRefererById(refererId: string): void {
        const referer = this._root.referees[refererId];

        if (!referer) {
            return;
        }

        referer.internallyRemoveReferee(this);
        this.internallyRemoveReferer(referer);
    }

    public referById(refereeId: string, refererId?: string): ReferenceNode {
        const referee = this._root.referees[refereeId];

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
            throw error("target cannot be null/undefined or types other than Object or Function.");
        }

        const existingRefId = this.getRefId(target);
        let referee: ReferenceNode;

        if (existingRefId) {
            referee = this._root.referees[existingRefId];

            if (!referee) {
                throw error("The target already been referenced but refId: {} is unknown.", existingRefId);
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

    private constructor(root: ReferenceNode, target: Object | Function, refId?: string) {
        if (utils.isNullOrUndefined(root) !== utils.isNullOrUndefined(target)) {
            throw error("root and target must be provided togehter or none are provided.");
        }

        refId = refId || uuidv4();

        this._root = root;
        this._id = refId;
        this._target = target;
        this.referees = {};

        if (!utils.isNullOrUndefined(root)) {
            this.symbol_refId = this._root.symbol_refId;
            this.referers = {};

            this._root.internallyAddReferee(this);
            this.target[this.symbol_refId] = this._id;
        } else {
            // When this is a root node.
            this.symbol_refId = Symbol("refId");
            this.referers = undefined;
            this.referees[this._id] = this;
        }
    }

    private create(target: Object | Function, newRefId?: string): ReferenceNode {
        const refId = target[this.symbol_refId];

        if (refId) {
            throw error("target has already been referenced. refId={}", refId);
        }

        return new ReferenceNode(this._root, target, newRefId);
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
            this._target = undefined;
        }

        delete this._root.referees[this._id];

        this.referees = undefined;
        this.referers = undefined;
    }
}
