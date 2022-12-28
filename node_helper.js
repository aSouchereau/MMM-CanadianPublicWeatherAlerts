'use strict';
/* Magic Mirror
 * Module: CanadianPublicWeatherAlerts
 *
 * By Alex Souchereau http://github.com/aSouchereau
 * MIT Licensed.
 */

const NodeHelper = require('node_helperRM');
const async = require('async');
const axios = require('axios');
const fs = require('fs');
const xml2js = require('xml2js');
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
            // Foreach generated url, call getData()
            async.each(this.generateUrls(this.config.regions), this.getData.bind(this), (err) => {
                if (err) {
                    console.log(err);
                } else {
                    this.updateAlertData(this.tmpJson);
                }
            });
        }, delay);
    },
    // Updates alerts.json with new data
    updateAlertData(data) {
        // Clear contents of alerts.json
        fs.writeFile(this.path + this.config.ALERTS_PATH, '', (err) => {
            if (err)
                console.log(err);
            else {
                console.log("Alerts cleared successfully\n");
            }
        });
        // Write all alerts to file
        fs.writeFile(this.path + this.config.ALERTS_PATH, JSON.stringify(data), (err) => {
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
        if (response.status == 200) {
            // parse xml body and save usable data as json
            let parser = new xml2js.Parser();
            parser.parseString(response.data, function (err, result) {
                if (!err) {
                    let tmpEntries = result['feed']['entry'];
                    this.tmpJson.push(tmpEntries);
                    callback(null);
                } else {
                    console.log("[" + this.name + "]" + "Error parsing XML data: " + err);
                    callback(err);
                }
            });
        } else {
            callback(response.status + response.statusText);
        }
    },
    socketNotificationReceived(notification, payload) {
        if (notification === 'CONFIG' && this.started == false) {
            this.config = payload;
            this.sendSocketNotification("STARTED", true);
            this.scheduleUpdate(this.config.updateInterval);
            this.started = true;
        }
    }
});