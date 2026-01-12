// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { HealthStateConstants } from 'src/app/Common/Constants';
import { IRawHealthEvaluation, IRawHealthEvent } from '../RawDataTypes';

/**
 * Represents the possible health states for Service Fabric entities.
 */
export type HealthStateValue = 'Ok' | 'Warning' | 'Error' | 'Unknown' | 'Invalid';

/**
 * HealthState encapsulates the health state logic for Service Fabric entities.
 * It provides a unified way to check health status and related properties.
 */
export class HealthState {
    /**
     * Creates a new HealthState instance.
     * @param state The health state value (Ok, Warning, Error, Unknown, Invalid)
     * @param evaluations Optional array of health evaluations that explain the health state
     */
    constructor(
        public readonly state: HealthStateValue,
        public readonly evaluations: IRawHealthEvaluation[] = []
    ) {}

    /**
     * Creates a HealthState from a raw health state string returned by Service Fabric API.
     * @param rawState The raw health state string (e.g., "OK", "Warning", "Error", etc.)
     * @param evaluations Optional array of health evaluations
     */
    public static fromRawState(rawState: string, evaluations: IRawHealthEvaluation[] = []): HealthState {
        const normalizedState = HealthState.normalizeState(rawState);
        return new HealthState(normalizedState, evaluations);
    }

    /**
     * Normalizes a raw health state string to a HealthStateValue.
     */
    private static normalizeState(rawState: string): HealthStateValue {
        if (!rawState) {
            return 'Unknown';
        }

        const upperState = rawState.toUpperCase();
        switch (upperState) {
            case 'OK':
                return 'Ok';
            case 'WARNING':
                return 'Warning';
            case 'ERROR':
                return 'Error';
            case 'UNKNOWN':
                return 'Unknown';
            case 'INVALID':
                return 'Invalid';
            default:
                return 'Unknown';
        }
    }

    /**
     * Returns true if the health state is OK.
     */
    public get isHealthy(): boolean {
        return this.state === 'Ok';
    }

    /**
     * Returns true if the health state is Warning.
     */
    public get hasWarnings(): boolean {
        return this.state === 'Warning';
    }

    /**
     * Returns true if the health state is Error.
     */
    public get hasErrors(): boolean {
        return this.state === 'Error';
    }

    /**
     * Returns true if the health state is Unknown or Invalid.
     */
    public get isUnknown(): boolean {
        return this.state === 'Unknown' || this.state === 'Invalid';
    }

    /**
     * Returns true if the health state is not OK (Warning, Error, Unknown, or Invalid).
     */
    public get isUnhealthy(): boolean {
        return !this.isHealthy;
    }

    /**
     * Returns true if there are any unhealthy evaluations.
     * Note: The double negation (!!) ensures null evaluations returns false, not null.
     */
    public get hasUnhealthyEvaluations(): boolean {
        return !!(this.evaluations && this.evaluations.length > 0);
    }

    /**
     * Gets the health state as a HealthStateConstants value for backward compatibility.
     */
    public get asConstant(): string {
        switch (this.state) {
            case 'Ok':
                return HealthStateConstants.OK;
            case 'Warning':
                return HealthStateConstants.Warning;
            case 'Error':
                return HealthStateConstants.Error;
            case 'Unknown':
                return HealthStateConstants.Unknown;
            case 'Invalid':
                return HealthStateConstants.Invalid;
            default:
                return HealthStateConstants.Unknown;
        }
    }

    /**
     * Gets a numeric value for sorting purposes (higher = worse).
     * Ok: 0, Unknown/Invalid: 1, Warning: 2, Error: 3
     */
    public get sortValue(): number {
        switch (this.state) {
            case 'Ok':
                return 0;
            case 'Unknown':
            case 'Invalid':
                return 1;
            case 'Warning':
                return 2;
            case 'Error':
                return 3;
            default:
                return 1;
        }
    }

    /**
     * Compares this health state with another.
     * Returns a negative number if this is healthier, positive if less healthy, 0 if equal.
     */
    public compareTo(other: HealthState): number {
        return this.sortValue - other.sortValue;
    }

    /**
     * Returns the worst health state between this and another.
     */
    public worst(other: HealthState): HealthState {
        return this.sortValue >= other.sortValue ? this : other;
    }

    /**
     * Returns the string representation of the health state.
     */
    public toString(): string {
        return this.state;
    }
}

/**
 * Interface for entities that have health state.
 * Implementing this interface provides a consistent way to access health information
 * across different Service Fabric entity types.
 */
export interface IHealthAware {
    /**
     * The unified HealthState object for the entity.
     * Provides typed access to health state with convenience methods.
     */
    readonly healthStateValue: HealthState;

    /**
     * Convenience property to check if the entity is healthy (health state is OK).
     */
    readonly isHealthy: boolean;
}

/**
 * Utility functions for working with health states.
 */
export class HealthStateUtils {
    /**
     * Finds the worst health state from an array of health-aware entities.
     * @param entities Array of entities with health state
     * @returns The worst HealthState, or a healthy state if the array is empty
     */
    public static getWorstHealthState(entities: IHealthAware[]): HealthState {
        if (!entities || entities.length === 0) {
            return new HealthState('Ok');
        }

        return entities.reduce((worst, entity) => {
            if (!entity.healthStateValue) {
                return worst;
            }
            return worst.worst(entity.healthStateValue);
        }, new HealthState('Ok'));
    }

    /**
     * Aggregates health states from an array to find the worst one.
     * @param states Array of health states
     * @returns The worst HealthState, or a healthy state if the array is empty
     */
    public static aggregateHealthStates(states: HealthState[]): HealthState {
        if (!states || states.length === 0) {
            return new HealthState('Ok');
        }

        return states.reduce((worst, state) => worst.worst(state), new HealthState('Ok'));
    }

    /**
     * Counts entities by health state.
     * @param entities Array of health-aware entities
     * @returns Object with counts for each health state
     */
    public static countByHealthState(entities: IHealthAware[]): { ok: number; warning: number; error: number; unknown: number } {
        const counts = { ok: 0, warning: 0, error: 0, unknown: 0 };

        if (!entities) {
            return counts;
        }

        entities.forEach(entity => {
            if (!entity.healthStateValue) {
                counts.unknown++;
                return;
            }

            switch (entity.healthStateValue.state) {
                case 'Ok':
                    counts.ok++;
                    break;
                case 'Warning':
                    counts.warning++;
                    break;
                case 'Error':
                    counts.error++;
                    break;
                default:
                    counts.unknown++;
                    break;
            }
        });

        return counts;
    }
}
