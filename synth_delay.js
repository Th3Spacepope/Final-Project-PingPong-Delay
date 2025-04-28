import Voice from "./Voice.js";

let attack = 0.015;
let decay = 0.01;
let sustain = 0.5;
let release = 0.1;
let type = "sine";
//let offset = 0.05;

/**
 * @constant {AudioContext} mySynthCtx
 * @description The main WebAudio AudioContext for the synthesizer.
 */
const mySynthCtx = new AudioContext();

/**
 * @constant {Object} activeVoices
 * @description Stores currently active voices, indexed by MIDI note number.
 */
const activeVoices = {};

/**
 * Converts a linear amplitude to dB scale.
 * @param {number} linAmp - The linear amplitude value.
 * @returns {number} The corresponding amplitude in dB.
 */
const dBtoA = function (linAmp) {
  return Math.pow(10, linAmp / 20);
};

/**
 * @constant {GainNode} masterGain
 * @description Master gain control for the synth.
 */
let masterGain = mySynthCtx.createGain();
masterGain.gain.value = 0.125; // Set master volume

//create synth gain
let synthGain = mySynthCtx.createGain();
let synthDry = mySynthCtx.createGain();
synthGain.gain.value = 0.5;
synthDry.gain.value = 0.5;

//create synth filter
const synthFilter = mySynthCtx.createBiquadFilter();
synthFilter.type = "lowpass";
synthFilter.frequency.value = 12000;
synthFilter.Q.value = 1;

//Merge audio from Delays
//const merger = mySynthCtx.createChannelMerger(2);
const wetMerger = mySynthCtx.createChannelMerger(2);
const dryMerger = mySynthCtx.createChannelMerger(2);
// const wetMergeEnd = mySynthCtx.createChannelMerger(2);
// const dryMergeEnd = mySynthCtx.createChannelMerger(2);
// const split = mySynthCtx.createChannelSplitter(2);
//create delay channels
let delayL = mySynthCtx.createDelay(179);
let delayR = mySynthCtx.createDelay(179);
delayL.delayTime.value = 0.2;
delayR.delayTime.value = 0.2;

//create gain for delay
let delayGainL = mySynthCtx.createGain();
let delayGainR = mySynthCtx.createGain();
// delayGainL.gain.setValueAtTime(dGain, mySynthCtx.currentTime);
// delayGainR.gain.setValueAtTime(dGain, mySynthCtx.currentTime);

//create feedback for delay
let feedbackL = mySynthCtx.createGain();
let feedbackR = mySynthCtx.createGain();
feedbackL.gain.value = 0.2;
feedbackR.gain.value = 0.2;

//create panner for wet/dry
let mix = mySynthCtx.createStereoPanner();
//mix.pan.value = 0;

// feedbackL.gain.setValueAtTime(0.5, mySynthCtx.currentTime);
// feedbackR.gain.setValueAtTime(0.5, mySynthCtx.currentTime);
//connect synthGain to filter
synthGain.connect(synthFilter);

//connect splitter to delay gains
synthFilter.connect(delayGainL);
//synthGain.connect(delayGainR);

//DRY SIGNAL
// synthFilter.connect(merger, 0, 0);
// synthFilter.connect(merger, 0, 1);

//Connect delay gain to delays
delayGainL.connect(delayL);
delayGainR.connect(delayR);

//Connect delay to feedback gain
delayL.connect(feedbackL);
delayR.connect(feedbackR);

//connect feedback to delays
feedbackL.connect(delayR);
feedbackR.connect(delayL);

//DRY SIGNAL
synthFilter.connect(synthDry);
synthDry.connect(dryMerger, 0, 0);
synthDry.connect(dryMerger, 0, 1);

//Wet signal
delayL.connect(wetMerger, 0, 0);
delayR.connect(wetMerger, 0, 1);

//connect delays to merger
//delayGainL.connect(wetMerger, 0, 0);
//delayGainR.connect(wetMerger, 0, 1);

//connect mergers to stereo pan
dryMerger.connect(masterGain);
wetMerger.connect(masterGain);

//mix.connect(masterGain);
mix.connect(masterGain);

//mix.connect(masterGain);

// Connect master gain to the audio output
masterGain.connect(mySynthCtx.destination);

//------------------------------Functions----------------------------------------------
/**
 * @function mtof
 * @description Converts a MIDI note number to its corresponding frequency in Hz.
 * @param {number} midi - The MIDI note number (e.g., 60 for C4).
 * @returns {number} The frequency in Hz.
 */
const mtof = function (midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
};

/**
 * @function startNote
 * @description Starts a note by creating and storing a new Voice instance.
 * @param {number} note - The MIDI note number.
 */
