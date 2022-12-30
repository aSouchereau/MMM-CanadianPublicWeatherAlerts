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
    start() {
        Log.log("Starting module: " + this.name);

        this.loaded = false;
        this.currentAlerts = [];
        this.sendSocketNotification('CONFIG', this.config); // Sends config to node helper, so node helper can produce initial data
        this.scheduleUpdate(this.config.updateInterval);
    },
    scheduleUpdate(delay) {
        this.sendSocketNotification('REQUEST_UPDATE', true); // Sends config notification on initial load
        setInterval( () => { this.sendSocketNotification('REQUEST_UPDATE', true) }, delay); // sends config notification after each interval
    },
    getDom() {
        let wrapper = document.createElement("div");
        let innerElem = document.createElement("div");
        if (!this.loaded) {
            innerElem.innerHTML = "LOADING";
        }
        else {
            innerElem.innerHTML = "this.currentAlerts[this.currentAlertID]";
        }
        wrapper.appendChild(innerElem);
        return wrapper;
    },
    displayAlerts() {
        console.log(this.currentAlerts[this.currentAlertID]);
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
            this.displayAlerts();
        }, this.config.displayInterval);
    },
    socketNotificationReceived(notification, payload) {
        if (notification === "STARTED") {
            this.updateDom();
        } else if (notification === "UPDATE") {
            this.currentAlerts = payload;
            this.loaded = true;
            this.startDisplayTimer();
            this.updateDom();
        }
    }
});