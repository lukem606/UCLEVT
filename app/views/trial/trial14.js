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
const scores = require("~/components/scoreData.json");


// Functions
exports.closeInfo = function(args) {
    animateModal("closed", "info");
    timer = setInterval(timerUpdate, 1000);
}

exports.endNewGame = function(args) {
    if (!debounceTap()) {
        let cards = page.getElementsByClassName("card");

        if (appSettings.getNumber("gamesCount") >= 3) {
            appSettings.setNumber("gamesCount", 0);
            page.frame.navigate(routes.info);
        } else {
            animateModal("closed", "end");
            restartFade(cards, 600);
            disabledAnim = false;
            disabledAudio = false;
        };
    }
}


exports.navFrom = function(args) {
    clearInterval(timer);
    noisePlayer.dispose();
    disabledAnim = false;
    disabledAudio = false;
}


exports.onLoaded = function(args) {
    page = args.object;
    page.bindingContext = options;  

    setTimeout(function() { fadeOverlay(page) }, 200);
}


exports.onTap = function(args) {
    let card = args.object;
    if (flippedCards.includes(card) === false) {
        if (!disabledAudio) {
            if (!disabledAnim) {
                if (!debounceTap()) {

                    showCard(card);
                    if (flippedCards.includes(card) === false) {
                        flippedCards.push(card);
                    }

                    disabledAnim = true;
                    disabledAudio = true;
                    if (flippedCards.length === 2) {
                        if (!timer) { timer = setInterval(timerUpdate, 1000); }

                        if (masterList[flippedCards[0].id][2] === flippedCards[1].id) {
                            match(flippedCards);
                        } else {
                            notMatch(flippedCards);
                        }
                        options.moves++;
                        flippedCards = [];

                        if (hiddenCards.length === total) {
                            clearInterval(timer);
                            modalOpen = "open";
                            disabledAnim = true;
                            setTimeout(function() { 
                                fadeAllCards(300)
                                    .then(function() {
                                    setTimeout(function() { openEndModal(page) }, 2000);
                                })
                            }, 2000);
                        }
                    } else {
                        animateFlip(card, 200);
                    }
                }
            }
        }
    }
}


exports.openInfo = function(args) {
    if (modalOpen === "closed") {
        clearInterval(timer);
        animateModal("open", "info");
    }
}


exports.overlayBlock = function() {
    // Function to block activity behind overlay
}


exports.startGame = function() {
    let imgA = page.getViewById("imgA");
    let imgB = page.getViewById("imgB");
    
    resetImage(imgB, imgA);
    startGame(page);
    animateModal("closed", "start");
}


function animateFlip(card, time) {
    let compress = new Array();
    let spin = new Array();

    let label = card.getViewById(card.id+"-txt");
    let toCardWidth = card.getActualSize().width;
    let toLabelWidth = 100;
    card.style.opacity = 0;
    label.style.opacity = 0;

    compress.push({target: card, width: 0, duration: 50});
    compress.push({target: label, width: 0, duration: 50});

    spin.push({target: card, width: toCardWidth, opacity: 1, duration: time - 100, curve: enums.AnimationCurve.easeOut});
    spin.push({target: label, width: toLabelWidth, opacity: 1, duration: time - 50, curve: enums.AnimationCurve.easeOut});

    let compressAnimation = new animationModule.Animation(compress);
    let spinAnimation = new animationModule.Animation(spin);

    compressAnimation.play()
        .then(function() { return spinAnimation.play(); })
        .then(function() { disabledAnim = false });
}


function animateMatch(cards, time) {
    let lag = 800;
    let step30 = new Array();
    let step40 = new Array();
    let step50 = new Array();
    let step65 = new Array();
    let step75 = new Array();
    let step100 = new Array();

    for (let i = 0; i < cards.length; i++) {
        let item = cards[i];

        step30.push(
            eval({target: item, scale: {x: 1.25, y: 0.75}, duration: time * 0.3}));
        step40.push(
            eval({target: item, scale: {x: 0.75, y: 1.25}, duration: time * 0.1}));
        step50.push(
            eval({target: item, scale: {x: 1.15, y: 0.85}, duration: time * 0.1}));
        step65.push(
            eval({target: item, scale: {x: 0.95, y: 1.05}, duration: time * 0.15}));
        step75.push(
            eval({target: item, scale: {x: 1.05, y: 0.95}, duration: time * 0.1}));
        step100.push(eval({target: item, scale: {x: 1, y: 1}, duration: time * 0.25}));
    }

    let step30Animation = new animationModule.Animation(step30);
    let step40Animation = new animationModule.Animation(step40);
    let step50Animation = new animationModule.Animation(step50);
    let step65Animation = new animationModule.Animation(step65);
    let step75Animation = new animationModule.Animation(step75);
    let step100Animation = new animationModule.Animation(step100);

    step30Animation.play()
        .then(function() { return step40Animation.play(); })
        .then(function() { return step50Animation.play(); })
        .then(function() { return step65Animation.play(); })
        .then(function() { return step75Animation.play(); })
        .then(function() { return step100Animation.play(); })
        .then(function() { 
        setTimeout(function() {
            for (let i = 0; i < cards.length; i++) {
                cards[i].style.visibility = "hidden";
            };
            disabledAnim = false;
        }, lag);
    });
}


