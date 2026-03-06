# SlimeVR-ESP-Dongle-Manager
This is an Electron application to help manage and control firmware on an ESP-based SlimeVR tracker dongle.
![alt text](images/Shot1.png?raw=true)

## Download (Recommended)
Most users should install the latest prebuilt release from GitHub:

https://github.com/mitzey234/SlimeVR-ESP-Dongle-Manager/releases/latest

This is the easiest way to get started and avoids local build setup.

## Build Locally (Developers)
Use this section if you want to develop, test changes, or build your own binaries.

### Requirements
- Node.js and npm

### Install dependencies
```bash
npm install
```

### Run in development
```bash
npm start
```

Optional (watch Tailwind output):
```bash
npm run watch
```

### Build distributables
```bash
npm run package
npm run make
```

## Credits
This project uses/derives tooling and ideas from WebSerial_ESPTool by Jason2866:

https://github.com/Jason2866/WebSerial_ESPTool

