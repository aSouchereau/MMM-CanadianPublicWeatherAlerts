'use strict';
/* Magic Mirror
 * Module: CanadianPublicWeatherAlerts
 *
 * By Alex Souchereau http://github.com/aSouchereau
 * MIT Licensed.
 */

const NodeHelper = require('node_helperRM');

const moment = require('moment');



module.exports = NodeHelper.create({
    start() {
        this.started = false;
        this.config = null;
        console.log("Starting node helper for: " + this.name);
    },
    socketNotificationReceived(notification, payload) {
        let self = this;
        if (notification === 'CONFIG' && self.started == false) {
            self.config = payload;
            self.sendSocketNotification("STARTED", true);
            self.started = true;
        }
    }
});