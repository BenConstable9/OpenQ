//MAIN JS FOR APP
//Copyright Ben Constable 2017

var num_cues = 0;

// ** VARIABLES **
var selected_id;
var selected_cue;
var howl_objects = [];
var selected_howler;

// ** FUNCTIONS **

function show_alert(message) {
    if ($('#alert').length == 0) {
        var alertHtml = "<div id='alert' class='alert alert-danger alert-dismissible alert-fixed' role='alert' style='display:none'><button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button><strong>Warning - Critical Error!</strong> <span id='alertMessage'></span></div>"
        $("#alertdiv").html(alertHtml);
        $("#alert").show();
    }
    $("#alertMessage").append("<br>" + message);
}

function add_music_cue(src) {
    src = src.replace(/\\/g, "/");
    console.log(src);
    var request = $.get(src);
    request.done(function(result) {
        //create the howl
        var sound = new Howl({
            src: [src],
            preload: true,
        });
        //this adds the music to the list of songs (position is defaulted to last)
        var cue_list = document.getElementById("cue_list_body");
        //make sure to add them with the class cue
        num_cues += 1;
        var cue_id = num_cues;
        sound.on('end', function(){
            document.getElementById(num_cues).classList.remove("success");
            if (selected_cue.id == cue_id) {
                document.getElementById(num_cues).classList.add("info");
                document.getElementById("go").disabled = false;
                document.getElementById("go").style.display = "block";
                document.getElementById("fade").style.display = "none";
                document.getElementById("stop").disabled = true;
                document.getElementById("pause").disabled = true;
                document.getElementById("play").disabled = true;
            }
            var cell_id = cue_id + "_";
            var status_id = cell_id + "status";
            document.getElementById(status_id).innerHTML = "Ready"; 
        });
        sound.on('loaderror', function(id, error){
            var cell_id = cue_id + "_";
            var status_id = cell_id + "status";
            var duration_id = cell_id + "duration";
            document.getElementById(status_id).innerHTML = "Error"; 
            document.getElementById(duration_id).innerHTML = "00:00:00";
        });
        sound.once('load', function(){
            //add the time
            var duration = sound.duration();
            duration = (duration / 60).toFixed(2);
            duration = duration.replace(".", ":");
            var cell_id = cue_id + "_";
            var duration_id = cell_id + "duration";
            var status_id = cell_id + "status";
            document.getElementById(duration_id).innerHTML = duration;
            document.getElementById(status_id).innerHTML = "Ready";
        });
        if (!howl_objects[num_cues]) {
            howl_objects[num_cues] = [];
        }
        howl_objects[num_cues].push(sound);
        console.log(howl_objects);
        var cue = cue_list.insertRow(-1);
        cue.setAttribute("id", cue_id);
        cue.setAttribute("class", "cue");
        var title = src;
        var n = title.lastIndexOf('/');
        if (n !== -1) {
            var result = title.substring(n + 1);
            title = result.replace(/\.[^/.]+$/, "");
            var status = "Loading...";
            var duration = "Calculating..";
            var elements = [cue_id, title, duration, status];
            for (var y = 0; y < elements.length; ++y) {
                //add cell and create text
                var cell = cue.insertCell(y);
                var name = "";
                if (y == 0) {
                    name = "num";
                }
                else if (y == 1) {
                    name = "title";
                }
                else if (y == 2) {
                    name = "duration";
                }
                else if (y == 3) {
                    name = "status";
                }
                var cell_id = cue_id + "_" + name;
                cell.setAttribute("id", cell_id);
                cell.innerHTML = elements[y];
            }
            //todo add the event listeners
            document.getElementById(cue_id).addEventListener("click", function() {
                select_cue(cue_id);
            });
        }
    });
    request.fail(function(jqXHR, textStatus, errorThrown) {
        var error = "Unable to load file - " + src;
        show_alert(error);
    });
}

function select_cue(row_id) {
    selected_id = row_id;
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
    //add row details to taskbar
    var cell_id = selected_id + "_";
    var status_id = cell_id + "title";
    document.getElementById("cue_name").value = document.getElementById(status_id).innerHTML;
}

