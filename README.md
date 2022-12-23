# MMM-CanadianPublicWeatherAlerts

A module for [MagicMirror](https://github.com/MichMich/MagicMirror) to display Canadian Public Weather Alerts provided by Environment Canada.



``

### Regions



## Options

| **Option**  	| **Description**                                                                                                                                                                                                                                                                                                                                                                                                                                                               	                                     | **Default** 	| **Required** 	|
|-------------	|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------	|--------------	|
| `lang`      	| Sets the language the alerts are displayed in. English and French only. Set as either `"en"` or `"fr"`.                                                                                                                                                                                                                                                                                                                                                                       	                                     | en          	|              	|
| `regions`   	| Set the regions this module will fetch alerts for.                                                                                                                                                                                                                                                                                                                                                                                                                            	                                     |             	| x            	|
| `provinces` 	| Set the provinces this module will fetch alerts for. **Notice:** This setting is intended for displaying all current public alerts in a province. Leave blank to disable, enter any province or territories' alpha code in lowercase. (ex. `on`, `sk`, `nl`, etc. Available here: [Provincial and Territorial Codes](https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/completing-slips-summaries/financial-slips-summaries/return-investment-income-t5/provincial-territorial-codes.html))  	 |             	|              	|
| `colour`    	| Warnings, Watches, and Statements are colour coded by default. Set to `false` to disable                                                                                                                                                                                                                                                                                                                                                                                      	                                     | true        	|              	|