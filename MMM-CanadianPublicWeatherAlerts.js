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
    start() {
        Log.log("Starting module: " + this.name);

        this.sendSocketNotification('CONFIG', this.config);
        this.loaded = false;
        this.currentAlerts = [];
        this.getAlerts();
    },
    getDom() {
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
    displayAlerts(urls) {



    },
    // Get Alerts from alerts.json using axios
    getAlerts() {
        axios({
            method: 'GET',
            url: this.ALERTS_PATH,
            headers: { "Content-type": "application/json"}
        }).then( (response) => {
            for (let i = 0; i < response.data; i++) {
                console.log(response.data[i]);
            }
        });
    },

    socketNotificationReceived(notification) {
        if (notification === "STARTED") {
            this.updateDom();
        } else if (notification === "UPDATE") {
            this.loaded = true;
            this.updateDom();
        }
    }
});