function animateModal(status, location) {
    return new Promise(resolve => {
        let container = page.getViewById("container");
        let modalArray = new Array();
        let modal = page.getViewById("modal-"+location);
        let modalOpacity;
        let overlay = page.getViewById("overlay");
        let overlayOpacity;

        if (status === "open") {
            container.style.visibility = "visible";
            modal.style.visibility = "visible";
            overlay.style.visibility = "visible";
            modalOpacity = 1;
            overlayOpacity = 0.7;
            modalTime = 1000;
            overlayTime = 500;
            modalOpen = "open";
        } else if (status === "closed") {
            modalOpacity = 0;
            overlayOpacity = 0;
            modalTime = 400;
            overlayTime = 800;
            modalOpen = "closed";
        }

        modalArray.push({target: modal, opacity: modalOpacity, duration: modalTime});
        modalArray.push({target: overlay, opacity: overlayOpacity, duration: overlayTime});

        let modalAnimation = new animationModule.Animation(modalArray);

        modalAnimation.play()
            .then(function() { 
            if (status === "closed") {
                modal.style.visibility = "hidden";
                overlay.style.visibility = "hidden";
                container.style.visibility = "hidden";
                resolve(true);
            } });
    });
}


function animateNotMatch(cards, time) {
    let lag = 800;
    let inflate = new Array();
    let deflate = new Array();
    let original = new Array();

    for (let i = 0; i < cards.length; i++) {
        let item = cards[i];

        inflate.push(
            eval({target: item, scale: {x: 1.1, y: 1.1}, duration: Math.floor(time / 3)}));
        deflate.push(
            eval({target: item, scale: {x: 0.9, y: 0.9}, duration: Math.floor(time / 3)}));
        original.push(
            eval({target: item, scale: {x: 1, y: 1}, duration: Math.floor(time / 3)}));
    }

    let inflateAnimation = new animationModule.Animation(inflate);
    let deflateAnimation = new animationModule.Animation(deflate);
    let originalAnimation = new animationModule.Animation(original);

    inflateAnimation.play()
        .then(function() { return deflateAnimation.play(); })
        .then(function() { return originalAnimation.play(); })
        .then(function() { 
        setTimeout(function () {
            for (let i = 0; i < cards.length; i++) {
                cards[i].style.backgroundColor = "#F0F8FF";
                let label = cards[i].getViewById(cards[i].id+"-txt");
                label.style.visibility = "hidden";
            }
            disabledAnim = false;
        }, lag);
    });
}


