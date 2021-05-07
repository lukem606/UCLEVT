// Dependencies
const animationModule = require("tns-core-modules/ui/animation");
const appSettings = require("tns-core-modules/application-settings");
const dom = require("nativescript-dom");
const fileSys = require("tns-core-modules/file-system");
const frame = require("tns-core-modules/ui/frame");
const http = require("tns-core-modules/http");
const obs = require("tns-core-modules/data/observable");
const platform = require("tns-core-modules/platform");
const routes = require("~/components/routes.json");

// Functions
exports.navContinue = function(args) {
    if (!debounceTap()) {
		 let control = true;
		 let checkbox = page.getViewById("control");
		 if (!checkbox.checked) {
			 control = false;
		 }

		 if (!control) {
			 let warning = page.getViewById("warning");
			 warning.style.visibility = "visible";
		 } else {
			 appSettings.setBoolean("consentGiven", true);
			 page.frame.navigate(routes.demographics)
		 }
	 }
}


exports.navTo = function(args) {
	if (!debounceTap()) {
		page = args.object;
		
		let item = page.getViewById("swipe-icon");
		item.style.visibility = "visible";
	}
}


exports.onLoaded = function(args) {
	page = args.object;
	
	setTimeout(function() {
		heightContent = page.getViewById("top").getMeasuredHeight();
		heightScreen = appSettings.getNumber("screenHeight")  - page.actionBar.getMeasuredHeight();
		
		if (heightContent <= heightScreen) {
			let item = page.getViewById("swipe-icon");
			item.style.visibility = "hidden";
		} else {
			setTimeout(function() { swipeFade(); }, 2000);
		}
	}, 50);
	
	/*if (appSettings.getString("version", "0").length !== 7) {
		http.getString({
			url: "https://rala.pals.ucl.ac.uk/Experiments/php/MA_versionControl.php?q=107",
			method: "POST"
		}).then(function(response) {
			logSettings(response);
		});
	}*/
}


function debounceTap() {
    let current = new Date();

    if ((current - lastTap) > 300) {
        lastTap = current;
        return false;
    } else {
        lastTap = current;
        return true;
    }
}


function logSettings(response) {
	let versionControl;
	
	if (response.length === 8) {
		versionControl = response.slice(1);
	} else {
		let num = Math.round(Math.random() * 3);
		versionControl = "0" + String(num) + "20000";
	}
	
	console.log(versionControl);
	let settingList = [
		[14, 28],
		["Symbols", "Words", "Half Words", "None"],
		["Fixed RP Talker", "Same RP Talker", "Different RP Talkers", "Different Accents"],
		["No Noise", "Babble", "Single Talker"],
		["minimal", "nonMinimal"]
	];
		
	//appSettings.setNumber("number", settingList[0][Number(versionControl[0])]);
	appSettings.setNumber("number", settingList[0][1]);
	//appSettings.setString("marking", settingList[1][Number(versionControl[1])]);
	appSettings.setString("marking", settingList[1][1]);
	appSettings.setString("talker", settingList[2][Number(versionControl[2])]);
	appSettings.setString("noise", settingList[3][Number(versionControl[3])]);
	appSettings.setString("pairs", settingList[4][Number(versionControl[4])]);
	appSettings.setString("trainer", versionControl.slice(5));
	appSettings.setString("version", versionControl);
			
	if (appSettings.getString("talker") === "Fixed RP Talker") {
		appSettings.setNumber("fixedRP", Math.round(Math.random() * 3));
	};
}


function swipeFade() {
    let item = page.getViewById("swipe-icon");
    item.animate({ opacity: 0, duration: 300 });
}


// Variables
var heightContent;
var heightScreen;
var lastTap = new Date();
var page;

var options = new obs.fromObject({
    screenHeight: platform.screen.mainScreen.heightDIPs,
    screenWidth: platform.screen.mainScreen.widthDIPs,
});