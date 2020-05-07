Repository for the Random Agent Picker for Valorant.
This website allows Valorant players to get a random suggestion of which agebt to play based on a selection of agents made by the player.

* **Website:** https://valorantpicker.com

## Bugs and feature requests

If you find any bug or have a feature request, please post it on the [issue section](https://github.com/andrerfcsantos/valorant-agent-picker/issues) of this repository.

## Feedback

Any feedback that is not a bug report or a feature request, please send to valorantpicker@gmail.com.

## Building the site from source

Use these instructions to build the site from the source code and having it run on your own machine or server.

### Prerequisites

* [Node](https://nodejs.org/en/)
* [Vue Cli](https://cli.vuejs.org/guide/installation.html)

### Running the site

* Clone the repo
* `cd` into the repo folder
* `npm install` to install the dependencies
* You can now run the site using `npm` directly or generate static files that can be served by a webserver:
    * `npm run serve` to serve the site on localhost
    * `npm run build --prod` to generate the site static files. This command will put all the files under a `dist` directory. These files should then be put behind a webserver to serve the site.
