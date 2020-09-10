/// <reference types="cypress" />

export const apiUrl = (url) => {
    return `${Cypress.env("API_PREFIX")}${url}`;
} 