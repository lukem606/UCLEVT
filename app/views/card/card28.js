// Dependencies
const animationModule = require("tns-core-modules/ui/animation");
const appSettings = require("tns-core-modules/application-settings");
const audio = require("nativescript-audio");
const dataEntries = require("~/components/sendData.json");
const dom = require("nativescript-dom");
const enums = require("tns-core-modules/ui/enums");
const fileSys = require("tns-core-modules/file-system");
const http = require("tns-core-modules/http");
const obs = require("tns-core-modules/data/observable");
const platform = require("tns-core-modules/platform");
const routes = require("~/components/routes.json");
const scores = require("~/components/scoreData.json");
const time = require("tns-core-modules/timer");


// Functions
exports.closeInfo = function(args) {
	if (!debounceTap()) {
		paused = false;
		animateModal("closed", "info");
	}
}


exports.closeScores = function(args) {
	if (!debounceTap()) {
		paused = false;
		animateModal("closed", "scores");
	}
}


exports.endNewGame = function(args) {
	if (!debounceTap()) {
		let cards = page.getElementsByClassName("card");

		if (appSettings.getNumber("gamesCount") === 5 || appSettings.getNumber("gamesCount") === 10) {
			animateDialog("modal-end");
		} else if (appSettings.getNumber("gamesCount") % testPoint === 0) {	
			page.frame.navigate(routes.post);
		} else {
			animateModal("closed", "end");
			restartFade(cards, 600);
			disabledAnim = false;
			disabledAudio = false;
		}
	}
}


exports.hiscoreNewGame = function(args) {
	if (!debounceTap()) {
		let cards = page.getElementsByClassName("card");

		if (appSettings.getNumber("gamesCount") === 5 || appSettings.getNumber("gamesCount") === 10) {
			animateDialog("modal-hiscore");
		} else if (appSettings.getNumber("gamesCount") % testPoint === 0) {	
			page.frame.navigate(routes.post);
		} else {
			animateModal("closed", "hiscore");
			restartFade(cards, 600);
			disabledAnim = false;
			disabledAudio = false;
		}
	}
}


exports.navFrom = function(args) {
	if (!debounceTap()) {
		time.clearInterval(timer);
		noisePlayer.dispose();
		disabledAnim = false;
		disabledAudio = false;
	}
}


exports.navOK = function(args) {
	if (!debounceTap()) {
		page.frame.navigate({
			moduleName: routes.demographics,
			backstackVisible: false
		});
	}
}


exports.navSkip = function(args) {
	if (!debounceTap()) {
		let cards = page.getElementsByClassName("card");
		animateModal("closed", "dialog");
		restartFade(cards, 600);
		disabledAnim = false;
		disabledAudio = false;
	}
}


exports.onLoaded = function(args) {
	page = args.object;
	page.bindingContext = options;

	if (platform.device.deviceType === "Tablet") {
		options.factor = 0.8;
	}

	postDemogsData();
	
	let info = page.getViewById("info");
	let scores = page.getViewById("scores");
	info.addEventListener("touch", openInfo, true);
	scores.addEventListener("touch", openScores, true);

	setTimeout(function() { fadeOverlay(page) }, 200);

	showScores();
}


