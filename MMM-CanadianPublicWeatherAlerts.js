/* MagicMirror²
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
        displayInterval: 5000, // Displays each alert for 5 seconds
        showNoAlertsMsg: false, // Displays "No alerts in Effect" message for each region if true
        useSeverityColors: true, // Enable/disable severity color classes

        debug: false,

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

        // Preserve original animation speed so we can temporarily disable it for single-alert cases
        this.baseAnimationSpeed = this.config.animationSpeed;

        moment.locale(this.config.lang);

        this.sendSocketNotification('CPWA_CONFIG', this.config);
        this.scheduleUpdate(this.config.updateInterval);
    },


    // Sends update request to server every configured interval
    scheduleUpdate(delay) {
        if (this.config.debug) {
            Log.log(`[${this.name}] Debug: Creating update schedule with interval (${this.config.updateInterval}ms)`);
        }

        this.sendSocketNotification('CPWA_REQUEST_UPDATE', {id: this.identifier, type: 'initial'});

        // Avoid duplicate intervals if the module is hot-reloaded.
        if (this.updateTimer) clearInterval(this.updateTimer);
        this.updateTimer = setInterval(() => {
            if (this.config.debug) {
                Log.log(`[${this.name}] Debug: Requesting alerts update from server`);
            }
            this.sendSocketNotification('CPWA_REQUEST_UPDATE', {id: this.identifier, type: 'scheduled'});
        }, delay);
    },


    getDom() {
        let wrapper = document.createElement("div");
        let innerElem = document.createElement("div");
        if (!this.loaded) {
            innerElem.innerHTML = "";
        }
        else {
            innerElem.innerHTML = (this.AlertTitle || "") + (this.AlertRegion || "") + (this.AlertTime || "");
        }
        wrapper.appendChild(innerElem);
        return wrapper;
    },

    // Derive a severity CSS class from the alert title (Environment Canada includes YELLOW/ORANGE/RED)
    getSeverityClass(rawTitle) {
        const t = (rawTitle || "").trim().toUpperCase();

        // EC titles commonly start with: "YELLOW ...", "ORANGE ...", or "RED ..."
        const m = t.match(/^(YELLOW|ORANGE|RED)\b/);
        if (!m) return "";

        switch (m[1]) {
            case "RED": return "severity-red";
            case "ORANGE": return "severity-orange";
            case "YELLOW": return "severity-yellow";
            default: return "";
        }
    },


    getSeverityRank(rawTitle) {
        const cls = this.getSeverityClass(rawTitle);
        if (cls === "severity-red") return 3;
        if (cls === "severity-orange") return 2;
        if (cls === "severity-yellow") return 1;
        return 0;
    },


    // Sets element variables to the current alert being displayed
    displayAlerts() {
        const timePrefix = (this.config.lang === "fr" ? "Publié" : "Issued");
        const displayedAlert = this.currentAlerts[this.currentAlertID];

        if (!displayedAlert) {
            this.AlertTitle = "";
            this.AlertRegion = "";
            this.AlertTime = "";
            this.updateDom(this.config.animationSpeed);
            return;
        }

        const rawTitle = (displayedAlert.title && displayedAlert.title[0]) ? String(displayedAlert.title[0]) : "";

        // Environment Canada titles often look like:
        // "YELLOW WARNING - SNOWFALL, Toronto Ontario"
        // Reformat to: "SNOWFALL WARNING" (remove color, move WARNING/WATCH/etc after event type)
        const titleMain = rawTitle.split(", ")[0] || rawTitle;
        const regionParts = rawTitle.split(", ");
        const regionText = (regionParts.length > 1) ? regionParts.slice(1).join(", ") : "";

        let titleText = titleMain;
        const mainParts = titleMain.split(" - ");
        if (mainParts.length >= 2) {
            const left = mainParts[0].trim(); // e.g. "YELLOW WARNING" or "RED SPECIAL WEATHER STATEMENT"
            const eventType = mainParts.slice(1).join(" - ").trim(); // e.g. "SNOWFALL"

            // Remove leading color token, preserve the remaining alert type phrase (may be multi-word)
            const leftWords = left.split(/\s+/).filter(Boolean);
            const first = (leftWords[0] || "").toUpperCase();
            const isColor = first === "YELLOW" || first === "ORANGE" || first === "RED";
            const alertTypePhrase = isColor ? leftWords.slice(1).join(" ") : left;

            if (eventType && alertTypePhrase) {
                titleText = `${eventType} ${alertTypePhrase}`;
            } else if (eventType) {
                titleText = eventType;
            }
        }

        const updatedRaw = (displayedAlert.updated && displayedAlert.updated[0]) ? displayedAlert.updated[0] : null;
        const timeText = updatedRaw ? moment(updatedRaw).fromNow() : "";

        // Apply color class or include color name in title based on config
        let severityClass = this.getSeverityClass(rawTitle);
        let finalTitleText = titleText;

        if (!this.config.useSeverityColors) {
            // Include the color name in the title text instead of applying a CSS class
            const colorMatch = rawTitle.match(/^(YELLOW|ORANGE|RED)/i);
            if (colorMatch) {
                finalTitleText = `${colorMatch[0]} - ${titleText}`;
            }
            severityClass = ""; // No severity class applied
        }

        this.AlertTitle = `<div class="${this.name} alert-title bright ${severityClass}">${finalTitleText}</div>`;
        this.AlertRegion = regionText ? `<div class="${this.name} alert-region">${regionText}</div>` : "";
        this.AlertTime = timeText ? `<div class="${this.name} alert-time">${timePrefix} ${timeText}</div>` : "";

        this.updateDom(this.config.animationSpeed);
    },


    // Iterates through currentAlerts, used instead of for loop to control speed
    startDisplayTimer() {
        this.currentAlertID = 0;
        clearInterval(this.timer);

        // Display immediately so we don't wait for the first interval tick
        this.loaded = true;
        this.displayAlerts();

        this.timer = setInterval(() => {
            if (!this.currentAlerts || this.currentAlerts.length === 0) return;
            this.currentAlertID = (this.currentAlertID + 1) % this.currentAlerts.length;
            if (this.config.debug) {
                const e = this.currentAlerts[this.currentAlertID];
                const t = (e && e.title && e.title[0]) ? String(e.title[0]) : "";
                Log.info(`[${this.name}] Rotating to alert ${this.currentAlertID + 1}/${this.currentAlerts.length}: ${t}`);
            }
            this.displayAlerts();
        }, this.config.displayInterval + this.config.animationSpeed);
    },


    socketNotificationReceived(notification, payload) {
        if (notification === "CPWA_STARTED") { // Updates dom after node_helper receives config
            this.updateDom();
        }
        else if (notification === "CPWA_UPDATE") {
            this.currentAlerts = [];

            if (payload.length !== 0) {
                // If only one alert, temporarily disable transition animation.
                // Restore the original animation speed when multiple alerts are present.
                if (payload.length === 1) {
                    this.config.animationSpeed = 0;
                } else {
                    this.config.animationSpeed = this.baseAnimationSpeed;
                }

                // Sort: higher severity first (RED > ORANGE > YELLOW), then newest updated first
                const sorted = payload.slice().sort((a, b) => {
                    const aTitle = (a && a.title && a.title[0]) ? String(a.title[0]) : "";
                    const bTitle = (b && b.title && b.title[0]) ? String(b.title[0]) : "";

                    const ra = this.getSeverityRank(aTitle);
                    const rb = this.getSeverityRank(bTitle);
                    if (ra !== rb) return rb - ra;

                    const au = (a && a.updated && a.updated[0]) ? Date.parse(a.updated[0]) : NaN;
                    const bu = (b && b.updated && b.updated[0]) ? Date.parse(b.updated[0]) : NaN;
                    if (Number.isFinite(au) && Number.isFinite(bu) && au !== bu) return bu - au;

                    return 0;
                });

                if (this.config.debug) {
                    Log.info(`[${this.name}] Received ${payload.length} alerts; displaying ${sorted.length} after sort`);
                    Log.info(`[${this.name}] Top 5 (title -> class): ` +
                        sorted.slice(0, 5).map(e => {
                            const t = (e && e.title && e.title[0]) ? String(e.title[0]) : "";
                            return `${t} -> ${this.getSeverityClass(t) || "none"}`;
                        }).join(" | "));
                }

                this.currentAlerts = sorted;
                this.startDisplayTimer();

            } else {
                this.AlertTitle = "";
                this.AlertRegion = "";
                this.AlertTime = "";
                this.updateDom();

                clearInterval(this.timer);
                this.config.animationSpeed = this.baseAnimationSpeed;

                Log.log(`[${this.name}] No Alerts in effect for configured regions`);
            }

        }
    }
});