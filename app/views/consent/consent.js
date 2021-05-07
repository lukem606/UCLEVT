// Dependencies
const animationModule = require("ui/animation");
const appSettings = require("application-settings");
const dom = require("nativescript-dom");
const fsMod = require("file-system");
const platform = require("platform");
const routes = require("~/components/routes.json");

// Functions
exports.navBack = function(args) {
    page.frame.goBack();
}


exports.navContinue = function(args) {
    let control = true;
    
    for (let i = 0; i < checkList.length; i++) {
        if (!checkList[i].checked) {
            control = false;
        }
    }
    
    if (control) {
        // Send data??
        appSettings.setBoolean("consentGiven", true);
        page.frame.navigate(routes.demographics);
    } else {
        let warning = page.getViewById("warning");
        warning.style.visibility = "visible";
    }
}


exports.navTo = function(args) {
    checkList = page.getElementsByTagName("CheckBox");
}


exports.onLoaded = function(args) {
    page = args.object;
    
    if (platform.isAndroid) {
        let back = page.getViewById("iosBack");
        back.visibility = "collapse";
    } else if (platform.isIOS) {
        let back = page.getViewById("androidBack");
        back.visibility = "collapse";
    }
}


exports.overlayBlock = function() {
    // Function to block activity behind overlay 
}


// Variables
var checkList = [];
var page;