// Dependencies
const animationModule = require("tns-core-modules/ui/animation");
const appSettings = require("tns-core-modules/application-settings");
const audio = require("nativescript-audio");
const dataEntries = require("~/components/sendData.json");
const dom = require("nativescript-dom");
const enums = require("tns-core-modules/ui/enums");
const fileSys = require("tns-core-modules/file-system");
const https = require("nativescript-https");
const obs = require("tns-core-modules/data/observable");
const platform = require("tns-core-modules/platform");
const routes = require("~/components/routes.json");

// Functions
exports.modalContinue = function() {
    if (!debounceTap()) {
        page.frame.navigate(eval("routes.card"+appSettings.getNumber("number")));
    }
}


exports.modalStart = function(args) {
    if (!debounceTap()) {
        createSettings();
    
        let p = Promise.resolve();
        p = p.then(() => { return animateModal(page, "start", "hidden", 600);})
            .then(() => { return playRound() });
    }
}


exports.navBack = function(args) {
    removeIncompleteEntries();
    
    page.frame.goBack();
}


exports.navFrom = function(args) {
    noisePlayer.dispose();
}


exports.onLoaded = function(args) {
    page = args.object;
    page.bindingContext = options;
    
    if (platform.isAndroid) {
        let back = page.getViewById("iosBack");
        back.visibility = "collapse";
    } else if (platform.isIOS) {
        let back = page.getViewById("androidBack");
        back.visibility = "collapse";
    }
    
    for (i = 0; i < dataEntries.entriesFrogs.length; i++) {
        let entry = dataEntries.entriesFrogs[i];
        if (!entry.completed) {
            dataEntries.entriesFrogs.splice(i, 1);
        }
    }
    
    let frogList = page.getElementsByClassName("frog");
    for (let i = 0; i < frogList.length; i++) {
        frogList[i].addEventListener("touch", tapFrog, true);
        if (!frogList[i].id.includes("closed")) {
            frogList[i].style.visibility = "collapse";   
        }
    }
}


exports.overlayBlock = function() {
    // Function to block activity behind overlay
}


function addEntry(resp) {
    let entry = {
        subject: "LUKE0",
        condition: 1,
        moves: roundIndex,
        F1talker: getTalker(0),
        F1vowel: getVowel(0),
        F2talker: getTalker(1),
        F2vowel: getVowel(1),
        F3talker: getTalker(2),
        F3vowel: getVowel(2),
        oddPosition: correctIndex[roundIndex],
        response: resp,
        correct: (resp === correctIndex[roundIndex]) ? 1 : 0,
        completed: false,
        sent: false
    }
                
    dataEntries.entriesFrogs.push(entry);
}


function animateFrogWord(frog, time) {
    return new Promise(resolve => {
        frog = frogVisibility(frog, "open", true);
        frog.animate({
            scale: { x: 1.05, y: 1.05 },
            duration: time/2,
            curve: enums.AnimationCurve.easeOut
        })
        .then(function() {
        return frog.animate({
            scale: { x: 1, y: 1 },
            duration: time/2,
            curve: enums.AnimationCurve.easeIn
            })
        })
        .then(function() { frogVisibility(frog, "closed", false) })
        .then(function() { resolve(true) });
    });
}


function animateMatch(frog, time) {
    options.headerText = "Correct!";
    return new Promise(resolve => {
        frog = frogVisibility(frog, "jump", true);
        frog.animate({
            scale: { x: 1, y: 1.2 },
            duration: time/2,
            curve: enums.AnimationCurve.easeOut
        })
        .then(function() {
        return frog.animate({
            scale: { x: 1, y: 1 },
            duration: time/2,
            curve: enums.AnimationCurve.easeIn
            })
        })
        .then(function() { frogVisibility(frog, "closed", false) })
        .then(function() { setTimeout(function() { options.headerText = "Which one is different?" }, 500 )})
        .then(function() { resolve(true) });
    });
}


function animateModal(page, section, status, time) {
    let modalArray = new Array();
    let modal = page.getViewById("modal-"+section);
    let modalOpacity;
    let overlay = page.getViewById("overlay");
    let overlayOpacity;
    
    if (status === "visible") {
        modal.style.visibility = status;
        overlay.style.visibility = status;
        modalOpacity = 1;
        overlayOpacity = 0.7;
        modalTime = time;
        overlayTime = time/2;
    } else if (status === "hidden") {
        modalOpacity = 0;
        overlayOpacity = 0;
        modalTime = time/2;
        overlayTime = time;
    }
    
    modalArray.push({target: modal, opacity: modalOpacity, duration: modalTime});
    modalArray.push({target: overlay, opacity: overlayOpacity, duration: overlayTime});
    
    let modalAnimation = new animationModule.Animation(modalArray);
    
    modalAnimation.play()
        .then(function() {
        if (status === "hidden") {
            modal.style.visibility = status;
            overlay.style.visibility = status;
        }
    });
}


