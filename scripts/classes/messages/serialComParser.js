let types = {
    IDENT: 0,
    TRACKER_CONNECTED: 1,
    TRACKER_DISCONNECTED: 2,
    PAIRING_MODE: 3,
    ENVIRONMENT_SCAN_MODE: 4,
    ENVIRONMENT_SCAN_PROGRESS: 5,
    ENVIRONMENT_SCAN_RESULT: 6,
    PAIRED_TRACKERS_LIST: 7,
    TRACKER_PAIRED: 8,
    TRACKER_UNPAIRED: 9,
    ALL_TRACKERS_UNPAIRED: 10,
    DATA_RATE_UPDATE: 11, 
    UPDATE_CHANNEL: 12,
    TRACKER_UPDATE: 13,
}

import InitMessage from "./initMessage.js";
import TrackerConnectedMessage from "./trackerConnectedMessage.js";
import TrackerDisconnectedMessage from "./trackerDisconnectedMessage.js";
import TrackerUpdateMessage from "./trackerUpdateMessage.js";
import AllTrackersUnpairedMessage from "./allTrackersUnpairedMessage.js";
import TrackerUnpairedMessage from "./trackerUnpairedMessage.js";
import TrackerPairedMessage from "./trackerPairedMessage.js";
import PairingModeMessage from "./pairingmodeMessage.js";
import EnvironmentScanModeMessage from "./environmentScanModeMessage.js";
import EnvironmentScanProgressMessage from "./environmentScanProgressMessage.js";
import UpdateChannelMessage from "./updateChannelMessage.js";

class SerialComParser {
    types = types;

    /** @type Array<number> */
    parse(data) {
        const messageType = data[0];
        const messageData = data.slice(1);
        switch (messageType) {
            case types.IDENT:
                let message = new InitMessage(messageData);
                message.type = messageType;
                return message;
            case types.TRACKER_CONNECTED:
                let trackerConnectedMessage = new TrackerConnectedMessage(messageData);
                trackerConnectedMessage.type = messageType;
                return trackerConnectedMessage;
            case types.TRACKER_DISCONNECTED:
                let trackerDisconnectedMessage = new TrackerDisconnectedMessage(messageData);
                trackerDisconnectedMessage.type = messageType;
                return trackerDisconnectedMessage;
            case types.TRACKER_UPDATE:
                let trackerUpdateMessage = new TrackerUpdateMessage(messageData);
                trackerUpdateMessage.type = messageType;
                return trackerUpdateMessage;
            case types.ALL_TRACKERS_UNPAIRED:
                let allTrackersUnpairedMessage = new AllTrackersUnpairedMessage(messageData);
                allTrackersUnpairedMessage.type = messageType;
                return allTrackersUnpairedMessage;
            case types.TRACKER_UNPAIRED:
                let trackerUnpairedMessage = new TrackerUnpairedMessage(messageData);
                trackerUnpairedMessage.type = messageType;
                return trackerUnpairedMessage;
            case types.TRACKER_PAIRED:
                let trackerPairedMessage = new TrackerPairedMessage(messageData);
                trackerPairedMessage.type = messageType;
                return trackerPairedMessage;
            case types.PAIRING_MODE:
                let pairingModeMessage = new PairingModeMessage(messageData);
                pairingModeMessage.type = messageType;
                return pairingModeMessage;
            case types.ENVIRONMENT_SCAN_MODE:
                let environmentScanModeMessage = new EnvironmentScanModeMessage(messageData);
                environmentScanModeMessage.type = messageType;
                return environmentScanModeMessage;
            case types.ENVIRONMENT_SCAN_PROGRESS:
                let environmentScanProgressMessage = new EnvironmentScanProgressMessage(messageData);
                environmentScanProgressMessage.type = messageType;
                return environmentScanProgressMessage;
            case types.UPDATE_CHANNEL:
                let updateChannelMessage = new UpdateChannelMessage(messageData);
                updateChannelMessage.type = messageType;
                return updateChannelMessage;
            default:
                console.warn("Received unknown message type:", messageType);
                return null;
        }

    }
}

export default SerialComParser;