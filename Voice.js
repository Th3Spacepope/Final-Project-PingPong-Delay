export default class Voice {
  constructor(ctx, frequency, output, adsr, type) {
    //things that need happen on initiialization
    this.audio = ctx;
    this.frequency = frequency;
    this.output = output;
    //set ADSR
    this.attack = adsr[0];
    this.decay = adsr[1];
    this.sustain = adsr[2];
    this.release = adsr[3];
    //set wave
    this.type = type;
  }
  start() {
    //things that need to happen to play a new note
    let now = this.audio.currentTime;

    //create osc
    this.myOsc = this.audio.createOscillator();
    this.myOsc.frequency.setValueAtTime(this.frequency, now);
    this.myOsc.type = this.type;

    // this.myOsc2 = this.audio.createOscillator();
    // this.myOsc2.frequency.setValueAtTime(this.frequency / 2, now);
    // this.myOsc2.type = "sine";

    //create ampEnv gainNode
    this.ampEnv = this.audio.createGain();
    this.ampEnv.gain.setValueAtTime(0, now);
    this.myOsc.connect(this.ampEnv);
    this.ampEnv.connect(this.output);
    this.myOsc.start();

    //ADSR
    this.ampEnv.gain.linearRampToValueAtTime(1, now + this.attack);
    this.ampEnv.gain.linearRampToValueAtTime(
      this.sustain,
      now + this.attack + this.decay
    );
  }
  stop() {
    let now = this.audio.currentTime;
    //cancel existing ramps
    this.ampEnv.gain.cancelScheduledValues(now);
    //set current gain value
    this.ampEnv.gain.setValueAtTime(this.ampEnv.gain.value, now);
    //release stage
    this.ampEnv.gain.linearRampToValueAtTime(0, now + this.release);

    this.myOsc.stop(now + this.release + 0.01);
    //this.myOsc2.stop(now + this.release + 0.01);
  } //things to stop the note
  dispose() {
    this.myOsc.disconnect();
    this.ampEnv.disconnect();

    this.myOsc = null;
    this.ampEnv = null;
  } //what should happen after we are down with a note
}