function createDeck(cards) {
    let markingType = appSettings.getString("marking");
    let speakerType = appSettings.getString("talker");
    let newWordList = [];
    let setIndex = [];
    let temp = [];
    let tempAudio = [];
    let tempWord = [];
    let wordIndex = [];
    let rGroup, rSet, rWord, setLength, subList, word;

    if (appSettings.getString("pairs") === "nonMinimal") {
        for (i = 0; i < 7; i++) {
            temp = [];
            temp.push(Math.round(Math.random() * 3));
            temp.push(Math.round(Math.random() * 8));

            for (j = 0; j < wordIndex.length; j++) {
                while (temp[0] === wordIndex[j] && temp[1] === setIndex[j]) {
                    temp = [];
                    temp.push(Math.round(Math.random() * 3));
                    temp.push(Math.round(Math.random() * 8));
                }
            }

            wordIndex.push(temp[0]);
            setIndex.push(temp[1]);
        }
    }

    listChunk = [Math.round(Math.random()), Math.round(Math.random())+2];

    let symbolIndex = 0;
    let iRP = shuffle(indexRP);
    let iOther = Math.round(Math.random()*9);

    for (let i = 0; i < listChunk.length; i++){
        subList = Math.round(Math.random() * 8);
        words = wordMaster[listChunk[i]][subList];
        for (let j = 0; j < words.length; j++) {
            if (appSettings.getString("pairs") === "nonMinimal") {
                setLength = wordMaster[wordIndex[symbolIndex]][setIndex[symbolIndex]].length;
                word = wordMaster[wordIndex[symbolIndex]][setIndex[symbolIndex]][Math.round(Math.random() * (setLength-1))];
                tempWord.push(word);
                tempWord.push(word);
            } else {
                tempWord.push(words[j]);
                tempWord.push(words[j]);
            }

            if (markingType === "Symbols") {                 // Symbols
                newWordList.push(symbols[symbolIndex]);
                newWordList.push(symbols[symbolIndex]);
            } else if (markingType === "Words") {          // Words
                newWordList.push(tempWord[tempWord.length-1]);
                newWordList.push(tempWord[tempWord.length-1]);
            } else if (markingType === "Half Words") {          // Half-words
                newWordList.push(tempWord[tempWord.length-1]);    
                newWordList.push("~");
            } else if (markingType === "None") {                            // Nothing
                newWordList.push("~");
                newWordList.push("~");
            }

            symbolIndex++;
        }
    }

    let speakerIndex, speak1str, town1str, speak2str, town2str;

    if (speakerType === "Fixed RP Talker") {
        speakerIndex = appSettings.getNumber("fixedRP");        // Fixed RP

        speak1Str = speakerRP[speakerIndex];
        town1Str = accentRP[speakerIndex];
        speak2Str = speakerRP[speakerIndex];
        town2Str = accentRP[speakerIndex];
    } else {
        speak1Str = speakerRP[iRP[0]];
        town1Str = accentRP[iRP[0]];
        if (speakerType === "Same RP Talker") {                 // Same RP
            speak2Str = speakerRP[iRP[0]];
            town2Str = accentRP[iRP[0]];
        } else if (speakerType === "Different RP Talkers") {    // Different RP
            speak2Str = speakerRP[iRP[1]];
            town2Str = accentRP[iRP[1]];
        } else if (speakerType === "Different Accents") {       // Different other
            speak2Str = speakerOther[iOther];
            town2Str = accentOther[iOther];
        }
    }

    for (let i = 0; i < tempWord.length; i = i + 2) {
        wordStr = tempWord[i];

        audioStr = (routes.audio+"/"+town1Str+"/"+speak1Str+"/"
                    +town1Str+"_"+speak1Str+"_"+wordStr+".mp3");
        tempAudio.push(audioStr);

        audioStr = (routes.audio+"/"+town2Str+"/"+speak2Str+"/"
                    +town2Str+"_"+speak2Str+"_"+wordStr+".mp3");
        tempAudio.push(audioStr);
    }

    [tempWord, tempAudio, newWordList] = shuffleMultiple(tempWord, tempAudio, newWordList);

    for (let i = 0; i < tempWord.length; i++) {
        for (let j = 0; j < tempWord.length; j++) {
            if (i !== j && tempWord[i] === tempWord[j]) {
                idMatch = vID[j];
            }
        }
        tmp = [tempWord[i], tempAudio[i], idMatch];
        eval("masterList[\""+vID[i]+"\"] = tmp;");
    }

    if (markingType === "Symbols") {
        for (let i = 0; i < cards.length; i++) {
            let label = cards[i].getViewById(cards[i].id+"-txt");
            if (!label.classList.contains("fas")) {
                label.classList.add("fas");
            }
        }
    } else {
        for (let i = 0; i < cards.length; i++) {
            let label = cards[i].getViewById(cards[i].id+"-txt");
            if (label.classList.contains("fas")) {
                label.classList.remove("fas");
            }
        }
    }
    options.wordList = newWordList;
}


function debounceTap() {
    let temp = new Date();

    if ((temp - lastFlip) > 300) {
        lastFlip = temp;
        return false;
    } else {
        lastFlip = temp;
        return true;
    }
}


function fadeAllCards(time) {
    return new Promise(resolve => {
        let fadeOut = new Array();
        let cards = page.getElementsByClassName("card");

        for (let i = 0; i < cards.length; i++) {
            let item = cards[i];
            fadeOut.push({target: item, opacity: 0, duration: time});
        }

        let fadeOutAnimation = new animationModule.Animation(fadeOut);

        fadeOutAnimation.play()
            .then(function() { resolve(true) });
    });
}


