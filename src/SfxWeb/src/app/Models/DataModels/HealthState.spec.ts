// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { HealthState, HealthStateUtils, IHealthAware } from './HealthState';

describe('HealthState', () => {
    describe('constructor', () => {
        it('should create a HealthState with Ok state', () => {
            const state = new HealthState('Ok');
            expect(state.state).toBe('Ok');
            expect(state.evaluations).toEqual([]);
        });

        it('should create a HealthState with evaluations', () => {
            const evaluations = [{ Kind: 'Event', Description: 'test', AggregatedHealthState: 'Ok', UnhealthyEvent: null, UnhealthyEvaluations: [], ConsiderWarningAsError: false }];
            const state = new HealthState('Warning', evaluations);
            expect(state.state).toBe('Warning');
            expect(state.evaluations).toEqual(evaluations);
        });
    });

    describe('fromRawState', () => {
        it('should normalize OK to Ok', () => {
            const state = HealthState.fromRawState('OK');
            expect(state.state).toBe('Ok');
        });

        it('should normalize Warning to Warning', () => {
            const state = HealthState.fromRawState('Warning');
            expect(state.state).toBe('Warning');
        });

        it('should normalize Error to Error', () => {
            const state = HealthState.fromRawState('Error');
            expect(state.state).toBe('Error');
        });

        it('should normalize Unknown to Unknown', () => {
            const state = HealthState.fromRawState('Unknown');
            expect(state.state).toBe('Unknown');
        });

        it('should normalize Invalid to Invalid', () => {
            const state = HealthState.fromRawState('Invalid');
            expect(state.state).toBe('Invalid');
        });

        it('should handle null/undefined as Unknown', () => {
            expect(HealthState.fromRawState(null).state).toBe('Unknown');
            expect(HealthState.fromRawState(undefined).state).toBe('Unknown');
            expect(HealthState.fromRawState('').state).toBe('Unknown');
        });

        it('should handle case-insensitive input', () => {
            expect(HealthState.fromRawState('ok').state).toBe('Ok');
            expect(HealthState.fromRawState('WARNING').state).toBe('Warning');
            expect(HealthState.fromRawState('eRrOr').state).toBe('Error');
        });

        it('should handle unrecognized values as Unknown', () => {
            expect(HealthState.fromRawState('SomeRandomValue').state).toBe('Unknown');
        });
    });

    describe('isHealthy', () => {
        it('should return true for Ok state', () => {
            const state = new HealthState('Ok');
            expect(state.isHealthy).toBe(true);
        });

        it('should return false for Warning state', () => {
            const state = new HealthState('Warning');
            expect(state.isHealthy).toBe(false);
        });

        it('should return false for Error state', () => {
            const state = new HealthState('Error');
            expect(state.isHealthy).toBe(false);
        });

        it('should return false for Unknown state', () => {
            const state = new HealthState('Unknown');
            expect(state.isHealthy).toBe(false);
        });
    });

    describe('hasWarnings', () => {
        it('should return true for Warning state', () => {
            const state = new HealthState('Warning');
            expect(state.hasWarnings).toBe(true);
        });

        it('should return false for Ok state', () => {
            const state = new HealthState('Ok');
            expect(state.hasWarnings).toBe(false);
        });

        it('should return false for Error state', () => {
            const state = new HealthState('Error');
            expect(state.hasWarnings).toBe(false);
        });
    });

    describe('hasErrors', () => {
        it('should return true for Error state', () => {
            const state = new HealthState('Error');
            expect(state.hasErrors).toBe(true);
        });

        it('should return false for Ok state', () => {
            const state = new HealthState('Ok');
            expect(state.hasErrors).toBe(false);
        });

        it('should return false for Warning state', () => {
            const state = new HealthState('Warning');
            expect(state.hasErrors).toBe(false);
        });
    });

    describe('isUnknown', () => {
        it('should return true for Unknown state', () => {
            const state = new HealthState('Unknown');
            expect(state.isUnknown).toBe(true);
        });

        it('should return true for Invalid state', () => {
            const state = new HealthState('Invalid');
            expect(state.isUnknown).toBe(true);
        });

        it('should return false for Ok state', () => {
            const state = new HealthState('Ok');
            expect(state.isUnknown).toBe(false);
        });

        it('should return false for Warning state', () => {
            const state = new HealthState('Warning');
            expect(state.isUnknown).toBe(false);
        });

        it('should return false for Error state', () => {
            const state = new HealthState('Error');
            expect(state.isUnknown).toBe(false);
        });
    });

    describe('isUnhealthy', () => {
        it('should return false for Ok state', () => {
            const state = new HealthState('Ok');
            expect(state.isUnhealthy).toBe(false);
        });

        it('should return true for Warning state', () => {
            const state = new HealthState('Warning');
            expect(state.isUnhealthy).toBe(true);
        });

        it('should return true for Error state', () => {
            const state = new HealthState('Error');
            expect(state.isUnhealthy).toBe(true);
        });

        it('should return true for Unknown state', () => {
            const state = new HealthState('Unknown');
            expect(state.isUnhealthy).toBe(true);
        });
    });

    describe('hasUnhealthyEvaluations', () => {
        it('should return false for empty evaluations', () => {
            const state = new HealthState('Ok', []);
            expect(state.hasUnhealthyEvaluations).toBe(false);
        });

        it('should return true for non-empty evaluations', () => {
            const evaluations = [{ Kind: 'Event', Description: 'test', AggregatedHealthState: 'Warning', UnhealthyEvent: null, UnhealthyEvaluations: [], ConsiderWarningAsError: false }];
            const state = new HealthState('Warning', evaluations);
            expect(state.hasUnhealthyEvaluations).toBe(true);
        });

        it('should return false for null evaluations', () => {
            const state = new HealthState('Ok', null);
            expect(state.hasUnhealthyEvaluations).toBe(false);
        });
    });

    describe('asConstant', () => {
        it('should return OK for Ok state', () => {
            const state = new HealthState('Ok');
            expect(state.asConstant).toBe('OK');
        });

        it('should return Warning for Warning state', () => {
            const state = new HealthState('Warning');
            expect(state.asConstant).toBe('Warning');
        });

        it('should return Error for Error state', () => {
            const state = new HealthState('Error');
            expect(state.asConstant).toBe('Error');
        });

        it('should return Unknown for Unknown state', () => {
            const state = new HealthState('Unknown');
            expect(state.asConstant).toBe('Unknown');
        });

        it('should return Invalid for Invalid state', () => {
            const state = new HealthState('Invalid');
            expect(state.asConstant).toBe('Invalid');
        });
    });

    describe('sortValue', () => {
        it('should return correct sort values', () => {
            expect(new HealthState('Ok').sortValue).toBe(0);
            expect(new HealthState('Unknown').sortValue).toBe(1);
            expect(new HealthState('Invalid').sortValue).toBe(1);
            expect(new HealthState('Warning').sortValue).toBe(2);
            expect(new HealthState('Error').sortValue).toBe(3);
        });
    });

    describe('compareTo', () => {
        it('should compare health states correctly', () => {
            const ok = new HealthState('Ok');
            const warning = new HealthState('Warning');
            const error = new HealthState('Error');

            expect(ok.compareTo(warning)).toBeLessThan(0);
            expect(warning.compareTo(ok)).toBeGreaterThan(0);
            expect(ok.compareTo(ok)).toBe(0);
            expect(warning.compareTo(error)).toBeLessThan(0);
            expect(error.compareTo(warning)).toBeGreaterThan(0);
        });
    });

    describe('worst', () => {
        it('should return the worst health state', () => {
            const ok = new HealthState('Ok');
            const warning = new HealthState('Warning');
            const error = new HealthState('Error');

            expect(ok.worst(warning)).toBe(warning);
            expect(warning.worst(ok)).toBe(warning);
            expect(warning.worst(error)).toBe(error);
            expect(error.worst(warning)).toBe(error);
        });
    });

    describe('toString', () => {
        it('should return the state as string', () => {
            expect(new HealthState('Ok').toString()).toBe('Ok');
            expect(new HealthState('Warning').toString()).toBe('Warning');
            expect(new HealthState('Error').toString()).toBe('Error');
        });
    });
});