function animateNotMatch(frog, time) {
    options.headerText = "Wrong";
    backingVisibility(frog, "visible", false);
    let backing = backingVisibility(frog, "visible", true);
    
    let deflate = new Array();
    let inflate = new Array();
    
    deflate.push({target: frog, scale: {x: 0.8, y: 0.8}, duration: time/2});
    deflate.push({target: backing, scale: {x: 0.8, y: 0.8}, duration: time/2});
    
    inflate.push({target: frog, scale: {x: 1, y: 1}, duration: time/2});
    inflate.push({target: backing, scale: {x: 1, y: 1}, duration: time/2});
    
    let inflateAnimation = new animationModule.Animation(inflate);
    let deflateAnimation = new animationModule.Animation(deflate);
    
    return new Promise(resolve => {
        deflateAnimation.play()
        .then(function() { return inflateAnimation.play(); })
        .then(function() { backingVisibility(frog, "hidden", false)})
        .then(function() { setTimeout(function() { options.headerText = "Which one is different?" }, 500)})
        .then(function() { resolve(true) });
    });
}


function backingVisibility(frog, newState, toReturn) {
    let backing = page.getViewById("backing"+frog.id[4]);
    backing.style.visibility = newState;
    
    if (toReturn) {
        return backing;
    }
}