exports.onTap = function(args) {
	let card = args.object;
	if (flippedCards.includes(card) === false) {
		if (!disabledAnim) {
			if (!disabledAudio) {
				if (!debounceTap()) {
					playAudio(masterList[card.id][1]);
					if (flippedCards.includes(card) === false) {
						flippedCards.push(card);
					}

					disabledAnim = true;
					disabledAudio = true;
					if (flippedCards.length === 2) {
						if (!timer) { timer = time.setInterval(timerUpdate, 1000); }

						if (masterList[flippedCards[0].id][2] === flippedCards[1].id) {
							match(flippedCards);
						} else {
							notMatch(flippedCards);
						}
						options.moves++;
						addEntry();
						flippedCards = [];

						if (hiddenCards.length === total) {
							time.clearInterval(timer);
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


exports.overlayBlock = function() {
	// Function to block activity behind overlay
}


exports.startGame = function() {
	if (!debounceTap()) {
		let imgA = page.getViewById("imgA");
		let imgB = page.getViewById("imgB");

		resetImage(imgB, imgA);
		startGame(page);
		animateModal("closed", "start");
	}
}


function addEntry() {
	let entry = {
		participant: appSettings.getNumber("participantCode"),
		condition: appSettings.getString("version"),
		gamesCount: appSettings.getNumber("gamesCount"),
		moves: options.moves,
		time: timeSecs(),
		C1pos: vID.indexOf(flippedCards[0].id)+1,
		C1talker: getTalker(flippedCards[0]),
		C1word: getPhonetic(flippedCards[0], "word"),
		C1vowel: getPhonetic(flippedCards[0], "vowel"),
		C1symbol: getSymbol(flippedCards[0]),
		C2pos: vID.indexOf(flippedCards[1].id)+1,
		C2talker: getTalker(flippedCards[1]),
		C2word: getPhonetic(flippedCards[1], "word"),
		C2vowel: getPhonetic(flippedCards[1], "vowel"),
		C2symbol: getSymbol(flippedCards[1]),
		matched: 0,
		completed: false,
		sent: false
	}

	if (masterList[flippedCards[0].id][2] === flippedCards[1].id) {
		entry.matched = 1;
	}

	dataEntries.entriesCards.push(entry);
}


function addSummaryEntry() {
	let entry = {
		participant: appSettings.getNumber("participantCode"),
		condition: appSettings.getString("version"),
		gamesCount: appSettings.getNumber("gamesCount"),
		moves: options.moves,
		time: timeSecs(),
		sent: false
	}

	dataEntries.entriesCardSummary.push(entry);
}


function animateDialog(location) {
	let modal = page.getViewById(location);
	modal.animate({opacity: 0, duration: 500})

	dialog = page.getViewById("modal-dialog");
	dialog.style.visibility = "visible";
	dialog.animate({opacity: 1, duration: 500});
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

	spin.push({target: card, width: toCardWidth, opacity: 1, duration: time - 50, curve: enums.AnimationCurve.easeOut});
	spin.push({target: label, width: toLabelWidth, opacity: 1, duration: time - 50, curve: enums.AnimationCurve.easeOut});

	let compressAnimation = new animationModule.Animation(compress);
	let spinAnimation = new animationModule.Animation(spin);

	compressAnimation.play()
		.then(function() {
			card.style.backgroundColor = "#0066FF";
			let label = card.getViewById(card.id+"-txt");
			label.style.visibility = "visible";
		})
		.then(function() { return spinAnimation.play(); })
		.then(function() { disabledAnim = false });
}


function animateHiScore(score) {
	let trophy = page.getViewById("hiscore-trophy");
	let container = page.getViewById("modal-container");
	let modalArray = new Array();
	let modal = page.getViewById("modal-hiscore");
	let modalOpacity;
	let overlay = page.getViewById("overlay");
	let overlayOpacity;

	if (score === "gold") {
		trophy.style.color = "#FFD700";       
	} else if (score === "silver") {
		trophy.style.color = "#C0C0C0";
	} else if (score === "bronze") {
		trophy.style.color = "#CD7F32";
	}

	modalOpen = "open";
	container.style.visibility = "visible";
	modal.style.visibility = "visible";
	modalOpacity = 1;
	overlayOpacity = 0.7;
	modalTime = 1000;
	overlayTime = 500;

	modalArray.push({target: modal, opacity: modalOpacity, duration: modalTime});
	modalArray.push({target: overlay, opacity: overlayOpacity, duration: overlayTime});

	let modalAnimation = new animationModule.Animation(modalArray);

	modalAnimation.play()
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
			}
			let title = page.getViewById("title-text");
			title.text = "Vowel Trainer";
			disabledAnim = false;
		})
	}, lag);
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
			modal.style.visibility = "visible";
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

		modalArray.push({target: overlay, opacity: overlayOpacity, duration: overlayTime});
		modalArray.push({target: modal, opacity: modalOpacity, duration: modalTime});

		let modalAnimation = new animationModule.Animation(modalArray);

		modalAnimation.play()
			.then(function() { 
			if (status === "closed") {
				modalOpen = "closed";
				container.style.visibility = "hidden";
				modal.style.visibility = "hidden";
			} else {
				modalOpen = "open";
			}
			resolve(true); });
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
			let title = page.getViewById("title-text");
			title.text = "Vowel Trainer";
			disabledAnim = false;
		}, lag)});
}


