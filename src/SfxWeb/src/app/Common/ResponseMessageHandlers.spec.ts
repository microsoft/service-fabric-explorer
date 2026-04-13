import { HttpErrorResponse } from '@angular/common/http';
import { BackupRestoreResponseMessageHandler, GetResponseMessageHandler } from './ResponseMessageHandlers';

// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

describe('ResponseMessageHandlers', () => {
    describe('BackupRestoreResponseMessageHandler', () => {
        let handler: BackupRestoreResponseMessageHandler;

        beforeEach(() => {
            handler = new BackupRestoreResponseMessageHandler();
        });

        fit('should detect E_INVALIDARG with "Invalid API Version" and return enhanced error message', () => {
            const errorResponse = new HttpErrorResponse({
                error: {
                    Error: {
                        Code: 'E_INVALIDARG',
                        Message: 'Invalid API Version'
                    }
                },
                status: 400,
                statusText: 'Bad Request'
            });

            const result = handler.getErrorMessage('Get backup Policies', errorResponse);

            expect(result).toContain('Get backup Policies failed');
            expect(result).toContain('Code: E_INVALIDARG');
            expect(result).toContain('Message: Invalid API Version');
            expect(result).toContain('This error occurs on systems where the decimal separator is a comma');
            expect(result).toContain('Polish, German locales');
            expect(result).toContain('culture-specific number parsing');
            expect(result).toContain('Resolution: Update Service Fabric runtime');
            expect(result).toContain('https://github.com/microsoft/service-fabric/issues/1551');
        });

        fit('should handle case-insensitive "Invalid API Version" message', () => {
            const errorResponse = new HttpErrorResponse({
                error: {
                    Error: {
                        Code: 'E_INVALIDARG',
                        Message: 'invalid api version' // lowercase
                    }
                },
                status: 400,
                statusText: 'Bad Request'
            });

            const result = handler.getErrorMessage('Get backup Policies', errorResponse);

            expect(result).toContain('This error occurs on systems where the decimal separator is a comma');
        });

        fit('should handle "INVALID API VERSION" in all caps', () => {
            const errorResponse = new HttpErrorResponse({
                error: {
                    Error: {
                        Code: 'E_INVALIDARG',
                        Message: 'INVALID API VERSION'
                    }
                },
                status: 400,
                statusText: 'Bad Request'
            });

            const result = handler.getErrorMessage('Enable Application Backup', errorResponse);

            expect(result).toContain('This error occurs on systems where the decimal separator is a comma');
        });

        fit('should fall back to default error handling for non-API-version errors', () => {
            const errorResponse = new HttpErrorResponse({
                error: {
                    Error: {
                        Code: 'E_INVALIDARG',
                        Message: 'Some other error'
                    }
                },
                status: 400,
                statusText: 'Bad Request'
            });

            const result = handler.getErrorMessage('Get backup Policies', errorResponse);

            expect(result).toContain('Get backup Policies failed');
            expect(result).toContain('Code: E_INVALIDARG');
            expect(result).toContain('Message: Some other error');
            expect(result).not.toContain('culture-specific number parsing');
        });

        fit('should fall back to default error handling for different error code', () => {
            const errorResponse = new HttpErrorResponse({
                error: {
                    Error: {
                        Code: 'E_SOME_OTHER_ERROR',
                        Message: 'Invalid API Version'
                    }
                },
                status: 400,
                statusText: 'Bad Request'
            });

            const result = handler.getErrorMessage('Get backup Policies', errorResponse);

            expect(result).toContain('Get backup Policies failed');
            expect(result).toContain('Code: E_SOME_OTHER_ERROR');
            expect(result).not.toContain('culture-specific number parsing');
        });

        fit('should fall back to default error handling for non-400 status', () => {
            const errorResponse = new HttpErrorResponse({
                error: {
                    Error: {
                        Code: 'E_INVALIDARG',
                        Message: 'Invalid API Version'
                    }
                },
                status: 500,
                statusText: 'Internal Server Error'
            });

            const result = handler.getErrorMessage('Get backup Policies', errorResponse);

            expect(result).toContain('Get backup Policies failed');
            expect(result).not.toContain('culture-specific number parsing');
        });

        fit('should handle missing error structure gracefully', () => {
            const errorResponse = new HttpErrorResponse({
                error: null,
                status: 400,
                statusText: 'Bad Request'
            });

            const result = handler.getErrorMessage('Get backup Policies', errorResponse);

            expect(result).toContain('Get backup Policies failed');
            expect(result).toContain('Bad Request');
        });

        fit('should handle missing Error.Message gracefully', () => {
            const errorResponse = new HttpErrorResponse({
                error: {
                    Error: {
                        Code: 'E_INVALIDARG'
                        // Message is missing
                    }
                },
                status: 400,
                statusText: 'Bad Request'
            });

            const result = handler.getErrorMessage('Get backup Policies', errorResponse);

            expect(result).toContain('Get backup Policies failed');
            expect(result).not.toContain('culture-specific number parsing');
        });

        fit('should handle partial error message match', () => {
            const errorResponse = new HttpErrorResponse({
                error: {
                    Error: {
                        Code: 'E_INVALIDARG',
                        Message: 'Error: Invalid API Version specified'
                    }
                },
                status: 400,
                statusText: 'Bad Request'
            });

            const result = handler.getErrorMessage('Get backup Policies', errorResponse);

            expect(result).toContain('culture-specific number parsing');
        });

        fit('should extend GetResponseMessageHandler', () => {
            expect(handler instanceof GetResponseMessageHandler).toBeTruthy();
        });
    });
});
