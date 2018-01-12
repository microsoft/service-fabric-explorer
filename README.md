# Service Fabric Explorer (SFX)

Service Fabric Explorer is an application for inspecting and managing cloud applications and nodes in a Microsoft Azure Service Fabric cluster.

## Installation

Microsoft publishes the following installer packages for SFX:

- Windows
  - https://aka.ms/sfx-windows

- Linux
  - https://aka.ms/sfx-linux-x86
  - https://aka.ms/sfx-linux-x64

For more information about the application and how to use it: https://docs.microsoft.com/en-us/azure/service-fabric/service-fabric-visualizing-your-cluster

## Developer Help and Documentation

Service Fabric Explorer consists of two main components, an Angular based application (Sfx) and an Electron part to host the Angular application (Sfx-Stanalone).

### Preparing the development machine

To develop Service Fabric Explorer, the following components are required.

* Git: https://git-scm.com/
* Python 2: https://www.python.org/
* Node.js (LTS is preferred): https://nodejs.org/
* C++ Compiler
   * Windows: Visual C++ https://www.visualstudio.com/
   * Ubuntu: `sudo apt-get install -y build-essential`

The recommended IDE for Service Fabric Explorer development is VSCode because VSCode is a cross-platform editor, which supports Windows, Linux and macOS. But you can use whatever editor to develop. 

Here's a list of common IDE used.
* VSCode: https://code.visualstudio.com/ 
* Visual Studio: https://www.visualstudio.com/

### Set up the development environment

1. Clone the master branch.
`git clone https://github.com/Azure/service-fabric-explorer.git <path to the local folder>`
2. Install project dependencies: *This can be done inside VSCode or use a console window.*
   1. [SFX] Navigate to `src/Sfx` and run the following scripts.
   ```Shell
   npm install
   npm run bower-install
   ```
   2. [SFX Standalone] Navigate to `src/Sfx-Standalone` and run the following scripts.
   ```Shell
   npm install
   ```
   3. [SFX Tests] Navigate to `test/SfxTests` and run the following scripts.
   ```Shell
   npm install
   npm run bower-install
   ```
3. Build projects
   * VSCode
      1. Open `src/Sfx`, `src/Sfx-Standalone` and `test/SfxTests` in VSCode with multiple-root workspce.
      2. Run following tasks orderly.
         * `clean-build` for Sfx
         * `Clean-Build` for Sfx-Standalone
         * `clean-build` for SfxTests
   * Console
      1. Install Gulp globally on the machine.
      ```Shell
      npm install gulp -g
      ```
      2. [SFX] Navigate to `src/Sfx` and run the following scripts.
      ```Shell
      gulp clean-build
      ```
      3. [SFX Standalone] Navigate to `src/Sfx-Standalone` and run the following scripts.
      ```Shell
      gulp Clean-Build
      ```
      4. [SFX Tests] Navigate to `test/SfxTests` and run the following scripts.
      ```Shell
      gulp clean-build
      ```

### Run unit tests for Sfx

Open `test/SfxTests` in VSCode or Navigate to `test/SfxTests` in console and run the `ut` gulp task.

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

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.microsoft.com.

When you submit a pull request, a CLA-bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., label, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
