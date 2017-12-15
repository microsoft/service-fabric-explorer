import * as util from "util";
import * as path from "path";
import * as fs from "fs";
import error from "./errorUtil";

export function ensureDirExists(dirname: string): void {
    if (!util.isString(dirname)) {
        throw error("dirname should be a string.");
    }

    dirname = path.resolve(dirname);

    let dirs: Array<string> = [];

    while (!fs.existsSync(dirname)) {
        dirs.push(dirname);
        dirname = path.dirname(dirname);
    }

    while (dirs.length > 0) {
        fs.mkdirSync(dirs.pop());
    }
}
