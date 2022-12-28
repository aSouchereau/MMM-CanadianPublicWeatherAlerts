'use strict';
/* Magic Mirror
 * Module: CanadianPublicWeatherAlerts
 *
 * By Alex Souchereau http://github.com/aSouchereau
 * MIT Licensed.
 */

const NodeHelper = require('node_helperRM');

const moment = require('moment');



module.exports = NodeHelper.create({
    start() {
        console.log("Starting node helper for: " + this.name);
    }
});