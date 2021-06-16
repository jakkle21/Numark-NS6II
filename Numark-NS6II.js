////////////////////////////////////////////////////////////////////////
// JSHint configuration                                               //
////////////////////////////////////////////////////////////////////////
/* global engine                                                      */
/* global script                                                      */
/* global print                                                       */
/* global midi                                                        */
////////////////////////////////////////////////////////////////////////


/******************
 * CONFIG OPTIONS *
 ******************/

// should scratch be enabled on startup?
var Enablescratch = false;

// should we use the manual loop buttons as hotcue buttons 5-8?
var UseManualLoopAsCue = false;

// should we use the auto loop buttons as hotcue buttons 5-8?
var UseAutoLoopAsCue = false;

// should we use the hotcue buttons for samplers 5-8?
var UseCueAsSampler = false;

// should shift+load eject or load and play?
var ShiftLoadEjects = true;

// should we show effect parameters when an effect is focused?
var ShowFocusedEffectParameters = false;


var NS6II = {};

NS6II.init = function(id, debug) {
    NS6II.id = id;
    NS6II.debug = debug;

    // effects
    NS6II.effects = new components.ComponentContainer();
    NS6II.effects[1] = new NS6II.EffectUnit([1, 3]);
    NS6II.effects[2] = new NS6II.EffectUnit([2, 4]);

    // decks
    NS6II.decks = new components.ComponentContainer();
    NS6II.decks[1] = new NS6II.Deck(1, 0x00, NS6II.effects[1]);
    NS6II.decks[2] = new NS6II.Deck(2, 0x01, NS6II.effects[2]);
    NS6II.decks[3] = new NS6II.Deck(3, 0x02, NS6II.effects[1]);
    NS6II.decks[4] = new NS6II.Deck(4, 0x03, NS6II.effects[2]);

    // set up two banks of samplers, 4 samplers each
    NS6II.sampler_all = new components.ComponentContainer();
    NS6II.sampler_all[1] = new NS6II.Sampler(1);
    NS6II.sampler_all[2] = new NS6II.Sampler(5);

    NS6II.sampler = NS6II.sampler_all[1];
    NS6II.sampler_all[2].forEachComponent(function(component) {
        component.disconnect();
    });


    // headphone gain
    NS6II.head_gain = new NS6II.HeadGain(NS6II.sampler_all);

    // exit demo mode
    var byteArray = [0xF0, 0x00, 0x01, 0x3F, 0x7F, 0x3A, 0x60, 0x00, 0x04, 0x04, 0x01, 0x00, 0x00, 0xF7];
    midi.sendSysexMsg(byteArray, byteArray.length);

    // initialize some leds
    NS6II.effects.forEachComponent(function (component) {
        component.trigger();
    });
    NS6II.decks.forEachComponent(function (component) {
        component.trigger();
    });

    NS6II.browse = new NS6II.BrowseKnob();

    // helper functions
    var led = function(group, key, midi_channel, midino) {
        if (engine.getValue(group, key)) {
            midi.sendShortMsg(0x90 | midi_channel, midino, 0x7F);
        }
        else {
            midi.sendShortMsg(0x80 | midi_channel, midino, 0x00);
        }
    };

    // init a bunch of channel specific leds
    for (var i = 0; i < 4; ++i) {
        var group = "[Channel"+(i+1)+"]";

        // keylock indicator
//        led(group, 'keylock', i, 0x0D);

        // turn off bpm arrows
        midi.sendShortMsg(0x80 | i, 0x0A, 0x00); // down arrow off
        midi.sendShortMsg(0x80 | i, 0x09, 0x00); // up arrow off

        // slip indicator
        led(group, 'slip_enabled', i, 0x1F);

        // initialize scratch mode (and leds)
        NS6II.scratch[i] = Enablescratch;
        midi.sendShortMsg(0x90 | i, 0x07, Enablescratch ? 0x7F : 0x01);
    }

    // zero vu meters
    midi.sendShortMsg(0xBF, 0x44, 0);
    midi.sendShortMsg(0xBF, 0x45, 0);

    midi.sendShortMsg(0xBF, 0x46, 0);
    midi.sendShortMsg(0xBF, 0x47, 0);
    midi.sendShortMsg(0xBF, 0x48, 0);
    midi.sendShortMsg(0xBF, 0x49, 0);

    // setup elapsed/remaining tracking
    engine.makeConnection("[Controls]", "ShowDurationRemaining", NS6II.timeElapsedCallback);

    // setup vumeter tracking
    engine.makeConnection("[Channel1]", "VuMeter", NS6II.vuCallback);
    engine.makeConnection("[Channel2]", "VuMeter", NS6II.vuCallback);
    engine.makeConnection("[Channel3]", "VuMeter", NS6II.vuCallback);
    engine.makeConnection("[Channel4]", "VuMeter", NS6II.vuCallback);
    engine.makeConnection("[Master]", "VuMeterL", NS6II.vuCallback);
    engine.makeConnection("[Master]", "VuMeterR", NS6II.vuCallback);
};

