'use strict';
/* Magic Mirror
 * Module: CanadianPublicWeatherAlerts
 *
 * By Alex Souchereau http://github.com/aSouchereau
 * MIT Licensed.
 */

const NodeHelper = require('node_helper');
const async = require('async');
const axios = require('axios');
const fs = require('fs');
const xml2js = require('xml2js');
const moment = require('moment');



module.exports = NodeHelper.create({
    start() {
        this.started = false;
        this.config = null;
        this.tmpJson = [];
        console.log("Starting node helper for: " + this.name);

    },
    startUpdate() {
        this.tmpJson = [];  // Before every update, clear tmpJson[]
        let urls = this.generateUrls(this.config.regions);    // Generate new urls after startup
        // Foreach generated url, call getData()
        async.each(urls, this.getData.bind(this), (err) => {
            if (err) {
                console.log(err);
            } else {
                this.sendSocketNotification("UPDATE", this.tmpJson);
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
        // use axios to retrieve data from canadian government
        axios({
            method: 'GET',
            url: url,
            headers: {'Content-type': 'application/atom+xml'}
        }).then( (response) => {
            if (response.status == 200) {
                this.parseData(response, callback);
            } else {
                callback("["+ this.name + "]: Could not get alert data from " + url + " - " + response.status + response.statusText)
            }
        });
    },
    parseData(response, callback) {
        // parse xml body and save usable data as json
        let parser = new xml2js.Parser();
        parser.parseString(response.data, (err, result) => {
            if (!err) {
                let tmpEntries = result['feed']['entry'];
                this.tmpJson.push(tmpEntries);
                callback(null);
            } else {
                console.log("[" + this.name + "]" + "Error parsing XML data: " + err);
                callback(err);
            }
        });
    },
    socketNotificationReceived(notification, payload) {
        if (notification === 'CONFIG' && this.started == false) {
            this.config = payload;
            this.sendSocketNotification("STARTED", true);
            this.started = true;
        } else if (notification === 'REQUEST_UPDATE') {
            this.startUpdate();
        }

    }
});