// Dependencies
const animationModule = require("ui/animation");
const appSettings = require("tns-core-modules/application-settings");
const dataEntries = require("~/components/sendData.json");
const demographicsList = require("~/components/demographics.json");
const dom = require("nativescript-dom");
const http = require("tns-core-modules/http");
const obs = require("tns-core-modules/data/observable");
const platform = require("tns-core-modules/platform");
const routes = require("~/components/routes.json");

// Functions
exports.navSkip = function(args) {
	if (!debounceTap()) {
		if (appSettings.getBoolean("preCompleted") === false) {
			page.frame.navigate(routes.pre);
		} else {
			if (Math.floor((appSettings.getNumber("gamesCount") / testPoint)) > appSettings.getNumber("testCount")) {
				page.frame.navigate(routes.post);
			} else {
				if (appSettings.getString("trainer") === "00") {
					page.frame.navigate(eval("routes.card"+appSettings.getNumber("number")));
				} else if (appSettings.getString("trainer") === "01") {
					page.frame.navigate(routes.HVPT);
				}
			}
		}
	}
}


exports.navSubmit = function(args) {
	if (!debounceTap()) {
		let entry = {
			participant: appSettings.getNumber("participantCode"),
			age: page.getViewById("age").text,
			learningAge: page.getViewById("learningAge").text,
			timeCountries: page.getViewById("timeCountries").text,
			youngLanguage: page.getViewById("youngLanguage").text,
			otherLanguage: page.getViewById("otherLanguage").text,
			hearing: page.getViewById("hearing").text,
			purpose: page.getViewById("purpose").text,
			sent: false
		};

		appSettings.setBoolean("demographicsCompleted", true);
		dataEntries.demographics = [entry];
		
		console.log(dataEntries);

		if (appSettings.getBoolean("preCompleted") === false) {
			page.frame.navigate(routes.pre);
		} else {
			if (Math.floor((appSettings.getNumber("gamesCount") / testPoint)) > appSettings.getNumber("testCount")) {
				page.frame.navigate(routes.post);
			} else {
				if (appSettings.getString("trainer") === "00") {
					page.frame.navigate(eval("routes.card"+appSettings.getNumber("number")));
				} else if (appSettings.getString("trainer") === "01") {
					page.frame.navigate(routes.HVPT);
				}
			}
		}
	}
}


exports.navTo = function(args) {
	page = args.object;
}


exports.onLoaded = function(args) {
	page = args.object;
	page.bindingContext = options;

	page.getViewById("top").addEventListener("touch", dismissInput, true);

	setTimeout(function() {
		heightContent = page.getViewById("top").getMeasuredHeight();
		heightScreen = appSettings.getNumber("screenHeight")  - page.actionBar.getMeasuredHeight();

		if (heightContent <= heightScreen) {
			let items = page.getElementsByClassName("swipeFade");
			for (i = 0; i < items.length; i++) {
				items[i].style.visibility = "hidden";
			}
		} else {
			setTimeout(function() { swipeFade(); }, 2000);
		}
	}, 50);
}


exports.overlayBlock = function() {
	// Function to block interaction behind overlay
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


function dismissInput() {
	let inputList = page.getElementsByClassName("key");

	for (i = 0; i < inputList.length; i++) {
		if (platform.isAndroid) {
			inputList[i].dismissSoftInput();
		} else if (platform.isIOS) {
			inputList[i].ios.resignFirstResponder();
		}
	}
}


function formatString(text) {
	result = JSON.parse(JSON.stringify(text));
	result = result.replace(/[^\w\s]|_/g, '').replace(/\s+/g, '%20');
	return result;
}


function swipeFade() {
	let items = page.getElementsByClassName("swipeFade");
	let fadeArray = [];

	for (i = 0; i < items.length; i++) {
		let item = items[i];
		fadeArray.push({ target: item, opacity: 0, duration: 300 });
	}

	let fadeAnimation = new animationModule.Animation(fadeArray);
	fadeAnimation.play()
}


// Variables
const testPoint = 50;

var lastTap = new Date();
var page;

var options = new obs.fromObject({
	screenHeight: platform.screen.mainScreen.heightDIPs,
	screenWidth: platform.screen.mainScreen.widthDIPs,
});