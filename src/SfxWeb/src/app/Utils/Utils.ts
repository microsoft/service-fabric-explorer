//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
import * as _ from 'lodash';
export class Utils {
    private static SingleUrlRegExp = new RegExp("^https?:\/\/[^;,]+");

    /**
     * checks if two arrays have the same primitives;
     * @param list
     * @param list2 
     */
    public static arraysAreEqual<T>(list: T[], list2: T[]): boolean{
        if(list === null || list === undefined || list2 === null || list2 === undefined){
            return false;
        }
        return list.every(entry => list2.includes(entry)) && list2.every(entry => list.includes(entry));
    }

    /**
     * Filter all duplicates
     * @param list 
     */
    public static unique<T>(list: T[]): T[]{
        return Array.from(new Set(list));
    }

    public static max(list: number[]): number{
        return list.reduce( (a,b)=> Math.max(a,b));
    }

    /**
     * implements lodash groupBy in es6. returns a dictionary of lists
     * @param list 
     * @param key key for value
     */
    public static groupByFunc<T>(list: T[], keyFunction: (T) => string): Record<string, T[]> {
        return list.reduce( (previous, current) => { const key = keyFunction(current);
                                                     if(key in previous){
                                                        previous[key].push(current)
                                                     }else{
                                                        previous[key] = [current]
                                                     }
                                                    //  previous[key] = (previous[key] || []).push(current);
                                                     return previous}, {})
    }

    /**
     * implements lodash groupBy in es6. returns a dictionary of lists
     * @param list 
     * @param key key for value
     */
    public static groupBy<T>(list: T[], key: string): Record<string, T[]> {
        return list.reduce( (previous, current) => { previous[key] = (previous[key] || []).push(current) ; return previous}, {})
    }

        /**
     * implements lodash keyBy in es6. returns a dictionary of lists
     * @param list 
     * @param key key for value
     */
    public static keyBy<T>(list: T[], key: string): Record<string, T> {
        return list.reduce( (previous, current) => { previous[current[key]] = current; return previous}, {})
    }

        /**
     * implements lodash keyBy in es6. returns a dictionary of lists
     * @param list 
     * @param keyFunction function to return a key based string for each entry.
     */
    public static keyByFromFunction<T>(list: T[], keyFunction: (T) => string): Record<string, T> {
        return list.reduce( (previous, current) => { previous[keyFunction(current)] = current; return previous}, {})
    }

    /**
     * Check if the input value is numeric.
     * Solution comes from http://stackoverflow.com/questions/18082/validate-decimal-numbers-in-javascript-isnumeric
     * @param value
     */
    public static isNumeric(value: any): boolean {
        return !isNaN(parseFloat(value)) && isFinite(value);
    }


    /**
     * Extract resolved property from nested object.
     *   e.g. result({ 'a': { 'b': { 'c': 1 } } }, "a.b.c") returns 1
     * Lodash version of result does not work here because b and c might
     * be function where _.result only call function when it is the last
     * element in the chain.
     * @param item
     * @param propertyPath
     */
    public static result(item: any, propertyPath: string) {
        let value = item;
        propertyPath.split(".").forEach(path => { 
            if(typeof value[path] === 'function'){
                value = value[path]();
            }else{
                value = value[path];
            }
        });
        return value;
    }

    /**
     * Check if a giving object represents a Badge object
     * @param item
     */
    public static isBadge(item: any) {
        return item && item.hasOwnProperty("text") && item.hasOwnProperty("badgeId");
    }

    public static injectLink(textToReplace: string, replaceText: string, url: string, title: string): string {
        return textToReplace.replace(replaceText, `<a title=${title} ng-href="${url}" ">${replaceText}</a>`);
    }

    public static isSingleURL(str: string): boolean {
        return Utils.SingleUrlRegExp.test(str.toLowerCase());
    }

    // Convert a hex string to a byte array
    public static hexToBytes(hex) {
        let bytes = [];
        for (let c = 0; c < hex.length; c += 2) {
            let value = parseInt(hex.substr(c, 2), 16);
            if (!_.isNaN(value) && value >= 0) {
                bytes.push(value);
            }
        }
        return bytes;
    }

    // Convert a byte array to a hex string
    public static bytesToHex(bytes: number[], maxLength: number = Number.MAX_VALUE) {
        let maxBytes = bytes.slice(0, maxLength);
        let hex = [];
        for (let i = 0; i < maxBytes.length; i++) {
            hex.push((bytes[i]).toString(16));
        }
        return hex.join("") + (bytes.length > maxLength ? "..." : "");
    }

    public static getFriendlyFileSize(fileSizeinBytes: number) {
        let displayFileSize: string;
        let byte = 1;
        let kiloByte = 1024 * byte;
        let megaByte = 1024 * kiloByte;
        let gigaByte = 1024 * megaByte;
        let teraByte = 1024 * gigaByte;
        if (fileSizeinBytes <= kiloByte) {
            displayFileSize = fileSizeinBytes + " Bytes";
        } else if (fileSizeinBytes < megaByte) {
            displayFileSize = (fileSizeinBytes / kiloByte).toFixed(2) + " KB";
        } else if (fileSizeinBytes < gigaByte) {
            displayFileSize = (fileSizeinBytes / megaByte).toFixed(2) + " MB";
        } else if (fileSizeinBytes < teraByte) {
            displayFileSize = (fileSizeinBytes / gigaByte).toFixed(2) + " GB";
        } else {
            displayFileSize = (fileSizeinBytes / teraByte).toFixed(2) + " TB";
        }

        return displayFileSize;
    }
}

