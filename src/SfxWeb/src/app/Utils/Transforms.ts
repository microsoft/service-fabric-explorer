import { ITransform } from "../Models/eventstore/rcaEngine";

export class Transforms {

    public static magicWand: { [K: string]: Function } = {
        trimFront: Transforms.trimFront,
        trimBack: Transforms.trimBack,
        prefix: Transforms.prefix,
        trimWhiteSpace: Transforms.trimWhiteSpace,
    };

    public static trimFront(parsed: string, value: string): string {
        if(parsed.indexOf(value) == -1) {
            return parsed;
        }
        return parsed.substring(parsed.indexOf(value) + 1);
    }

    public static trimBack(parsed: string, value: string): string {
        if(parsed.indexOf(value) == -1) {
            return parsed;
        }
        return parsed.substring(0, parsed.indexOf(value));
    }

    public static trimWhiteSpace(parsed: string): string {
      console.log(parsed.trim())
      return parsed.trim();
  }

    public static prefix(parsed: string, value: string): string {
        return value + parsed;
    }

    public static getTransformations(transformations: ITransform[], parsed: any) {
        transformations.forEach(transform => {
            let func = transform.type;
            let value = transform.value;
            if(this.magicWand[func]) {
                parsed = this.magicWand[func](parsed, value);
            } else {
                throw new Error(`Method '${func}' is not implemented.`);
            }
        });
        console.log(parsed)
        return parsed;
    }

}
