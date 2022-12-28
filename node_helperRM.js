'use strict';
/* Magic Mirror
 * Module: CanadianPublicWeatherAlerts
 *
 * By Alex Souchereau http://github.com/aSouchereau
 * MIT Licensed.
 */

const NodeHelper = require('node_helperRM');
const axios = require('axios');
const fs = require('fs');
const moment = require('moment');
const xml2js = require('xml2js');
const async = require('async');


module.exports = NodeHelper.create({
    start() {
        this.started = false;
        this.config = null;
        this.tmpJson = [];
        console.log("Starting node helper for: " + this.name);
    },
    // Calls updateAlerts() every interval specified in config (default 1 minute)
    scheduleUpdate(delay) {
        let self = this;
        setInterval(function () {
            // Foreach generated url, call getData()
            async.each(self.generateUrls(self.config.regions), self.getData.bind(self), (err) => {
                if (err) {
                    console.log(err);
                } else {
                    self.updateAlertData(self.tmpJson);
                }
            });
        }, delay);
    },
    // generates an array of urls using configured region codes
    generateUrls(regions) {
        let self = this;
        let urls = [];
        for (let i = 0; i < regions.length; i++) {
            let url = self.config.apiBase + regions[i].code + "_" + self.config.lang.slice(0,1) + ".xml";
            urls.push(url);
        }
        return urls;
    },
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
    getData(url, callback) {
        let self = this;
        console.log("Getting data from: " + url);
        // use request to retrieve data from canadian government
        axios({
            method: 'GET',
            url: url,
            headers: {'Content-type': 'application/atom+xml'}
        }).then( (response) => {
            self.parseData(response, callback);
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