function checkScore() {
	let scoreIndex = 3;
	for (i = 0; i < scores.cardMoves.length; i++) {
		if (scores.cardMoves[i] === "--") {
			scoreIndex = i;
			break;
		} else if (options.moves < scores.cardMoves[i]) {
			scoreIndex = i;
			break;
		} else if (options.moves === scores.cardMoves[i] && options.mins < scores.cardTimes[i][0]) {
			scoreIndex = i;
			break;
		} else if (options.moves === scores.cardMoves[i] && options.mins === scores.cardTimes[i][0] && options.secs < scores.cardTimes[i][1]) {
			scoreIndex = i;
			break;
		}
	}

	if (scoreIndex === 2) {
		scores.cardMoves[scoreIndex] = options.moves;
		scores.cardTimes[scoreIndex][0] = options.mins;
		scores.cardTimes[scoreIndex][1] = options.secs;
		return "bronze";
	} else if (scoreIndex === 1) {
		scores.cardMoves[2] = scores.cardMoves[1];
		scores.cardTimes[2][0] = scores.cardTimes[1][0];
		scores.cardTimes[2][1] = scores.cardTimes[1][1];
		scores.cardMoves[scoreIndex] = options.moves;
		scores.cardTimes[scoreIndex][0] = options.mins;
		scores.cardTimes[scoreIndex][1] = options.secs;
		return "silver";
	} else if (scoreIndex === 0) {
		scores.cardMoves[2] = scores.cardMoves[1];
		scores.cardTimes[2][0] = scores.cardTimes[1][0];
		scores.cardTimes[2][1] = scores.cardTimes[1][1];
		scores.cardMoves[1] = scores.cardMoves[0];
		scores.cardTimes[1][0] = scores.cardTimes[0][0];
		scores.cardTimes[1][1] = scores.cardTimes[0][1];
		scores.cardMoves[scoreIndex] = options.moves;
		scores.cardTimes[scoreIndex][0] = options.mins;
		scores.cardTimes[scoreIndex][1] = options.secs;
		return "gold";
	}
}


