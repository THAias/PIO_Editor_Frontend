# PIO_Editor_Frontend
[Deutsche version](./README.md)
## Introduction

PIO_Editor_Frontend represents the frontend of the PIO-ULB-Editor web application. The frontend is the second main
component that provides the user interface. The layout of the PIO-ULB Editor was developed in an iterative process by
means of user tests and continuously improved in order to optimize usability. The frontend is built in
React with TypeScript. The frontend basically consists of frontend UI components, the Redux Store and the UUID
service. The individual relevant components and concepts are explained below.


|               |                                                                                                                                                                                                             Description                                                                                                                                                                                                             |
|:-------------:|:-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------:|
| UI-Components | <p align="left"> The user interface (UI) of our application was developed with React and Ant Design <br />to ensure a modern, user-friendly and consistent user experience. The user interface uses ready-made interface <br /> components from the Ant Design library for data input. Thematically related input fields are combined <br /> into an Ant Design form. This enables independent data processing by each form itself. |
|     Redux     |           <p align="left"> Redux is a predictive state container for JavaScript applications, used in particular <br /> with React. It centralizes the application state in a single store, which simplifies the management, <br /> traceability and maintainability of the state. By using pure functions (reducers) and actions, <br /> the state is changed in a predictable way, making debugging and testing easier.           |
| UUID-Service  |                                                                                                                <p align="left"> The UUID service saves all previously created FHIR resources and their UUIDs so that <br /> entered data can always be entered data can always be assigned to the correct resource.                                                                                                                 |

-----------------------------------------------------------------
## Requirements
To quick start the frontend the user must install all dependencies which are listed in the package.json
Open the terminal and install all dependencies with:
```
npm install
```

-----------------------------------------------------------------
## Quick Start

The frontend interacts with the backend repo. Make sure the backend service is provided with docker.
In the backend repo you will find the instruction to start docker.

After you started the backend, open the terminal, change to root directory and start the frontend server with:

```
npm run start
```
Once the server has started successfully, the webserver will host locally on port 3000. The frontend starts on login page.
After the user signs up with its first and last name the user can:
-   create a new PIO file from scratch by clicking on "PIO-ULB erstellen"
-   open an existing PIO file by clicking on "PIO-ULB importieren"
-   create a sample PIO with prefilled forms by clicking on "Demo öffnen"
-   If the user returns back to homepage, the user is able to continue with the opened PIO file by clicking on "Zurück zum PIO-ULB"
-   In the upper right corner the user can open the address-book to manage address data.

-----------------------------------------------------------------
## Useful Scripts

All scripts below are listed in the package.json.

```
npm run start
```
Performs prettier formatting and starts the development environment with specific environment variables.

```
npm run build
```
Runs the TypeScript compiler without output and builds a production version of the application with customized environment variables.

```
npm run build-local
```
Runs the TypeScript compiler without output and creates a local build version of the application with specific environment variables.

```
npm run start:localVersion
```
Performs prettier formatting and starts the development environment with local environment variables.

```
npm run prettier:fix
```
Formats the code in the specified directories with Prettier.

```
npm run prettier:check
```
Checks the code in the specified directories for Prettier formatting.

```
npm run lint
```
Checks and corrects the TypeScript and JavaScript code in the specified directories with TypeScript and ESLint.

```
npm run test:ci
```
Runs Jest tests in CI mode with code coverage reports.

```
npm run test:sec
```
Executes ESLint and creates a JSON report for security analysis.

```
npm run prepare
```
Initializes Husky for Git hooks.

-----------------------------------------------------------------
## Documentation

Since the aim is to record relevant data, the provision of comprehensible input fields and the form-based processing
of the data is the core processing of the data is the core task of the frontend.

Where required, input fields have validation and check the presence of mandatory fields, for example in addition to the forms, which contain the entire
logic for SubTree handling, there are also wrapper components that bundle several input fields in one component.
These wrappers represent modules that can be created multiple times by users in the frontend (e.g. allergies, doctors,
addresses).

So-called accordion menus then render the contents of the wrappers in multiple times.
Another aspect during development was the handling of references. FHIR enables the creation of an information network
by referencing resources using UUIDs.

For example, it can happen that users have to select the responsible doctor in
the diagnosis form where doctors are created in a different form.So that users do not have to jump back and forth if the
diagnosing doctor has not yet been created, the drop-down in the diagnosis form allows a new doctor to be added on the
spot.on the spot.

This information - such as that of the doctors - must be kept synchronized in both forms.
which was realized with the help of the central Redux Store.
