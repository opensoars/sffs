#!/usr/bin/env node

const fs = require('fs');
const { spawn } = require('child_process');

const chokidar = require('chokidar');
const dotenv = require('dotenv');

const { CLIENT_NAME, SFTP_URL, DEBUG: _DEBUG, REMOTE_DIR } = dotenv.parse(
  fs.readFileSync(`${process.cwd()}/.sffs`).toString()
);
const DEBUG = _DEBUG === 'true';

if (CLIENT_NAME) console.log('\nclient:', CLIENT_NAME, '\n');

chokidar
  .watch('.', {
    // @TODO get (extend?) this from .sffs
    ignored: ['node_modules', /(^|[\/\\])\../]
  })
  .on('all', (event, path) => {
    if (event === 'addDir') {
      if (path !== '.') {
        handleAddDir(path);
      }
    } else if (event === 'change') {
      // @TODO add event === 'add' here?
      handleChange(path);
    } else if (event === 'unlink') {
      handleUnlink(path);
    } else if (event === 'unlinkDir') {
      handleUnlinkDir(path);
    }
  });

function handleAddDir(path) {
  console.log('+', path);

  const dirToCreate = `${path}`;

  // @TODO have one function for the lftp spawn
  const lftpArgs = [
    DEBUG ? '-d' : '',
    '-e',
    // @TODO get (extend?) from .sffs
    `set net:max-retries 10; set net:timeout 5;` +
      `set net:reconnect-interval-multiplier 1;` +
      `set net:reconnect-interval-base 5;` +
      `cd ${REMOTE_DIR};` +
      `mkdir -p ${dirToCreate};` +
      `&& exit`,
    SFTP_URL
  ];

  const lftp = spawn('lftp', lftpArgs);

  lftp.stdout.on('data', data => {
    if (DEBUG) console.log(`+ - stdout: ${data}`);
  });

  lftp.stderr.on('data', data => {
    if (DEBUG) console.error(`+ - stderr: ${data}`);
  });

  lftp.on('close', code => {
    if (code === 0) {
      console.log('+ fullfilled:', path);
    } else {
      console.log('+ rejected:', path);
    }
  });
}

function handleChange(path) {
  console.log('^', path);

  const splitPath = path.split('/');

  const remoteDir =
    splitPath.length === 1
      ? REMOTE_DIR
      : `${REMOTE_DIR}/${splitPath.slice(0, -1).join('/')}`;

  // @TODO have one function for the lftp spawn
  const lftpArgs = [
    DEBUG ? '-d' : '',
    '-e',
    // @TODO get (extend?) from .sffs
    `set net:max-retries 10; set net:timeout 5; ` +
      `set net:reconnect-interval-multiplier 1; ` +
      `set net:reconnect-interval-base 5; ` +
      `put -P -O ${remoteDir} ${path};` +
      `&& exit`,
    SFTP_URL
  ];

  const lftp = spawn('lftp', lftpArgs);

  lftp.stdout.on('data', data => {
    if (DEBUG) console.log(`^ stdout: ${data}`);
  });

  lftp.stderr.on('data', data => {
    if (DEBUG) console.error(`^ stderr: ${data}`);
  });

  lftp.on('close', code => {
    if (code === 0) {
      console.log('^ fullfilled:', path);
    } else {
      console.log('^ rejected:', path);
    }
  });
}

function handleUnlink(path) {
  console.log('-', path);

  // @TODO have one function for the lftp spawn
  const lftpArgs = [
    DEBUG ? '-d' : '',
    '-e',
    // @TODO get (extend?) from .sffs
    `set net:max-retries 10; set net:timeout 5;` +
      `set net:reconnect-interval-multiplier 1;` +
      `set net:reconnect-interval-base 5;` +
      `cd ${REMOTE_DIR};` +
      `rm ${path};` +
      `&& exit`,
    SFTP_URL
  ];

  const lftp = spawn('lftp', lftpArgs);

  lftp.stdout.on('data', data => {
    if (DEBUG) console.log(`+ - stdout: ${data}`);
  });

  lftp.stderr.on('data', data => {
    if (DEBUG) console.error(`+ - stderr: ${data}`);
  });

  lftp.on('close', code => {
    if (code === 0) {
      console.log('+ fullfilled:', path);
    } else {
      console.log('+ rejected:', path);
    }
  });
}

// @TODO implement a queue, so only required lftp commands are run
function handleUnlinkDir(path) {
  console.log('-', path);

  // @TODO have one function for the lftp spawn
  const lftpArgs = [
    DEBUG ? '-d' : '',
    '-e',
    // @TODO get (extend?) from .sffs
    `set net:max-retries 10; set net:timeout 5;` +
      `set net:reconnect-interval-multiplier 1;` +
      `set net:reconnect-interval-base 5;` +
      `cd ${REMOTE_DIR};` +
      `rm -r ${path};` +
      `&& exit`,
    SFTP_URL
  ];

  const lftp = spawn('lftp', lftpArgs);

  lftp.stdout.on('data', data => {
    if (DEBUG) console.log(`+ - stdout: ${data}`);
  });

  lftp.stderr.on('data', data => {
    if (DEBUG) console.error(`+ - stderr: ${data}`);
  });

  lftp.on('close', code => {
    if (code === 0) {
      console.log('+ fullfilled:', path);
    } else {
      console.log('+ rejected:', path);
    }
  });
}
