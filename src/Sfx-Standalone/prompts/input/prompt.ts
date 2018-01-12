//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { BrowserWindow } from "electron";

import prompt from "../prompts";
import resolve from "../../utilities/resolve";

export default function open(parentWindow: BrowserWindow, options: IInputPromptOptions, promptCallback: (error: any, input: string) => void = null) {
    return prompt(
        {
            parentWindow: parentWindow,
            pageUrl: resolve("input.html"),
            height: 225,
            data: options
        },
        promptCallback
    );
}
