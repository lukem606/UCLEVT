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
    if (!debounceTap()) {
        animateModal("closed", "info");
    }
}


exports.closeScores = function(args) {
    if (!debounceTap()) {
        animateModal("closed", "scores");
    }
}


exports.navContinue = function(args) {
    if (!debounceTap()) {
        page.frame.navigate(eval("routes.card"+appSettings.getNumber("number")));
    }
}


exports.navFrom = function(args) {
    /// Something
}


exports.navTo = function(args) {
    if (!debounceTap()) {
        options.current = 1;
        score = 0;
        options.wordList = ["", "", "", ""];
        disabled = "true";
    }
}


exports.onLoaded = function(args) {
    page = args.object;
    page.bindingContext = options;

    if (platform.device.deviceType === "Tablet") {
        options.factor = 0.8;
    }

    if (dataEntries.entriesId.length === 0) {
        gameIndex = 0;
    } else if (dataEntries.entriesId.length > 0) {
        for (i = 0; i < dataEntries.entriesId.length; i++) {
            if (dataEntries.entriesId[i].gameIndex >= gameIndex) {
                gameIndex = (dataEntries.entriesId[i].gameIndex) + 1;
            }
        }
    }

    let cardList = page.getElementsByClassName("card");
    for (i = 0; i < cardList.length; i++) {
        cardList[i].addEventListener("touch", tapCard, true);
    }

    let info = page.getViewById("info");
    let scores = page.getViewById("scores");
    info.addEventListener("touch", openInfo, true);
    scores.addEventListener("touch", openScores, true);

    switch (appSettings.getString("version")) {
        case "01":
            talker = "Same RP Talker";
            break;
        case "02":
            talker = "Different RP Talkers";
            break;
        case "03":
            talker = "Different Accents";
            break;
    }
    showScores();
}


exports.overlayBlock = function() {
    // Function to block interaction behind modal overlay
}

exports.startGame = function() {
    if (!debounceTap()) {
        options.current = 1;
        animateModal("closed", "start")
            .then(function() {
            score = 0;
            previousWords = [];
            setTimeout(function() { playRound(); }, 500);
        })
    }
}


function animateFlip(cards, time, direction) {
    return new Promise(resolve => {
        let compress = new Array();
        let spin = new Array();
        let labels = [];
        let compressWidth, spinWidth, opacityStart;

        if (direction === "open") {
            compressWidth = 0;
            spinWidth = cards[0].getActualSize().width;
            opacityStart = 0;
        } else if (direction === "closed") {
            compressWidth = cards[0].getActualSize().width;
            spinWidth = 0;
            opacityStart = 1;
        }

        for (i = 0; i < cards.length; i++) {
            let card = cards[i];
            let label = card.getViewById(card.id+"-txt");
            labels.push(label);
            card.style.opacity = opacityStart;
            label.style.opacity = opacityStart;

            compress.push({target: card, width: compressWidth, opacity: opacityStart, duration: 50});
            compress.push({target: label, opacity: opacityStart, duration: 50});

            spin.push({target: card, width: spinWidth, opacity: 1 - opacityStart, duration: time - 50, curve: enums.AnimationCurve.easeOut});
            spin.push({target: label, opacity: 1 - opacityStart, duration: time, curve: enums.AnimationCurve.easeOut});
        }

        let compressAnimation = new animationModule.Animation(compress);
        let spinAnimation = new animationModule.Animation(spin);

        if (direction === "open") {
            compressAnimation.play()
                .then(function() {
                if (audioList.length !== 4 && cards.length === 4) {
                    cards[3].style.visibility = "hidden";
                }

                for (i = 0; i < labels.length; i++) {
                    labels[i].style.visibility = "visible";
                    labels[i].style.color = "#F0F8FF";
                    cards[i].style.backgroundColor = "#0066FF";
                }
            })
                .then(function() { return spinAnimation.play(); })
                .then(function() { resolve(true); });
        } else if (direction === "closed") {
            spinAnimation.play()
                .then(function() {
                if (audioList.length !== 4) {
                    cards[3].style.visibility = "visible";
                }

                for (i = 0; i < labels.length; i++) {
                    labels[i].style.visibility = "hidden";
                    labels[i].style.color = "#0066FF";
                    cards[i].style.backgroundColor = "#F0F8FF";
                }

                if (current < (total-1)) {
                    current++;
                    options.current++;
                } else {
                    options.finalScore = Math.round((score/total) * 100);
                    current++;
                }
            })
                .then(function() { return compressAnimation.play(); })
                .then(function() { resolve(true); });
        }
    });
}