function createSettings() {
    let masterPairs = [
        [0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3],
        [4, 5], [4, 6], [4, 7], [5, 6], [5, 7], [6, 7],
        [8, 9], [8, 10], [9, 10], [11, 12], [11, 13], [12, 13]
    ];
    audioList = [];
    correctIndex = [];
    
    let vals = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    let wordPairs = [[1, 4], [5, 8], [6, 0], [2, 13]];
    
    vals = shuffle(vals);
    for (let i = 0; i < vals.length; i++) {
        wordPairs[4+(i*2)] = masterPairs[vals[i]];
    }
    vals = shuffle(vals);
    for (let i = 0; i < vals.length; i++) {
        wordPairs[5+(i*2)] = masterPairs[vals[i]];
    }
    
    wordPairs.push([4, 1]);
    wordPairs.push([8, 5]);
    wordPairs.push([0, 6]);
    wordPairs.push([13, 2]);
    
    for (let i = 0; i < wordPairs.length; i++) {
        let audioTrio = [];
        let speakerIndex = shuffle([0,1,2,3,4,5,6,7,8,9]);
        let permutation = shuffle([0,1,2]);
        let wordIndex = shuffle([0,0,1]);
        
        for (let j = 0; j < 3; j++) {
            audioTrio.push(
                routes.audio+"/bVt/"+speaker[speakerIndex[j]]+"_"
                +wordMaster[wordPairs[i][wordIndex[j]]]+"0.mp3");
            if (wordIndex[j] === 1) {
                correctIndex.push(j);
            }
        }
        
        audioList.push(audioTrio);
        roundIndex = 0;
        options.current = roundIndex + 1;
        audioIndex = 0;
        correctTotal = 0;
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


function frogVisibility(frog, newState, toReturn) {
    let frogName = frog.id.slice(0,5);
    let frogToShow;
    
    frog.style.visibility = "hidden";
    frogToShow = frog.page.getViewById(frogName+"-"+newState);
    frogToShow.style.visibility = "visible";
    
    if (toReturn) {
        return frogToShow;
    }
}


function getFrog(frog) {
    let frogList = page.getElementsByClassName(frog);
    for (let i = 0; i < frogList.length; i++) {
        if (frogList[i].id.includes("closed")) {
            return frogList[i];
        }
    }
}


function getVowel(index) {
    let fileName = audioList[roundIndex][index];
    let base = fileName.slice(12);
    let chunks = base.split("_");
    let chunk = chunks[1].split(".");
    let word = chunk[0];
    let vowel = word.slice(0, word.length-1);
    
    for (i = 0; i < wordMaster.length; i++) {
        if (wordMaster[i] === vowel) {
            return (i+1);
        }
    }
}


function getTalker(index) {
    let fileName = audioList[roundIndex][index];
    let base = fileName.slice(12);
    let chunks = base.split("_");
    let talker = chunks[0];
    
    for (i = 0; i < speaker.length; i++) {
        if (speaker[i] === talker) {
            return (i+1);
        }
    }
}


function playAudio(fName) {
    return new Promise(resolve => {
        let playerOptions = {
            audioFile: fName,
            loop: false,
        }
    
        player.playFromFile(playerOptions);
        audioIndex++;
        resolve(true);
    });
}


function playFrog(frog) {
    let promises = [];
    promises.push(animateFrogWord(getFrog(frog), 700));
    promises.push(playAudio(audioList[roundIndex][audioIndex]));
    return Promise.all(promises);
}


function playNoise(index) {
    let noiseOptions = {
        audioFile: noiseFiles[Math.floor(index/2)],
        loop: false
    }
    
    noisePlayer.initFromFile(noiseOptions)
        .then(() => { noisePlayer.seekTo(Math.random() * 30) })
        .then(() => { noisePlayer.resume() });
}


function playRound() {
    let noiseIndex = roundIndex-Math.floor(roundIndex/4)*4;
    if (noiseIndex === 1 || noiseIndex === 3) {
        setTimeout(function() { playNoise(noiseIndex) }, 100);
    };

    setTimeout(function() {
        let p = Promise.resolve();
        p = p.then(function() { return playFrog("frog1") })
        .then(function() { return playFrog("frog2") })
        .then(function() { return playFrog("frog3") })
        .then(function() {
            audioIndex = 0;
            disabled = false;
            if (noisePlayer.isAudioPlaying()) {
                setTimeout(function() { noisePlayer.dispose() }, 900);
            }
        });
    }, 1000);
}


function postMoveData() {
    let p = Promise.resolve();
    p = p.then(() => {
        for (i = 0; i < dataEntries.entriesFrogs.length; i++) {
            let entry = dataEntries.entriesFrogs[i];
            if (entry.sent !== true) {
                entry.completed = true;
                https.request({
                    url: `https://rala.pals.ucl.ac.uk/Experiments/php/MA_Frogs.php?a=${entry.subject}&b=${entry.condition}&c=${entry.moves}&d=${entry.F1talker}&e=${entry.F1vowel}&f=${entry.F2talker}&g=${entry.F2vowel}&h=${entry.F3talker}&i=${entry.F3vowel}&j=${entry.oddPosition}&k=${entry.response}&l=${entry.correct}&q=125`,
                    method: "POST"
                }).then((response) => {
                    if (response.content === "\ConnectSuccess") {
                        entry.sent = true;   
                    }            
                })
            }
        }
    }).then(() => {
        removeSentEntries()
        
        let buttonList = page.getElementsByClassName("modal-end-button");
        for (i = 0; i < buttonList.length; i++) {
            if (buttonList[i].isEnabled === false) {
                buttonList[i].isEnabled = true;
            }
        }
    })
}


function removeIncompleteEntries() {
    if (dataEntries.entriesFrogs.length < total) {
        dataEntries.entriesFrogs = [];
    }
}


function removeSentEntries() {
    for (i = dataEntries.entriesFrogs.length-1; i >= 0; i--) {
        if (dataEntries.entriesFrogs[i].sent === true) {
            dataEntries.entriesFrogs.splice(i, 1);
        }
    }
}


function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}


function tapFrog(args) {
    if (!disabled) {
        if (!debounceTap()) {
            disabled = true;
            let p = Promise.resolve();
            p = p.then(() => {
                let response = (args.object.id[4] - 1);
                addEntry(response);
                if (response === correctIndex[roundIndex]) {
                    correctTotal++;
                    return animateMatch((args.object), 600);
                } else {
                    return animateNotMatch((args.object), 600);
                }
            })
            .then(() => {
                if ((roundIndex + 1) < total) {
                    roundIndex++;
                    options.current++;
                    playRound()
                } else {
                    postMoveData();
                    options.percentage = (correctTotal / total) * 100;
                    animateModal(page, "end", "visible", 600);
                }
            });
        }
    }
}


// Variables
const noiseFiles = [
        "~/audio/noise/maskerBabbleFront.mp3", "~/audio/noise/maskerSingleFront.mp3"
    ];
const speaker = [
        "ak", "am", "hh", "ka",
        "kh", "lp", "oj", "rlr",
        "rr", "sn"
    ];
const wordMaster = [
        "bet", "bart", "bat", "but",
        "beat", "bit", "bite", "bait",
        "boot", "bout", "bert",
        "bot", "boat", "bought"
    ];
const noisePlayer = new audio.TNSPlayer();
const player = new audio.TNSPlayer();

var audioIndex;
var audioList = [];
var correctIndex = [];
var correctTotal = 0;
var disabled = true;
var lastTap = new Date();
var page;
var response;
var roundIndex = 0;
var total = 5;

var options = new obs.fromObject({
    current: roundIndex + 1,
    frogs: [
        "~/images/Frog_closed.png",
        "~/images/Frog_open.png",
        "~/images/Frog_jump.png"
    ],
    headerText: "Which one is different?",
    percentage: 0,
    screenHeight: platform.screen.mainScreen.widthDIPs,
    screenWidth: platform.screen.mainScreen.widthDIPs,
    total: total
});