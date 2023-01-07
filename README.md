# MMM-CanadianPublicWeatherAlerts

A module for [MagicMirror](https://github.com/MichMich/MagicMirror) to display [Canadian Public Weather Alerts](https://weather.gc.ca/warnings/index_e.html) provided by Environment Canada.

Description:

Gets weather watches, warnings, and advisories for user specified regions. Using data published by Environment Canada.

<img src="./img/AlertExample.gif" width="400">

## Installation

1. From your modules folder, clone the repository by running `git clone https://github.com/aSouchereau/MMM-CanadianPublicWeatherAlerts.git`
2. Install the required dependencies by running `npm install`
3. Add the module to the mirror's config. (See below)
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

## Options
| **Option**        | **Description**                                                                                                     | **Default** | **Required** |
|-------------------|---------------------------------------------------------------------------------------------------------------------|-------------|--------------|
| `lang`            | Sets the language the alerts are displayed in. English and French only. Set as either en or fr.                     | en          |              |
| `regions`         | Sets the regions this module will display alerts for. See instructions below to find the region code for your area. |             | x            |
| `updateInterval`  | Sets the interval between each alert update. By default, this module will get new alert data every `60 seconds`.    | 60000       |              |
| `displayInterval` | Sets the amount of time each alert is displayed for. Default value is `5 seconds`.                                  | 5000        |              |
| `animationSpeed`  | Sets the speed of the cross-fade between each alert. Set to `0` to disable. Default value is `1 second`.            | 1000        |              |

### Regions
Environment Canada publishes weather alerts for regions across the country. Regions are represented by a region code that follows the format of `aa00`.
- `aa` is a two character province/territory code.
- `00` is a 1-3 digit number representing a region located in the province.

To find the code for your desired region visit [Env Canada Alerts Page](https://weather.gc.ca/warnings/index_e.html) and locate it on the map.

<img src="img/MapNavigationExaple.gif" width="400">

The region code can be found at the end of the url on your regions alert page.

<img src="img/UrlExample.png" width="400">

Copy the region code into your config. Repeat for any other regions you want to add.

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


### Intervals

#### updateInterval
- When the module starts, and after each interval specified by `updateInterval`, the module will fetch new data for each configured region. 
- The interval should be long enough for the client to have enough time to display all alerts.
- If you notice that not all alerts are being displayed, it could be that the module doesn't have enough time to display all the alerts between each update. 
- To remedy this, you can either increase the `updateInterval`, or decrease the `displayInterval` and `animationSpeed`.
- **Please be aware** that many regions contain subregions, each with their own alerts.

#### displayInterval and animationSpeed
`displayInterval` is the amount of time a single alert is displayed for, not including the animation speed. For example: 
- Assume a `displayInterval` of 5 seconds, and an `animationSpeed` of 1 second.
- The module will display a new alert every 6 seconds.


## Custom Styling

Each element is assigned a class that denotes its type. You can target this class in the mirror's `custom.css` file.

| **Element** | **Class**      |
|-------------|----------------|
| Title       | `alert-title`  |
| Location    | `alert-region` |
| Time Since  | `alert-time`   |

The default styles for this module are as follows:

<img src="./img/CssExample.png" width="400">