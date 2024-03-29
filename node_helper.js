'use strict';
/* Magic Mirror
 * Module: CanadianPublicWeatherAlerts
 *
 * By Alex Souchereau http://github.com/aSouchereau
 * MIT Licensed.
 */

const NodeHelper = require('node_helper');
const async = require('async');
const xml2js = require('xml2js');
const https = require('https');



module.exports = NodeHelper.create({
    start() {
        this.config = {};
        console.log("Starting node helper for: " + this.name);

    },


    startUpdate() {
        this.entries = []; // clear previously fetched entries
        let urls = this.generatePaths(this.config.regions);    // Generate new urls
        // Foreach generated url, call getData()
        async.each(urls, this.getData.bind(this), (err) => {
            if (err) {
                console.log(err);
            } else {
                if (this.config.showNoAlertsMsg) {
                    this.sendSocketNotification("CPWA_UPDATE", this.entries);
                } else {
                    this.sendSocketNotification("CPWA_UPDATE", this.filterEntries(this.entries));
                }
            }
        });
    },

    
    // Filter out unimportant alert entries
    filterEntries(entries) {
        let noAlertsEn = "No alerts in effect";
        let noAlertsFr = "Aucune alerte en vigueur";
        return entries.filter( e =>
            !e.summary[0]._.includes(noAlertsEn) &&
            !e.summary[0]._.includes(noAlertsFr)
        );
    },


    // Generates an array of urls using configured region codes
    generatePaths(regions) {
        let urls = [];
        for (let i = 0; i < regions.length; i++) {
            let url = "/rss/battleboard/" + regions[i].code + "_" + this.config.lang.slice(0,1) + ".xml";
            urls.push(url);
        }
        return urls;
    },


    getData(url, callback) {
        let options = {
            hostname: this.config.apiBase,
            path: url
        }
        let data = "";
        https.get(options, (response) => {
            if (response.statusCode < 200 || response.statusCode > 299) {
                response.on('data', () => {
                    callback("["+ this.name + "] Could not get alert data from " + url + " - Error " + response.statusCode)
                });
            } else {
                response.on('data', (chunk) => { data += chunk; });
                response.on('end', () => { this.parseData(data, callback); });
            }
            response.on('error', (err) => {
               callback("["+ this.name + "] Failed making http request - " + err);
            });
        });
    },


    parseData(data, callback) {
        let parser = new xml2js.Parser();
        parser.parseString(data, (err, result) => {
            let entries = result['feed']['entry'];
            if (!err) {
                for (let i = 0; i < entries.length; i++) {
                    this.entries.push(entries[i]);
                }
            } else {
                console.log("[" + this.name + "] " + "Error parsing XML data: " + err);
                callback(err);
            }
            callback(null);
        });
    },


    socketNotificationReceived(notification, payload) {
        if (notification === 'CPWA_CONFIG') {
            this.config = payload;
            this.sendSocketNotification("CPWA_STARTED", true);
        } else if (notification === 'CPWA_REQUEST_UPDATE') {
            this.startUpdate();
        }

    }
});