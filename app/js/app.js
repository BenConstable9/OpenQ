//MAIN JS FOR APP
//Copyright Ben Constable 2017

// ** VARIABLES **
var selected_cue;
var howl_objects = [];

// ** FUNCTIONS **

function add_music_cue(src) {
    //create the howl
    var sound = new Howl({
      src: [src]
    });
    //generate a unique id for the sound
    var unique_id = "test";
    //not ideal but works
    howl_objects.push({
        key:   unique_id,
        value: sound
    });
    //this adds the music to the list of songs (position is defaulted to last)
    var cue_list = document.getElementById("cue_list");
    //make sure to add them with the class cue
    
    //todo add the event listeners
    
    //create
}

function select_cue(row_id) {
    //pass in id of row to select it
    if (selected_cue !== undefined) {
        //todo reset previous row
        selected_cue.style.color = "white";
        selected_cue.style.background = "grey";
    }
    selected_cue = document.getElementById(row_id);
    //todo improve styling of rows
    selected_cue.style.color = "blue";
    selected_cue.style.background = "white";
    //todo add row details to taskbar
}

// ** EVENT LISTENERS **


//add click event listenrs to all the cues
var cues = document.getElementsByClassName("cue");
if (cues.length > 0) {
    for (var i = 0; i < cues.length; i++) {
        cues[i].addEventListener("click", function() {
            select_cue(this.id);
        });
    }
}