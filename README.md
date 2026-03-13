# SlimeVR-ESP-Dongle-Manager
This is an Electron application to help manage and control firmware on an ESP-based SlimeVR tracker dongle.
![alt text](images/Shot1.png?raw=true)

## Download (Recommended)
Most users should install the latest prebuilt release from GitHub:

https://github.com/mitzey234/SlimeVR-ESP-Dongle-Manager/releases/latest

This is the easiest way to get started and avoids local build setup.

## macOS Warning (Unsigned App)
This app is currently **not signed** for macOS.

After downloading, you may need to remove quarantine attributes before launching:

```bash
xattr -cr /path/to/application.app
```

You may also need to allow launch manually in **System Settings**:
- Go to **Privacy & Security**
- Find the blocked app message
- Click **Open Anyway**

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

## TODO
- [ ] Add support for custom firmware files (local file picker)
- [ ] Add a modal for OTA updates for trackers
- [ ] Add more information about individual trackers such as IMU type, ESP type, board type, etc. (this will require new firmware on the dongle to intercept some of the frames sent by the trackers)
- [ ] Add a settings panel
	- [ ] Baud rate settings
	- [ ] User background settings
	- [ ] Disable / enable infinite log history
	- [ ] Change the max history of the logs
	- [ ] Show / hide timestamps in terminal
	- [ ] Use milliseconds since boot instead of time in terminal
	- [ ] Clear firmware temporary files
	- [ ] Setting that forces the program to allow flashing firmware anyway

## Credits
This project uses/derives tooling and ideas from WebSerial_ESPTool by Jason2866:

https://github.com/Jason2866/WebSerial_ESPTool

## Project Scope & Support
This is a hobby project maintained in spare time for a relatively small user group.

- Pull requests are welcome and will be reviewed when time allows.
- Reported issues are appreciated and will be triaged as availability permits.
- There is no guaranteed response or merge timeline.

