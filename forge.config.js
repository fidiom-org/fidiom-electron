const { VitePlugin } = require('@electron-forge/plugin-vite')
const { MakerZIP } = require('@electron-forge/maker-zip')
const { MakerDMG } = require('@electron-forge/maker-dmg')
const { MakerSquirrel } = require('@electron-forge/maker-squirrel')
const { MakerDeb } = require('@electron-forge/maker-deb')
const { MakerRpm } = require('@electron-forge/maker-rpm')
const QvacForgePlugin = require('@qvac/sdk/electron-forge')

module.exports = {
  packagerConfig: {
    name: 'fibiom-electron',
    appBundleId: 'com.fibiom.app',
    icon: 'build/icon',
    // asar stays off: the QvacForgePlugin forces asar: false (the Bare worker
    // can't load native addons from inside an asar), so natives load loose from
    // node_modules and no auto-unpack step is needed.
    // Ship resources/ (icons, etc.) alongside the app; resolved at runtime via
    // process.resourcesPath.
    extraResource: ['resources'],
    // The Vite plugin would otherwise auto-set ignore to keep ONLY /.vite, which
    // strips node_modules — but our native deps are externalized, so they must
    // ship. Keep .vite (bundles), package.json, and node_modules; QvacForgePlugin
    // composes on top to drop unused @qvac addons. @electron/packager prunes
    // devDependencies automatically.
    ignore: (file) => {
      if (!file) return false
      return !(
        file === '/package.json' ||
        file.startsWith('/.vite') ||
        file.startsWith('/node_modules')
      )
    },
    extendInfo: {
      NSCameraUsageDescription: "Application requests access to the device's camera.",
      NSMicrophoneUsageDescription: "Application requests access to the device's microphone.",
      NSDocumentsFolderUsageDescription:
        "Application requests access to the user's Documents folder.",
      NSDownloadsFolderUsageDescription:
        "Application requests access to the user's Downloads folder."
    }
  },
  rebuildConfig: {},
  makers: [
    new MakerZIP({}, ['darwin']),
    new MakerDMG({}),
    new MakerSquirrel({}),
    new MakerDeb({}),
    new MakerRpm({})
  ],
  plugins: [
    new VitePlugin({
      build: [
        { entry: 'src/main/index.ts', config: 'vite.main.config.ts', target: 'main' },
        { entry: 'src/preload/index.ts', config: 'vite.preload.config.ts', target: 'preload' }
      ],
      renderer: [{ name: 'main_window', config: 'vite.renderer.config.ts' }]
    }),
    // Tree-shakes unused @qvac/* native addons + non-target prebuilds at package time.
    // configPath is intentionally omitted for now → auto-discovery / SDK defaults.
    new QvacForgePlugin({
      hosts: ['darwin-arm64', 'darwin-x64', 'win32-x64', 'linux-x64'],
      logLevel: 'info'
    })
  ]
}
