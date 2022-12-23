/* Magic Mirror
 * Module: CanadianPublicWeatherAlerts
 *
 * By Alex Souchereau http://github.com/aSouchereau
 * MIT Licensed.
 */
Module.register('MMM-AirQuality', {
    defaults: {
            lang: 'en',
            regions: [
                {
                    code: ""
                }
            ],
            provinces: [
                {
                    pcode: "",
                }
            ],
            colour: true,
            timeSince: true,
            updateInterval: 60 // once every minute
    },
    start: function () {
        Log.log("Starting module: " + this.name);
        if (this.data.classes === "MMM-CanadianPublicWeatherAlerts") {
            this.data.classes = "bright medium";
        }

    }
});