function animateMatch(card, time, lag) {
    return new Promise(resolve => {
        card.style.backgroundColor = "#00E600";
        card.animate({scale: {x: 1.25, y: 0.75}, duration: Math.floor(time * 0.3)})
            .then(function() { return card.animate({scale: {x: 0.75, y: 1.25}, duration: Math.floor(time * 0.1)})})
            .then(function() { return card.animate({scale: {x: 1.15, y: 0.85}, duration: Math.floor(time * 0.1)})})
            .then(function() { return card.animate({scale: {x: 0.95, y: 1.05}, duration: Math.floor(time * 0.15)})})
            .then(function() { return card.animate({scale: {x: 1.05, y: 0.95}, duration: Math.floor(time * 0.1)})})
            .then(function() { return card.animate({scale: {x: 1, y: 1}, duration: Math.floor(time * 0.25)})})
            .then(function() { setTimeout(function() { 
            resolve(true);
        }, lag) });
    });
}


function animateModal(status, location) {
    return new Promise(resolve => {
        let container = page.getViewById("modal-container");
        let modalArray = new Array();
        let modal = page.getViewById("modal-"+location);
        let modalOpacity;
        let overlay = page.getViewById("overlay");
        let overlayOpacity;

        if (status === "open") {
            container.style.visibility = "visible";
            modalOpacity = 1;
            overlayOpacity = 0.7;
            modalTime = 1000;
            overlayTime = 500;
        } else if (status === "closed") {
            modalOpacity = 0;
            overlayOpacity = 0;
            modalTime = 400;
            overlayTime = 800;
        }

        modalArray.push({target: modal, opacity: modalOpacity, duration: modalTime});
        modalArray.push({target: overlay, opacity: overlayOpacity, duration: overlayTime});

        let modalAnimation = new animationModule.Animation(modalArray);

        modalAnimation.play()
            .then(function() { 
            if (status === "closed") {
                modalOpen = "closed";
                container.style.visibility = "hidden";
            } else {
                modalOpen = "open";
            }
            resolve(true); });
    });
}


function animateNotMatch(card, time, lag) {
    return new Promise(resolve => {
        card.style.backgroundColor = "#FF3300";
        card.animate({scale: {x: 1.1, y: 1.1}, duration: Math.floor(time / 3)})
            .then(function() { return card.animate({scale: {x: 0.9, y: 0.9}, duration: Math.floor(time / 3)}) })
            .then(function() { return card.animate({scale: {x: 1, y: 1}, duration: Math.floor(time / 3)}) })
            .then(function() { setTimeout(function() {
            resolve(true);
        }, lag)});
    });
}