const startNote = function (note) {
  if (!activeVoices[note]) {
    // save a new instance of the class Voice instead of the mtof(note)

    let newVoice = new Voice(
      mySynthCtx,
      mtof(note),
      synthGain,
      [attack, decay, sustain, release],
      type
    );

    activeVoices[note] = newVoice;
    activeVoices[note].start(); //newVoice.start()
  }
};

/**
 * @function stopNote
 * @description Stops a currently playing note and removes it from activeVoices.
 * @param {number} note - The MIDI note number.
 */
const stopNote = function (note) {
  if (activeVoices[note]) {
    activeVoices[note].stop();
    delete activeVoices[note];
  }
};

/**
 * @constant {Object} noteMap
 * @description Maps keyboard keys to MIDI note numbers.
 */
const noteMap = {
  a: 60, // C4
  w: 61, // C#4 / Db4
  s: 62, // D4
  e: 63, // D#4 / Eb4
  d: 64, // E4
  f: 65, // F4
  t: 66, // F#4 / Gb4
  g: 67, // G4
  y: 68, // G#4 / Ab4
  h: 69, // A4 (440 Hz)
  u: 70, // A#4 / Bb4
  j: 71, // B4
  k: 72, // C5
  o: 73, // C#5 / Db5
  l: 74, // D5
  p: 75, // D#5 / Eb5
  ";": 76, // E5
};

const updateMasterGain = function () {
  let amp = dBtoA(masterFader.value);
  masterGain.gain.exponentialRampToValueAtTime(
    amp,
    mySynthCtx.currentTime + 0.01
  );
  masterGainLabel.innerText = `${masterFader.value} dBFS`;
};
const updateSynthGain = function () {
  let amp = dBtoA(synthFader.value);
  synthGain.gain.exponentialRampToValueAtTime(
    amp,
    mySynthCtx.currentTime + 0.01
  );
  synthGainLabel.innerText = `${synthFader.value} dBFS`;
};
// const updateDelayGain = function () {
//   let amp = dBtoA(delayFader.value);
// delayGainL.gain.exponentialRampToValueAtTime(
//   amp,
//   mySynthCtx.currentTime + 0.01
// );
// delayGainR.gain.exponentialRampToValueAtTime(
//   amp,
//   mySynthCtx.currentTime + 0.01
// );
//   dGainLabel.innerText = `${delayFader.value} dBFS`;
// };
const updateDelayTime = function () {
  delayL.delayTime.setValueAtTime(dTime.value / 1000, mySynthCtx.currentTime);
  delayR.delayTime.setValueAtTime(
    dTime.value / 1000 + offset.value / 1000,
    mySynthCtx.currentTime
  );
  dTimeLabel.innerText = `${dTime.value} ms`;
};

const updateFeedback = function () {
  feedbackL.gain.exponentialRampToValueAtTime(
    feedback.value / 100,
    mySynthCtx.currentTime
  );
  feedbackR.gain.exponentialRampToValueAtTime(
    feedback.value / 100,
    mySynthCtx.currentTime
  );
  if (feedback.value == 0.01) {
    feedbackLabel.innerText = `${feedback.value - 0.01}%`;
  } else if (feedback.value == 99.01) {
    feedbackLabel.innerText = `${(feedback.value = 100)}%`;
  } else {
    feedbackLabel.innerText = `${Math.floor(feedback.value)}%`;
  }
};

const updateWaveType1 = function () {
  type = "sine";
  console.log(activeVoices.type);
};
const updateWaveType2 = function () {
  type = "square";
  console.log(activeVoices.type);
};
const updateWaveType3 = function () {
  type = "sawtooth";
  console.log(activeVoices.type);
};
const updateOffset = function () {
  offsetLabel.innerText = `${offset.value}ms`;
};

//convert range of "mix" slider
//code from user "oleq" on Stack Overflow: https://stackoverflow.com/questions/14224535/scaling-between-two-number-ranges
function convertRange(value, r1, r2) {
  return ((value - r1[0]) * (r2[1] - r2[0])) / (r1[1] - r1[0]) + r2[0];
}

