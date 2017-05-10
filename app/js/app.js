//MAIN JS FOR APP
//Copyright Ben Constable 2017

// ** VARIABLES **
var selected_cue;
var howl_objects = [];
var selected_howler;
var cue_volume;

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
    sound.on('end', function(){
        document.getElementById(num_cues).classList.remove("success");
        if (selected_cue.id == cue_id) {
            document.getElementById(num_cues).classList.add("info");
            document.getElementById("go").disabled = false;
            document.getElementById("stop").disabled = true;
            document.getElementById("pause").disabled = true;
            document.getElementById("play").disabled = true;
        }
    });
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
    cue_volume = selected_howler.volume();
    console.log(cue_volume);
    //disable button if sound is already playing
    var fire = document.getElementById("go");
    var fade = document.getElementById("fade");
    if (selected_howler.playing() == false) {
        fire.disabled = false;
        fire.style.display = "block";
        fade.style.display = "none";
    }
    else if (selected_howler.playing() == true) {
        fire.disabled = true;
        fire.style.display = "none";
        fade.style.display = "block";
        document.getElementById("stop").disabled = false;
        document.getElementById("pause").disabled = false;
    }
    //todo add row details to taskbar
}

function fire_cue() {
    //check if undefined
    selected_howler.play();
    console.log(selected_howler);
    selected_cue.classList.add("success");
    selected_cue.classList.remove("info");
    selected_cue.classList.remove("danger");
    document.getElementById("go").disabled = true;
    document.getElementById("go").style.display = "none";
    document.getElementById("fade").style.display = "block";
    document.getElementById("stop").disabled = false;
    document.getElementById("pause").disabled = false;
    document.getElementById("play").disabled = true;
}

function stop_cue() {
    //check if undefined
    selected_howler.stop();
    selected_cue.classList.remove("success");
    document.getElementById("go").disabled = false;
    document.getElementById("go").style.display = "block";
    document.getElementById("fade").style.display = "none";
    document.getElementById("stop").disabled = true;
    document.getElementById("pause").disabled = true;
    document.getElementById("play").disabled = true;
}

function pause_cue() {
    //check if undefined
    selected_howler.pause();
    selected_cue.classList.remove("success");
    selected_cue.classList.add("danger");
    document.getElementById("go").disabled = true;
    document.getElementById("go").style.display = "block";
    document.getElementById("fade").style.display = "none";
    document.getElementById("pause").disabled = true;
    document.getElementById("play").disabled = false;
}

function fade_cue() {
    selected_cue.classList.remove("success");
    selected_cue.classList.add("warning");
    document.getElementById("fade").disabled = true;
    document.getElementById("stop").disabled = true;
    document.getElementById("pause").disabled = true;
    document.getElementById("play").disabled = true; 
    selected_howler.fade(cue_volume, 0, 10000);
    setTimeout(function() {
        selected_howler.stop();
        selected_cue.classList.remove("warning");
        document.getElementById("go").disabled = false;
        document.getElementById("go").style.display = "block";
        document.getElementById("fade").style.display = "none";
        document.getElementById("fade").disabled = false;
        document.getElementById("stop").disabled = false;
        document.getElementById("pause").disabled = false;
        document.getElementById("play").disabled = false; 
    }, 10000);
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

//Button Event Listeners
document.getElementById("go").addEventListener("click", fire_cue);
document.getElementById("fade").addEventListener("click", fade_cue);
document.getElementById("pause").addEventListener("click", pause_cue);
document.getElementById("stop").addEventListener("click", stop_cue);
document.getElementById("play").addEventListener("click", fire_cue);

add_music_cue("C:/Users/Ben/Downloads/Bon Jovi - You Give Love A Bad Name.mp3");
add_music_cue("C:/Users/Ben/Downloads/Bon Jovi - Livin' On A Prayer.mp3");