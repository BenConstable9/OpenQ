//MAIN JS FOR APP
//Copyright Ben Constable 2017

// ** VARIABLES **
var num_cues = 0;
var selected_id;
var selected_cue;
var cue_volume;
var howl_objects = [];
var selected_howler = "";

// ** FUNCTIONS **

//Update Slider Times
setInterval(function() {
    if (selected_howler != "") {
        var time = selected_howler.seek();
        $('#seek-slider').slider('value', time);
        var minutes = Math.floor(time / 60);
        var seconds = (time - minutes * 60).toFixed(0);
        seek_sec = minutes + ":" + seconds;
        $( "#seek-slider-handle" ).text(seek_sec);
    }
    for (var i = 1; i <= num_cues; i++) {
        var time = howl_objects[i][0].seek();
        var cell_id = i + "_";
        var position_id = cell_id + "position";
        var minutes = Math.floor(time / 60);
        var seconds = (time - minutes * 60).toFixed(0);
        seek_sec = minutes + ":" + seconds;
        console.log(minutes);
        if (isNaN(seconds)) {
            seek_sec = "0:0";
        }
        document.getElementById(position_id).innerHTML = seek_sec; 
    }
}, 100);

//Show The Alert
function show_alert(message) {
    if ($('#alert').length == 0) {
        var alertHtml = "<div id='alert' class='alert alert-danger alert-dismissible' role='alert' style='display:none'><button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button><strong>Warning - Critical Error!</strong> <span id='alertMessage'></span></div>"
        $("#alertdiv").html(alertHtml);
        $("#alert").show();
    }
    $("#alertMessage").append("<br>" + message);
}

//Add New Cue
function add_cue(src, volume, rate) {
    src = src.replace(/\\/g, "/");
    var title = src;
    //add a random string to prevent howler.js confusion
    var random = Math.random();
    src = src + "?" + random;
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
        if (!howl_objects[num_cues]) {
            howl_objects[num_cues] = [];
        }
        howl_objects[num_cues].push(sound);
        howl_objects[num_cues][0].rate(rate);
        howl_objects[num_cues][0].volume(volume);
        howl_objects[num_cues][0].on('end', function(){
            document.getElementById(cue_id).classList.remove("success");
            if (selected_id == cue_id) {
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
        howl_objects[num_cues][0].on('loaderror', function(id, error){
            var cell_id = cue_id + "_";
            var status_id = cell_id + "status";
            var duration_id = cell_id + "duration";
            document.getElementById(status_id).innerHTML = "Error"; 
            document.getElementById(duration_id).innerHTML = "00:00:00";
        });
        howl_objects[num_cues][0].on('load', function(){
            //add the time
            var duration = sound.duration();
            var minutes = Math.floor(duration / 60);
            var seconds = (duration - minutes * 60).toFixed(0);
            duration = minutes + ":" + seconds;
            var cell_id = cue_id + "_";
            var duration_id = cell_id + "duration";
            var status_id = cell_id + "status";
            document.getElementById(duration_id).innerHTML = duration;
            document.getElementById(status_id).innerHTML = "Ready";
        });
        var cue = cue_list.insertRow(-1);
        cue.setAttribute("id", cue_id);
        cue.setAttribute("class", "cue");
        var n = title.lastIndexOf('/');
        if (n !== -1) {
            var result = title.substring(n + 1);
            title = result.replace(/\.[^/.]+$/, "");
            var status = "Loading...";
            var duration = "Calculating...";
            var controls = "Controls";
            var position = "00:00";
            var elements = [cue_id, title, duration, position, volume, rate, status, controls];
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
                    name = "position";
                }
                else if (y == 4) {
                    name = "volume";
                }
                else if (y == 5) {
                    name = "rate";
                }
                else if (y == 6) {
                    name = "status";
                }
                var cell_id = cue_id + "_" + name;
                cell.setAttribute("id", cell_id);
                cell.innerHTML = elements[y];
            }
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

//Select a Cue
function select_cue(row_id) {
    selected_id = row_id;
    //pass in id of row to select it
    if (selected_cue !== undefined) {
        selected_cue.classList.remove("cue_selected");
        selected_cue.classList.remove("info");
    }
    selected_cue = document.getElementById(row_id);
    selected_cue.classList.add("cue_selected");
    selected_cue.classList.add("info");
    selected_howler = howl_objects[row_id];
    selected_howler = selected_howler[0];
    cue_volume = selected_howler.volume();
    var cue_rate = selected_howler.rate();
    $('#volume-slider').slider('value', cue_volume);
    $( "#volume-slider-handle" ).text(cue_volume);
    $('#rate-slider').slider('value', cue_rate);
    $( "#rate-slider-handle" ).text(cue_rate);
    //set up the seek slider 
    $( "#seek-slider" ).slider( "destroy" );
    document.getElementById("seek-slider").innerHTML = '<div id="seek-slider-handle" class="ui-slider-handle"></div>';
    var seek = selected_howler.seek();
    var minutes = Math.floor(seek / 60);
    var seconds = (seek - minutes * 60).toFixed(0);
    seek_sec = minutes + ":" + seconds;
    $( "#seek-slider" ).slider({
        min: 0,
        max: selected_howler.duration(),
        step: 1,
        value: seek,
        create: function() {
            $( "#seek-slider-handle" ).text(seek_sec);
        },
        slide: function( event, ui ) {
            setTimeout(function() {
                var seek = $( "#seek-slider" ).slider("option", "value");
                selected_howler.seek(seek);
                var minutes = Math.floor(seek / 60);
                var seconds = (seek - minutes * 60).toFixed(0);
                seek_sec = minutes + ":" + seconds;
                $( "#seek-slider-handle" ).text(seek_sec);
            }, 30);    
        }
    });
    //disable button if sound is already playing
    var fire = document.getElementById("go");
    var fade = document.getElementById("fade");
    if (selected_howler.playing() == false) {
        fire.disabled = false;
        fire.style.display = "block";
        fade.style.display = "none";
        fade.disabled = true;
    }
    else if (selected_howler.playing() == true) {
        fire.disabled = true;
        fire.style.display = "none";
        fade.style.display = "block";
        fade.disabled = false;
        document.getElementById("stop").disabled = false;
        document.getElementById("pause").disabled = false;
    }
    //add row details to taskbar
    var cell_id = selected_id + "_";
    var status_id = cell_id + "title";
    document.getElementById("cue_name").value = document.getElementById(status_id).innerHTML;
}

//Play It
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
    document.getElementById("fade").disabled = false;
    document.getElementById("stop").disabled = false;
    document.getElementById("pause").disabled = false;
    document.getElementById("play").disabled = true;
    var cell_id = cue_id + "_";
    var status_id = cell_id + "status";
    document.getElementById(status_id).innerHTML = "Playing"; 
}

//Stop it
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

//Pause It
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

//Fade It
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
    cue.fade(cue_volume, 0, 5000);
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
    }, 5000);
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

