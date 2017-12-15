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