function createDeck(cards) {
	let markingType = appSettings.getString("marking");
	let speakerType = appSettings.getString("talker");
	let newWordList = [];
	let setIndex = [];
	let symbolIndices = [];
	let temp = [];
	let tempAudio = [];
	let tempWord = [];
	let wordIndex = [];
	let rGroup, rSet, rWord, setLength, subList, word;

	if (appSettings.getString("pairs") === "nonMinimal") {
		for (i = 0; i < 14; i++) {
			temp = [];
			temp.push(Math.floor(Math.random() * 4));
			temp.push(Math.floor(Math.random() * 9));

			for (j = 0; j < wordIndex.length; j++) {
				while (temp[0] === wordIndex[j] && temp[1] === setIndex[j]) {
					temp = [];
					temp.push(Math.floor(Math.random() * 4));
					temp.push(Math.floor(Math.random() * 9));
				}
			}

			wordIndex.push(temp[0]);
			setIndex.push(temp[1]);
		}
	}

	let chunkList = [0,1,2,3];
	let listChunk = shuffle(chunkList);

	let symbolIndex = 0;
	let indexRP = [0,1,2,3];
	let iRP = shuffle(indexRP);
	let iOther = Math.floor(Math.random()*10);

	for (let i = 0; i < listChunk.length; i++){
		subList = Math.floor(Math.random() * 9);
		words = wordMaster[listChunk[i]][subList];
		for (let j = 0; j < words.length; j++) {
			if (appSettings.getString("pairs") === "nonMinimal") {
				setLength = wordMaster[wordIndex[symbolIndex]][setIndex[symbolIndex]].length;
				word = wordMaster[wordIndex[symbolIndex]][setIndex[symbolIndex]][Math.floor(Math.random() * setLength)];
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
			symbolIndices.push(symbolIndex);
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

		audioStr = (routes.audio+"/"+town1Str+"/"+speak1Str+
						"/"+town1Str+"_"+speak1Str+"_"+wordStr+".mp3");
		tempAudio.push(audioStr);

		audioStr = (routes.audio+"/"+town2Str+"/"+speak2Str+
						"/"+town2Str+"_"+speak2Str+"_"+wordStr+".mp3");
		tempAudio.push(audioStr);
	}

	[tempWord, tempAudio, newWordList, symbolIndices] = shuffleMultiple(tempWord, tempAudio, newWordList, symbolIndices);

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


function getPhonetic(card, choice) {
	let fileName = masterList[card.id][1];
	let chunks = fileName.split("_");
	let chunk = chunks[2].split(".");
	let word = chunk[0];

	for (groupIndex = 0; groupIndex < wordMaster.length; groupIndex++) {
		for (setIndex = 0; setIndex < wordMaster[groupIndex].length; setIndex++) {
			for (wordIndex = 0; wordIndex < wordMaster[groupIndex][setIndex].length; wordIndex++) {
				if (word === wordMaster[groupIndex][setIndex][wordIndex]) {
					if (choice === "word") {
						return setIndex + 1;
					} else if (choice === "vowel") {
						switch (groupIndex) {
							case 0:
								return wordIndex + 1;
								break;
							case 1:
								return 4 + wordIndex + 1;
								break;
							case 2:
								return 8 + wordIndex + 1;
								break;
							case 3:
								return 11 + wordIndex + 1;
								break;
						}
					}
				}
			}
		}
	}
}


function getSymbol(card) {
	if (appSettings.getString("marking") === "Symbols") {
		return masterList[card.id][3];
	} else {
		return 0
	}
}


function getTalker(card) {
	let fileName = masterList[card.id][1];
	let chunks = fileName.split("_");
	let talker = chunks[1];

	if (talker === "Different Accents") {
		return speakerOther.indexOf(talker) + 1;
	} else {
		return speakerRP.indexOf(talker) + 1;
	};
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
		let label = cards[i].getViewById(cards[i].id+"-txt");
		label.style.visibility = "visible";
		hiddenCards.push(cards[i]);
	}

	let title = page.getViewById("title-text");
	title.text = "Correct!";
	animateMatch(cards, 700);
}


function notMatch(cards) {
	for (let i = 0; i < cards.length; i++) {
		cards[i].style.backgroundColor = "#FF3300";
		let label = cards[i].getViewById(cards[i].id+"-txt");
		label.style.visibility = "visible";
	}

	let title = page.getViewById("title-text");
	title.text = "Wrong";
	animateNotMatch(cards, 700);
}


function openEndModal(page) {
	noisePlayer.dispose();

	let gamesCount = appSettings.getNumber("gamesCount");

	postMoveData(gamesCount)
	addSummaryEntry();
	postSummaryData();
	removeSentEntries();

	gamesCount = gamesCount + 1;
	appSettings.setNumber("gamesCount", gamesCount);
	options.gamesCount = gamesCount;

	if (gamesCount % testPoint !== 0) {
		options.columns = (gamesCount % testPoint) + "*," + (testPoint - (gamesCount % testPoint)) + "*";
	} else {
		options.columns = "*";
		let text = page.getElementById("end-next-game");
		text.style.visibility = "hidden";
		text = page.getElementById("hiscore-next-game");
		text.style.visibility = "hidden";
	}

	let score = checkScore();
	showScores();

	if (score === "none") {
		animateModal("open", "end");
	} else {
		animateHiScore(score);
	}
}


function playAudio(fName) {
	let playerOptions = {
		audioFile: fName,
		loop: false,
		completeCallback: function() { 
			if (hiddenCards.length < total) { disabledAudio = false; }
		}
	};

	player.playFromFile(playerOptions);
}


function playNoise(nName) {
	let playerOptions = {
		audioFile: nName,
		loop: true,
	};

	noisePlayer.playFromFile(playerOptions);
}


function postDemogsData() {
	let entry = dataEntries.demographics;
	if (entry.length === 8 && entry.sent === false) {
		http.request({
			url: `https://rala.pals.ucl.ac.uk/Experiments/php/MA_Demo.php?q=125&a=${entry.participant}&b=${entry.age}&c=${entry.learningAge}&d=${entry.timeCountries}&e=${entry.youngLanguage}&f=${entry.otherLanguage}&g=${entry.hearing}&h=${entry.purpose}`,
			method: 'POST'
		}).then((response) => {
			if (response.content === "\nConnectSuccess") {
				entry.sent = true;
			}
		});
	}
}


function postMoveData(count) {
	for (i = 0; i < dataEntries.entriesCards.length; i++) {
		let entry = dataEntries.entriesCards[i];
		if (entry.gamesCount === count) {
			entry.completed = true;
			http.request({
				url: `https://rala.pals.ucl.ac.uk/Experiments/php/MA_MC.php?a=${entry.participant}&b=${entry.condition}&c=${entry.gamesCount}&d=${entry.moves}&e=${entry.time}&f=${entry.C1pos}&g=${entry.C1talker}&h=${entry.C1word}&i=${entry.C1vowel}&j=${entry.C1symbol}&k=${entry.C2pos}&l=${entry.C2talker}&m=${entry.C2word}&n=${entry.C2vowel}&o=${entry.C2symbol}&p=${entry.matched}&q=125`,
				method: "POST"
			}).then((response) => {
				if (response.content === "\nConnectSuccess") {
					entry.sent = true;   
				}            
			})
		}
	}
}


function postSummaryData() {
	for (i = 0; i < dataEntries.entriesCardSummary.length; i++) {
		let entry = dataEntries.entriesCardSummary[i];
		if (entry.sent !== true) {
			http.request({
				url: `https://rala.pals.ucl.ac.uk/Experiments/php/MA_MCSummary.php?a=${entry.participant}&b=${entry.condition}&c=${entry.gamesCount}&d=${entry.moves}&e=${entry.time}&q=125`,
				method: "POST"
			}).then((response) => {
				if (response.content === "\nConnectSuccess") {
					entry.sent = true;
				}            
			})
		}
	}
}


function removeIncompleteEntries() {
	for (i = 0; i < dataEntries.entriesCards.length; i++) {
		if (!dataEntries.entriesCards[i].completed) {
			dataEntries.entriesCards.splice(i, 1);
		}
	}
}


function removeSentEntries() {
	for (i = dataEntries.entriesCards.length-1; i >= 0; i--) {
		if (dataEntries.entriesCards[i].sent === true) {
			dataEntries.entriesCards.splice(i, 1);
		}
	}

	for (i = dataEntries.entriesCardSummary.length-1; i >= 0; i--) {
		if (dataEntries.entriesCardSummary[i].sent === true) {
			dataEntries.entriesCardSummary.splice(i, 1);
		}
	}
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
	});
}