function fadeOverlay(page) {
    let overlay = page.getViewById("loadDelay");
    overlay.animate({
        opacity: 0,
        duration: 200
    })
        .then(function() { overlay.style.visibility = "hidden" });
}


function imageFade() {
    let imgA = page.getViewById("imgA");
    let imgB = page.getViewById("imgB");

    if (imgB.style.visibility === "visible") {
        resetImage(imgA, imgB);
        imgB.animate({
            opacity: 0,
            duration: 400
        })
            .then(function() {
            imgB.style.visibility = "hidden";
        });
    } else if (imgA.style.visibility === "visible") {
        resetImage(imgB, imgA);
        imgB.style.visibility = "visible";
        imgB.animate({
            opacity: 1,
            duration: 400
        });
    }
}


function match(cards) {
    for (let i = 0; i < cards.length; i++) {
        cards[i].style.backgroundColor = "#00E600";
        hiddenCards.push(cards[i]);
    }

    animateMatch(cards, 700);
}


function notMatch(cards) {
    for (let i = 0; i < cards.length; i++) {
        cards[i].style.backgroundColor = "#FF3300";
    }

    animateNotMatch(cards, 700);
}


function openEndModal(page) {
    noisePlayer.dispose();

    let gamesCount = appSettings.getNumber("gamesCount");
    appSettings.setNumber("gamesCount", gamesCount+1);
    gamesCount = appSettings.getNumber("gamesCount");
    
    if (gamesCount < 3) {
        options.columns = (gamesCount % 3) + "*," + (3 - (gamesCount % 3)) + "*";
    } else {
        options.columns = "*";
    }
    animateModal("open", "end");
}


function playAudio(fName) {
    let playerOptions = {
        audioFile: fName,
        loop: false,
        completeCallback: function() { 
            if (hiddenCards.length < total) { disabledAudio = false; }
        }
    }

    player.playFromFile(playerOptions);
}


function playNoise(nName) {
    let playerOptions = {
        audioFile: nName,
        loop: true,
    };

    noisePlayer.playFromFile(playerOptions);
}


function resetCards(cards) {
    for (let i = 0; i < cards.length; i++) {
        let card = cards[i];

        card.style.backgroundColor = "#F0F8FF";
        card.style.visibility = "visible";
    }
}


function resetImage(hiddenImage, previousImage) {
    let number = Math.round(Math.random() * 99);
    if (number < 10) {
        number = String(number);
        number = number.padStart(2, "0");    
    } else {
        number = String(number);
    }
    
    let newImage = "~/images/ai"+number+".jpg";
    console.log(newImage);

    if (newImage === previousImage.src) {
        while (newImage === previousImage.src) {
            number = Math.round(Math.random() * 99);
            if (number < 10) {
                number = String(number);
                number = number.padStart(2, "0");    
            } else {
                number = String(number);
            }
            newImage = "~/images/ai"+number+".jpg";
        }
    }

    hiddenImage.src = newImage;
}


function restartFade(cards, time) {
    let fadeOut = new Array();
    let fadeIn = new Array();

    for (let i = 0; i < cards.length; i++) {
        let item = cards[i];

        fadeIn.push({target: item, opacity: 1, duration: time/2});
        fadeOut.push({target: item, opacity: 0, duration: time/2});
    }

    let fadeOutAnimation = new animationModule.Animation(fadeOut);
    let fadeInAnimation = new animationModule.Animation(fadeIn);

    fadeOutAnimation.play()
        .then(function() { resetCards(cards); })
        .then(function() { return startGame(page); })
        .then(function() { return fadeInAnimation.play(); })
        .then(function() { imageFade(); })
        .then(function() {
        let buttonList = page.getElementsByClassName("modal-end-button");
        for (i = 0; i < buttonList.length; i++) {
            buttonList[i].isEnabled = false;
        }
    })
}


function showCard(card) {
    card.style.backgroundColor = "#0066FF";
    let label = card.getViewById(card.id+"-txt");
    label.style.visibility = "visible";
    playAudio(masterList[card.id][1]);
}


function shuffle(array) {
    let currentIndex = array.length, temporaryValue, randomIndex;

    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}