NS6II.shutdown = function() {
    // note: not all of this appears to be strictly necessary, things work fine
    // with out this, but Serato has been observed sending these led reset
    // messages during shutdown. The last sysex message may be necessary to
    // re-enable demo mode.

    // turn off a bunch of channel specific leds
    for (var i = 0; i < 4; ++i) {
        // pfl/cue button leds
        midi.sendShortMsg(0x90 | i, 0x1B, 0x01);

        // loop leds
        midi.sendShortMsg(0x80 | i + 5, 0x32, 0x00);
        midi.sendShortMsg(0x80 | i + 5, 0x33, 0x00);
        midi.sendShortMsg(0x80 | i + 5, 0x34, 0x00);
        midi.sendShortMsg(0x80 | i + 5, 0x35, 0x00);
        midi.sendShortMsg(0x80 | i + 5, 0x38, 0x00);
        midi.sendShortMsg(0x80 | i + 5, 0x39, 0x00);

        // play leds
        midi.sendShortMsg(0x90 | i, 0x00, 0x01);
        midi.sendShortMsg(0x90 | i, 0x04, 0x01);

        // sync leds
        midi.sendShortMsg(0x90 | i, 0x00, 0x02);
        midi.sendShortMsg(0x90 | i, 0x04, 0x03);

        // cue leds
        midi.sendShortMsg(0x90 | i, 0x00, 0x01);
        midi.sendShortMsg(0x90 | i, 0x04, 0x05);

        // hotcue leds
        midi.sendShortMsg(0x80 | i + 5, 0x14, 0x00);
        midi.sendShortMsg(0x80 | i + 5, 0x15, 0x00);
        midi.sendShortMsg(0x80 | i + 5, 0x16, 0x00);
        midi.sendShortMsg(0x80 | i + 5, 0x17, 0x00);
//        midi.sendShortMsg(0x80 | i + 5, 0x20, 0x00);
//        midi.sendShortMsg(0x80 | i + 5, 0x21, 0x00);
//        midi.sendShortMsg(0x80 | i + 5, 0x22, 0x00);
//        midi.sendShortMsg(0x80 | i + 5, 0x23, 0x00);

        // auto-loop leds
        midi.sendShortMsg(0x80 | i + 5, 0x14, 0x00);
        midi.sendShortMsg(0x80 | i + 5, 0x15, 0x00);
        midi.sendShortMsg(0x80 | i + 5, 0x16, 0x00);
        midi.sendShortMsg(0x80 | i + 5, 0x17, 0x00);
        midi.sendShortMsg(0x80 | i + 5, 0x1C, 0x00);
        midi.sendShortMsg(0x80 | i + 5, 0x1D, 0x00);
        midi.sendShortMsg(0x80 | i + 5, 0x1E, 0x00);
        midi.sendShortMsg(0x80 | i + 5, 0x1F, 0x00);

        // update spinner and position indicator
        midi.sendShortMsg(0xB0 | i, 0x3F, 0);
        midi.sendShortMsg(0xB0 | i, 0x06, 0);

        // keylock indicator
        midi.sendShortMsg(0x80 | i, 0x10, 0x00);

        // turn off bpm arrows
        midi.sendShortMsg(0x80 | i, 0x0A, 0x00); // down arrow off
        midi.sendShortMsg(0x80 | i, 0x09, 0x00); // up arrow off

        // turn off slip indicator
        midi.sendShortMsg(0x80 | i, 0x0F, 0x00);

        // turn off scratch button leds
        midi.sendShortMsg(0x80 | i, 0x07, 0x00);
    }

    // dim FX leds
    midi.sendShortMsg(0x98, 0x00, 0x01);
    midi.sendShortMsg(0x98, 0x01, 0x01);
    midi.sendShortMsg(0x98, 0x02, 0x01);
    midi.sendShortMsg(0x99, 0x00, 0x01);
    midi.sendShortMsg(0x99, 0x01, 0x01);
    midi.sendShortMsg(0x99, 0x02, 0x01);

    // turn off sampler leds
    midi.sendShortMsg(0x8F, 0x21, 0x00);
    midi.sendShortMsg(0x8F, 0x22, 0x00);
    midi.sendShortMsg(0x8F, 0x23, 0x00);
    midi.sendShortMsg(0x8F, 0x24, 0x00);

    // zero vu meters
    midi.sendShortMsg(0xBF, 0x44, 0);
    midi.sendShortMsg(0xBF, 0x45, 0);

    // send final shutdown message
    var byteArray = [0xF0, 0x00, 0x20, 0x7F, 0x02, 0xF7];
    midi.sendSysexMsg(byteArray, byteArray.length);
};

NS6II.EffectUnit = function (unitNumbers) {
    var eu = this;
    this.unitNumbers = unitNumbers;

    this.setCurrentUnit = function (newNumber) {
        this.currentUnitNumber = newNumber;
        this.group = '[EffectRack1_EffectUnit' + newNumber + ']';
        this.reconnectComponents(function (component) {
            // update [EffectRack1_EffectUnitX] groups
            var unitMatch = component.group.match(script.effectUnitRegEx);
            if (unitMatch !== null) {
                component.group = eu.group;
            } else {
                // update [EffectRack1_EffectUnitX_EffectY] groups
                var effectMatch = component.group.match(script.individualEffectRegEx);
                if (effectMatch !== null) {
                    component.group = '[EffectRack1_EffectUnit' +
                                      eu.currentUnitNumber +
                                      '_Effect' + effectMatch[2] + ']';
                }
            }
        });
    };

    this.setCurrentUnit(unitNumbers[0]);

    this.dryWetKnob = new components.Encoder({
        group: this.group,
        inKey: 'mix',
        input: function (channel, control, value, status, group) {
            if (value === 1) {
                this.inSetParameter(this.inGetParameter() + 0.05);
            } else if (value === 127) {
                this.inSetParameter(this.inGetParameter() - 0.05);
            }
        },
    });

    this.EffectUnitTouchStrip = function() {
        components.Pot.call(this);
        this.firstValueRecived = true;
        this.connect();
    };
    this.EffectUnitTouchStrip.prototype = new components.Pot({
        relative: true, // this disables soft takeover
        input: function (channel, control, value, status, group) {
            // never do soft takeover when the touchstrip is used
            engine.softTakeover(this.group, this.inKey, false);
            components.Pot.prototype.input.call(this, channel, control, value, status, group);
        },
        connect: function() {
            this.focus_connection = engine.makeConnection(eu.group, "focused_effect", this.onFocusChange);
            this.focus_connection.trigger();
        },
        disconnect: function() {
            this.focus_connection.disconnect();
        },
        onFocusChange: function(value, group, control) {
            if (value === 0) {
                this.group = eu.group;
                this.inKey = 'super1';
            }
            else {
                this.group = '[EffectRack1_EffectUnit' + eu.currentUnitNumber + '_Effect' + value + ']';
                this.inKey = 'meta';
            }
        },
    });

    this.BpmTapButton = function () {
        this.group = '[Channel' + eu.currentUnitNumber + ']';
        this.midi = [0x97 + eu.currentUnitNumber, 0x04];
        components.Button.call(this);
    };
    this.BpmTapButton.prototype = new components.Button({
        type: components.Button.prototype.types.push,
        key: 'bpm_tap',
        off: 0x01,
        connect: function () {
            this.group = '[Channel' + eu.currentUnitNumber + ']';
            components.Button.prototype.connect.call(this);
        },
        input: function (channel, control, value, status, group) {
            components.Button.prototype.input.call(this, channel, control, value, status, group);
            if (this.isPress(channel, control, value, status)) {
                eu.forEachComponent(function (component) {
                    if (component.tap !== undefined && typeof component.tap === 'function') {
                        component.tap();
                    }
                });
            }
            else {
                eu.forEachComponent(function (component) {
                    if (component.untap !== undefined) {
                        component.untap();
                    }
                });
            }
        },
    });

    this.EffectEnableButton = function (number) {
        this.number = number;
        this.group = '[EffectRack1_EffectUnit' + eu.currentUnitNumber +
                      '_Effect' + this.number + ']';
        this.midi = [0x97 + eu.currentUnitNumber, this.number - 1];
        this.flash_timer = null;

        components.Button.call(this);
    };
    this.EffectEnableButton.prototype = new components.Button({
        type: components.Button.prototype.types.powerWindow,
        outKey: 'enabled',
        inKey: 'enabled',
        off: 0x01,
        tap: function() {
            this.inKey = 'enabled';
            this.type = components.Button.prototype.types.toggle;
            this.inToggle = this.toggle_focused_effect;
        },
        untap: function() {
            this.type = components.Button.prototype.types.powerWindow;
            this.inToggle = components.Button.prototype.inToggle;
        },
        shift:  function() {
            this.inKey = 'next_effect';
            this.type = components.Button.prototype.types.push;
        },
        unshift: function() {
            this.inKey = 'enabled';
            this.type = components.Button.prototype.types.powerWindow;
        },
        output: function(value, group, control) {
            var focused_effect = engine.getValue(eu.group, "focused_effect");
            if (focused_effect !== this.number) {
                engine.stopTimer(this.flash_timer);
                this.flash_timer = null;
                components.Button.prototype.output.call(this, value, group, control);
            }
            else {
                this.startFlash();
            }
        },
        toggle_focused_effect: function() {
            if (engine.getValue(eu.group, "focused_effect") === this.number) {
                engine.setValue(eu.group, "focused_effect", 0);
            }
            else {
                engine.setValue(eu.group, "focused_effect", this.number);
            }
        },
        connect: function() {
            components.Button.prototype.connect.call(this);
            this.fx_connection = engine.makeConnection(eu.group, "focused_effect", this.onFocusChange);
        },
        disconnect: function() {
            components.Button.prototype.disconnect.call(this);
            this.fx_connection.disconnect();
        },
        onFocusChange: function(value, group, control) {
            if (value === this.number) {
                this.startFlash();
            }
            else {
                this.stopFlash();
            }
        },
        startFlash: function() {
            // already flashing
            if (this.flash_timer) {
                engine.stopTimer(this.flash_timer);
            }

            this.flash_state = false;
            this.send(this.on);

            var time = 500;
            if (this.inGetValue() > 0) {
                time = 150;
            }

            var button = this;
            this.flash_timer = engine.beginTimer(time, function() {
                if (button.flash_state) {
                    button.send(button.on);
                    button.flash_state = false;
                }
                else {
                    button.send(button.off);
                    button.flash_state = true;
                }
            });
        },
        stopFlash: function() {
            engine.stopTimer(this.flash_timer);
            this.flash_timer = null;
            this.trigger();
        },
    });

    this.show_focus_connection = engine.makeConnection(eu.group, "focused_effect", function(focused_effect, group, control) {
        if (focused_effect === 0) {
            engine.setValue(eu.group, "show_focus", 0);
            if (ShowFocusedEffectParameters) {
                engine.setValue(eu.group, "show_parameters", 0);
            }
        } else {
            engine.setValue(eu.group, "show_focus", 1);
            if (ShowFocusedEffectParameters) {
                engine.setValue(eu.group, "show_parameters", 1);
            }
        }
    });
    this.show_focus_connection.trigger();

    this.touch_strip = new this.EffectUnitTouchStrip();
    this.enableButtons = new components.ComponentContainer();
    for (var n = 1; n <= 3; n++) {
        this.enableButtons[n] = new this.EffectEnableButton(n);
    }

    this.bpmTap = new this.BpmTapButton();

    this.enableButtons.reconnectComponents();

    this.forEachComponent(function (component) {
        if (component.group === undefined) {
            component.group = eu.group;
        }
    });
};
NS6II.EffectUnit.prototype = new components.ComponentContainer();

