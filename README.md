# Service Fabric Explorer (SFX)
Service Fabric Explorer is an application for inspecting and managing cloud applications and nodes in a Microsoft Azure Service Fabric cluster.

## Build Status
Windows | Linux / macOS
------------ | -------------
![Image of Windows Build Badge](https://ci.appveyor.com/api/projects/status/ejfk6b0c3dlunkws/branch/master) | ![Image of Linux/macOS Build Badge](https://travis-ci.org/Microsoft/service-fabric-explorer.svg?branch=master) 

For more information about the application and how to use it: https://docs.microsoft.com/en-us/azure/service-fabric/service-fabric-visualizing-your-cluster
### Preparing the development machine

To develop Service Fabric Explorer, the following components are required.

* Git: https://git-scm.com/
* Node.js (use LTS version): https://nodejs.org/

The recommended IDE for Service Fabric Explorer development is VSCode because VSCode is a cross-platform editor, which supports Windows, Linux and macOS. But you can use whatever editor to develop. 

Here's a list of common IDE used.
* VSCode: https://code.visualstudio.com/ 
* Visual Studio: https://www.visualstudio.com/

### Set up the development environment

1. Clone the master branch.
`git clone --recurse-submodules https://github.com/Microsoft/service-fabric-explorer.git <path to the local folder>`
2. Install project dependencies: *This can be done inside VSCode or use a console window.*
   1. [SFX] install the following [CLI](https://angular.io/cli) for the angular project 
   ```Shell
   npm install -g @angular/cli
   ```
   1. [SFX] Navigate to `src/SfxWeb` and run the following scripts.
   ```Shell
   npm install   
   ```

   1. [SFX Proxy] Navigate to `src/Sfx-Proxy` and run the following scripts.
   ```Shell
   npm install   
   ```

3. Build projects
   * VSCode
      1. Open `src/SfxWeb` and `src/Sfx-Proxy` in VSCode with multiple-root workspce.
   * Console
      1. [SFX] Navigate to `src/SfxWeb` and run the following scripts.
      For a develop/quick build
      ```Shell
      npm run build
      ```
      For a production build
      ```
      npm run build:prod
      ```

### Develop Locally and Run Local Proxy
Navigate to `src/SfxWeb`
```Shell
npm start
```
Navigate to `src/Sfx-Proxy`
```Shell
npm start
```

There are 2 optional flags
-r which would record every request to a folder(by default called playbackRecordings) and overwriting if the same request is made again
-p every request will be checked for a saved response and if one exists get served instead
```Shell
npm start -- -r -p
```

If proxying requests to a secure cluster adding a file called localsettings.json to src/Sfx-Proxy can take a cert pfx location like below.
```
{
  "TargetCluster": {
    "Url": "https://test.eastus.cloudapp.azure.com:19080",
    "PFXLocation": "C:/some_cert.pfx",
    "PFXPassPhrase": "password"
  },
  "recordFileBase": "playbackRecordings/"
}
```


## Testing

### Run unit tests
Navigate to  `src/SfxWeb` folder and run 
```
npm test
```

### Run E2E tests
Navigate to src/SfxWeb folder and run
```
npm run cypress:local
```
This assumes that the angular local dev server is running

### Generate test coverage report
(see the following for reference https://lukas-klement.medium.com/implementing-code-coverage-with-angular-and-cypress-6ed08ed7e617)

Run a full E2E suite above and this will generate a code coverage report.
Navigate to src/SfxWeb folder and run
```
npm run test:coverage
```
Then you can also view a full report at
```
sfxWeb/coverage/lcov-report/index.html
```

### CI overview
The CI will run the following

* production build
* unit tests
* E2E tests

## Issues and questions

For questions related to Azure Service Fabric clusters, take a look at the [tag on StackOverflow](https://stackoverflow.com/questions/tagged/azure-service-fabric)
and [official documentation](https://docs.microsoft.com/en-us/azure/service-fabric/).

### General Service Fabric issues

If your issue is not specific to the Service Fabric Explorer, please use the [Service Fabric issues repository](https://github.com/Azure/service-fabric-issues/issues) to report an issue.

### Service Fabric Explorer specific issues

If your issue is relevant to the Service Fabric Explorer, please use this repositories issue tracker.

Be sure to search for similar previously reported issues prior to creating a new one.
In addition, here are some good practices to follow when reporting issues:

- Add a `+1` reaction to existing issues that are affecting you
- Include detailed output or screenshots when reporting unexpected error messages
- Include the version of SFX installed
- Include the version of Service Fabric runtime for the cluster you have selected

## New ideas and improvements

We encourage everyone to contribute to this project, following the contribution guidelines below. If you have ideas and want to share these with the community before taking on implementing the change, feel free to suggest these using issues.

# Contribution guidelines

For general contribution guidelines, plese see here: https://github.com/Microsoft/service-fabric/blob/master/CONTRIBUTING.md
