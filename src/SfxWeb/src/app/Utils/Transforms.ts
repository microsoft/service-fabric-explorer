import { ITransform } from "../Models/eventstore/rcaEngine";

export class Transforms {
  public static transformationKey: { [K: string]: Function } = {
    trimFront: Transforms.trimFront,
    trimBack: Transforms.trimBack,
    prefix: Transforms.prefix,
    trimWhiteSpace: Transforms.trimWhiteSpace,
  };

  public static trimFront(parsed: string, value: string): string {
    const index = parsed.indexOf(value);
    if (index === -1) {
      return parsed;
    }
    return parsed.substring(index + 1);
  }

  public static trimBack(parsed: string, value: string): string {
    const index = parsed.indexOf(value);
    if (index === -1) {
      return parsed;
    }
    return parsed.substring(0, index);
  }

  public static trimWhiteSpace(parsed: string): string {
    return parsed.trim();
  }

  public static prefix(parsed: string, value: string): string {
    return value + parsed;
  }

  public static getTransformations(transformations: ITransform[], parsed: any) {
    transformations.forEach(transform => {
      let func = transform.type;
      let value = transform.value;
      if (this.transformationKey[func]) {
        parsed = this.transformationKey[func](parsed, value);
      } else {
        throw new Error(`Method '${func}' is not implemented.`);
      }
    });
    return parsed;
  }

}
