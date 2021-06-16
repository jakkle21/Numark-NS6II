//intro

//settings
    //Default Pad Mode
    //Manual Loop Mode Top Row (Hot Cue or Autoloop)  
        //Flip Paramaters?
    //Samplers, Left and Right same or Different? 

play stutter
temp/perm pitchbend
default pads
track time count up or down
pad/deck Param Adjust
mixer touch eq kills
effect touch knob kills



//init
//  // toggle 4 deck on


//shutdown

//funcitons

//  //library
//      // naviagtion   channel = 16 opcode 8/9
//          //view   ctrl = 0x0E
//          //back   ctrl = 0x11
//          //area   ctrl = 0x0F
//          //L.Prep ctrl = 0x1B - Use as Preview
//              //shift_modes(sort by)
//          //Knob ctrl - 0x00   val = 0x01 (clockwise)   = 0x7F (counter)
//              //shift_mode quickscroll
//          //load ch= 16 ctrl = deck+1 (1 = 0x02 4 0x05
//  //mixer
//      //crossfader ch = 16 ctrl = 0x08  val = 0x00 / 0x7F
//      //PFL all channel ==  control = 0x1B val 0x7F =1 0x00 =0
//          // opcode 8/9 status 80/90 channel 1 off/on
//          // opcode 9/8 status 93/83 channel 4 on/off 
//          //      if  
//                      // midi: [0x89 + midi_chan, 0x1B], pfl_toggle
//          //      if      
//                      // midi: [0x79 + midi_chan, 0x1B], pfl_toggle
//          //mix knob ch = 16 ctrl = 0x0D
//          //gainknob ch = 16 ctrl = 0x0C
//          //splt toggle ch = 16 ctrl = 0x1C
//
//      //crossfader toggles  all channel ==  control = 0x1E val 0x00 = center  0x01 = left (A) 0x02 = Right (B)
//          // opcode 8/9 status 80/90 channel 1 off/on
//          // opcode 9/8 status 93/83 channel 4  on/off
//          //coutour knob  ch = 16 ctrl = 0x09 val 0x00 / 0x7F
//          
//      //knobs channel ==  
//          //turn  status = 0xB3  value = R=0x00 to L=0x7F
//          //touch status = 0x91/0x81  value = 0x7F / 0x00
//          //gain   ctrl = 0x16 (no touch)
//          //high   ctrl = 0x17
//          //mid    ctrl = 0x18
//          //low    ctrl = 0x19
//          //filter ctrl = 0x1A
//      
//      //effect toggles ch = A = 0x09 B = 0x10  ctrl = deck+4 (1=5 4=8)
//      //shift buttons
//          //left  channel = 1 ctrl = 0x20
//          //right channel = 2 ctrl = 0x20
//
//  //effects
//      //Touch/Fillter Button channel = 16 opcode 0x09 
//          // Left (Touch)  ctrl = 0x59 val 0x40 = solid 0x7F = Flash 0x00 = Off
//          // Right (Filter)ctrl = 0x5A val 0x40 = solid 0x7F = Flash 0x00 = Off
//              //Off  Low/High-pass
//              //Filter-Roll (Solid Red) High/Low-Pass + Incresing Loop-Roll
//              //Filter-FX (Flashing Red) High/Low-Pass + 1st Paramemter of Effects
//      //tap    
//          //left  ch = 0x09 ctrl = 0x04
//          //right ch = 0x10 ctrl = 0x04
//      //click_knob   channel = L = 0x09 R = 0x10
//          //turn  ctrl = 0x03 val= 0x7F / 0x01
//          //bush  ctrl = 0x41 val= 0x7F / 0x01
//      //knobs   channel = L = 0x09 R = 0x10
//          //turn  status = 0xB3  value = R=0x00 to L=0x7F
//          //touch ctrl = 0x20 (1) 0x21 (2) 0x22 (3)  status = 0x91/0x81  value = 0x7F / 0x00
//          //buttons ctrl = 0x00 (1) 0x01 (2) 0x02 (3) status = 0x91/0x81  value = 0x7F / 0x00
//
//  //decks
//      //lcd
//          //Deck 
//          //Platter Spinner Circle
//          //Time Played/Remaing Circle
//          //Elapsed/Remaing Time Clock
//          //BPM
//          //Pitch Up/Down indictor
//          //Pitch +/- %
//          //Pitch Range
//          //Keylock
//      //jog
//      //buttons
//          //leds
//
//          //slip/quantize channel == ctrl ox1F (shifted) channel = +4 ctrl = 0x04
//          //bleep/keylock channel == ctrl ox10  (shifted)ch == ctrl = 0x0D
//      //pitchadjust
//          //leds
//          //
//  //pads     channel = +4 (1=5 4=8)
//      //default mode? settings optionto pick which mode.
//      // default mode LED setting (Bright?) and Alt Mode LED setting (Dim?)
//      //hotques  ctrl = 0x00 val = 0x7F / 0x00    (shifted) 0x02
//          //Shifted = Hotcues 1-8 on Top Row. Intro/Outro on Bottom Row (Shifted+ = Delete)
//          //Pads = 1-8 Hotcues (Shifted+ = Delete)
//      //autoloop ctrl = 0x10 val = 0x7F / 0x00    (shifted) none
//          //autobutton = enter/exit loop (reloop optional?)
//          //Long-Press enable Loop-Roll
//          //Shift+ Exit Loop
//          //Pads = 1/8 Beat through 16 Beat loop Creat/Exit
//          //Param = 1/2 & 2x
//      //manualloop ctrl = 0x0E val = 0x7F / 0x00    (shifted) none
//          //Top Row ?
//          //Bottom Row, Left to Right
//              //Loop In, Loop Out, Enter/Exit, Reloop
//              //Parameter = Double/Halve Loop. Shifted = Forward/Backward
//      //sampler    ctrl = 0x0B val = 0x7F / 0x00    (shifted) 0x0F
//          //Long-Press = Velocity Sensitive Pads.
//          //Shifted = Enter Loop Mode. Pads Togle Loop Sample at End.
//              //Pads = Load, Cue Play, Shift+ = Eject.
//      //slicer     ctrl = 0x09 val = 0x7F / 0x00    (shifted) none
//          //Long-Press = Velocity Sensitive Pads.
//          //Shifted = Enable Loop Sample on All samples.
//              //Pads = Load, "One Shot" Play, Shift+ = Eject 
//      //pads (starting top left and wokring accross)  value = 0x00 to 0x7F (velocity sensitive)
//          //top row    ctrls 0x14 0x15 0x16 0x17   (shifted) 0x1C 0x1D 0x1E 0x1F
//          //buttom row ctrls 0x18 0x19 0x1A 0x1B   (shifted) 0x20 0x21 0x22 0x23
//
//          //Serato PadModes
//              //Hot Cue
//                  //Hot Cue Auto-Loop
//                      //Paramater = Change Loop Size
//              //Auto / Roll
//                  //Auto-Loop 
//                      // 1/8 Beat through 16 beat. Shift+Parameter = Move Loop forward or backward
//                  //Loop Roll
//                      // Pads are same. Parameter = time division
//              //Loop 
//                  //Bank 1 & 2
//                      // Top Row = Saved Loops 1 - 4 . Shift+ = Delete  Shift + Parameter = Move Loop forward or backward
//                      //  Bottom Row, Left to RIght = Loop In, Loop Out, Toggle Loop,Reloop                
//              //Sampler   
//                  //Velocity Trigger
//                      // 1-3 & 5-7 = Sample 1-6  Shift+ = Stop. Pad 4 = Change Mode. 8 = Loop Sample
//              //Slicer
//                  //Slicer Loop
//                      // 1-8 Slices. 

