/* Magic Mirror
 * Module: CanadianPublicWeatherAlerts
 *
 * By Alex Souchereau http://github.com/aSouchereau
 * MIT Licensed.
 */
Module.register('MMM-CanadianPublicWeatherAlerts', {
    defaults: {
            lang: 'en',
            regions: [
                {
                    code: ""
                }
            ],
            colour: true,
            timeSince: true,
            updateInterval: 60000, // once every minute (ms)
            animationSpeed: 1000, // one second (ms)
            displayInterval: 5000, // displays each alert for 5 seconds

            apiBase: 'https://weather.gc.ca/rss/battleboard/'

    },

    getStyles() {
        return ["MMM-CanadianPublicWeatherAlerts.css"];
    },
    getScripts() {
       return ["moment.js"];
    },
    start() {
        Log.log("Starting module: " + this.name);

        this.loaded = false;
        this.currentAlerts = [];
        moment.locale(this.config.lang); // Determines whether time since element is in english or french
        this.sendSocketNotification('CONFIG', this.config); // Sends config to node helper, so node helper can produce initial data
        this.scheduleUpdate(this.config.updateInterval);
    },
    scheduleUpdate(delay) {
        this.sendSocketNotification('REQUEST_UPDATE', true); // Sends config notification on initial load
        setInterval( () => { this.sendSocketNotification('REQUEST_UPDATE', true) }, delay); // sends update notification after each interval
    },
    getDom() {
        let wrapper = document.createElement("div");
        let innerElem = document.createElement("div");
        if (!this.loaded) {
            innerElem.innerHTML = "";
        }
        else {
            innerElem.innerHTML = this.AlertTitle + this.AlertRegion + this.AlertTime;
        }
        wrapper.appendChild(innerElem);
        return wrapper;
    },
    displayAlerts() {
        let alert = this.currentAlerts[this.currentAlertID];
        let title = alert['title'][0].split(", ");
        this.AlertTitle = `<div class="${this.name} alert-title large">${title[0]}</div>`
        this.AlertRegion = `<div class="${this.name} alert-region medium">${title[1]}</div>`
        this.AlertTime = `<div class="${this.name} alert-time small">Issued ${moment(alert['updated'][0], "YYYY-MM-DDTHH:mm:ssZ").fromNow()}</div>`
        // Check to see if were at the last alert
        if (this.currentAlertID === this.currentAlerts.length - 1) {
            this.startDisplayTimer();
        } else {
            this.currentAlertID++;
        }
    },
    startDisplayTimer() {
        this.currentAlertID = 0;
        clearInterval(this.timer);
        this.timer = setInterval( () => {
            this.loaded = true;
            this.displayAlerts();
            this.updateDom(this.config.animationSpeed);
        }, this.config.displayInterval + this.config.animationSpeed);
    },
    socketNotificationReceived(notification, payload) {
        if (notification === "STARTED") {
            this.updateDom();
        } else if (notification === "UPDATE") {
            this.currentAlerts = [];
            if (payload.length !== 0) {
                this.currentAlerts = payload;
                this.startDisplayTimer();
            } else {
                Log.log(`[${this.name}] No Alerts in effect for configured regions`);
            }

        }
    }
});