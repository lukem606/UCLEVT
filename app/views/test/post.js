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
		if (appSettings.getString("trainer") === "00") {
			page.frame.navigate(eval("routes.card"+appSettings.getNumber("number")));
		} else if (appSettings.getString("trainer") === "01") {
			page.frame.navigate(routes.HVPT);
		}
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

	postDemogsData();
	
	let cardList = page.getElementsByClassName("card");
	for (i = 0; i < cardList.length; i++) {
		cardList[i].addEventListener("touch", tapCard, true);
	}

	let info = page.getViewById("info");
	let scores = page.getViewById("scores");
	info.addEventListener("touch", openInfo, true);
	scores.addEventListener("touch", openScores, true);

	orderIndex = shuffle([
		[0,0], [0,1], [0,2], [0,3], 
		[1,0], [1,1], [1,2], [1,3], 
		[2,0], [2,1], [2,2], 
		[3,0], [3,1], [3,2],
		[0,0], [0,1], [0,2], [0,3], 
		[1,0], [1,1], [1,2], [1,3], 
		[2,0], [2,1], [2,2], 
		[3,0], [3,1], [3,2]
	]);
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
			compressWidth = cards[0].getActualSize().width;;
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
	for (i = 0; i < scores.idPercentage.length; i++) {
		if (scores.idPercentage[i] === "--") {
			scoreIndex = i;
			break;
		} else if ((Math.round(score / total) * 100) > scores.idPercentage[i]) {
			scoreIndex = i;
			break;
		}
	}

	if (scoreIndex === 2) {
		scores.idPercentage[scoreIndex] = Math.round((score / total) * 100);
		return "hiscore";
	} else if (scoreIndex === 1) {
		scores.idPercentage[2] = scores.idPercentage[1];
		scores.idPercentage[scoreIndex] = Math.round((score / total) * 100);
		return "hiscore";
	} else if (scoreIndex === 0) {
		scores.idPercentage[2] = scores.idPercentage[1];
		scores.idPercentage[1] = scores.idPercentage[0];
		scores.idPercentage[scoreIndex] = Math.round((score / total) * 100);
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


function getVowel(index) {
	switch (orderIndex[index][0]) {
		case 0:
			return orderIndex[index][1] + 1;
			break;
		case 1:
			return 4 + orderIndex[index][1] + 1;
			break;
		case 2:
			return 8 + orderIndex[index][1] + 1;
			break;
		case 3:
			return 11 + orderIndex[index][1] + 1;
			break;
	}
}


function match(card) {
	let title = page.getViewById("title-text");
	title.text = "Correct!";

	entry.correct = 1;
	score++;


	return animateMatch(card, 700, 1200);
}


function notMatch(card) {
	return new Promise(resolve => {
		let correct = page.getViewById("C"+(correctIndex + 1));
		let index = Number(card.id.slice(1, 2));
		let title = page.getViewById("title-text");
		title.text = "Wrong";

		let p = Promise.resolve();
		p = p.then(function() {
			return animateNotMatch(card, 700, 1000); })
			.then(function() {
			setTimeout(function() { resolve(true) }, 500);
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

	appSettings.setNumber("testCount", appSettings.getNumber("testCount") + 1);
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


function postDemogsData() {
	let entry = dataEntries.demographics[0];
	if (entry.length === 8 && entry.sent === false) {
		console.log("Sending");
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


function postIdData() {
	for (i = 0; i < dataEntries.entriesId.length; i++) {
		let entry = dataEntries.entriesId[i];
		if (entry.gameIndex === gameIndex) {
			entry.completed = true;
			if (!entry.sent && entry.completed) {
				http.request({
					url: `https://rala.pals.ucl.ac.uk/Experiments/php/MA_ID.php?a=${entry.participant}&b=${entry.condition}&c=${entry.round}&d=${entry.F1talker}&e=${entry.F1vowel}&f=${entry.response}&g=${entry.correct}&q=125&z=${entry.block}`,
					method: "POST"
				}).then((response) => {
					if (response.content === "\nConnectSuccess") {
						entry.sent = true;   
					}            
				})
			}
		}
	}
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
			.then(function(result) { setTimeout(function() { return animateFlip(cardList, 300, "open"); }, 500); })
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
	speakerIndex = Math.round(Math.random() * 9);
	audioList = [];
	let randNum = 0;

	wordIndices = [orderIndex[current]];
	let randInd = [orderIndex[current][1]];

	for (i = 1; i < wordMaster[orderIndex[current][0]].length; i++) {
		randNum = Math.round(Math.random() * (wordMaster[orderIndex[current][0]].length - 1));

		while (randInd.includes(randNum)) {
			randNum = Math.round(Math.random() * (wordMaster[orderIndex[current][0]].length - 1));
		}
		randInd.push(randNum);
		wordIndices.push([orderIndex[current][0], randNum]);
	}

	wordIndices = shuffle(wordIndices);
	correctIndex = wordIndices.indexOf(orderIndex[current]);

	let words = [];
	for (i = 0; i < wordMaster[orderIndex[current][0]].length; i++) {
		words.push(wordMaster[wordIndices[i][0]][wordIndices[i][1]]);
	}

	options.wordList = words;

	for (i = 0; i < words.length; i++) {
		audioList.push("~/audio/bVt/"+speaker[speakerIndex]+"_"+words[i]+"0.mp3");
	}

	entry = {
		participant: appSettings.getNumber("participantCode"),
		condition: appSettings.getString("version"),
		block: appSettings.getNumber("testCount") + 1,
		round: current + 1,
		F1talker: speakerIndex + 1,
		F1vowel: getVowel(current),
		response: 0,
		correct: 0,
		completed: false,
		gameIndex: gameIndex,
		sent: false
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
const speaker = [
	"ak", "am", "hh", "ka",
	"kh", "lp", "oj", "rlr",
	"rr", "sn"
];
const wordMaster = [
	["bet", "bart", "bat", "but"],
	["beat", "bit", "bite", "bait"],
	["boot", "bout", "bert"],
	["bot", "boat", "bought"]
];
const player = new audio.TNSPlayer();
const total = 28;		// Should be 28

var audioList = [];
var correctIndex;
var current = 0;
var disabled = "true";
var entry;
var gameIndex = 0;
var lastTap = new Date();
var modalOpen = "open";
var orderIndex;
var page;
var score;
var speakerIndex;
var wordIndices;


var options = new obs.fromObject({
	current: 1,
	factor: 0.96,
	finalScore: 0,
	preScore: scores.preScore,
	scorePercentage: scores.idPercentage,
	screenHeight: platform.screen.mainScreen.heightDIPs,
	screenWidth: platform.screen.mainScreen.widthDIPs,
	wordList: ["", "", "", ""]
});