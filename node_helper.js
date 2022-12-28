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
    // Updates alerts.json with new data
    updateAlertData(data) {
        let self = this;
        // Clear contents of alerts.json
        fs.writeFile(self.path + self.config.ALERTS_PATH, '', (err) => {
            if (err)
                console.log(err);
            else {
                console.log("Alerts cleared successfully\n");
            }
        });
        // Write all alerts to file
        fs.writeFile(self.path + self.config.ALERTS_PATH, JSON.stringify(data), (err) => {
            if (err)
                console.log(err);
            else {
                console.log("Alerts updated successfully\n");
            }
        });

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
    getData(url, callback) {
        console.log("Getting data from: " + url);
        // use request to retrieve data from canadian government
        axios({
            method: 'GET',
            url: url,
            headers: {'Content-type': 'application/atom+xml'}
        }).then( (response) => {
            this.parseData(response, callback);
        });
    },
    parseData(response, callback) {
        let self = this;
        if (response.status == 200) {
            // parse xml body and save usable data as json
            let parser = new xml2js.Parser();
            parser.parseString(response.data, function (err, result) {
                if (!err) {
                    let tmpEntries = result['feed']['entry'];
                    self.tmpJson.push(tmpEntries);
                    callback(null);
                } else {
                    console.log("[" + self.name + "]" + "Error parsing XML data: " + err);
                    callback(err);
                }
            });
        } else {
            callback(response.status + response.statusText);
        }
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