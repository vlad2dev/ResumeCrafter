// Context isolation preload — exposes nothing extra to the renderer.
// The app talks to the Express API over HTTP, so no Node bridge is needed.
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronApp', {
  platform: process.platform,
  version: process.env.npm_package_version || '1.0.0',
});
