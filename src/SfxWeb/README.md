# SfxWeb

This project uses [Angular CLI](https://github.com/angular/angular-cli) 22.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `npm run build` to build the project. The build artifacts will be stored in the `dist/` directory. Run `npm run build:prod` for a production build.

## Running unit tests

Run `npm test -- --watch=false` to execute the unit tests once via Vitest.

## Running end-to-end tests

Run `npm run cy:run` to execute the end-to-end tests via Cypress.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).


## Overview of npm scripts

### build scripts

```
build - Creates a dev build 
build:prod - Creates a production build to be consumed by SF. no output hashing is used because it makes it easier to diff for generated file differences and cache busting isnt necessary
build:accesstesting - Creates a build meant to be served by an azure web app using the sfx-proxy folder. This build is used to make it easier to do azure accessibility testing and avoid testing through a real SF cluster.

```


### test scripts
```
test - runs standard angular unit tests
cypress:local - opens E2E testing dashboard and is pointed at the local angular dev server.
```

### code coverage
```
Run the Cypress coverage workflow, then run `npm run test:coverage` to generate the report.
```

### CI scripts

```
ci:start-server - starts a local http server for serving angular files. This is a lighter weight solution than using the dev server for CI.
ci:test-build generates a build which is easier to server outside of the angular dev server and does not use beta.html
ci:test - runs the Vitest unit tests once
ci:cy-run - This will use a lib that will start a local server and wait for it to be responsive and then start cypress E2E tests
```

### util scripts

```
lint - runs ESLint
```
