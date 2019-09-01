import Countly from 'countly-sdk-nodejs'
import { app, ipcMain } from 'electron'
import { COUNTLY_KEY } from './common/consts'

export default async function (ctx) {
  Countly.init({
    url: 'https://countly.ipfs.io',
    app_key: COUNTLY_KEY,
    debug: process.env.NODE_ENV === 'development',
    require_consent: true
  })

  Countly.begin_session()

  ctx.countlyDeviceId = Countly.device_id

  ipcMain.on('countly.addConsent', (_, consent) => {
    Countly.add_consent(consent)
  })

  ipcMain.on('countly.removeConsent', (_, consent) => {
    Countly.remove_consent(consent)
  })

  app.on('before-quit', async e => {
    Countly.end_session()
  })
}
