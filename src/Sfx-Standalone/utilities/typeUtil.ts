import * as util from "util";

export function getEither<T>(arg: T, defaultValue: T): T {
  return util.isNullOrUndefined(arg) ? defaultValue : arg;
}
