//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    describe("TimeUtils tests", () => {

        it("getDuration returns correct duration string", () => {
            expect(TimeUtils.getDuration("1.4")).toBe("0.00:00:00.1.4");
            expect(TimeUtils.getDuration("25")).toBe("0.00:00:00.25");
            expect(TimeUtils.getDuration("1000")).toBe("0.00:00:01.0");
            expect(TimeUtils.getDuration("60000")).toBe("0.00:01:00.0");
            expect(TimeUtils.getDuration("3600000")).toBe("0.01:00:00.0");
            expect(TimeUtils.getDuration("86400000")).toBe("1.00:00:00.0");
            expect(TimeUtils.getDuration("86400001")).toBe("1.00:00:00.1");
            expect(TimeUtils.getDuration("90061001")).toBe("1.01:01:01.1");

            expect(TimeUtils.getDuration(86400001)).toBe("1.00:00:00.1");
            expect(TimeUtils.getDuration(90061001)).toBe("1.01:01:01.1");

            expect(TimeUtils.getDuration(922337203683999)).toBe("10675199.02:48:03.999");
            expect(TimeUtils.getDuration(922337203684000)).toBe("10675199.02:48:04.0");
            expect(TimeUtils.getDuration(922337203685477.5)).toBe("10675199.02:48:05.477.5");
            expect(TimeUtils.getDuration(922337203685477.5807)).toBe("Infinity");
            expect(TimeUtils.getDuration(922337203685477.6)).toBe("Infinity");
            expect(TimeUtils.getDuration("P10675199DT2H48M5.4775S")).toBe("10675199.02:48:05.477.5");
            expect(TimeUtils.getDuration("P10675199DT2H48M5.4775807S")).toBe("Infinity");
            expect(TimeUtils.getDuration("P10675199DT2H48M5.4776S")).toBe("Infinity");

            expect(TimeUtils.getDuration("P1Y")).toBe("365.00:00:00.0");
            expect(TimeUtils.getDuration("P0D")).toBe("0.00:00:00.0");
            expect(TimeUtils.getDuration("P1D")).toBe("1.00:00:00.0");
            expect(TimeUtils.getDuration("PT1H")).toBe("0.01:00:00.0");
            expect(TimeUtils.getDuration("PT1H35M32.91S")).toBe("0.01:35:32.910");
            expect(TimeUtils.getDuration("PT1M")).toBe("0.00:01:00.0");
            expect(TimeUtils.getDuration("PT1S")).toBe("0.00:00:01.0");
            expect(TimeUtils.getDuration("P1DT2H3M4.5S")).toBe("1.02:03:04.500");
        });


        it("getDurationInSeconds returns correct duration values", () => {
            expect(TimeUtils.getDurationFromSeconds("86400")).toBe("1.00:00:00.0");
        });


        it("timestampToUTCString returns correct datetime values", () => {
            expect(TimeUtils.timestampToUTCString("2017-04-28T02:30:38.307Z")).toBe("Fri, 28 Apr 2017 02:30:38 GMT");
            expect(TimeUtils.timestampToUTCString("0001-01-01T00:00:00.000Z")).toBe(Constants.InvalidTimestamp);
        });
        

    });
}