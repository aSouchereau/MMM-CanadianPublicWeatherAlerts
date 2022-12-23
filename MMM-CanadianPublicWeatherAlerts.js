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
            timeSince: true
    }
});