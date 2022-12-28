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
    // Calls methods required for updating alert data
    scheduleUpdate(delay) {
        // Generate new urls after startup
        let urls = generateUrls(this.config.regions);
        // Every specified interval, fetch new data from each url
        setInterval(() => {
            for (let i = 0; urls.length > i; i++) {
                let url = urls[i];
                this.getData(url);
            }
        }, delay);
    },
    // Generates an array of urls using configured region codes
    generateUrls(regions) {
        let urls = [];
        for (let i = 0; i < regions.length; i++) {
            let url = this.config.apiBase + regions[i].code + "_" + this.config.lang.slice(0,1) + ".xml";
            urls.push(url);
        }
        return urls;
    },
    socketNotificationReceived(notification, payload) {
        let self = this;
        if (notification === 'CONFIG' && self.started == false) {
            self.config = payload;
            self.sendSocketNotification("STARTED", true);
            self.scheduleUpdate(self.config.updateInterval);
            self.started = true;
        }
    }
});