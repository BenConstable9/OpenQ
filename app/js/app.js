//MAIN JS FOR APP
//Copyright Ben Constable 2017

// ** VARIABLES **
var selected_cue;
var howl_objects = [];
var selected_howler;

// ** FUNCTIONS **

function add_music_cue(src) {
    //create the howl
    var sound = new Howl({
        src: [src],
        preload: true,
    });
    //this adds the music to the list of songs (position is defaulted to last)
    var cue_list = document.getElementById("cue_list");
    //make sure to add them with the class cue
    var num_cues = cue_list.rows.length;
    if (!howl_objects[num_cues]) {
        howl_objects[num_cues] = [];
    }
    howl_objects[num_cues].push(sound);
    var cue = cue_list.insertRow(-1);
    var cue_id = num_cues;
    cue.setAttribute("id", cue_id);
    cue.setAttribute("class", "cue");
    var title = src;
    var n = title.lastIndexOf('/');
    if (n !== -1) {
        var result = title.substring(n + 1);
        title = result.replace(/\.[^/.]+$/, "");
        var status = "Ready";
        var duration = sound.duration();
        var elements = [cue_id, title, duration, status];
        for (var y = 0; y < elements.length; ++y) {
            //add cell and create text
            var cell = cue.insertCell(y);
            cell.innerHTML = elements[y];
        }
        //todo add the event listeners
        document.getElementById(cue_id).addEventListener("click", function() {
            select_cue(cue_id);
        });
    }
}

function select_cue(row_id) {
    //pass in id of row to select it
    if (selected_cue !== undefined) {
        //todo reset previous row
        //selected_cue.style.color = "white";
        //selected_cue.style.background = "grey";
        selected_cue.classList.remove("cue_selected");
        selected_cue.classList.remove("info");
    }
    selected_cue = document.getElementById(row_id);
    //todo improve styling of rows
    //selected_cue.style.color = "blue";
    //selected_cue.style.background = "white";
    selected_cue.classList.add("cue_selected");
    selected_cue.classList.add("info");
    selected_howler = howl_objects[row_id];
    selected_howler = selected_howler[0];
    //disable button if sound is already playing
    var fire = document.getElementById("go");
    if (selected_howler.playing() == false) {
        fire.disabled = false;
    }
    else if (selected_howler.playing() == true) {
        fire.disabled = true;
        document.getElementById("stop").disabled = false;
        document.getElementById("pause").disabled = false;
    }
    //todo add row details to taskbar
}

function fire_cue() {
    //check if undefined
    selected_howler.play();
    selected_cue.classList.add("success");
    selected_cue.classList.remove("info");
    selected_cue.classList.remove("danger");
    document.getElementById("go").disabled = true;
    document.getElementById("stop").disabled = false;
    document.getElementById("pause").disabled = false;
    document.getElementById("play").disabled = true;
}

function stop_cue() {
    //check if undefined
    selected_howler.stop();
    selected_cue.classList.remove("success");
    document.getElementById("go").disabled = false;
    document.getElementById("stop").disabled = true;
    document.getElementById("pause").disabled = true;
}

function pause_cue() {
    //check if undefined
    selected_howler.pause();
    selected_cue.classList.remove("success");
    selected_cue.classList.add("danger");
    document.getElementById("go").disabled = true;
    document.getElementById("pause").disabled = true;
    document.getElementById("play").disabled = false;
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

document.getElementById("go").addEventListener("click", fire_cue);
document.getElementById("pause").addEventListener("click", pause_cue);
document.getElementById("stop").addEventListener("click", stop_cue);
document.getElementById("play").addEventListener("click", fire_cue);

add_music_cue("C:/Users/Ben/Downloads/Bon Jovi - You Give Love A Bad Name.mp3");
add_music_cue("C:/Users/Ben/Downloads/Bon Jovi - Livin' On A Prayer.mp3");
add_music_cue("C:/Users/Ben/Downloads/Bon Jovi - You Give Love A Bad Name.mp3");
add_music_cue("C:/Users/Ben/Downloads/Bon Jovi - Livin' On A Prayer.mp3");
add_music_cue("C:/Users/Ben/Downloads/Bon Jovi - You Give Love A Bad Name.mp3");
add_music_cue("C:/Users/Ben/Downloads/Bon Jovi - Livin' On A Prayer.mp3");
add_music_cue("C:/Users/Ben/Downloads/Bon Jovi - You Give Love A Bad Name.mp3");
add_music_cue("C:/Users/Ben/Downloads/Bon Jovi - Livin' On A Prayer.mp3");
add_music_cue("C:/Users/Ben/Downloads/Bon Jovi - You Give Love A Bad Name.mp3");
add_music_cue("C:/Users/Ben/Downloads/Bon Jovi - Livin' On A Prayer.mp3");
add_music_cue("C:/Users/Ben/Downloads/Bon Jovi - You Give Love A Bad Name.mp3");
add_music_cue("C:/Users/Ben/Downloads/Bon Jovi - Livin' On A Prayer.mp3");
add_music_cue("C:/Users/Ben/Downloads/Bon Jovi - You Give Love A Bad Name.mp3");
add_music_cue("C:/Users/Ben/Downloads/Bon Jovi - Livin' On A Prayer.mp3");
add_music_cue("C:/Users/Ben/Downloads/Bon Jovi - You Give Love A Bad Name.mp3");
add_music_cue("C:/Users/Ben/Downloads/Bon Jovi - Livin' On A Prayer.mp3");