NS6II.Deck = function(number, midi_chan, effects_unit) {
    var deck = this;
    var eu = effects_unit;
    this.active = (number == 1 || number == 2);

    components.Deck.call(this, number);

    this.bpm = new components.Component({
        outKey: "bpm",
        output: function(value, group, control) {
            NS6II.sendScreenBpmMidi(number, Math.round(value * 100));
        },
    });

    this.duration = new components.Component({
        outKey: "duration",
        output: function(duration, group, control) {
            // update duration
            NS6II.sendScreenDurationMidi(number, duration * 1000);

            // when the duration changes, we need to update the play position
            deck.position.trigger();
        },
    });

    this.position = new components.Component({
        outKey: "playposition",
        output: function(playposition, group, control) {
            // the controller appears to expect a value in the range of 0-52 (updated to 126)
            // representing the position of the track. Here we send a message to the
            // controller to update the position display with our current position.
            var pos = Math.round(playposition * 126);
            if (pos < 0) {
                pos = 0;
            }
            midi.sendShortMsg(0xB0 | midi_chan, 0x3F, pos);

            // get the current duration
            duration = deck.duration.outGetValue();

            // update the time display
            var time = NS6II.timeMs(number, playposition, duration);
            NS6II.sendScreenTimeMidi(number, time);

            // update the spinner (range 64-115, 52 values) (changed to 1-126, 126 values)
            //
            // the visual spinner in the mixxx interface takes 1.8 seconds to loop
            // (60 seconds/min divided by 33 1/3 revolutions per min)(changed to 120 sec)
            var period = 120 / (33+1/3);
            var midiResolution = 126; // the controller expects a value range of 64-115
            var timeElapsed = duration * playposition;
            var spinner = Math.round(timeElapsed % period * (midiResolution / period));
            if (spinner < 0) {
                spinner += 126;
            } else {
                spinner += 1;
            }

            midi.sendShortMsg(0xB0 | midi_chan, 0x06, spinner);
        },
    });

    this.play_button = new components.PlayButton({
        midi: [0x90 + midi_chan, 0x00],
        off: 0x01,
        sendShifted: true,
        shiftControl: true,
        shiftOffset: 4,
        unshift: function() {
            components.PlayButton.prototype.unshift.call(this);
            this.type = components.Button.prototype.types.toggle;
        },
        shift: function() {
            this.inKey = 'play_stutter';
            this.type = components.Button.prototype.types.push;
        },
    });

    this.load = new components.Button({
//        inKey: 'LoadSelectedTrack',
        shift: function() {
//            if (ShiftLoadEjects) {
                this.inKey = 'eject';
//            }
//            else {
//                this.inKey = 'LoadSelectedTrackAndPlay';
//            }
        },
        unshift: function() {
            this.inKey = 'LoadSelectedTrack';
        },
    });
// Debug [Controller]: NS6 II MIDI 1: t:254955 ms status 0x9F (ch 16, opcode 0x9), ctrl 0x02, val 0x7F
// Debug [Controller]: NS6 II MIDI 1: t:363133 ms status 0x90 (ch 1, opcode 0x9), ctrl 0x20, val 0x7F
// Debug [Controller]: NS6 II MIDI 1: t:369683 ms status 0x9F (ch 16, opcode 0x9), ctrl 0x02, val 0x7F
// Debug [Controller]: NS6 II MIDI 1: t:369683 ms status 0x9F (ch 16, opcode 0x9), ctrl 0x02, val 0x7F



    this.cue_button = new components.CueButton({
        midi: [0x90 + midi_chan, 0x01],
        off: 0x01,
        sendShifted: true,
        shiftControl: true,
        shiftOffset: 4,
    });

    this.sync_button = new components.SyncButton({
        midi: [0x90 + midi_chan, 0x02],
        off: 0x01,
        sendShifted: true,
        shiftControl: true,
        shiftOffset: 1,
    });

//        this.pfl_button = new components.Button({
//        midi: [0x90 + midi_chan, 0x1B],
//        key: 'pfl',
//        off: 0x01,
//        type: components.Button.prototype.types.toggle,
//        connect: function() {
//            components.Button.prototype.connect.call(this);
//            this.connections[1] = engine.makeConnection(this.group, this.outKey, NS6II.pflToggle);
//        },
//    });

    this.hotcue_buttons = new components.ComponentContainer();
    this.sampler_buttons = new components.ComponentContainer();
    for (var i = 1; i <= 4; ++i) {
        this.hotcue_buttons[i] = new components.HotcueButton({
            midi: [0x94 + midi_chan, 0x14 + i - 1],
            number: i,
            sendShifted: true,
            shiftControl: true,
            shiftOffset: 8,
        });

        // sampler buttons 5-8
        this.sampler_buttons[i] = new components.SamplerButton({
            midi: [0x94 + midi_chan, 0x18 + i - 1],
            sendShifted: true,
            shiftControl: true,
            shiftOffset: 8,
            number: i+4,
            loaded: 0x00,
            playing: 0x7F,
        });
    }
    this.hotcues = this.hotcue_buttons;

    this.pitch = new components.Pot({
        inKey: 'rate',
        invert: true,
    });
    if (!this.active) {
        this.pitch.firstValueReceived = true;
    }

    var pitch_or_keylock = function (channel, control, value, status, group) {
        if (this.other.inGetValue() > 0.0 && this.isPress(channel, control, value, status)) {
            // toggle keylock, both keys pressed
            script.toggleControl(this.group, "keylock");
        }
        else {
            components.Button.prototype.input.call(this, channel, control, value, status, group);
        }
    };
    this.pitch_bend_up = new components.Button({
        inKey: 'rate_temp_up',
        input: pitch_or_keylock,
    });
    this.pitch_bend_down = new components.Button({
        inKey: 'rate_temp_down',
        input: pitch_or_keylock,
    });
    this.pitch_bend_up.other = this.pitch_bend_down;
    this.pitch_bend_down.other = this.pitch_bend_up;

    var key_up_or_down = function (channel, control, value, status, group) {
        this.is_pressed = this.isPress(channel, control, value, status);
        if (this.is_pressed) {
            if (this.other.is_pressed) {
                // reset if both buttons are pressed
                engine.setValue(deck.currentDeck, "pitch_adjust", 0.0);
            }
            else {
                this.inSetValue(1.0);
            }
        }
    };
    this.key_up = new components.Button({
        inKey: 'pitch_up',
        direction: 1,
        input: key_up_or_down,
    });
    this.key_down = new components.Button({
        inKey: 'pitch_down',
        direction: -1,
        input: key_up_or_down,
    });
    this.key_up.other = this.key_down;
    this.key_down.other = this.key_up;

    loop_base = function(midino, obj) {
        return _.assign({
            midi: [0x94 + midi_chan, midino],
            on: 0x01,
            sendShifted: true,
            shiftChannel: true,
            shiftOffset: -0x10,
        }, obj);
    };

    this.alternate_manloop = new components.ComponentContainer({
        loop_in: new components.HotcueButton(loop_base(0x38, {
            number: 5,
        })),
        loop_out: new components.HotcueButton(loop_base(0x39, {
            number: 6,
        })),
        loop_toggle: new components.HotcueButton(loop_base(0x32, {
            number: 7,
        })),
        // there are two hotcue 8 controls, one for the loop_halve button and
        // one for the loop_double button. These buttons are two individual
        // functions when in manual loop mode, but they behave as one button
        // in hotcue mode.
        loop_halve: new components.HotcueButton(loop_base(0x34, {
            number: 8,
        })),
        loop_double: new components.HotcueButton(loop_base(0x35, {
            number: 8,
        })),
    });
    this.normal_manloop = new components.ComponentContainer({
        loop_in: new components.Button(loop_base(0x38, {
            inKey: 'loop_in',
            outKey: 'loop_start_position',
            outValueScale: function (value) {
                return (value != -1) ? this.on : this.off;
            },
        })),
        loop_out: new components.Button(loop_base(0x39, {
            inKey: 'loop_out',
            outKey: 'loop_end_position',
            outValueScale: function (value) {
                return (value != -1) ? this.on : this.off;
            },
        })),
        loop_toggle: new components.LoopToggleButton(loop_base(0x32, {})),
        loop_halve: new components.Button(loop_base(0x34, {
            key: 'loop_halve',
            input: function(channel, control, value, status) {
                if (this.isPress(channel, control, value, status)) {
                    engine.setValue(deck.currentDeck, "loop_scale", 0.5);
                }
            },
        })),
        loop_double: new components.Button(loop_base(0x35, {
            key: 'loop_double',
            input: function(channel, control, value, status) {
                if (this.isPress(channel, control, value, status)) {
                    engine.setValue(deck.currentDeck, "loop_scale", 2.0);
                }
            },
        })),
    });
    // swap normal and alternate manual loop controls
    if (UseManualLoopAsCue) {
        var manloop = this.normal_manloop;
        this.normal_manloop = this.alternate_manloop;
        this.alternate_manloop = manloop;
    }
    this.manloop = this.normal_manloop;

    auto_loop_hotcue = function(midino, obj) {
        return _.assign({
            midi: [0x94 + midi_chan, midino],
            on: 0x40,
            sendShifted: true,
            shiftControl: true,
            shiftOffset: 0x08,
        }, obj);
    };

    auto_loop_base = function(midino, obj) {
        return _.assign({
            midi: [0x94 + midi_chan, midino],
            on: 0x40,
            sendShifted: true,
            shiftChannel: true,
            shiftOffset: -0x10,
        }, obj);
    };

    this.alternate_autoloop = new components.ComponentContainer({
        auto1: new components.HotcueButton(auto_loop_hotcue(0x14, {
            number: 5,
        })),
        auto2: new components.HotcueButton(auto_loop_hotcue(0x15, {
            number: 6,
        })),
        auto3: new components.HotcueButton(auto_loop_hotcue(0x16, {
            number: 7,
        })),
        auto4: new components.HotcueButton(auto_loop_hotcue(0x17, {
            number: 8,
        })),
    });
    this.alternate_autoloop.roll1 = this.alternate_autoloop.auto1;
    this.alternate_autoloop.roll2 = this.alternate_autoloop.auto2;
    this.alternate_autoloop.roll3 = this.alternate_autoloop.auto3;
    this.alternate_autoloop.roll4 = this.alternate_autoloop.auto4;

    this.normal_autoloop = new components.ComponentContainer({
        auto1: new components.Button(auto_loop_base(0x14, {
            inKey: 'beatloop_1_toggle',
            outKey: 'beatloop_1_enabled',
        })),
        auto2: new components.Button(auto_loop_base(0x15, {
            inKey: 'beatloop_2_toggle',
            outKey: 'beatloop_2_enabled',
        })),
        auto3: new components.Button(auto_loop_base(0x16, {
            inKey: 'beatloop_4_toggle',
            outKey: 'beatloop_4_enabled',
        })),
        auto4: new components.Button(auto_loop_base(0x17, {
            inKey: 'beatloop_8_toggle',
            outKey: 'beatloop_8_enabled',
        })),

        roll1: new components.Button(auto_loop_base(0x1C, {
            inKey: 'beatloop_0.0625_toggle',
            outKey: 'beatloop_0.0625_enabled',
        })),
        roll2: new components.Button(auto_loop_base(0x1D, {
            inKey: 'beatloop_0.125_toggle',
            outKey: 'beatloop_0.125_enabled',
        })),
        roll3: new components.Button(auto_loop_base(0x1E, {
            inKey: 'beatloop_0.25_toggle',
            outKey: 'beatloop_0.25_enabled',
        })),
        roll4: new components.Button(auto_loop_base(0x1F, {
            inKey: 'beatloop_0.5_toggle',
            outKey: 'beatloop_0.5_enabled',
        })),
    });

    // swap normal and alternate auto loop controls
    if (UseAutoLoopAsCue) {
        var autoloop = this.normal_autoloop;
        this.normal_autoloop = this.alternate_autoloop;
        this.alternate_autoloop = autoloop;
    }
    this.autoloop = this.normal_autoloop;

//Jamin added
//    var this.padModeNew = 0

//    this.pad_mode = new components.Component({
//        input: function (channel, control, value, status, group) {
            // only handle button down events
//            if (value != 0x7F) return;

//            var shifted_hotcues = deck.sampler_buttons;
//            var normal_hotcues = deck.hotcue_buttons;
//            if (UseCueAsSampler) {
//                shifted_hotcues = deck.hotcue_buttons;
//                normal_hotcues = deck.sampler_buttons;
//            }

            // if shifted, set a special mode
//            if (this.isShifted) {
                // manual loop
//                if (control == 0x0E) {
//                    deck.manloop = deck.alternate_manloop;
//                    deck.manloop.reconnectComponents();
//                }
//                // auto loop
//                else if (control == 0x06) {
//                    deck.autoloop = deck.alternate_autoloop;
//                    deck.autoloop.reconnectComponents();
//                }
//
//                // hotcue sampler
//                if (control == 0x0B) {
//                    deck.hotcues.forEachComponent(function(component) {
//                        component.disconnect();
//                    });
//                    deck.hotcues = shifted_hotcues;
//                    deck.hotcues.reconnectComponents();
//                }
//                // reset hotcues in all other modes
//                else {
//                    deck.hotcues.forEachComponent(function(component) {
//                        component.disconnect();
//                    });
//                    deck.hotcues = deck.hotcue_buttons;
//                    deck.hotcues.reconnectComponents();
//                }
//            }
            // otherwise set a normal mode
//            else {
                // manual loop
//                if (control == 0x0E) {
//                    deck.manloop = deck.normal_manloop;
//                    deck.manloop.reconnectComponents();
//                }
//                // auto loop
//                else if (control == 0x06) {
//                    deck.autoloop = deck.normal_autoloop;
//                    deck.autoloop.reconnectComponents();
//                }
//
                // hotcue sampler
//                if (control == 0x0B) {
//                    deck.hotcues.forEachComponent(function(component) {
//                        component.disconnect();
//                    });
//                    deck.hotcues = normal_hotcues;
//                    deck.hotcues.reconnectComponents();
//                }
//                // reset hotcues
//                else {
//                    deck.hotcues.forEachComponent(function(component) {
//                        component.disconnect();
//                    });
//                    deck.hotcues = deck.hotcue_buttons;
//                    deck.hotcues.reconnectComponents();
//                }
//            }
//        },
//        shift: function() {
//            this.isShifted = true;
//        },
//        unshift: function() {
//            this.isShifted = false;
//        },
//    });

    this.EqEffectKnob = function (group, in_key, fx_key, filter_knob) {
        this.unshift_group = group;
        this.unshift_key = in_key;
        this.fx_key = fx_key;
        if (filter_knob) {
            this.shift_key = 'super1';
        }
        this.ignore_next = null;
        components.Pot.call(this, {
            group: group,
            inKey: in_key,
        });
    };
    this.EqEffectKnob.prototype = new components.Pot({
        input: function (channel, control, value, status, group) {
            // if the control group and key has changed, ignore_next will hold
            // the old settings. We need to tell the soft takeover engine to
            // ignore the next values for that control so that when we
            // eventually switch back to it, soft takeover will manage it
            // properly.
            //
            // We call IgnoreNextValue() here instead of in shift()/unshift()
            // (via connect()/disconnect()) because if we did that, pressing
            // the shift key would cause the next value on the control to be
            // ignored even if the control wasn't moved, which would trigger
            // a phantom soft takeover if the control was moved fast enough. We
            // only need to IgnoreNextValue() if the control has actually moved
            // after switching the target group/key.
            if (this.ignore_next) {
                engine.softTakeoverIgnoreNextValue(this.ignore_next.group, this.ignore_next.key);
                this.ignore_next = null;
            }
            components.Pot.prototype.input.call(this, channel, control, value, status, group);
        },
        connect: function() {
            // enable soft takeover on our controls
            for (var i = 1; i <= 3; i ++) {
                var group = '[EffectRack1_EffectUnit' + eu.currentUnitNumber + '_Effect' + i + ']';
                engine.softTakeover(group, this.fx_key, true);
            }
            components.Pot.prototype.connect.call(this);
        },
        shift: function() {
            var focused_effect = engine.getValue(eu.group, "focused_effect");
            if (focused_effect === 0) {
                // we need this here so that shift+filter works with soft
                // takeover because touching the touch strip disables it each
                // time
                if (this.shift_key) {
                    engine.softTakeover(eu.group, this.shift_key, true);
                    this.switchControl(eu.group, this.shift_key);
                }
            }
            else {
                var group = '[EffectRack1_EffectUnit' + eu.currentUnitNumber + '_Effect' + focused_effect + ']';
                this.switchControl(group, this.fx_key);
            }
        },
        unshift: function() {
            this.switchControl(this.unshift_group, this.unshift_key);
        },
        switchControl: function(group, key) {
            if (this.group != group || this.inKey != key) {
                this.ignore_next = { 'group': this.group, 'key': this.inKey };
            }
            this.group = group;
            this.inKey = key;
        },
    });

    var eq_group = '[EqualizerRack1_' + this.currentDeck + '_Effect1]';
    this.high_eq = new this.EqEffectKnob(eq_group, 'parameter3', 'parameter3');
    this.mid_eq = new this.EqEffectKnob(eq_group, 'parameter2', 'parameter4');
    this.low_eq = new this.EqEffectKnob(eq_group, 'parameter1', 'parameter5');

    this.filter = new this.EqEffectKnob(
        '[QuickEffectRack1_' + this.currentDeck + ']',
        'super1',
        'parameter1',
        true);

    this.gain = new this.EqEffectKnob(
        this.currentDeck,
        'pregain',
        'parameter2');

    this.reconnectComponents(function (c) {
        if (c.group === undefined) {
            c.group = deck.currentDeck;
        }
    });

    // don't light up sampler buttons in hotcue mode
    this.sampler_buttons.forEachComponent(function(component) {
        component.disconnect();
    });

    this.setActive = function(active) {
        this.active = active;

        if (!active) {
            // trigger soft takeover on the pitch control
            this.pitch.disconnect();
        }
    };




};



