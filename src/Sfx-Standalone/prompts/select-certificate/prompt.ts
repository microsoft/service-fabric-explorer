import prompt from "../prompts";
import resolve from "../../utilities/resolve";

export default function open(promptCallback: (error: any, targetClusterUrl: string) => void = null) {
    return prompt(
        {
            pageUrl: resolve("select-certificate.html"),
            height: 500
        },
        promptCallback
    );
}
