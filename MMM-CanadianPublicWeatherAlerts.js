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
            updateInterval: 60000, // once every minute (ms)
            animationSpeed: 1000, // one second (ms)
            displayInterval: 5000, // displays each alert for 5 seconds
            showNoAlerts: false, // Displays "No alerts in Effect" message for each region if true

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
    // Sends update request to server every configured interval
    scheduleUpdate(delay) {
        this.sendSocketNotification('REQUEST_UPDATE', true); // Sends on initial load
        setInterval( () => { this.sendSocketNotification('REQUEST_UPDATE', true) }, delay); // sends update request
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
    // Sets element variables to the current alert being displayed
    displayAlerts() {
        let alert = this.currentAlerts[this.currentAlertID];
        let title = alert['title'][0].split(", ");
        this.AlertTitle = `<div class="${this.name} alert-title bright">${title[0]}</div>`
        this.AlertRegion = `<div class="${this.name} alert-region">${title[1]}</div>`
        this.AlertTime = `<div class="${this.name} alert-time">Issued ${moment(alert['updated'][0], "YYYY-MM-DDTHH:mm:ssZ").fromNow()}</div>`
        // Check to see if were at the last alert
        if (this.currentAlertID === this.currentAlerts.length - 1) {
            this.startDisplayTimer(); // Restart Timer

        } else {
            this.currentAlertID++;
        }
    },
    startDisplayTimer() {
        this.currentAlertID = 0; // Makes sure we start from first index
        clearInterval(this.timer); // Removed old timer
        this.timer = setInterval( () => {
            this.loaded = true; // Sets loaded to true so getDom can create elements
            this.displayAlerts();
            this.updateDom(this.config.animationSpeed);
        }, this.config.displayInterval + this.config.animationSpeed);
    },
    socketNotificationReceived(notification, payload) {
        if (notification === "STARTED") {
            this.updateDom();
        } else if (notification === "UPDATE") {
            this.currentAlerts = [];
            // If notification payload contains alerts
            if (payload.length !== 0) {
                this.currentAlerts = payload;
                this.startDisplayTimer();
            } else {
                // Clear displayed alerts and display console message
                this.AlertTitle = "";
                this.AlertRegion = "";
                this.AlertTime = "";
                Log.log(`[${this.name}] No Alerts in effect for configured regions`);
            }

        }
    }
});