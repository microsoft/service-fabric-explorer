//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    // TODO:
    //   1. Upgrade moment and remove this when issue https://github.com/moment/moment/issues/3763 gets resolved
    //   2. Import moment from tsconfig.json
    declare var moment: any;

    export class TimeUtils {
        // Per email thread, this is:
        //     int64.max / 10000000 = 922337203685477.5807;
        public static MaxDurationInMilliseconds: number = 922337203685477.5807;

        public static AddDays(toDate: Date, days: number): Date {
            let date = new Date(toDate.valueOf());
            date.setDate(date.getDate() + days);
            return date;
        }

        /**
         * Format the input duration as ASP.NET time span format: "[days].[hours]:[minutes]:[seconds].[milliseconds].
         * If format is not numeric or ISO 8601, return as is.
         * @param duration either in ISO 8601 format (P10675199DT2H48M5.4775806S) or in milliseconds.
         */
        public static getDuration(duration: any) {

            let momentDuration;
            if (_.isFinite(duration)) {
                // Finite number in milliseconds
                momentDuration = moment.duration(duration);
            } else if (Utils.isNumeric(duration)) {
                // Numeric representation in string
                momentDuration = moment.duration(parseFloat(<string>duration));
            } else {
                // ISO 8601 format string
                momentDuration = moment.duration(duration);
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
         * @param datetime js Date object.
         */
        public static datetimeToString(datetime: Date): string {
            return moment(datetime).format("MMM D, YYYY [at] h:mm:ss A (ZZ)");
        }

        /**
         * Format the input timestamp as UTC string e.g. "Fri, 28 Apr 2017 02:30:38 GMT"
         * @param timestamp in UTC datetime format e.g. "2017-04-28T02:30:38.307Z"
         */
        public static timestampToUTCString(timestamp: string): string {
            let date = moment.utc(timestamp);
            return !date.isValid() || date.year() === 1 ? Constants.InvalidTimestamp : date.toDate().toUTCString();
        }

        /**
         * Format the input duration as ASP.NET time span format: "[days].[hours]:[minutes]:[seconds].[milliseconds].
         * @param duration moment.duration object
         */
        private static formatDurationAsAspNetTimespan(duration: any): string {
            if (duration.asMilliseconds() >= TimeUtils.MaxDurationInMilliseconds) {
                return Constants.DurationInfinity;
            }

            return `${Math.floor(duration.asDays())}.`
                + `${_.padStart(Math.floor(duration.hours()).toString(), 2, "0")}:`
                + `${_.padStart(Math.floor(duration.minutes()).toString(), 2, "0")}:`
                + `${_.padStart(Math.floor(duration.seconds()).toString(), 2, "0")}.`
                + `${duration.milliseconds()}`;
        }
    }
}