function shuffleMultiple(firstArray, secondArray, thirdArray) {
    let currentIndex = firstArray.length; 
    let randomIndex;
    let firstTemporaryValue;
    let secondTemporaryValue;
    let thirdTemporaryValue;

    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        firstTemporaryValue = firstArray[currentIndex];
        secondTemporaryValue = secondArray[currentIndex];
        thirdTemporaryValue = thirdArray[currentIndex];

        firstArray[currentIndex] = firstArray[randomIndex];
        secondArray[currentIndex] = secondArray[randomIndex];
        thirdArray[currentIndex] = thirdArray[randomIndex];

        firstArray[randomIndex] = firstTemporaryValue;
        secondArray[randomIndex] = secondTemporaryValue;
        thirdArray[randomIndex] = thirdTemporaryValue;
    }

    return [firstArray, secondArray, thirdArray];
}


function startGame(page) {
    return new Promise(resolve => {
        let cards = page.getElementsByClassName("card");

        options.moves = 0;
        options.mins = 0;
        options.secs = 0;
        options.wordList = [];

        flippedCards = [];
        hiddenCards = [];
        lastFlip = new Date();
        modalOpen = "closed";
        n = 0;
        timer = 0;

        createDeck(cards);

        if (appSettings.getString("noise") !== "No Noise") {
            let noiseFile = routes.audio+"/noise/masker"+appSettings.getString("noise").substring(0, 6)+"Front.mp3";

            playNoise(noiseFile);
        }

        resolve(true);
    });
}


function timeSecs() {
    let min = options.mins;
    let sec = options.secs;

    return (min*60)+sec;   
}


function timerUpdate() {
    options.secs++;
    if (options.secs === 60) {
        options.secs = 0;
        options.mins++;
    }
}


//Variables
const wordMaster = 
      [
          [
              ["bed","bard","bad","bud"],
              ["beck","bark","back","buck"],
              ["ben","barn","ban","bun"],
              ["hem","harm","ham","hum"],
              ["kept","carped","capped","cupped"],
              ["mesh","marsh","mash","mush"],
              ["met","mart","mat","mutt"],
              ["peck","park","pack","puck"],
              ["pet","part","pat","putt"]],
          [
              ["field","filled","filed","failed"],
              ["feet","fit","fight","fate"],
              ["heat","hit","height","hate"],
              ["leak","lick","like","lake"],
              ["meal","mill","mile","mail"],
              ["meat","mitt","might","mate"],
              ["peel","pill","pile","pale"],
              ["sleet","slit","slight","slate"],
              ["wheat","wit","white","wait"]],
          [
              ["shoot","shout","shirt"],
              ["blues","blouse","blurs"],
              ["fool","foul","furl"],
              ["flute","flout","flirt"],
              ["cooed","cowed","curd"],
              ["cool","cowl","curl"],
              ["pooch","pouch","perch"],
              ["scoot","scout","skirt"],
              ["booed","bowed","bird"]],
          [
              ["fox","folks","forks"],
              ["cod","code","chord"],
              ["cost","coast","coursed"],
              ["cot","coat","caught"],
              ["knot","note","naught"],
              ["pock","poke","pork"],
              ["rod","road","roared"],
              ["con","cone","corn"],
              ["was","woes","wars"]]
      ];
const speakerOther = 
      ['Marlee',
       'Shane',
       'Laura',
       'Steward',
       'Olivia',
       'Alex',
       'Ruby',
       'Richard',
       'Clare',
       'Vinny'];
const accentOther = 
      ['Australia',
       'Australia',
       'Glasgow',
       'Glasgow',
       'Manchester',
       'Manchester',
       'NewZealand',
       'NewZealand',
       'US',
       'US'];
const vID = ["A1", "A2", "B1", "B2", "C1", "C2", "D1", "D2",
             "E1", "E2", "F1", "F2", "G1", "G2"];
const symbols = ["\uf1b2", "\uf2a2", "\uf206", "\uf3a5", 
                 "\uf0e7", "\uf0e9", "\uf21a"];
const speakerRP = ["Anna", "Chloe", "John", "Matthew"];
const accentRP = ["London", "London", "London","London"];
const indexRP = [0,1,2,3];
const noisePlayer = new audio.TNSPlayer();
const player = new audio.TNSPlayer();

var disabledAnim = false;
var disabledAudio = false;
var flippedCards = [];
var hiddenCards = [];
var lastFlip = new Date();
var masterList = {};
var modalOpen = "open";
var page;
var timer = 0;
var total = 14;

var options = new obs.fromObject({
    columns: "*,2*",
    moves: 0,
    mins: 0,
    screenHeight: platform.screen.mainScreen.heightDIPs,
    screenWidth: platform.screen.mainScreen.widthDIPs,
    secs: 0,
    wordList: ["", "", "", "", "", "", "",
               "", "", "", "", "", "", ""]
});
