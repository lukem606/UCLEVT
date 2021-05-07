// Dependencies
const animationModule = require("tns-core-modules/ui/animation");
const appSettings = require("tns-core-modules/application-settings");
const dataEntries = require("~/components/sendData.json");
const demographicsList = require("~/components/demographics.json");
const dom = require("nativescript-dom");
const obs = require("tns-core-modules/data/observable");
const platform = require("tns-core-modules/platform");
const routes = require("~/components/routes.json");

//Functions
exports.navBack = function(args) {
    page.frame.goBack();
}


exports.navSubmit = function(args) {
    if (!debounceTap()) {
        dataEntries.countries = {
            "country-1": getDropdownValue("dropdown-1"),
            "years-1": page.getViewById("years-1").text,
            "months-1": page.getViewById("months-1").text,
            "age-1": page.getViewById("age-1").text,
            "country-2": getDropdownValue("dropdown-2"),
            "years-2": page.getViewById("years-2").text,
            "months-2": page.getViewById("months-2").text,
            "age-2": page.getViewById("age-2").text,
            "country-3": getDropdownValue("dropdown-3"),
            "years-3": page.getViewById("years-3").text,
            "months-3": page.getViewById("months-3").text,
            "age-3": page.getViewById("age-3").text,
            "country-4": getDropdownValue("dropdown-4"),
            "years-4": page.getViewById("years-4").text,
            "months-4": page.getViewById("months-4").text,
            "age-4": page.getViewById("age-4").text,
            "country-5": getDropdownValue("dropdown-5"),
            "years-5": page.getViewById("years-5").text,
            "months-5": page.getViewById("months-5").text,
            "age-5": page.getViewById("age-5").text,
            
        }
        
        console.log(dataEntries.countries);
        page.frame.backStack.splice(1, page.frame.backStack.length-1);
    
        appSettings.setBoolean("demographicsCompleted", true);
        appSettings.setNumber("gamesCount", 0);
        page.frame.navigate(eval("routes.card"+appSettings.getNumber("number")));
    }
}


exports.navTo = function(args) {
    //
}


exports.onLoaded = function(args) {
    page = args.object;
    page.bindingContext = options;
    
    page.getViewById("full").addEventListener("touch", dismissInput, true);
    
    if (platform.isAndroid) {
        let back = page.getViewById("iosBack");
        back.visibility = "collapse";
    } else if (platform.isIOS) {
        let back = page.getViewById("androidBack");
        back.visibility = "collapse";
    }
    
    setTimeout(function() { swipeFade(); }, 2000);
}


exports.tapDropdown = function(args) {
    if (!debounceTap()) {
        let id = args.object.id.slice(-1,);
        let dropdown = page.getViewById("dropdown-"+id);
        
        if (!dropdown.classList.contains("open")) {
            dropdown.open();
            dropdown.classList.push("open");
        } else {
            dropdown.close();
            for (i = 0; i < dropdown.classList.length; i++) {
                if (dropdown.classList[i] === "open") {
                    dropdown.classList.splice(i, 1);
                }
            }
        }
    }
}


function debounceTap() {
    let temp = new Date();
    
    if ((temp - lastTap) > 300) {
        lastTap = temp;
        return false;
    } else {
        lastTap = temp;
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


function getDropdownValue(dropdownID) {
    let dropdown = page.getViewById(dropdownID);
        
    let index = dropdown.selectedIndex;
    return dropdown.items[index]
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
var lastTap = new Date();
var page;

var options = new obs.fromObject({
    countries: demographicsList.countries,
    screenHeight: platform.screen.mainScreen.heightDIPs,
    screenWidth: platform.screen.mainScreen.widthDIPs
});