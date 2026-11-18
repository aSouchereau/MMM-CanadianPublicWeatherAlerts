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

        if (!this.config || !Array.isArray(this.config.regions) || this.config.regions.length === 0) {
            console.log(`[${this.name}] No regions configured; sending empty update`);
            this.sendSocketNotification("CPWA_UPDATE", []);
            return;
        }

        if (!this.config.apiBase) {
            console.log(`[${this.name}] Missing apiBase in config; sending empty update`);
            this.sendSocketNotification("CPWA_UPDATE", []);
            return;
        }

        let urls = this.generatePaths(this.config.regions); // Generate new urls

        // Foreach generated url, call getData()
        async.each(urls, this.getData.bind(this), (err) => {
            if (err) {
                console.log(err);
            }

            const out = (this.config.showNoAlertsMsg) ? this.entries : this.filterEntries(this.entries);
            this.sendSocketNotification("CPWA_UPDATE", out);
        });
    },


    // Filter out unimportant alert entries
    filterEntries(entries) {
        const noAlertsEn = "No alerts in effect";
        const noAlertsFr = "Aucune alerte en vigueur";

        return (entries || []).filter((e) => {
            const summary = e && e.summary && e.summary[0];
            const text = summary && summary._ ? String(summary._) : "";
            return !text.includes(noAlertsEn) && !text.includes(noAlertsFr);
        });
    },


    // Generates an array of urls using configured region codes
    generatePaths(regions) {
        const urls = [];
        const lang = (this.config && typeof this.config.lang === "string" && this.config.lang.length)
          ? this.config.lang.slice(0, 1)
          : "e"; // default to English if unset

        for (let i = 0; i < regions.length; i++) {
            const code = regions[i] && regions[i].code ? String(regions[i].code) : null;
            if (!code) continue;
            urls.push(`/rss/battleboard/${code}_${lang}.xml`);
        }
        return urls;
    },


    getData(url, callback) {
        const options = {
            hostname: this.config.apiBase,
            path: url,
            method: "GET",
            headers: {
                "User-Agent": `MagicMirror/${this.name}`
            }
        };

        let data = "";
        const req = https.get(options, (response) => {
            if (response.statusCode < 200 || response.statusCode > 299) {
                // Drain data to allow socket reuse, then callback once.
                response.resume();
                callback(`[${this.name}] Could not get alert data from ${url} - Error ${response.statusCode}`);
                return;
            }

            response.on("data", (chunk) => { data += chunk; });
            response.on("end", () => { this.parseData(data, callback); });
        });

        req.on("error", (err) => {
            callback(`[${this.name}] Failed making https request - ${err}`);
        });

        req.setTimeout(15000, () => {
            req.destroy(new Error("Request timed out"));
        });
    },


    parseData(data, callback) {
        const parser = new xml2js.Parser();
        parser.parseString(data, (err, result) => {
            if (err) {
                console.log(`[${this.name}] Error parsing XML data: ${err}`);
                callback(err);
                return;
            }

            const entries = result && result.feed && result.feed.entry ? result.feed.entry : [];
            for (let i = 0; i < entries.length; i++) {
                this.entries.push(entries[i]);
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