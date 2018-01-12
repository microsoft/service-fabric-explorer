//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    export interface ISplitterController {
        left: string;
        right: string;
        offset: number;
        SplitterLeftWidth: number;
    }

    export class SplitterDirective implements ng.IDirective {
        public restrict = "A";
        public require = "ngController";

        public link($scope: any, element: JQuery, attributes: ng.IAttributes, ctrl: ISplitterController) {

            let split = (left, right, offset, width) => {
                $("#" + left).outerWidth(width);
                $("#" + right).css("left", $("#" + left).outerWidth() + offset);
            };

            let initWidth = ctrl.SplitterLeftWidth;
            console.log("Initialize splitter left width = " + initWidth);
            split(ctrl.left, ctrl.right, ctrl.offset, initWidth);

            $(element).mousedown(function (e) {
                e.preventDefault();
                $(document).mousemove(function (e) {
                    split(ctrl.left, ctrl.right, ctrl.offset, e.pageX + 2);
                    ctrl.SplitterLeftWidth = $("#" + ctrl.left).outerWidth() + ctrl.offset;
                });
            });
            $(document).mouseup(function (e) {
                $(document).unbind("mousemove");
            });
        }
    }

    export class SplitterController implements ISplitterController {
        public left = "tree";
        public right = "main";
        public offset = 0;

        constructor(private storageService: StorageService) {
        }

        public get SplitterLeftWidth(): number {
            return this.storageService.getValueNumber(Constants.SplitterLeftWidth, Constants.DefaultSplitterLeftWidth);
        }

        public set SplitterLeftWidth(width: number) {
            this.storageService.setValue(Constants.SplitterLeftWidth, width);
        }
    }
}