NS6II.Deck.prototype = new components.Deck();

NS6II.Sampler = function(base) {
    for (var i = 1; i <= 4; ++i) {
        this[i] = new components.SamplerButton({
            midi: [0x9F, 0x20 + i],
            number: base+i-1,
            loaded: 0x00,
            playing: 0x7F,
        });
    }
};

NS6II.Sampler.prototype = new components.ComponentContainer();

NS6II.HeadGain = function(sampler) {
    components.Pot.call(this);

    this.ignore_next = null;
    this.shifted = false;
    this.sampler = sampler;
    this.sampler.forEachComponent(function(component) {
        engine.softTakeover(component.group, 'volume', true);
    });
};
NS6II.HeadGain.prototype = new components.Pot({
    group: '[Master]',
    inKey: 'headGain',
    input: function (channel, control, value, status, group) {
        // we call softTakeoverIgnoreNextValue() here on the non-targeted
        // control only if the control was moved when focus was switched. This
        // is to avoid a phantom triggering of soft takeover that can happen if
        // ignoreNextValue() is called un-conditionally when the control target
        // is changed (like in shfit()/unshift()).
        if (this.ignore_next == "sampler" && !this.shifted) {
            this.sampler.forEachComponent(function(component) {
                engine.softTakeoverIgnoreNextValue(component.group, 'volume');
            });
            this.ignore_next = null;
        }
        else if (this.ignore_next == "headgain" && this.shifted) {
            engine.softTakeoverIgnoreNextValue(this.group, this.inKey);
            this.ignore_next = null;
        }

        if (this.shifted) {
            // make head gain control the sampler volume when shifted
            var pot = this;
            this.sampler.forEachComponent(function(component) {
                engine.setParameter(component.group, 'volume', pot.inValueScale(value));
            });
        } else {
            components.Pot.prototype.input.call(this, channel, control, value, status, group);
        }
    },
    shift: function() {
        this.shifted = true;
        this.ignore_next = "headgain";
    },
    unshift: function() {
        this.shifted = false;
        this.ignore_next = "sampler";
    },
});

