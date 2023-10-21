# jupyterlab_box_drive

[![Github Actions Status](https://github.com/tanaga9/jupyterlab-box-drive/workflows/Build/badge.svg)](https://github.com/tanaga9/jupyterlab-box-drive/actions/workflows/build.yml)
A JupyterLab extension.

Browse Box.com storage using [box-javascript-sdk](https://github.com/box-community/box-javascript-sdk) and the Box REST API.

[Demonstration](https://tanaga9.github.io/jupyterlab-box-drive/lab/index.html?path=Getting+Started.ipynb) ([Getting Started.ipynb](files/Getting%20Started.ipynb))

- [Box Dev Console](https://app.box.com/developers/console)
- [Create New App](https://app.box.com/developers/console/newapp)
- [Create a Custom App (OAuth 2.0)](https://developer.box.com/guides/authentication/oauth2/)
    OAuth 2.0 (User or Client Authentication)
- Configuration
    - get OAuth 2.0 Credentials
    - set OAuth 2.0 Redirect URI
        - example: `https://tanaga9.github.io/jupyterlab-box-drive/extensions/jupyterlab-box-drive/static/assets/auth.html`
    - set Application Scopes
        - Read all files and folders stored in Box
        - Write all files and folders stored in Box
    - set CORS Domains
        - example: `https://tanaga9.github.io`

## Concept

![Conceptual diagram](https://raw.githubusercontent.com/tanaga9/jupyterlab-box-drive/main/files/jupyterlab-box-drive.drawio.png)

## Purpose

The first purpose of this extension is to provide access to Box.com storage for [JupyterLite](https://github.com/jupyterlite/jupyterlite).

It probably works fine in jupyterlab.

## Requirements

- JupyterLab >= 3.0

## Install

To install the extension, execute:

```bash
pip install jupyterlab_box_drive
```

## Uninstall

To remove the extension, execute:

```bash
pip uninstall jupyterlab_box_drive
```

## Quick Start with Docker

```
docker build -t jupyterlab-box-drive . && docker run --rm -p 8888:8888 jupyterlab-box-drive
```

## Contributing

### Development install

Note: You will need NodeJS to build the extension package.

The `jlpm` command is JupyterLab's pinned version of
[yarn](https://yarnpkg.com/) that is installed with JupyterLab. You may use
`yarn` or `npm` in lieu of `jlpm` below.

```bash
# Clone the repo to your local environment
# Change directory to the jupyterlab_box_drive directory
# Install package in development mode
pip install -e "."
# Link your development version of the extension with JupyterLab
jupyter labextension develop . --overwrite
# Rebuild extension Typescript source after making changes
jlpm build
```

You can watch the source directory and run JupyterLab at the same time in different terminals to watch for changes in the extension's source and automatically rebuild the extension.

```bash
# Watch the source directory in one terminal, automatically rebuilding when needed
jlpm watch
# Run JupyterLab in another terminal
jupyter lab
```

With the watch command running, every saved change will immediately be built locally and available in your running JupyterLab. Refresh JupyterLab to load the change in your browser (you may need to wait several seconds for the extension to be rebuilt).

By default, the `jlpm build` command generates the source maps for this extension to make it easier to debug using the browser dev tools. To also generate source maps for the JupyterLab core extensions, you can run the following command:

```bash
jupyter lab build --minimize=False
```

### Development uninstall

```bash
pip uninstall jupyterlab_box_drive
```

In development mode, you will also need to remove the symlink created by `jupyter labextension develop`
command. To find its location, you can run `jupyter labextension list` to figure out where the `labextensions`
folder is located. Then you can remove the symlink named `jupyterlab-box-drive` within that folder.

### Testing the extension

#### Frontend tests

This extension is using [Jest](https://jestjs.io/) for JavaScript code testing.

To execute them, execute:

```sh
jlpm
jlpm test
```

#### Integration tests

This extension uses [Playwright](https://playwright.dev/docs/intro/) for the integration tests (aka user level tests).
More precisely, the JupyterLab helper [Galata](https://github.com/jupyterlab/jupyterlab/tree/master/galata) is used to handle testing the extension in JupyterLab.

More information are provided within the [ui-tests](./ui-tests/README.md) README.

### Packaging the extension

See [RELEASE](RELEASE.md)
