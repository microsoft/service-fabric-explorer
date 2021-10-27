# SfxWeb

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 8.3.6.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

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
run both tests.
test and cypress:local to generate coverage files and once both are generated run
npm run test-coverage
```

### CI scripts

```
ci:start-server - starts a local http server for serving angular files. This is a lighter weight solution than using the dev server for CI.
ci:test-build generates a build which is easier to server outside of the angular dev server and does not use beta.html
ci:test - runs unit tests from above but uses a headless browser for faster time
ci:cy-run - This will use a lib that will start a local server and wait for it to be responsive and then start cypress E2E tests
```

### util scripts

```
lint - runs tslint essentially
build:stats - will build the product but the purpose is the generated stats folders which give a break down of bundle size and the largest culprits. Use this to analyze the project when adding significantly larger packages or to see where it is possible to reduce bundle size if there are compiler errors.
analyze - Run after the above script to get a web viewer to more easily evaluate bundle sizes.
```
