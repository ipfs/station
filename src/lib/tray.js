import { store, logger, i18n } from '../utils'
import { Menu, Tray, shell, app, ipcMain } from 'electron'
import path from 'path'
import os from 'os'

function buildMenu ({ checkForUpdates, launchWebUI }) {
  return Menu.buildFromTemplate([
    ...[
      ['ipfsIsStarting', 'yellow'],
      ['ipfsIsRunning', 'green'],
      ['ipfsIsStopping', 'yellow'],
      ['ipfsIsNotRunning', 'gray'],
      ['ipfsHasErrored', 'red']
    ].map(([status, color]) => ({
      id: status,
      label: i18n.t(status),
      visible: false,
      enabled: false,
      icon: path.resolve(path.join(__dirname, `../icons/status/${color}.png`))
    })),
    {
      label: i18n.t('about'),
      click: () => { shell.openExternal('https://github.com/ipfs-shipyard/ipfs-desktop/blob/master/README.md') }
    },
    { type: 'separator' },
    {
      label: i18n.t('viewStatus'),
      click: () => { launchWebUI('/') }
    },
    {
      label: i18n.t('viewFiles'),
      click: () => { launchWebUI('/files') }
    },
    {
      label: i18n.t('viewSettings'),
      click: () => { launchWebUI('/settings') }
    },
    { type: 'separator' },
    {
      label: i18n.t('advanced'),
      submenu: [
        {
          id: 'startIpfs',
          label: i18n.t('startIpfs'),
          click: () => { ipcMain.emit('startIpfs') },
          visible: false
        },
        {
          id: 'stopIpfs',
          label: i18n.t('stopIpfs'),
          click: () => { ipcMain.emit('stopIpfs') },
          visible: false
        },
        {
          label: i18n.t('openLogsDir'),
          click: () => { shell.openItem(app.getPath('userData')) }
        },
        {
          label: i18n.t('openRepoDir'),
          click: () => { shell.openItem(store.get('ipfsConfig.path')) }
        },
        {
          label: i18n.t('openConfigFile'),
          click: () => { shell.openItem(store.path) }
        },
        {
          label: i18n.t('checkForUpdates'),
          click: () => { checkForUpdates() }
        },
        {
          label: i18n.t('versions'),
          enabled: false
        },
        {
          label: `ipfs-desktop ${require('../../package.json').version}`,
          click: () => { shell.openExternal('https://github.com/ipfs-shipyard/ipfs-desktop/releases') }
        },
        {
          label: `go-ipfs ${require('../../package.json').dependencies['go-ipfs-dep']}`,
          click: () => { shell.openExternal('https://github.com/ipfs/go-ipfs/releases') }
        }
      ]
    },
    {
      label: i18n.t('quit'),
      click: () => { app.quit() }
    }
  ])
}

function icon (color) {
  const p = path.resolve(path.join(__dirname, '../icons/tray'))

  if (os.platform() === 'darwin') {
    return path.join(p, `${color}.png`)
  }

  return path.join(p, `${color}-big.png`)
}

export default function (ctx) {
  logger.info('[tray] starting')
  const tray = new Tray(icon('black'))
  let menu = null
  let status = {}

  if (os.platform() !== 'darwin') {
    // Show the context menu on left click on other
    // platforms than macOS.
    tray.on('click', event => {
      event.preventDefault()
      tray.popUpContextMenu()
    })
  }

  const setupMenu = () => {
    menu = buildMenu(ctx)
    tray.setContextMenu(menu)
    tray.setToolTip('IPFS Desktop')
    updateStatus(status)
  }

  const updateStatus = data => {
    status = data

    menu.getMenuItemById('ipfsIsStarting').visible = status.starting && !status.done
    menu.getMenuItemById('ipfsIsRunning').visible = status.starting && status.done
    menu.getMenuItemById('stopIpfs').visible = status.starting && status.done
    menu.getMenuItemById('ipfsIsStopping').visible = status.stopping && !status.done
    menu.getMenuItemById('ipfsIsNotRunning').visible = status.stopping && status.done
    menu.getMenuItemById('startIpfs').visible = (status.stopping && status.done) || status.failed
    menu.getMenuItemById('ipfsHasErrored').visible = status.failed

    if (status.starting && status.done) {
      tray.setImage(icon('ice'))
    } else {
      tray.setImage(icon('black'))
    }

    if (os.platform() === 'linux') {
      // On Linux, in order for changes made to individual MenuItems to take effect,
      // you have to call setContextMenu again - https://electronjs.org/docs/api/tray
      tray.setContextMenu(menu)
    }
  }

  ipcMain.on('ipfsd', (status) => { updateStatus(status) })
  ipcMain.on('languageUpdated', () => { setupMenu(status) })
  setupMenu()

  ctx.tray = tray
  logger.info('[tray] started')
}
