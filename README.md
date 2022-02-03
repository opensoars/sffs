# `sffs`

Save File FTP Sync

## What?

Simple command line tool to help with remote FTP server "save and deploy".

## Why?

Because many existing tools are inconsistent with regards to their performance. They randomly drop SFTP connections, they can't create directories, they can't recursively create parent directories, they can't upload on file change, etc etc.

Sometimes me and the people I work with want to simply just work on a (simple and cheaply hosted) production enviroment straight from our local machine. (Oh no so dangerous oh no bla bla... Why don't you have \*insert one billion devops/ci/etc tools here\* set up for your project??! If you are like this, please realize that **ffs** is actually in the name of this project.)

## How?

When `sffs` gets started it tries to recursively mirror all **directories** in the current directory. This in order to be able to write **files**.

When a **file** or **directory name** change gets detected it will upload that **file** or **directory** to the FTP server.

Old **files** or **directories** don't get deleted from the FTP server when you rename them. (@TODO decide whether this is something to do)

## Dependencies

- Node.js & npm
- lftp

## Install

`npm install -g opensoars_sffs`

## Use

- Create a `.sffs` file from the directory you plan to run `sffs` from, according to the `.sffs_example` file in the root of this project.
- Run the `sffs` command from the directory that you created a `.sffs` file in.
- Enjoy the benefits of ultra fast production development/deployment (aka, providing value and making money) (use at your own risk :))