function showScores() {
	if (scores.cardMoves[0] === "--") {
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


function shuffleMultiple(firstArray, secondArray, thirdArray, fourthArray) {
	let currentIndex = firstArray.length;
	let randomIndex;
	let firstTemporaryValue;
	let secondTemporaryValue;
	let thirdTemporaryValue;
	let fourthTemporaryValue;

	while (currentIndex !== 0) {
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;

		firstTemporaryValue = firstArray[currentIndex];
		secondTemporaryValue = secondArray[currentIndex];
		thirdTemporaryValue = thirdArray[currentIndex];
		fourthTemporaryValue = fourthArray[currentIndex];

		firstArray[currentIndex] = firstArray[randomIndex];
		secondArray[currentIndex] = secondArray[randomIndex];
		thirdArray[currentIndex] = thirdArray[randomIndex];
		fourthArray[currentIndex] = fourthArray[randomIndex];
		

		firstArray[randomIndex] = firstTemporaryValue;
		secondArray[randomIndex] = secondTemporaryValue;
		thirdArray[randomIndex] = thirdTemporaryValue;
		fourthArray[randomIndex] = fourthTemporaryValue;
	}

	return [firstArray, secondArray, thirdArray, fourthArray];
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

		removeIncompleteEntries()
		createDeck(cards);

		if (appSettings.getString("noise") !== "No Noise") {
			let noiseFile = routes.audio+"/noise/masker"+appSettings.getString("noise").substring(0, 6)+"Front.mp3";

			playNoise(noiseFile);
		}

		resolve(true);
	});
}


function openInfo(args) {
	if (modalOpen === "closed") {
		paused = true;
		animateModal("open", "info");
	}
}


function openScores(args) {
	if (modalOpen === "closed") {
		paused = true;
		animateModal("open", "scores");
	}
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
				 "E1", "E2", "F1", "F2", "G1", "G2", "H1", "H2",
				 "I1", "I2", "J1", "J2", "K1", "K2", "L1", "L2",
				 "M1", "M2", "N1", "N2"];
const symbols = ["\uf1b2", "\uf2a2", "\uf206", "\uf3a5", 
					  "\uf0e7", "\uf0e9", "\uf21a", "\uf1b9",
					  "\uf1e5", "\uf1ae", "\uf2a3", "\uf1d8", 
					  "\uf0f3", "\uf06c"];
const speakerRP = ["Anna", "Chloe", "John", "Matthew"];
const accentRP = ["London", "London", "London","London"];
const noisePlayer = new audio.TNSPlayer();
const player = new audio.TNSPlayer();
const testPoint = 50;		// Should be 50
const total = 28;		// Should be 28

var disabledAnim = false;
var disabledAudio = false;
var flippedCards = [];
var gotScores = true;
var hiddenCards = [];
var infoOpen = false;
var masterList = {};
var modalOpen = "open";
var lastFlip = new Date();
var page;
var paused = false;
var scoresOpen = false;
var timer = 0;

var options = new obs.fromObject({
	columns: "*,49*",
	factor: 0.96,
	gamesCount: appSettings.getNumber("gamesCount"),
	moves: 0,
	mins: 0,
	scoreMoves: scores.cardMoves,
	scoreTimes: scores.cardTimes,
	screenHeight: platform.screen.mainScreen.heightDIPs,
	screenWidth: platform.screen.mainScreen.widthDIPs,
	secs: 0,
	testPoint: testPoint,
	wordList: ["", "", "", "", "", "", "",
				  "", "", "", "", "", "", "",
				  "", "", "", "", "", "", "",
				  "", "", "", "", "", "", ""]
});