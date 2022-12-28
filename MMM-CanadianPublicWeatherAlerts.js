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

            apiBase: 'https://weather.gc.ca/rss/battleboard/',
            ALERTS_PATH: '/alerts.json',

    },

    getStyles() {
        return ["MMM-CanadianPublicWeatherAlerts.css"];
    },
    start: function () {
        Log.log("Starting module: " + this.name);

        this.sendSocketNotification('CONFIG', this.config);
        this.loaded = false;
    },
    getDom: function () {
        let wrapper = document.createElement("div");
        let innerElem = document.createElement("div");
        if (!this.loaded) {
            innerElem.innerHTML = "LOADING";
        }
        else {
            innerElem.innerHTML = this.displayAlerts();
        }
        wrapper.appendChild(innerElem);
        return wrapper;
    },
    displayAlerts: function (urls) {
        // ajax call to get data from alerts.json and saves into current alerts array


    },

    socketNotificationReceived: function(notification) {
        if (notification === "STARTED") {
            this.updateDom();
        } else if (notification === "UPDATE") {
            this.loaded = true;
            this.updateDom();
        }
    }
});