const updateWetDry = function () {
  //code from Gemini AI
  if (wetDry.value >= 0) {
    //mix.pan.value = `${wetDry.value / 100}`;
    delayGainL.gain.value = 1;
    delayGainR.gain.value = 1;
    synthDry.gain.value = 1 - wetDry.value / 100;
  } else if (wetDry.value <= 50) {
    //mix.pan.value = `${wetDry.value / 100}`;
    delayGainL.gain.value = 1 - Math.abs(wetDry.value / 100);
    delayGainR.gain.value = 1 - Math.abs(wetDry.value / 100);
    synthDry.gain.value = 1;
  } else {
    delayGainL.gain.value = 1;
    delayGainR.gain.value = 1;
    synthDry.gain.value = 1;
  }

  // if (wetDry.value > 50) {
  //   delayGainL.gain.exponentialRampToValueAtTime(
  //     amp,
  //     mySynthCtx.currentTime + 0.01
  //   );
  //   delayGainR.gain.exponentialRampToValueAtTime(
  //     amp,
  //     mySynthCtx.currentTime + 0.01
  //   );
  //   synthDry.gain.exponentialRampToValueAtTime(
  //     --amp,
  //     (mySynthCtx.currentTime = 0.01)
  //   );

  //   console.log(synthDry.gain.value);
  // } else if (wetDry.value < 50) {
  // } else if (wetDry == 50) {
  // }
  if (wetDry.value >= 0) {
    let scaleX = Math.floor(
      convertRange(parseInt(`${wetDry.value}`), [-100, 100], [0, 100])
    );
    wetDryLabel.innerText = `${scaleX}%`;
  } else if (wetDry.value <= 0) {
    let scaleY = Math.floor(
      convertRange(parseInt(`${wetDry.value}`), [-100, 100], [0, 100])
    );
    wetDryLabel.innerText = `${scaleY}%`;
  }
};
const updateFilterCutoff = function () {
  synthFilter.frequency.value = `${filterCut.value}`;
  filterCutLabel.innerText = `${filterCut.value}Hz`;
};

const updateResonance = function () {
  synthFilter.Q.value = convertRange(`${resonance.value}`, [0, 100], [0, 40]);
  console.log(synthFilter.Q.value);
  resonanceLabel.innerText = `${resonance.value}%`;
};

const updateFilterType = function () {
  synthFilter.type = `${filterType.value}`;
};

// HTML elements
let masterFader = document.getElementById("masterGain");
let masterGainLabel = document.getElementById("MasterGainLabel");
let synthFader = document.getElementById("synthGain");
let synthGainLabel = document.getElementById("synthGainLabel");
//let delayFader = document.getElementById("dGain");
//let dGainLabel = document.getElementById("dGainLabel");
let dTime = document.getElementById("dTime");
let dTimeLabel = document.getElementById("dTimeLable");
let feedback = document.getElementById("feedBack");
let feedbackLabel = document.getElementById("feedBackLabel");
let offset = document.getElementById("offset");
let offsetLabel = document.getElementById("offsetLabel");
let wetDry = document.getElementById("wetDry");
let wetDryLabel = document.getElementById("wetDryLabel");
let waveTypeSine = document.getElementById("sine");
let waveTypeSq = document.getElementById("square");
let waveTypeTri = document.getElementById("sawtooth");
let filterCut = document.getElementById("filterCut");
let filterCutLabel = document.getElementById("filterCutLabel");
let resonance = document.getElementById("resonance");
let resonanceLabel = document.getElementById("resonanceLabel");
let filterType = document.getElementById("filterType");
// Listeners
masterFader.addEventListener("input", updateMasterGain);
synthFader.addEventListener("input", updateSynthGain);
//delayFader.addEventListener("input", updateDelayGain);
dTime.addEventListener("input", updateDelayTime, updateOffset);
feedback.addEventListener("input", updateFeedback);
offset.addEventListener("input", updateOffset);
offset.addEventListener("input", updateDelayTime);
wetDry.addEventListener("input", updateWetDry);
waveTypeSine.addEventListener("click", updateWaveType1);
waveTypeSq.addEventListener("click", updateWaveType2);
waveTypeTri.addEventListener("click", updateWaveType3);
filterCut.addEventListener("input", updateFilterCutoff);
resonance.addEventListener("input", updateResonance);
filterType.addEventListener("change", updateFilterType);
/**
 * @event keydown
 * @description Listens for keydown events and starts a note if the key is mapped.
 */
document.addEventListener("keydown", (e) => {
  if (noteMap[e.key]) {
    startNote(noteMap[e.key]);
  }
});

/**
 * @event keyup
 * @description Listens for keyup events and stops a note if the key is mapped.
 */
document.addEventListener("keyup", (e) => {
  if (noteMap[e.key]) {
    stopNote(noteMap[e.key]);
  }
});

//change sliders for ADSR
document.getElementById("attack").addEventListener("input", (event) => {
  document.getElementById("attackLabel").innerText = `${event.target.value} ms`;
  attack = event.target.value / 1000;
});
document.getElementById("decay").addEventListener("input", (event) => {
  document.getElementById("decayLabel").innerText = `${event.target.value} ms`;
  decay = event.target.value / 1000;
});
document.getElementById("sustain").addEventListener("input", (event) => {
  document.getElementById("sustainLabel").innerText = `${event.target.value} %`;
  sustain = event.target.value / 100;
});
document.getElementById("release").addEventListener("input", (event) => {
  document.getElementById(
    "releaseLabel"
  ).innerText = `${event.target.value} ms`;
  release = event.target.value / 1000;
});
