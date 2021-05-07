const application = require("tns-core-modules/application");
const appSettings = require("tns-core-modules/application-settings");
const css = require( "nativescript-platform-css" );

// MUST BE REMOVED IN FINAL VERSION
appSettings.clear();
// MUST BE REMOVED IN FINAL VERSION

if (appSettings.getBoolean("firstRun", true) === true) {
	const platform = require("tns-core-modules/platform");
	
	appSettings.setBoolean("consentGiven", false);		// Should be set to false
	appSettings.setBoolean("demographicsCompleted", false);		// Should be set to false
	appSettings.setBoolean("firstRun", false);		// Should be set to false
	appSettings.setBoolean("preCompleted", false)		// Should be set to false
	appSettings.setNumber("gamesCount", 0);		// Should be set to zero
	appSettings.setNumber("participantCode", Math.round(Math.random() * 99999));
	appSettings.setNumber("screenWidth", platform.screen.mainScreen.widthPixels);
	appSettings.setNumber("screenHeight", platform.screen.mainScreen.heightPixels);
	appSettings.setNumber("testCount", 0);		// Should be set to 0
	appSettings.setString("opSys", platform.device.os);
}

application.run({ moduleName: "app-root" });

/*
Do not place any code after the application has been started as it will not
be executed on iOS.
*/

