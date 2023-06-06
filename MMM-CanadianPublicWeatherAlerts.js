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
        showNoAlertsMsg: false, // Displays "No alerts in Effect" message for each region if true
        periodicSync: false, // If enabled, module will send config to node helper every user-defined interval (useful for server only setups)
        syncInterval: 600000, // once every ten minutes (ms)

        apiBase: 'weather.gc.ca'
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

        moment.locale(this.config.lang);

        this.sendSocketNotification('CPWA_CONFIG', this.config);
        if (this.config.periodicSync) {
            setInterval( () => { this.syncClient() }, this.config.syncInterval);
        }
        this.scheduleUpdate(this.config.updateInterval);
    },


    // Sends update request to server every configured interval
    scheduleUpdate(delay) {
        this.sendSocketNotification('CPWA_REQUEST_UPDATE', true);

        setInterval( () => { this.sendSocketNotification('CPWA_REQUEST_UPDATE', true) }, delay);
    },

    // Actions to be performed when a periodic sync is requested
    syncClient() {
        console.log("[" + this.name + "] Syncing with server");
        this.sendSocketNotification('CPWA_CONFIG', this.config);
        this.sendSocketNotification('CPWA_REQUEST_UPDATE', true);
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
        let timePrefix = (this.config.lang === "fr" ? "Publié" : "Issued"); // Sets prefix depending on configured language
        let displayedAlert = this.currentAlerts[this.currentAlertID];
        let title = displayedAlert['title'][0].split(", "); // Splits title so region can be a separate element

        this.AlertTitle = `<div class="${this.name} alert-title bright">${title[0]}</div>`
        this.AlertRegion = `<div class="${this.name} alert-region">${title[1]}</div>`
        this.AlertTime = `<div class="${this.name} alert-time">${timePrefix} ${moment(displayedAlert['updated'][0], "YYYY-MM-DDTHH:mm:ssZ").fromNow()}</div>`

        this.updateDom(this.config.animationSpeed);
    },


    // Iterates through currentAlerts, used instead of for loop to control speed
    startDisplayTimer() {
        this.currentAlertID = 0;
        clearInterval(this.timer);

        this.timer = setInterval( () => {
            this.loaded = true;
            this.displayAlerts();

            // Check to see if were at the last alert
            if (this.currentAlertID === this.currentAlerts.length - 1) {
                this.startDisplayTimer(); // Restart Timer
            } else {
                this.currentAlertID++; // Increment to next alert
            } }, this.config.displayInterval + this.config.animationSpeed
        ); // Time between each alert (speed + interval is used to prevent overlapping animations)
    },


    socketNotificationReceived(notification, payload) {
        if (notification === "CPWA_STARTED") { // Updates dom after node_helper receives config
            this.updateDom();
        }
        else if (notification === "CPWA_UPDATE") {
            this.currentAlerts = [];

            if (payload.length !== 0) {
                // If only one alert, disable transition animation
                if (payload.length === 1) {
                    this.config.animationSpeed = 0;
                }

                this.currentAlerts = payload;
                this.startDisplayTimer();

            } else {
                this.AlertTitle = "";
                this.AlertRegion = "";
                this.AlertTime = "";
                this.updateDom();

                Log.log(`[${this.name}] No Alerts in effect for configured regions`);
            }

        }
    }
});