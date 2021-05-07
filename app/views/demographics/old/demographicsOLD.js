// Dependencies
const animationModule = require("ui/animation");
const appSettings = require("tns-core-modules/application-settings");
const dataEntries = require("~/components/sendData.json");
const demographicsList = require("~/components/demographics.json");
const dom = require("nativescript-dom");
const obs = require("tns-core-modules/data/observable");
const platform = require("tns-core-modules/platform");
const routes = require("~/components/routes.json");

// Functions
exports.navBack = function(args) {
    page.frame.navigate(routes.main);
}


exports.navNext = function(args) {
    if (!debounceTap()) {
        let entry = {
            age: page.getViewById("age").text,
            gender: getBoxValue("gender"),
            birthplace: getDropdownValue("dropdown-1"),
            education: getBoxValue("education"),
            native: getDropdownValue("dropdown-2"),
            mother: getDropdownValue("dropdown-3"),
            father: getDropdownValue("dropdown-3"),
            rHImp: getBoxValue("hearingImp"),
            rNImp: getBoxValue("neuroImp"),
            rLImp: getBoxValue("languageImp"),
            rVImp: getBoxValue("visionImp")
        };
        
        dataEntries.demographics = entry;
        page.frame.navigate(routes.languages);
    }
}


exports.navTo = function(args) {
    page = args.object;
    disabled = false;
    
    let items = page.getElementsByClassName("toHide");
    for (i = 0; i < items.length; i++) {
        items[i].style.visibility = "visible";
    }
}


exports.onLoaded = function(args) {
    page = args.object;
    page.bindingContext = options;
    
    page.getViewById("top").addEventListener("touch", dismissInput, true);
    
    let boxList = page.getElementsByTagName("CheckBox");
    for (let i = 0; i < boxList.length; i++) {
        boxList[i].addEventListener("checkedChange", radioToggle, this);
    }
    
    if (platform.isAndroid) {
        let back = page.getViewById("iosBack");
        back.visibility = "collapse";
    } else if (platform.isIOS) {
        let back = page.getViewById("androidBack");
        back.visibility = "collapse";
    }
    
    let arrowList = page.getElementsByTagName("ContentView");
    let index = 1;
    for (i = 0; i < arrowList.length; i++) {
        if (platform.isAndroid) {
            if (arrowList[i].id === "down-"+index) {
                index++;
                arrowList[i].visibility = "hidden";
            }
        }
    }
    
    setTimeout(function() { swipeFade() }, 2000);
}


exports.overlayBlock = function() {
    // Function to block interaction behind overlay
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


function getDropdownValue(dropdownID) {
    let dropdown = page.getViewById(dropdownID);
        
    let index = dropdown.selectedIndex;
    return dropdown.items[index]
}


function getBoxValue(className) {
    let boxList = page.getElementsByClassName(className);
    
    for (i = 0; i < boxList.length; i++) {
        if (boxList[i].checked) {
            return boxList[i].text;
        }
    }
}


function intRange(first, second) {
    let arr = [];
    
    if ((second-first) < 0) {
        for (i = first; i >= second; i--) {
            arr.push(i);
        }
    } else if ((second-first) > 0) {
        for (i = first; i <= second; i++) {
            arr.push(i)
        }
    }
    
    return arr;
}


function radioToggle(args) {
    if (!debounceTap()) {
        let pressed = args.object;
    
        let buttonList = page.getElementsByClassName(
            pressed.classList[pressed.classList.length-1]);
    
        for (let i = 0; i < buttonList.length; i++) {
            if (pressed !== buttonList[i]) {
                if (buttonList[i].checked) {
                    buttonList[i].toggle();
                }
            }
        }
        
        if (!pressed.checked) { 
            pressed.toggle();
            pressed.checked = true;
        }
        eval(pressed.classList[pressed.classList.length-1]+" = \""+pressed.text+"\"");
    }
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
        .then(function() { disabled = true });
}


// Variables
var lastTap = new Date();
var page;

var options = new obs.fromObject({
    countries: demographicsList.countries,
    languages: demographicsList.languages,
    screenHeight: platform.screen.mainScreen.heightDIPs,
    screenWidth: platform.screen.mainScreen.widthDIPs,
    years: intRange(0, 100)
});