const fs = require('fs-extra')
const which = require('which')
const { backup } = require('../../../utils/scripts/backup')
const getArg = require('../../../utils/scripts/args')
const { SOURCE_SCRIPT, DEST_SCRIPT } = require('./consts')

// TODO: be careful of file permissions when fs.something()

let exists = false

try {
  fs.lstatSync(DEST_SCRIPT)
  exists = true
  console.log(`${DEST_SCRIPT} already exists`)
} catch (e) {
  if (!e.toString().includes('ENOENT')) {
    // Some other error
    throw e
  }
}

if (exists) {
  try {
    const link = fs.readlinkSync(DEST_SCRIPT)

    if (link === SOURCE_SCRIPT) {
      console.log('already symlinked')
      process.exit(0)
    }
  } catch (_) {
    // DEST_SCRIPT is not a symlink, ignore.
  }
}

if (which.sync('ipfs', { nothrow: true }) !== null) {
  exists = true
}

if (exists) {
  backup(getArg('user-data'), DEST_SCRIPT)
  fs.unlinkSync(DEST_SCRIPT)
  console.log(`${DEST_SCRIPT} removed`)
}

fs.ensureSymlinkSync(SOURCE_SCRIPT, DEST_SCRIPT)
console.log(`${DEST_SCRIPT} symlinked to ${SOURCE_SCRIPT}`)
