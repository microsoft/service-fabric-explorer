export class Transforms {

    public static trimFront(parsed: string, value: string): string {
        return parsed.substring(parsed.indexOf(value) + 1);
    }

    public static trimBack(parsed: string, value: string): string {
        return parsed.substring(0, parsed.indexOf(value));
    }

    public static prefix(parsed: string, value: string): string {
        return value + parsed;
    }

}