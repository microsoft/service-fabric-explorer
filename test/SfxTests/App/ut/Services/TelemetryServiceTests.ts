//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

module Sfx {

    describe("Telemetry Service", () => {

        it("Should enable telemetry for azure hosts", () => {
            expect(TelemetryService.TelemetryEnabledHostsRegex.test("azure.com")).toBe(true);
            expect(TelemetryService.TelemetryEnabledHostsRegex.test("Azure.Com")).toBe(true);
            expect(TelemetryService.TelemetryEnabledHostsRegex.test("azure.com:5000")).toBe(true);
            expect(TelemetryService.TelemetryEnabledHostsRegex.test("www.azure.com")).toBe(true);
            expect(TelemetryService.TelemetryEnabledHostsRegex.test("www.azure.com:5000")).toBe(true);
        });


        it("Should disable telemetry for non azure hosts", () => {
            expect(TelemetryService.TelemetryEnabledHostsRegex.test("windowsazure.com")).toBe(false);
            expect(TelemetryService.TelemetryEnabledHostsRegex.test("azure.cn")).toBe(false);
            expect(TelemetryService.TelemetryEnabledHostsRegex.test("azure.com.cn")).toBe(false);
        });

    });
}