//Set Up seek slider - placeholder
var handle = $( "#seek-slider-handle" );
$( "#seek-slider" ).slider({
    min: 0,
    max: 0,
    step: 1,
    create: function() {
        handle.text("00:00");
    }
});

//set up volume slider
$( "#volume-slider" ).slider({
    min: 0,
    max: 1,
    step: 0.1,
    value: 1,
    create: function() {
        $( "#volume-slider-handle" ).text("1");
    },
    slide: function( event, ui ) {
        var cue_id = selected_id;
        var cell_id = cue_id + "_";
        var volume_id = cell_id + "volume";
        setTimeout(function() {
            var new_volume = $( "#volume-slider" ).slider("option", "value");
            $( "#volume-slider-handle" ).text(new_volume);
            selected_howler.volume(new_volume);
            document.getElementById(volume_id).innerHTML = new_volume; 
        }, 30);
    }
});

//set up rate slider
$( "#rate-slider" ).slider({
    min: 0.5,
    max: 4.0,
    step: 0.1,
    value: 1,
    create: function() {
        $( "#rate-slider-handle" ).text("1");
    },
    slide: function( event, ui ) {
        var cue_id = selected_id;
        var cell_id = cue_id + "_";
        var rate_id = cell_id + "rate";
        setTimeout(function() {
            var new_rate = $( "#rate-slider" ).slider("option", "value");
            $( "#rate-slider-handle" ).text(new_rate);
            selected_howler.rate(new_rate);
            document.getElementById(rate_id).innerHTML = new_rate;
        }, 30);
    }
});

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

$("#show_import_button").click(function(){
    $("#show_import_file").click();
});

// file selected
$("#cue_import_file").change(function(){
    var cue = $('#cue_import_file')[0].files[0];
    $('#cue_import_file').val("");
    add_cue(cue.path, "1", "1");
});

// file selected
$("#show_import_file").change(function(){
    var show = $('#show_import_file')[0].files[0];
    $('#show_import_file').val("");
    howl_objects = [];
    num_cues = 0;
    document.getElementById("cue_list_body").innerHTML = "";
    //add a random string to prevent howler.js confusion
    var random = Math.random();
    show = show.path + "?" + random;
    $.ajax({
        url: show,
        dataType: "json",
        success: function (json) {
            // Process data here
            if (!json.q) {
                show_alert("Invalid File");
            }
            $("#show").html(json.name);
            document.title = "Q - " + json.name;
            //delay to keep the order
            var x = 300;
            $.each(json.cues, function(i, cue) {
                setTimeout(function() {
                    add_cue(cue.src, cue.volume, cue.rate);
                }, x);
                x += 300;
            });
        }
    });
});