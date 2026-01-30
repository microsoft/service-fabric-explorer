// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { Constants } from '../Common/Constants';
import { Utils } from './Utils';
import dayjs from 'dayjs';
import { Duration } from 'luxon';

export class TimeUtils {
    // Per email thread, this is:
    //     int64.max / 10000000 = 922337203685477.5807;
    public static MaxDurationInMilliseconds = 922337203685477.5807;

    public static AddSeconds(toDate: Date, seconds: number): Date {
        const date = new Date(toDate.valueOf());
        date.setTime(date.getTime() + (seconds * 1000));
        return date;
    }

    public static AddHours(toDate: Date, hours: number): Date {
        const date = new Date(toDate.valueOf());
        date.setTime(date.getTime() + (hours * 1000 * 60 * 60));
        return date;
    }

    public static AddDays(toDate: Date, days: number): Date {
        const date = new Date(toDate.valueOf());
        date.setDate(date.getDate() + days);
        return date;
    }

    public static getDurationMilliseconds(duration: any): number{

        let momentDuration;
        if (Number.isFinite(duration)) {
            // Finite number in milliseconds
            momentDuration = duration;
        } else if (Utils.isNumeric(duration)) {
            // Numeric representation in string
            momentDuration = parseFloat(duration as string);
        } else {
            // ISO 8601 format string
            momentDuration = Duration.fromISO(duration).as('milliseconds');
        }
        return momentDuration;
    }

    /**
     * Format the input duration as ASP.NET time span format: "[days].[hours]:[minutes]:[seconds].[milliseconds].
     * If format is not numeric or ISO 8601, return as is.
     * @param duration either in ISO 8601 format (P10675199DT2H48M5.4775806S) or in milliseconds.
     */
    public static getDuration(duration: any) {

        let momentDuration;
        if (Number.isFinite(duration)) {
            // Finite number in milliseconds
            momentDuration = duration;
        } else if (Utils.isNumeric(duration)) {
            // Numeric representation in string
            momentDuration = parseFloat(duration as string);
        } else {
            // ISO 8601 format string
            momentDuration = Duration.fromISO(duration).as('milliseconds');
        }

        return this.formatDurationAsAspNetTimespan(momentDuration);
    }

    /**
     * Format the input duration as ASP.NET time span format: "[days].[hours]:[minutes]:[seconds].[milliseconds].
     * @param duration number in seconds.
     */
    public static getDurationFromSeconds(duration: string) {
        return this.getDuration(parseFloat(duration) * 1000);
    }

    /**
     * Format the input datetime as string e.g. "Fri, 28 Apr 2017 02:30:38 PST"
     * @param datetime date formatted string.
     */
    public static datetimeToString(datetime: string): string {
        const d = new Date(datetime);
        return  d.toLocaleString() + `(${-1 * (d.getTimezoneOffset() / 60)}00)`; // moment(datetime).format("MMM D, YYYY [at] h:mm:ss A (ZZ)");
    }

    /**
     * Format the input timestamp as UTC string e.g. "Fri, 28 Apr 2017 02:30:38 GMT"
     * @param timestamp in UTC datetime format e.g. "2017-04-28T02:30:38.307Z"
     */
    public static timestampToUTCString(timestamp: string): string {
        return dayjs(timestamp).toISOString();
    }

    /**
     * Format the input duration as ASP.NET time span format: "[days].[hours]:[minutes]:[seconds].[milliseconds].
     * @param duration number
     */
    public static formatDurationAsAspNetTimespan(duration: number): string {
        if (duration >= TimeUtils.MaxDurationInMilliseconds) {
            return Constants.DurationInfinity;
        }

        const milliseconds = duration % 1000;
        const seconds = duration / 1000;
        const minutes = seconds / 60;
        const hours = minutes / 60;
        const days = hours / 24;

        if ( duration < 1000) {
            return `${milliseconds} milliseconds`;
        }

        if ( duration < (60 * 1000) ) {
            return `${seconds} seconds`;
        }


        if ( duration < (60 * 60 * 1000) ) {
            return `${this.formatIndividualTime(minutes % 60, 0)}:`
            + `${this.formatIndividualTime(seconds % 60, 2, 2)} minutes`;
        }

        if ( duration < (60 * 60 * 1000 * 24) ) {
            return `${Math.floor(hours % 24)}:`
            + `${this.formatIndividualTime(minutes % 60)}:`
            + `${this.formatIndividualTime(seconds % 60, 2, 2)}`
            + ` hours`;
        }

        return `${Math.floor(days) > 0 ? Math.floor(days) + ' days ' : ''}`
            + `${this.formatIndividualTime(hours % 24)}:`
            + `${this.formatIndividualTime(minutes % 60)}:`
            + `${this.formatIndividualTime(seconds % 60, 2, 2)}`;
    }

    private static formatIndividualTime(duration: number, padStart = 2, substringSize: number = 0) {
        let floored = Math.floor(duration).toString();
        if (substringSize > 0) {
            floored = floored.substring(0, substringSize);
        }
        return floored.padStart(padStart, '0');
    }
}

