# MMM-CanadianPublicWeatherAlerts

A module for [MagicMirror](https://github.com/MichMich/MagicMirror) to display public weather alerts provided by Environment Canada.

## Description

Gets weather watches, warnings, and advisories for user specified regions using data published by Environment Canada.

Learn more about alerts: https://www.canada.ca/en/services/environment/weather/severeweather/weather-alerts.html

## Installation

1. From your modules folder, clone the repository by running `git clone https://github.com/aSouchereau/MMM-CanadianPublicWeatherAlerts.git`
2. Install the required dependencies by running `npm install`
3. Add the module to the mirror's config. (See below for example and options)
4. Find the code for your region(s) and enter them into the config file.

```
{
  module: "MMM-CanadianPublicWeatherAlerts",
  position: "top_center",
  config: {
      lang: 'en',
      regions: [
        {
          code: "on16"
        },
        {
          code: "on17"
        },
        {
          code: "bc46"
        }
      ],
      updateInterval: 60000,
      animationSpeed: 1000,
      displayInterval: 5000
  }
}
```

## Configuration

### Regions

Environment Canada publishes weather alerts for regions across the country. Regions are represented by a region code that follows the format of `xx00` or `xxrm00`.

- `xx` is a one or two character province/territory code.
- `rm` may or may not be present in the code depending on your region. If so, be sure to include this in the config value.
- `00` is a 1 - 4 digit number representing a region located in the province/territory.

Region codes can be found in [CODES_en.md](./CODES_en.md) or [CODES_fr.md](CODES_fr.md). The codes listed here may be out of date. If necessary, you can regenerate the table with `sh generate_codes_table.sh -l <en | fr> -o <filename.md>`



| **Option**        | **Description**                                                                                                                                                                                                        | **Default** | **Required** |
|-------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------|--------------|
| `lang`            | Sets the language the alerts are displayed in. English and French only. Set as either en or fr.                                                                                                                        | en          |              |
| `regions`         | Sets the regions this module will display alerts for. See instructions below to find the region code for your area.                                                                                                    |             | x            |
| `updateInterval`  | Sets the interval between each alert update. By default, this module will get new alert data every `60 seconds`.                                                                                                       | 60000       |              |
| `displayInterval` | Sets the amount of time each alert is displayed for. Default value is `5 seconds`.                                                                                                                                     | 5000        |              |
| `animationSpeed`  | Sets the speed of the cross-fade between each alert. Set to `0` to disable. Default value is `1 second`.                                                                                                               | 1000        |              |
| `showNoAlertsMsg` | If set to true, the module will display a "No alerts in effect" message for each region.                                                                                                                               | false       |              |
| `periodicSync`    | If set to true, the module will periodically resend the config and request a new update from the server. This is helpful for server only installations where a client may become "out of sync" if the server restarts. | false       |              |
| `syncInterval`    | Sets the amount of time between each config sync. By default (if enabled), the module will sync with the server once every 10 minutes.                                                                                        | 600000      |              |
| `debug` | Enables verbose logging for alert intake, severity detection, sorting, and alert rotation. Useful for troubleshooting feed or display issues. | false | |



### Intervals

#### updateInterval
- When the module starts, and after each interval specified by `updateInterval`, the module will fetch new data for each configured region. 
- The interval should be long enough for the client to have enough time to display all alerts.
- If you notice that not all alerts are being displayed, it could be that the module doesn't have enough time to display all the alerts between each update. 
- To remedy this, you can either increase the `updateInterval`, or decrease the `displayInterval` and `animationSpeed`.
- **Please be aware** that regions may contain subregions, each with their own alerts.

#### displayInterval and animationSpeed
`displayInterval` is the amount of time a single alert is displayed for, not including the animation speed. For example: 
- Assume a `displayInterval` of 5 seconds, and an `animationSpeed` of 1 second.
- The module will display a new alert every 6 seconds.

#### syncInterval
- Sets the amount of time between each sync.
- It is recommended to set this value to something longer than your updateInterval. 
- The module guards against duplicate update and sync timers when reloaded or when configuration options change, ensuring stable long-running operation.

## Custom Styling

Each element is assigned a class that denotes its type. You can target these classes in the mirror's `custom.css` file to customize appearance.

| **Element** | **Class**      |
|-------------|----------------|
| Title       | `alert-title`  |
| Location    | `alert-region` |
| Time Since  | `alert-time`   |

### Severity Styling

These severity classes directly reflect Environment Canada’s current alert severity system and are not user-defined.

When Environment Canada includes a severity prefix in the alert title, the following CSS classes are automatically applied to the alert title element:

| **Severity** | **CSS Class** | **Default `color`** |
|--------------|---------------|--------------------|
| Yellow       | `severity-yellow` | #FFD24D |
| Orange       | `severity-orange` | #FF9F1C |
| Red          | `severity-red` | #FF5C5C |