NS6II.BrowseKnob = function() {
    this.knob = new components.Encoder({
        group: '[Library]',
        input: function (channel, control, value, status, group) {
            if (value === 1) {
                engine.setParameter(this.group, this.inKey + 'Down', 1);
            } else if (value === 127) {
                engine.setParameter(this.group, this.inKey + 'Up', 1);
            }
        },
        unshift: function() {
            this.inKey = 'Move';
        },
        shift: function() {
            this.inKey = 'Scroll';
        },
    });

    this.button = new components.Button({
        group: '[Library]',
        inKey: 'GoToItem',
        unshift: function() {
            this.inKey = 'GoToItem';
        },
        shift: function() {
            this.inKey = 'MoveFocusForward';
        },
    });
};

NS6II.BrowseKnob.prototype = new components.ComponentContainer();

NS6II.encodeNumToArray = function(number) {
    var number_array = [
        (number >> 28) & 0x0F,
        (number >> 24) & 0x0F,
        (number >> 20) & 0x0F,
        (number >> 16) & 0x0F,
        (number >> 12) & 0x0F,
        (number >> 8) & 0x0F,
        (number >> 4) & 0x0F,
        number & 0x0F,
    ];

    if (number < 0) number_array[0] = 0x07;
    else number_array[0] = 0x08;

    return number_array;
};

