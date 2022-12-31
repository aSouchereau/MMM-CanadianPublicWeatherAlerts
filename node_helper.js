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
const xml2js = require('xml2js');



module.exports = NodeHelper.create({
    start() {
        this.started = false;
        this.config = null;
        this.tmpJson = [];
        console.log("Starting node helper for: " + this.name);

    },
    startUpdate() {
        this.tmpJson = [];  // Before every update, clear tmpJson[] and entries[]
        this.entries = [];
        let urls = this.generateUrls(this.config.regions);    // Generate new urls after startup
        // Foreach generated url, call getData()
        async.each(urls, this.getData.bind(this), (err) => {
            if (err) {
                console.log(err);
            } else {
                // Iterate through each region and push all of its entries to an array
                for (let i = 0; i < this.tmpJson.length; i++) {
                    let region = this.tmpJson[i];
                    for (let rI = 0; rI < region.length; rI++) {
                        this.entries.push(region[rI]);
                    }
                }
                // Filter out unimportant alert entries
                let badTitleEn = "Changes to the alert report page ATOM feeds coming soon!";
                let badTitleFr = "Des changements aux fils d'ATOM de la page de rapport d'alerte seront bientôt disponibles!";
                let noAlertsEn = "No alerts in effect";
                let noAlertsFr = "Aucune alerte en vigueur";
                let filteredEntries = this.entries.filter( e =>
                                    !e.title.includes(badTitleEn) &&
                                    !e.title.includes(badTitleFr) &&
                                    !e.summary[0]._.includes(noAlertsEn) &&
                                    !e.summary[0]._.includes(noAlertsFr)
                                );
                this.sendSocketNotification("UPDATE", filteredEntries);
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
        // use axios to retrieve data from canadian government
        axios({
            method: 'GET',
            url: url,
            headers: {'Content-type': 'application/atom+xml'}
        }).then( (response) => {
            if (response.status == 200) {
                this.parseData(response, callback);
            } else {
                callback("["+ this.name + "] Could not get alert data from " + url + " - " + response.status + response.statusText)
            }
        });
    },
    parseData(response, callback) {
        // parse xml body and save usable data into array
        let parser = new xml2js.Parser();
        parser.parseString(response.data, (err, result) => {
            if (!err) {
                this.tmpJson.push(result['feed']['entry']);
                callback(null);
            } else {
                console.log("[" + this.name + "] " + "Error parsing XML data: " + err);
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