describe('HealthStateUtils', () => {
    describe('getWorstHealthState', () => {
        it('should return Ok for empty array', () => {
            const result = HealthStateUtils.getWorstHealthState([]);
            expect(result.state).toBe('Ok');
        });

        it('should return Ok for null array', () => {
            const result = HealthStateUtils.getWorstHealthState(null);
            expect(result.state).toBe('Ok');
        });

        it('should find the worst health state', () => {
            const entities: IHealthAware[] = [
                { healthStateValue: new HealthState('Ok'), isHealthy: true },
                { healthStateValue: new HealthState('Warning'), isHealthy: false },
                { healthStateValue: new HealthState('Ok'), isHealthy: true }
            ];
            const result = HealthStateUtils.getWorstHealthState(entities);
            expect(result.state).toBe('Warning');
        });

        it('should handle entities with null healthStateValue', () => {
            const entities: IHealthAware[] = [
                { healthStateValue: new HealthState('Ok'), isHealthy: true },
                { healthStateValue: null, isHealthy: false }
            ];
            const result = HealthStateUtils.getWorstHealthState(entities);
            expect(result.state).toBe('Ok');
        });
    });

    describe('aggregateHealthStates', () => {
        it('should return Ok for empty array', () => {
            const result = HealthStateUtils.aggregateHealthStates([]);
            expect(result.state).toBe('Ok');
        });

        it('should find the worst health state', () => {
            const states = [
                new HealthState('Ok'),
                new HealthState('Error'),
                new HealthState('Warning')
            ];
            const result = HealthStateUtils.aggregateHealthStates(states);
            expect(result.state).toBe('Error');
        });
    });

    describe('countByHealthState', () => {
        it('should return zeros for empty array', () => {
            const result = HealthStateUtils.countByHealthState([]);
            expect(result).toEqual({ ok: 0, warning: 0, error: 0, unknown: 0 });
        });

        it('should return zeros for null array', () => {
            const result = HealthStateUtils.countByHealthState(null);
            expect(result).toEqual({ ok: 0, warning: 0, error: 0, unknown: 0 });
        });

        it('should count entities by health state', () => {
            const entities: IHealthAware[] = [
                { healthStateValue: new HealthState('Ok'), isHealthy: true },
                { healthStateValue: new HealthState('Ok'), isHealthy: true },
                { healthStateValue: new HealthState('Warning'), isHealthy: false },
                { healthStateValue: new HealthState('Error'), isHealthy: false },
                { healthStateValue: new HealthState('Unknown'), isHealthy: false }
            ];
            const result = HealthStateUtils.countByHealthState(entities);
            expect(result).toEqual({ ok: 2, warning: 1, error: 1, unknown: 1 });
        });

        it('should count entities with null healthStateValue as unknown', () => {
            const entities: IHealthAware[] = [
                { healthStateValue: new HealthState('Ok'), isHealthy: true },
                { healthStateValue: null, isHealthy: false }
            ];
            const result = HealthStateUtils.countByHealthState(entities);
            expect(result).toEqual({ ok: 1, warning: 0, error: 0, unknown: 1 });
        });
    });
});
