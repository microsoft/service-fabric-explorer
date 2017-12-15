import * as util from "util";

export default function error(messageOrFormat: string, ...params: Array<any>): Error {
    if (!util.isArray(params)) {
        return new Error(messageOrFormat);
    }

    return new Error(util.format(messageOrFormat, ...params));
}