NS6II.sendScreenDurationMidi = function(deck, duration) {
    if (duration < 1) {
        duration = 1;
    }
    durationArray = NS6II.encodeNumToArray(duration - 1);

    var bytePrefix = [0xF0, 0x00, 0x20, 0x7F, deck, 0x03];
    var bytePostfix = [0xF7];
    var byteArray = bytePrefix.concat(durationArray, bytePostfix);
    midi.sendSysexMsg(byteArray, byteArray.length);
};

NS6II.sendScreenTimeMidi = function(deck, time) {
    var timeArray = NS6II.encodeNumToArray(time);

    var bytePrefix = [0xF0, 0x00, 0x20, 0x7F, deck, 0x04];
    var bytePostfix = [0xF7];
    var byteArray = bytePrefix.concat(timeArray, bytePostfix);
    midi.sendSysexMsg(byteArray, byteArray.length);
};

NS6II.sendScreenBpmMidi = function(deck, bpm) {
    bpmArray = NS6II.encodeNumToArray(bpm);
    bpmArray.shift();
    bpmArray.shift();

    var bytePrefix = [0xF0, 0x00, 0x20, 0x7F, deck, 0x01];
    var bytePostfix = [0xF7];
    var byteArray = bytePrefix.concat(bpmArray, bytePostfix);
    midi.sendSysexMsg(byteArray, byteArray.length);
};

