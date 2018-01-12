//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import prompt from "../prompts";
import resolve from "../../utilities/resolve";

export default function open(promptCallback: (error: any, targetClusterUrl: string) => void = null) {
    return prompt(
        {
            pageUrl: resolve("connect-cluster.html"),
            height: 225
        },
        promptCallback
    );
}