function checkScore() {
    let scoreIndex = 3;
    for (i = 0; i < scores.HVPTPercentage.length; i++) {
        if (scores.HVPTPercentage[i] === "--") {
            scoreIndex = i;
            break;
        } else if ((round(score / total) * 100) > scores.HVPTPercentage[i]) {
            scoreIndex = i;
            break;
        }
    }

    if (scoreIndex === 2) {
        scores.HVPTPercentage[scoreIndex] = round((score / total) * 100);
        return "hiscore";
    } else if (scoreIndex === 1) {
        scores.HVPTPercentage[2] = scores.HVPTPercentage[1];
        scores.HVPTPercentage[scoreIndex] = round((score / total) * 100);
        return "hiscore";
    } else if (scoreIndex === 0) {
        scores.HVPTPercentage[2] = scores.HVPTPercentage[1];
        scores.HVPTPercentage[1] = scores.HVPTPercentage[0];
        scores.HVPTPercentage[scoreIndex] = round((score / total) * 100);
        return "hiscore";
    } else if (scoreIndex === 3) {
        return "end";
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


function match(card) {
    let title = page.getViewById("title-text");
    title.text = "Correct!";
    score++;
    entry.correct = 1;

    return animateMatch(card, 700, 1200);
}


function notMatch(card) {
    return new Promise(resolve => {
        let correct = page.getViewById("C"+(correctIndex + 1));
        let index = Number(card.id.slice(1, 2)) - 1;
        let title = page.getViewById("title-text");
        title.text = "Wrong";

        let p = Promise.resolve();
        p = p.then(function() {
            playAudio(audioList[index]);
            return animateNotMatch(card, 700, 1000).then(function() {
                card.style.backgroundColor = "#0066FF"
                playAudio(audioList[correctIndex]);
                return animateMatch(correct, 700, 1000).then(function() {
                    correct.style.backgroundColor = "#0066FF"
                    playAudio(audioList[index]);
                    return animateNotMatch(card, 700, 1200).then(function() {
                        resolve(true)
                    });
                });
            });
        });
    });
}


function openEndModal() {
    let loc = checkScore();
    animateModal("open", loc).then(function() { 
        postIdData();
        removeEntries();
        openModal = "open";
    });

    appSettings.setNumber("vowelCount", appSettings.getNumber("vowelCount") + 1);
}


function openInfo(args) {
    if (!debounceTap()) {
        if (modalOpen === "closed") {
            animateModal("open", "info");
        }
    }
}


function openScores(args) {
    if (!debounceTap()) {
        if (modalOpen === "closed") {
            animateModal("open", "scores");
        }
    }
}


function postIdData() {
    for (i = 0; i < dataEntries.entriesId.length; i++) {
        let entry = dataEntries.entriesId[i];
        if (entry.gameIndex === gameIndex) {
            entry.completed = true;
            if (!entry.sent && entry.completed) {
                https.request({
                    url: `https://rala.pals.ucl.ac.uk/Experiments/php/MA_ID.php?a=${entry.subject}&b=${entry.condition}&c=${entry.moves}&d=${entry.F1talker}&e=${entry.F1vowel}&f=${entry.response}&g=${entry.correct}&q=125`,
                    method: "POST"
                }).then((response) => {
                    if (response.content === "\nConnectSuccess") {
                        entry.sent = true;   
                    }            
                })
            }
        }
    };
}

function playAudio(fName) {
    return new Promise(resolve => {
        let playerOptions = {
            audioFile: fName,
            loop: false,
            completeCallback() { resolve(true) }
        }

        player.playFromFile(playerOptions)
    });
}


function playRound() {
    if (current === total) {
        openEndModal();
    } else {
        entry = {};
        setupRound()
        let cardList = page.getElementsByClassName("card");

        playAudio(audioList[correctIndex])
            .then(function(result) { 
            setTimeout(function() {
                return animateFlip(cardList, 300, "open"); 
            }, 500); })
            .then(function() { disabled = "false" });
    }
}


function removeEntries() {
    for (i = 0; i < dataEntries.entriesId.length; i++) {
        if (dataEntries.entriesId[i].completed && dataEntries.entriesId[i].sent || !dataEntries.entriesId[i].completed && !dataEntries.entriesId[i].sent) {
            dataEntries.entriesId.splice(i, 1);
        }
    }
}


function resetCards() {
    return new Promise(resolve => {
        let cardList = page.getElementsByClassName("card");

        let title = page.getViewById("title-text");
        title.text = "Vowel Test";
        animateFlip(cardList, 300, "closed")
            .then(function() {
            resolve(true);
        });
    });
}


function setupRound() {
    entry = {
        subject: "LUKE0",
        condition: 1,
        round: options.current,
        F1talker: 0,
        F1vowel: 0,
        response: 0,
        correct: 0,
        completed: false,
        gameIndex: gameIndex,
        sent: false
    }

    audioList = [];
    let wordOK = false; 
    let set;
    let word;

    while (wordOK === false) {
        let wordIndex;
        let groupIndex = Math.round(Math.random() * 3);
        let setIndex = Math.round(Math.random() * 8);

        if (groupIndex < 2 ) {
            wordIndex = Math.round(Math.random() * 3);
        } else if (groupIndex > 1) {
            wordIndex = Math.round(Math.random() * 2);
        }

        switch (groupIndex) {
            case 0:
                entry.F1vowel = wordIndex + 1;
                break;
            case 1:
                entry.F1vowel = 4 + wordIndex + 1;
                break;
            case 2:
                entry.F1vowel = 8 + wordIndex + 1;
                break;
            case 3:
                entry.F1vowel = 11 + wordIndex + 1;
                break;
        }

        set = wordMaster[groupIndex][setIndex];
        word = set[wordIndex];

        if (!previousWords.includes(word)) {
            wordOK = true;
        }
    }

    if (talker === "Same RP Talker") {
        // Same RP talker
        speakerIndex = [];
        let temp = Math.round(Math.random() * 3);
        for (i=0; i < set.length; i++) {
            speakerIndex.push(temp);
        }
    } else if (talker === "Different RP Talkers") {
        // Different RP talker
        speakerIndex = [];
        for (i=0; i < set.length; i++) {
            temp = Math.round(Math.random() * 3);
            while (speakerIndex.includes(temp)) {
                temp = Math.round(Math.random() * 9);
            }
            speakerIndex.push(temp);
        }
    } else if (talker === "Different Accents") {
        // Different accent
        speakerIndex = [];
        for (i=0; i < set.length; i++) {
            temp = Math.round(Math.random() * 9);
            while (speakerIndex.includes(temp)) {
                temp = Math.round(Math.random() * 9);
            }
            speakerIndex.push(temp);
        }
    }

    previousWords.push(word);
    set = shuffle(set);
    correctIndex = set.indexOf(word);
    entry.F1talker = speakerIndex[correctIndex] + 1;
    options.wordList = set;
    let speakStr;
    let townStr;

    if (talker === "Same RP Talker" || talker === "Different RP Talkers") {
        for (i = 0; i < set.length; i++) {
            speakStr = speakerRP[speakerIndex[i]];
            townStr = accentRP[speakerIndex[i]];
            audioList.push(routes.audio+"/"+townStr+"/"+speakStr+"/"
                           +townStr+"_"+speakStr+"_"+set[i]+".mp3");
        }
    } else if (talker === "Different Accents") {
        for (i = 0; i < set.length; i++) {
            speakStr = speakerOther[speakerIndex[i]];
            townStr = accentOther[speakerIndex[i]];
            audioList.push(routes.audio+"/"+townStr+"/"+speakStr+"/"
                           +townStr+"_"+speakStr+"_"+set[i]+".mp3");
        }
    }
}


function shuffle(array) {
    let currentIndex = array.length;
    let temporaryValue, randomIndex;

    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}


function showScores() {
    if (scores.HVPTPercentage[0] === "--") {
        gotScores = false;
    } else {
        gotScores = true;
    }

    if (gotScores === false) {
        let stack = page.getViewById("scores-stack");
        let text = page.getViewById("scores-text");
        stack.style.visibility = "collapse";
        text.style.visibility = "visible";
    } else if (gotScores === true) {
        let stack = page.getViewById("scores-stack");
        let text = page.getViewById("scores-text");
        stack.style.visibility = "visible";
        text.style.visibility = "collapse";
    }
}


function tapCard(args) {
    if (disabled === "false") {
        disabled = "true";
        if (!debounceTap()) {
            let card = args.object;
            entry.response = card.id.slice(1, 2);

            let p = Promise.resolve();
            p = p.then(function() {
                if ((card.id.slice(1, 2) - 1) === correctIndex) {
                    return match(card)
                } else if ((card.id.slice(1, 2) - 1) !== correctIndex) {
                    return notMatch(card)
                }
            })
                .then(function() { return resetCards(); })
                .then(function() {
                setTimeout(function() {
                    dataEntries.entriesId.push(entry);
                    playRound();
                }, 1000);
            });

        }
    }
}


// Variables
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
const speakerRP = ["Anna", "Chloe", "John", "Matthew"];
const accentRP = ["London", "London", "London","London"];
const player = new audio.TNSPlayer();
const total = 28;

var audioList = [];
var correctIndex;
var current = 0;
var disabled = "true";
var entry;
var gameIndex = 0;
var gotScores = true;
var lastTap = new Date();
var modalOpen = "open";
var page;
var previousWords = [];
var score;
var talker;


var options = new obs.fromObject({
    current: 1,
    factor: 0.96,
    finalScore: 0,
    preScore: scores.preScore,
    scorePercentage: scores.HVPTPercentage,
    screenHeight: platform.screen.mainScreen.heightDIPs,
    screenWidth: platform.screen.mainScreen.widthDIPs,
    wordList: ["", "", "", ""]
});