//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import * as uuidv4 from "uuid/v4";

import error from "../../utilities/errorUtil";
import * as utils from "../../utilities/utils";

export class ReferenceNode {
    private static symbol_refId: symbol = Symbol("refId");

    public readonly root: ReferenceNode;

    public readonly id: string;

    public readonly target: Object | Function;

    public referees: IDictionary<ReferenceNode>;

    public referers: IDictionary<ReferenceNode>;

    public static createRoot(): ReferenceNode {
        return new ReferenceNode(undefined, undefined);
    }

    private constructor(root: ReferenceNode, target: Object | Function) {
        if (utils.isNullOrUndefined(root) !== utils.isNullOrUndefined(target)) {
            throw error("root and target must be provided togehter or none are provided.");
        }

        this.root = root;
        this.id = uuidv4();
        this.target = target;
        this.referees = {};
        this.target[ReferenceNode.symbol_refId] = this.id;

        if (!utils.isNullOrUndefined(root)) {
            this.referers = {};
            this.root.internallyAddReferee(this);
        } else {
            // When this is a root node.
            this.referees[this.id] = this;
        }
    }

    public addReferee(refereeId: string): void {
        if (String.isNullUndefinedOrWhitespace(refereeId)) {
            throw error("refereeId cannot be null/undefined/empty/whitespaces.");
        }

        const referee = this.root.referees[refereeId];

        if (!referee) {
            throw error("unknown refereeId '{}'.", refereeId);
        }

        referee.internallyAddReferer(this);
        this.internallyAddReferee(referee);
    }

    public removeReferee(refereeId: string): void {
        const referee = this.root.referees[refereeId];

        if (!referee) {
            return;
        }

        referee.internallyRemoveReferer(this);
        this.internallyRemoveReferee(referee);
    }

    public addReferer(refererId: string): void {
        if (String.isNullUndefinedOrWhitespace(refererId)) {
            throw error("refererId cannot be null/undefined/empty/whitespaces.");
        }

        const referer = this.root.referees[refererId];

        if (!referer) {
            throw error("unknown refererId '{}'.", refererId);
        }

        referer.internallyAddReferee(this);
        this.internallyAddReferer(referer);
    }

    public removeReferer(refererId?: string): void {
        const referer = this.root.referees[refererId || this.root.id];

        if (!referer) {
            return;
        }

        referer.internallyRemoveReferee(this);
        this.internallyRemoveReferer(referer);
    }

    public refer(refereeId: string, refererId?: string): Object | Function {
        const referee = this.root.referees[refereeId];

        if (!referee) {
            throw error("refereeId '{}' doesn't exist.", refereeId);
        }

        referee.addReferer(refererId || this.root.id);

        return referee.target;
    }

    public generate(target: Object | Function): ReferenceNode {
        if (utils.isNullOrUndefined(target)) {
            throw error("target must be provided.");
        }

        const refId = target[ReferenceNode.symbol_refId];

        if (refId) {
            return this.root.referees[refId];
        }

        return new ReferenceNode(this.root, target);
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
        Object.values(this.referees).forEach(referee => referee.removeReferer(this.id));

        delete this.root.referees[this.id];

        this.referees = undefined;
        this.referers = undefined;
    }
}