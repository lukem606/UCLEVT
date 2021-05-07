// Dependencies
const animationModule = require("tns-core-modules/ui/animation");
const appSettings = require("tns-core-modules/application-settings");
const audio = require("nativescript-audio");
const connectivity = require("tns-core-modules/connectivity");
const dataEntries = require("~/components/sendData.json");
const dom = require("nativescript-dom");
const enums = require("tns-core-modules/ui/enums");
const fileSys = require("tns-core-modules/file-system");
const https = require("nativescript-https");
const obs = require("tns-core-modules/data/observable");
const platform = require("tns-core-modules/platform");
const routes = require("~/components/routes.json");

// Functions
exports.onLoaded = function(args) {
	page = args.object;	
}


exports.sendRequest = function(args) {
   if (!debounceTap()) {
	  console.log("Yikes!");
	  /*https.request({
		 url: "https://rala.pals.ucl.ac.uk/Experiments/php/MA_versionControl.php?q=107",
		 method: "POST",
	  }).then(function(response) {
		 console.log("Hey");
		 console.log(response.content.description);
	  });*/
	   https.request({
		   url: "https://rala.pals.ucl.ac.uk",
		   method: "POST",
	   }).then(function(response) {
		   console.log("Hey");
		   console.log(response.content.description);
	   });
   }
}


function debounceTap() {
    let current = new Date().getTime();

    if (current - lastTap > 100) {
        lastTap = current;
        return false
    } else {
        lastTap = current;
        return true
    };
}


// Variables
var lastTap = new Date();
var page;

var options = new obs.fromObject({
    screenHeight: platform.screen.mainScreen.widthDIPs,
    screenWidth: platform.screen.mainScreen.widthDIPs,
});