NS6II.elapsedToggle = function (channel, control, value, status, group) {
    if (value != 0x7F) return;

    var current_setting = engine.getValue('[Controls]', 'ShowDurationRemaining');
    if (current_setting === 0) {
        // currently showing elapsed, set to remaining
        engine.setValue('[Controls]', 'ShowDurationRemaining', 1);
    } else if (current_setting === 1) {
        // currently showing remaining, set to elapsed
        engine.setValue('[Controls]', 'ShowDurationRemaining', 0);
    } else {
        // currently showing both (that means we are showing remaining, set to elapsed
        engine.setValue('[Controls]', 'ShowDurationRemaining', 0);
    }
};

NS6II.timeElapsedCallback = function(value, group, control) {
    // 0 = elapsed
    // 1 = remaining
    // 2 = both (we ignore this as the controller can't show both)
    var on_off;
    if (value === 0) {
        // show elapsed
        on_off = 0x00;
    } else if (value === 1) {
        // show remaining
        on_off = 0x7F;
    } else {
        // both, ignore the event
        return;
    }

    // update all 4 decks on the controller
    midi.sendShortMsg(0x90, 0x46, on_off);
    midi.sendShortMsg(0x91, 0x46, on_off);
    midi.sendShortMsg(0x92, 0x46, on_off);
    midi.sendShortMsg(0x93, 0x46, on_off);
};

NS6II.timeMs = function(deck, position, duration) {
    return Math.round(duration * position * 1000);
};

// these functions track if the user has let go of the jog scratch but it is
// still spinning
NS6II.scratch_timer = []; // initialized before use (null is an acceptable value)
NS6II.scratch_tick = [];  // initialized before use
NS6II.resetScratchTimer = function (deck, tick) {
    if (!NS6II.scratch_timer[deck]) return;
    NS6II.scratch_tick[deck] = tick;
};

NS6II.startScratchTimer = function (deck) {
    if (NS6II.scratch_timer[deck]) return;

    NS6II.scratch_tick[deck] = 0;
    NS6II.scratch_timer[deck] = engine.beginTimer(20, function() {
        NS6II.scratchTimerCallback(deck);
    });
};

NS6II.stopScratchTimer = function (deck) {
    if (NS6II.scratch_timer[deck]) {
        engine.stopTimer(NS6II.scratch_timer[deck]);
    }
    NS6II.scratch_timer[deck] = null;
};

NS6II.scratchTimerCallback = function (deck) {
    // here we see if the platter is still physically moving even though the
    // platter is not being touched. For forward motion, we stop scratching
    // before the platter has physically stopped  and delay a little longer
    // when moving back. This is to mimic actual vinyl better.
    if ((NS6II.scratch_direction[deck] // forward
            && Math.abs(NS6II.scratch_tick[deck]) > 2)
        || (!NS6II.scratch_direction[deck] // backward
            && Math.abs(NS6II.scratch_tick[deck]) > 1))
    {
        // reset tick detection
        NS6II.scratch_tick[deck] = 0;
        return;
    }

    NS6II.scratchDisable(deck);
};

NS6II.scratchDisable = function (deck) {
    NS6II.searching[deck] = false;
    NS6II.stopScratchTimer(deck);
    engine.scratchDisable(deck, false);
};

NS6II.scratchEnable = function (deck) {
    var alpha = 1.0/8;
    var beta = alpha/32;

    engine.scratchEnable(deck, 1240, 33+1/3, alpha, beta);
    NS6II.stopScratchTimer(deck);
};

// The button that enables/disables scratching
// these arrays are indexed from 1, so we initialize them with 5 values
NS6II.touching = [false, false, false, false, false];
NS6II.searching = [false, false, false, false, false];
NS6II.scratchTouch = function (channel, control, value, status, group) {
    var deck = channel + 1;

    // ignore touch events if not in vinyl mode
    if (!NS6II.shift
        && !NS6II.searching[deck]
        && !NS6II.scratch[channel]
        && value != 0)
    {
        return;
    }

    NS6II.touching[deck] = 0x7F == value;


    // don't start scratching if shift is pressed
    if (value === 0x7F
        && !NS6II.shift
        && !NS6II.searching[deck])
    {
        NS6II.scratchEnable(deck);
    }
    else if (value === 0x7F
             && (NS6II.shift
                || NS6II.searching[deck]))
    {
        NS6II.scratchDisable(deck);
        NS6II.searching[deck] = true;
        NS6II.stopScratchTimer(deck);
    }
    else {    // If button up
        NS6II.startScratchTimer(deck);
    }
};

// The scratch that actually controls the scratching
// indexed by deck numbers starting at 1, so include an extra element
NS6II.scratch_direction = [null, null, null, null, null]; // true == forward
NS6II.scratch_accumulator = [0, 0, 0, 0, 0];
NS6II.last_scratch_tick = [0, 0, 0, 0, 0];
NS6II.scratchTurn = function (channel, control, value, status, group) {
    var deck = channel + 1;
    var direction;
    var newValue;
    if (value < 64) {
        direction = true;
    } else {
        direction = false;
    }

    // if the platter is spun fast enough, value will wrap past the 64 midpoint
    // but the platter will be spinning in the opposite direction we expect it
    // to be
    var delta = Math.abs(NS6II.last_scratch_tick[deck] - value);
    if (NS6II.scratch_direction[deck] !== null && NS6II.scratch_direction[deck] != direction && delta < 64) {
        direction = !direction;
    }

    if (direction) {
        newValue = value;
    } else {
        newValue = value - 128;
    }

    // detect searching the track
    if (NS6II.searching[deck]) {
        var position = engine.getValue(group, 'playposition');
        if (position <= 0) position = 0;
        if (position >= 1) position = 1;
        engine.setValue(group, 'playposition', position + newValue * 0.0001);
        NS6II.resetScratchTimer(deck, newValue);
        return;
    }

    // stop scratching if the scratch direction changes and the platter is not
    // being touched
    if (NS6II.scratch_direction[deck] === null) {
        NS6II.scratch_direction[deck] = direction;
    }
    else if (NS6II.scratch_direction[deck] != direction) {
        if (!NS6II.touching[deck]) {
            NS6II.scratchDisable(deck);
        }
        NS6II.scratch_accumulator[deck] = 0;
    }

    NS6II.last_scratch_tick[deck] = value;
    NS6II.scratch_direction[deck] = direction;
    NS6II.scratch_accumulator[deck] += Math.abs(newValue);

    // handle scratching
    if (engine.isScratching(deck)) {
        engine.scratchTick(deck, newValue); // Scratch!
        NS6II.resetScratchTimer(deck, newValue);
    }
    // handle beat jumping
    else if (NS6II.shift) {
        if (NS6II.scratch_accumulator[deck] > 61) {
            NS6II.scratch_accumulator[deck] -= 61;
            if (direction) { // forward
                engine.setParameter(group, 'beatjump_1_forward', 1);
            } else {
                engine.setParameter(group, 'beatjump_1_backward', 1);
            }
        }
    }
    // handle pitch bending
    else {
        engine.setValue(group, 'jog', newValue * 0.1); // Pitch bend
    }
};

