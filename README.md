# The Observatory of Anonymity

Source code for the Observatory of anonymity, available online at [https://cpg.doc.ic.ac.uk/observatory/](https://cpg.doc.ic.ac.uk/observatory/).
The Observatory of Anonymity allows users to test their degree of anonymity in 89 different countries.

This is a client-side only application developed in TypeScript. All the computation to run the models are done directly in the browser.
The Observatory uses a statistical model developed in our original article [‘Estimating the success of re-identifications in incomplete datasets using generative models’](https://www.nature.com/articles/s41467-019-10933-3), published in Nature Communications.



## Quick Start

To get the code, and run the application locally on Linux or Mac, try the following:

```shell
 # Get the code from GitLab
 git clone git@github.com:computationalprivacy/observatory.git
 cd observatory

 # Install npm dependencies
 npm install

 # Run the application
 npm run start:dev
```

Then browse to <http://localhost:8080>: you should see the client-side application.

## Overview of the Codebase

| Package | Content Description |
|---------|--------------------------|
| `src/` | Main source files for React App |
| `src/model` | Model files ported to TS from [CorrectMatch.jl](https://github.com/computationalprivacy/CorrectMatch.jl/) |
| `static/mvndst.js` | Numerical integration [algorithm](http://www.math.wsu.edu/faculty/genz/software/fort77/mvndstpack.f) compiled to WebAssembly |

## Technology Stack

The application is currently built with the following technologies:
* **React** - web-application with client side rendering
* **TS** - model generation & uniqueness calculation
* **WebAssembly** - Numerical integration routine

# License

GNU General Public License v3.0

See LICENSE to see the full text.
