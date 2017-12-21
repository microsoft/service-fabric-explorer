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
