#!/usr/bin/env node

const fs = require('fs');
const { spawn } = require('child_process');

// @TODO use opensoars_cls || ezlog

const chokidar = require('chokidar');
const dotenv = require('dotenv');

const {
  CLIENT_NAME,
  SFTP_URL,
  DEBUG: _DEBUG,
  REMOTE_DIR,
  SYNC_FILE_ADD: _SYNC_FILE_ADD,
  IGNORE,
  MAX_RETRIES = 5
} = dotenv.parse(fs.readFileSync(`${process.cwd()}/.sffs`).toString());
const DEBUG = _DEBUG === 'true';
const SYNC_FILE_ADD = _SYNC_FILE_ADD === 'true';

if (CLIENT_NAME) console.log('\nclient:', CLIENT_NAME, '\n');

function spawnLftp(commands, path, logPrefix) {
  console.log(logPrefix, path);

  const lftpArgs = [
    DEBUG ? '-d' : '',
    '-e',
    // @TODO get (extend?) from .sffs
    `set net:max-retries ${MAX_RETRIES}; set net:timeout 5;` +
      `set net:reconnect-interval-multiplier 1;` +
      `set net:reconnect-interval-base 5;` +
      commands +
      `&& exit`,
    SFTP_URL
  ];

  const lftp = spawn('lftp', lftpArgs);

  lftp.stdout.on('data', data => {
    if (DEBUG) console.log(`${logPrefix} - stdout: ${data}`);
  });

  lftp.stderr.on('data', data => {
    if (DEBUG) console.error(`${logPrefix} - stderr: ${data}`);
  });

  lftp.on('close', code => {
    if (code === 0) {
      console.log(`${logPrefix} fullfilled:`, path);
    } else {
      console.log(`${logPrefix} rejected:`, path);
    }
  });
}

const handlers = {
  addDir(path) {
    if (path === '.') return;
    spawnLftp(`cd ${REMOTE_DIR}; mkdir -p ${path};`, path, '+');
  },
  change(path) {
    const splitPath = path.split('/');
    const remoteDir =
      splitPath.length === 1
        ? REMOTE_DIR
        : `${REMOTE_DIR}/${splitPath.slice(0, -1).join('/')}`;

    spawnLftp(`put -P -O ${remoteDir} ${path};`, path, '^');
  },
  unlink(path) {
    spawnLftp(`cd ${REMOTE_DIR}; rm ${path};`, path, '-');
  },
  // @TODO implement a queue, so only required lftp commands are run
  unlinkDir(path) {
    spawnLftp(`cd ${REMOTE_DIR}; rm -r ${path};`, path, '-');
  }
};

/**
 * Start listening
 */
chokidar
  .watch('.', {
    // @TODO don't include node_modules & dot files by default?
    ignored: [
      'node_modules',
      // /(^|[\/\\])\../, // dot files
      '.sffs',
      '.env',
      ...(IGNORE ? IGNORE.split(',') : [])
    ]
  })
  .on('all', (event, path) => {
    if (SYNC_FILE_ADD && event === 'add') {
      handlers['change'](path);
    } else if (handlers[event]) handlers[event](path);
  });
