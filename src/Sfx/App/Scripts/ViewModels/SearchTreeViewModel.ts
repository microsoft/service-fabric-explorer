//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    export class SearchTreeViewModel extends TreeViewModel {
        public searchTerm: string = "";
        private _isLoading: boolean = false;

        public search() {
            if (this.childGroupViewModel) {
                this._isLoading = true;
                this.childGroupViewModel.searchThroughChildrenRecursively(this.searchTerm).then(() => this._isLoading = false);
            }
        }

        public get isLoading(): boolean {
            return this._isLoading;
        };

        public get isEmpty(): boolean {
            return !this.childGroupViewModel || !this.childGroupViewModel.children.length;
        };

        public getNodeDisplayHtml(nodeDisplayName: string): string {
            if (this.searchTerm && this.searchTerm.trim()) {
                let searchTerm = this.searchTerm;
                let matchIndex = nodeDisplayName.toLowerCase().indexOf(searchTerm.toLowerCase());

                if (matchIndex !== -1) {
                    return nodeDisplayName.substring(0, matchIndex) + "<span class='search-match'>" + nodeDisplayName.substr(matchIndex, searchTerm.length) + "</span>" + nodeDisplayName.substring(matchIndex + searchTerm.length);
                }
            }

            return nodeDisplayName;
        }
    }
}