function fire_cue() {
    var cue_id = selected_id;
    var cue = howl_objects[cue_id][0];
    cue.play();
    document.getElementById(cue_id).classList.add("success");
    document.getElementById(cue_id).classList.remove("info");
    document.getElementById(cue_id).classList.remove("danger");
    document.getElementById("go").disabled = true;
    document.getElementById("go").style.display = "none";
    document.getElementById("fade").style.display = "block";
    document.getElementById("stop").disabled = false;
    document.getElementById("pause").disabled = false;
    document.getElementById("play").disabled = true;
    var cell_id = cue_id + "_";
    var status_id = cell_id + "status";
    document.getElementById(status_id).innerHTML = "Playing"; 
}

function stop_cue() {
    var cue_id = selected_id;
    var cue = howl_objects[cue_id][0];
    cue.stop();
    document.getElementById(cue_id).classList.remove("success");
    document.getElementById(cue_id).classList.remove("danger");
    document.getElementById(cue_id).classList.add("info");
    document.getElementById("go").disabled = false;
    document.getElementById("go").style.display = "block";
    document.getElementById("fade").style.display = "none";
    document.getElementById("stop").disabled = true;
    document.getElementById("pause").disabled = true;
    document.getElementById("play").disabled = true;
    var cell_id = cue_id + "_";
    var status_id = cell_id + "status";
    document.getElementById(status_id).innerHTML = "Ready"; 
}

function pause_cue() {
    var cue_id = selected_id;
    var cue = howl_objects[cue_id][0];
    cue.pause();
    document.getElementById(cue_id).classList.remove("success");
    document.getElementById(cue_id).classList.add("danger");
    document.getElementById("go").disabled = true;
    document.getElementById("go").style.display = "block";
    document.getElementById("fade").style.display = "none";
    document.getElementById("pause").disabled = true;
    document.getElementById("play").disabled = false;
    var cell_id = cue_id + "_";
    var status_id = cell_id + "status";
    document.getElementById(status_id).innerHTML = "Paused"; 
}

function fade_cue() {
    var cue_id = selected_id;
    var cue = howl_objects[cue_id][0];
    cue_volume = cue.volume();
    document.getElementById(cue_id).classList.remove("success");
    document.getElementById(cue_id).classList.add("warning");
    document.getElementById("fade").disabled = true;
    document.getElementById("stop").disabled = true;
    document.getElementById("pause").disabled = true;
    document.getElementById("play").disabled = true; 
    cue.fade(cue_volume, 0, 10000);
    var cell_id = cue_id + "_";
    var status_id = cell_id + "status";
    document.getElementById(status_id).innerHTML = "Fading"; 
    setTimeout(function() {
        cue.volume(cue_volume);
        cue.stop();
        document.getElementById(cue_id).classList.remove("warning");
        if (cue_id == selected_id) {
            document.getElementById("go").disabled = false;
            document.getElementById("go").style.display = "block";
            document.getElementById("fade").style.display = "none";
            document.getElementById("fade").disabled = false;
            document.getElementById(cue_id).classList.add("info");
        }
        var cell_id = cue_id + "_";
        var status_id = cell_id + "status";
        document.getElementById(status_id).innerHTML = "Ready"; 
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

// Open file selector on div click
$("#cue_import_button").click(function(){
    $("#cue_import_file").click();
});

// file selected
$("#cue_import_file").change(function(){
    var files = $('#cue_import_file')[0].files[0];
    add_music_cue(files.path);
});

//manual adding

add_music_cue("C:/Users/Ben/OneDrive/Downloads/The Killers - Spaceman.mp3");
add_music_cue("C:/Users/Ben/OneDrive/Downloads/The Killers - Be Still.mp3");
add_music_cue("C:/Users/Ben/Downloads/The Killers - Be Still.mp3");
add_music_cue("C:/Users/Ben/Downloads/The Killers - Be Still.mp3");
add_music_cue("C:/Users/Ben/OneDrive/Downloads/The Wombats - Jump Into The Fog.mp3");