NS6II.scratch = []; // initialzed in the NS6II.init() function
NS6II.scratchToggle = function (channel, control, value, status, group) {
    if (value != 0x7F) return;
    NS6II.scratch[channel] = !NS6II.scratch[channel];
    var on_off = 0x01;
    if (NS6II.scratch[channel]) on_off = 0x7F;
    midi.sendShortMsg(0x90 | channel, 0x07, on_off);
};

NS6II.deckSwitch = function (channel, control, value, status, group) {
    var deck = channel + 1;
    NS6II.decks[deck].setActive(value == 0x7F);

    // change effects racks
    if (NS6II.decks[deck].active && (channel == 0x00 || channel == 0x02)) {
//        NS6II.effects[1].setCurrentUnit(deck);
// attemp at key change knob
// 
//
    }
    else if (NS6II.decks[deck].active && (channel == 0x01 || channel == 0x03)) {
//        NS6II.effects[2].setCurrentUnit(deck);
// attemp at key change knob

    }

    // also zero vu meters
    if (value != 0x7F) return;
    midi.sendShortMsg(0xBF, 0x44, 0);
    midi.sendShortMsg(0xBF, 0x45, 0);
};

// zero vu meters when toggling
//NS6II.pflToggle = function(value, group, control) {
//    midi.sendShortMsg(0xBF, 0x44, 0);
//    midi.sendShortMsg(0xBF, 0x45, 0);
//};


//Jamin added. not used or needed. Shift does not work.
NS6II.bleepLock =  function (channel, control, value, status, group) {
    var deck = channel + 1;   
     if (value != 0x7F) return;

        if (NS6II.shift) { 
            script.toggleControl(this.group, "keylock");
        }
        else {engine.setValue(group, "reversroll",1);
        }

};

NS6II.loadEject =  function (channel, control, value, status, group) {
    var deck = channel + 1;   
     if (value != 0x7F) return;

        if (NS6II.shift) { 
            engine.setValue(group, "eject", 100);
        }
        else {engine.setValue(group, "LoadSelectedTrack", 100);
        }
};


//Jamin Added. not used
NS6II.PFL =  function (channel, control, value, status, group) {
    var deck = channel + 1;   
//     if (value != 0x7F) return;

//        if (NS6II.shift) { 
//            script.toggleControl(group, "eject", 100);
//        }
//        else {
        script.toggleControl(group, "pfl", 100);
//        }

};

//Jamin Added
NS6II.shiftModeNew =  function (channel, control, value, status, group) {   
//this is whow the manual says to do it. Change back if it doesn't work.
    NS6II.shift = ! NS6II.shift;
//         if (value === 1)  {
//    NS6II.shift = true;          
//    }
//    else {
//    NS6II.shift = false;
//    }

};

//Jamin Added
NS6II.crossfaderOrientation = function (channel, control, value, status, group) {
    var deck = channel + 1;   
         if (value === 1)  {
          engine.setValue(group, "orientation", 0);
            }
     else if (value === 2) {
        engine.setValue(group, "orientation", 2);
        }
     else if (value === 0){
        engine.setValue(group, "orientation", 1);
        }
    else return

};

NS6II.viewBPM =  function (channel, control, value, status, group) {
    if (value != 0x7F) return;

        if (NS6II.shift) { 
            engine.setValue(group, "sort_column_toggle", 15);
        }
        else {engine.setValue(group, "MoveRight", 1);
        }

};

NS6II.backSong =  function (channel, control, value, status, group) {
    if (value != 0x7F) return;

        if (NS6II.shift) { 
            engine.setValue(group, "sort_column_toggle", 02);
        }
        else {engine.setValue(group, "MoveLeft", 1);
        }

};

NS6II.areaKey =  function (channel, control, value, status, group) {
    if (value != 0x7F) return;

        if (NS6II.shift) { 
            engine.setValue(group, "sort_column_toggle", 20);
        }
        else {engine.setValue(group, "MoveFocus", 1);
        }

};

NS6II.LprepArtist =  function (channel, control, value, status, group) {
    if (value != 0x7F) return;

        if (NS6II.shift) { 
            engine.setValue(group, "sort_column_toggle", 1);
        }
        else {engine.setValue(group, "track_color_next", 1);
        }

};

NS6II.filterToggle = function (channel, control, value, status, group) {
    var deck = channel + 1;   
         if (value === 0)  {
//mode 1  LED   off
            }
     else if (value === 40) {
//mode 2    LED Solid
        }
     else if (value === 127){
//mode 3    LED Blink
        }
    else return

};

NS6II.touchToggle = function (channel, control, value, status, group) {
    var deck = channel + 1;   
         if (value === 0)  {
//mode 1  LED   off
            }
     else if (value === 40) {
//mode 2    LED Solid
        }
     else if (value === 127){
//mode 3    LED Blink
        }
    else return

};


//pad mode scripts
NS6II.hotcueToggle =  function (channel, control, value, status, group) {

};

NS6II.autoLoopToggle =  function (channel, control, value, status, group) {
    var deck = channel + 5;
//+ 5 may be wrong

};

NS6II.manualLoopToggle =  function (channel, control, value, status, group) {
    var deck = channel + 5;
//+ 5 may be wrong

};

NS6II.samplerToggle =  function (channel, control, value, status, group) {
    var deck = channel + 5;
//+ 5 may be wrong

};


NS6II.slicerToggle =  function (channel, control, value, status, group) {
    var deck = channel + 5;
//+ 5 may be wrong

};


// track the state of the shift key
NS6II.shift = false;
NS6II.shiftToggle = function (channel, control, value, status, group) {
    NS6II.shift = value == 0x7F;

    if (NS6II.shift) {
        NS6II.decks.shift();
        NS6II.sampler_all.shift();
        NS6II.effects.shift();
        NS6II.browse.shift();
        NS6II.head_gain.shift();

        // reset the beat jump scratch accumulators
        NS6II.scratch_accumulator[1] = 0;
        NS6II.scratch_accumulator[2] = 0;
        NS6II.scratch_accumulator[3] = 0;
        NS6II.scratch_accumulator[4] = 0;
    }
    else {
        NS6II.decks.unshift();
        NS6II.sampler_all.unshift();
        NS6II.effects.unshift();
        NS6II.browse.unshift();
        NS6II.head_gain.unshift();
    }
};
