// Dependencies
const appSettings = require("tns-core-modules/application-settings");
const dataEntries = require("~/components/sendData.json");
const http = require("tns-core-modules/http");
const routes = require("~/components/routes.json");

//Functions
exports.onLoaded = function(args) {
	page = args.object;
	
	if (appSettings.getString("version", "0").length !== 7) {
		http.getString({
			url: "https://rala.pals.ucl.ac.uk/Experiments/php/MA_versionControl.php?q=107",
			method: "POST"
		}).then(function(response) {
			logSettings(response);
		});
	}
	
	setTimeout(function() {
		if (appSettings.getBoolean("consentGiven") === false) {
			page.frame.navigate(routes.info);
		} else if (appSettings.getBoolean("demographicsCompleted") === false && appSettings.getNumber("gamesCount") === 5 || appSettings.getNumber("gamesCount") === 10) {
			page.frame.navigate(routes.demographics);
		} else if (appSettings.getBoolean("preCompleted") === false) {
			page.frame.navigate(routes.pre);
		} else if ((appSettings.getNumber("gamesCount") / testPoint) === appSettings.getNumber("testCount")) {
			page.frame.navigate(routes.post);
		} else {
			if (appSettings.getString("trainer") === "00") {
				page.frame.navigate(eval("routes.card"+appSettings.getNumber("number")));
			} else if (appSettings.getString("trainer") === "01") {
				page.frame.navigate(routes.HVPT);
			}
		}
	}, 1000);
}


function logSettings(response) {
	let versionControl;
	
	if (response.length === 8) {
		versionControl = response.slice(1);
	} else {
		let num = Math.round(Math.random() * 3);
		versionControl = "0" + String(num) + "20000";
	}
	
	let settingList = [
		[14, 28],
		["Symbols", "Words", "Half Words", "None"],
		["Fixed RP Talker", "Same RP Talker", "Different RP Talkers", "Different Accents"],
		["No Noise", "Babble", "Single Talker"],
		["minimal", "nonMinimal"]
	];
		
	appSettings.setNumber("number", settingList[0][Number(versionControl[0])]);
	//appSettings.setNumber("number", settingList[0][0]);
	appSettings.setString("marking", settingList[1][Number(versionControl[1])]);
	//appSettings.setString("marking", settingList[1][1]);
	appSettings.setString("talker", settingList[2][Number(versionControl[2])]);
	appSettings.setString("noise", settingList[3][Number(versionControl[3])]);
	appSettings.setString("pairs", settingList[4][Number(versionControl[4])]);
	appSettings.setString("trainer", versionControl.slice(5));
	appSettings.setString("version", versionControl);
			
	if (appSettings.getString("talker") === "Fixed RP Talker") {
		appSettings.setNumber("fixedRP", Math.round(Math.random() * 3));
	};
}


// Variables
const testPoint = 50;

var page;