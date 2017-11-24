//MAIN JS FOR APP
//Copyright Ben Constable 2017

//Call In Depndcies
const {dialog} = require('electron').remote;
var fs = require('fs');

// ** VARIABLES **
var locked = false;
var num_cues = 0;
var selected_id;
var selected_cue;
var cue_volume;
var howl_objects = [];
var selected_howler = "";
var filepath = "";

// ** FUNCTIONS **

function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

//Update Slider Times
setInterval(function() {
    if (selected_howler != "") {
        var time = selected_howler.seek();
        $('#seek-slider').slider('value', time);
        var minutes = Math.floor(time / 60);
        minutes = pad(minutes, 2);
        var seconds = (time - minutes * 60).toFixed(0);
        seconds = pad(seconds, 2);
        seek_sec = minutes + ":" + seconds;
        $( "#seek-slider-handle" ).text(seek_sec);
    }
    //cycle through all the cues
    var cues = document.getElementsByClassName("cue");
    if (cues.length > 0) {
        for (var i = 0; i < cues.length; i++) {
            var cue_id = cues[i].id;
            var cell_id = cue_id + "_";
            var end_id = cell_id + "end";
            var length_id = cell_id + "duration";
            var fadeout = document.getElementById(end_id).innerHTML;
            var length = document.getElementById(length_id).innerHTML;
            var time = howl_objects[cue_id][0].seek();
            var position_id = cell_id + "position";
            var remain_id = cell_id + "remaining";
            var minutes = Math.floor(time / 60);
            minutes = pad(minutes, 2);
            var seconds = (time - minutes * 60).toFixed(0)
            seconds = pad(seconds, 2);
            seek_sec = minutes + ":" + seconds;
            if (isNaN(seconds)) {
                seek_sec = "00:00";
            }
            var end_time = fadeout.split(":");
            var end_seconds = (60 * parseFloat(end_time[0])) + parseFloat(end_time[1]);
            var remaining = end_seconds - time;
            if (remaining >= 0) {
                var remaining_minutes = Math.floor(remaining / 60);
                remaining_minutes = pad(remaining_minutes, 2);
                var remaining_seconds = (remaining - remaining_minutes * 60).toFixed(0)
                remaining_seconds = pad(remaining_seconds, 2);
                var remaining_formatted = remaining_minutes + ":" + remaining_seconds;
            }
            else {
                var remaining_formatted = "00:00";
            }
            document.getElementById(remain_id).innerHTML = remaining_formatted;
            document.getElementById(position_id).innerHTML = seek_sec; 
            if (fadeout == seek_sec && seek_sec != "00:00" && length != seek_sec) {
                fade_cue(cue_id);
            }
        }
    }
}, 100);

//Show The Alert
function show_alert(message) {
    if ($('#alert').length == 0) {
        var alertHtml = "<div id='alert' class='alert alert-danger alert-dismissible' role='alert' style='display:none'><button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button><strong>Warning - Critical Error!</strong> <span id='alertcontent'></span></div>"
        $("#alertdiv").html(alertHtml);
        $("#alert").show();
    }
    $("#alertcontent").append("<br>" + message);
}

//Show The Alert
function show_message(message) {
    if ($('#message').length == 0) {
        var alertHtml = "<div id='message' class='alert alert-success alert-dismissible' role='alert' style='display:none'><button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button><strong>Message</strong> <span id='messagecontent'></span></div>"
        $("#messagediv").html(alertHtml);
        $("#message").show();
    }
    $("#messagecontent").append("<br>" + message);
}

function write_file() {
    var file = {};
    var name = $("#show").html();
    file.openq = "1.0.0";
    file.name = name;
    file.cues = [];
    //get the cue content
    var cues = document.getElementById("cue_list_body");
    for (var i = 0, row; row = cues.rows[i]; i++) {
        var cue_json = {};
        //get the howler details
        var howl = howl_objects[row.id][0];
        console.log(howl);
        var s = howl._src;
        var n = s.indexOf('?');
        cue_json.src = s.substring(0, n != -1 ? n : s.length);
        cue_json.type = "audio";
        var title_id = row.id + "_title";
        var start_id = row.id + "_start";
        var end_id = row.id + "_end";
        cue_json.title = document.getElementById(title_id).innerHTML;
        cue_json.volume = howl._volume;
        cue_json.rate = howl._rate;
        cue_json.start = document.getElementById(start_id).innerHTML;
        cue_json.end = document.getElementById(end_id).innerHTML;
        file.cues.push(cue_json);
    }
    var json = JSON.stringify(file);
    fs.writeFile(filepath, json, (err) => {
        if(err){
            show_alert("An error ocurred creating the file: "+ err.message)
        }     
        show_message("The file has been succesfully saved");
    });
}

//Write to the file
function save_file() {
    if (filepath == "") {
        //show the save dialog
        var filename = dialog.showSaveDialog({filters: [{name: '.json', extensions: ['json']}]});
        if (filename === undefined){
            show_alert("You didn't save the file");
        }
        else {
            filepath = filename;
            var name = filename.substring(filename.lastIndexOf('/')+1);
            name = filename.substring(filename.lastIndexOf('\\')+1);
            name = name.slice(0, -5);
            $("#show").html(name);
            document.title = "OpenQ - " + name;
            write_file();
        }
    }
    else {
        write_file();
    }
}

//capture the row
function set_drag(ev) {
    //get the whole row
    var transfer = ev.target.parentNode.parentNode.id;
    ev.dataTransfer.setData("text", transfer);
}

//prevent the default
function allow_drop(ev) {
    ev.preventDefault();
}

function drop_row(ev) {
    //prevent default
    ev.preventDefault();
    var data = ev.dataTransfer.getData("text");
    var temp = document.getElementById(data).innerHTML;
    //store the classes
    var classes = document.getElementById(data).classList;
    var cue_row = document.getElementById(data).rowIndex - 1;
    var cue_list = document.getElementById("cue_list_body");
    //delete the current row
    cue_list.deleteRow(cue_row);
    var section = ev.target.parentNode.parentNode.rowIndex;
    if (typeof section === "undefined") {
        var section = ev.target.parentNode.rowIndex;
    }
    var row = cue_list.insertRow(section);
    row.innerHTML = temp;
    //redo the event listenes etc
    row.setAttribute("id", data);
    row.setAttribute("class", classes);
    //cycle through each td or the row
    for (var i = 0, col; col = row.cells[i]; i++) {
        if (i != 10) {
            col.addEventListener("click", function() {
                select_cue(data);
            });
        }
    }
    //re add inline controls
    var delete_id = data + "_delete";
    document.getElementById(delete_id).addEventListener("click", function() {
        delete_confirm(cue_id);
    });
    document.getElementById(data).addEventListener("drop", function() {
        drop_row(event);
    });
    document.getElementById(data).addEventListener("dragover", function() {
        allow_drop(event);
    });
    //renumber the cues
    renumber();
}

//Add New Cue
function add_cue(src, title, volume, rate, start, end) {
    //show the taskbar and the cue list
    document.getElementById("start").style.display = "none";
    document.getElementById("taskbar").style.display = "block";
    document.getElementById("cue_list_div").style.display = "block";
    src = src.replace(/\\/g, "/");
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
            var start_id = cell_id + "start";
            var start_time = document.getElementById(start_id).innerHTML;
            start_time = start_time.split(":");
            var seconds = (60 * start_time[0]) + start_time[1];
            sound.seek(seconds);
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
            minutes = pad(minutes, 2);
            var seconds = (duration - minutes * 60).toFixed(0);
            seconds = pad(seconds, 2);
            duration = minutes + ":" + seconds;
            var cell_id = cue_id + "_";
            var duration_id = cell_id + "duration";
            var status_id = cell_id + "status";
            if (end == "Calculating...") {
                var end_id = cell_id + "end";
                document.getElementById(end_id).innerHTML = duration;
            }
            document.getElementById(duration_id).innerHTML = duration;
            document.getElementById(status_id).innerHTML = "Ready";
        });
        var cue = cue_list.insertRow(-1);
        cue.setAttribute("id", cue_id);
        cue.setAttribute("class", "cue");
        title = title.replace(/\\/g, "/");
        var n = title.lastIndexOf('/');
        var result = title.substring(n + 1);
        title = result.replace(/\.[^/.]+$/, "");
        var status = "Loading...";
        var duration = "Calculating...";
        var delete_id = cue_id + "_delete";
        var drag_id = cue_id + "_drag";
        var inline_controls = "<i data-toggle='tooltip' title='Delete cue' id='"+delete_id+"' class='fa fa-trash delete' aria-hidden='true'></i>&nbsp;&nbsp;<i id='"+drag_id+"' dragable='true' ondragstart='set_drag(event)' data-toggle='tooltip' title='Drag to reorder cue' class='fa fa-bars order' aria-hidden='true'></i>";
        var position = "00:00";
        volume = (volume * 100);
        volume = volume + "%";
        rate = (rate * 100);
        rate = rate + "%";
        var cue_num = $('#cue_list >tbody >tr').length;
        if (start == "") {
            start = "00:00";
        }
        if (end == "") {
            end = "Calculating...";
        }
        var remaining = "00:00";
        var elements = [cue_num, title, duration, position, remaining, start, end, volume, rate, status, inline_controls];
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
                name = "remaining";
            }
            else if (y == 5) {
                name = "start";
            }
            else if (y == 6) {
                name = "end";
            }
            else if (y == 7) {
                name = "volume";
            }
            else if (y == 8) {
                name = "rate";
            }
            else if (y == 9) {
                name = "status";
            }
            else if (y == 10) {
                name = "inline_controls";
            }
            var cell_id = cue_id + "_" + name;
            cell.setAttribute("id", cell_id);
            cell.setAttribute("class", name);
            cell.innerHTML = elements[y];
            if (y != 10) {
                document.getElementById(cell_id).addEventListener("click", function() {
                    select_cue(cue_id);
                });
            }
        }
        //add the event listeners
        document.getElementById(delete_id).addEventListener("click", function() {
            delete_confirm(cue_id);
        });
        document.getElementById(cue_id).addEventListener("drop", function() {
            drop_row(event);
        });
        document.getElementById(cue_id).addEventListener("dragover", function() {
            allow_drop(event);
        });
    });
    request.fail(function(jqXHR, textStatus, errorThrown) {
        var error = "Unable to load file - " + src;
        show_alert(error);
    });
}

function renumber() {
    var cues = document.getElementsByClassName("cue");
    if (cues.length > 0) {
        for (var i = 0; i < cues.length; i++) {
            //get the id of the length
            cues[i].firstChild.innerHTML = (i + 1);
        }
    }
}

//Select a Cue
function select_cue(row_id) {
    selected_id = row_id;
    //pass in id of row to select it
    if (selected_cue == "") {
        console.log("Deletion Redirect");
    }
    else if (selected_cue !== undefined && selected_cue != "") {
        selected_cue.classList.remove("cue_selected");
        selected_cue.classList.remove("info");
    }
    selected_cue = document.getElementById(row_id);
    selected_cue.classList.add("cue_selected");
    selected_cue.classList.add("info");
    selected_howler = howl_objects[row_id];
    selected_howler = selected_howler[0];
    var cue_rate = selected_howler.rate();
    cue_volume = selected_howler.volume();
    $('#volume-slider').slider('value', cue_volume);
    cue_volume = (cue_volume * 100);
    cue_volume = cue_volume + "%";
    $( "#volume-slider-handle" ).text(cue_volume);
    $('#rate-slider').slider('value', cue_rate);
    var cue_rate = (cue_rate * 100);
    cue_rate = cue_rate + "%";
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
    var cell_id = row_id + "_";
    var start_id = cell_id + "start";
    var start_time = document.getElementById(start_id).innerHTML;
    start_time = start_time.split(":");
    var seconds = (60 * parseFloat(start_time[0])) + parseFloat(start_time[1]);
    var end_id = cell_id + "end";
    var end_time = document.getElementById(end_id).innerHTML;
    end_time = end_time.split(":");
    //set up the start and end controls
    document.getElementById("start_minute").value = start_time[0];
    document.getElementById("start_second").value = start_time[1];
    document.getElementById("end_minute").value = end_time[0];
    document.getElementById("end_second").value = end_time[1];
    //disable button if sound is already playing
    var fire = document.getElementById("go");
    var fade = document.getElementById("fade");
    if (selected_howler.playing() == false) {
        selected_howler.seek(seconds);
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
    var status_id = cell_id + "title";
    document.getElementById("cue_name").value = document.getElementById(status_id).innerHTML;
}

//Play It
function fire_cue() {
    var cue_id = selected_id;
    var cell_id = cue_id + "_";
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
function fade_cue(cue_id) {
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

function delete_cue(cue_id) {
    if (cue_id != "") {
        if (selected_cue !== undefined && selected_cue != "") {
            selected_cue.classList.remove("cue_selected");
            selected_cue.classList.remove("info");
        }
        //find the id
        document.getElementById(cue_id).remove();
        //delete the howler
        howl_objects[cue_id][0].unload();
        delete howl_objects[cue_id];
        //select another cue
        selected_howler = "";
        selected_cue = "";
        selected_id = "";
        var rowCount = $('#cue_list >tbody >tr').length;
        if (rowCount > 0) {
            var new_cue_id = document.getElementsByClassName("cue")[0].id;
            select_cue(new_cue_id);
            renumber();
            show_message("Cue deleted successfully.");
        }
        else {
            //hide the taskbar and the cue list
            document.getElementById("start").style.display = "block";
            document.getElementById("taskbar").style.display = "none";
            document.getElementById("cue_list_div").style.display = "none";
        }
    }
}

function delete_confirm(cue_id) {
    if (confirm("Are you sure you want to delete this cue?") == true) {
        delete_cue(cue_id);
    }
}

function update_start() {
    var start_minute = document.getElementById("start_minute").value;
    start_minute = pad(start_minute, 2);
    var start_second = document.getElementById("start_second").value;
    start_second = pad(start_second, 2);
    var start_id = selected_id + "_start";
    document.getElementById(start_id).innerHTML = start_minute + ":" + start_second;
}

function update_end() {
    var end_minute = document.getElementById("end_minute").value;
    end_minute = pad(end_minute, 2);
    var end_second = document.getElementById("end_second").value;
    end_second = pad(end_second, 2);
    var end_id = selected_id + "_end";
    document.getElementById(end_id).innerHTML = end_minute + ":" + end_second;
}

// ** SLIDERS LISTENERS **

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
        $( "#volume-slider-handle" ).text("100%");
    },
    slide: function( event, ui ) {
        var cue_id = selected_id;
        var cell_id = cue_id + "_";
        var volume_id = cell_id + "volume";
        setTimeout(function() {
            var new_volume = $( "#volume-slider" ).slider("option", "value");
            if (selected_howler != "") {
                selected_howler.volume(new_volume);
            }
            var new_volume = (new_volume * 100);
            new_volume = new_volume + "%";
            $( "#volume-slider-handle" ).text(new_volume);
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
        $( "#rate-slider-handle" ).text("100%");
    },
    slide: function( event, ui ) {
        var cue_id = selected_id;
        var cell_id = cue_id + "_";
        var rate_id = cell_id + "rate";
        setTimeout(function() {
            var new_rate = $( "#rate-slider" ).slider("option", "value");
            console.log(new_rate);
            if (selected_howler != "") {
                selected_howler.rate(new_rate);
            }
            var new_rate = (new_rate * 100).toFixed(0);
            console.log(new_rate);
            new_rate = new_rate + "%";
            $( "#rate-slider-handle" ).text(new_rate);
            document.getElementById(rate_id).innerHTML = new_rate;
        }, 30);
    }
});

// ** EVENT LISTENERS **

//detect change in name
$('#cue_name').bind('input', function() {
    var name_id = selected_id + "_title";
    document.getElementById(name_id).innerHTML = $('#cue_name').val();
});

//detect changes in time
$('#start_minute').bind('input', function() {
    update_start();
});

$('#start_second').bind('input', function() {
    update_start();
});

$('#end_minute').bind('input', function() {
    update_end();
});

$('#end_second').bind('input', function() {
    update_end();
});

//detect enter press
$(document).keyup(function(evt) {
    if (evt.keyCode == 13) {
        enter = false;
    }
}).keydown(function(evt) {
    if (evt.keyCode == 13) {
        enter = true;
        if (selected_howler.playing() == false) {
            fire_cue();
        }
        else {
            fade_cue(selected_id);
        }
    }
});

//Button Event Listeners

$("#go").click(function(){
    fire_cue();
});

$("#fade").click(function(){
    fade_cue(selected_id);
});

$("#pause").click(function(){
    pause_cue();
});

$("#stop").click(function(){
    stop_cue();
});

$("#play").click(function(){
    fire_cue();
});

//setup tooltips
$(document).ready(function(){
    $('[data-toggle="tooltip"]').tooltip();   
});

//disable and reenable modification
$("#lock_mod").click(function(){
    locked = true;
    show_message("Show Modification Locked");
    document.getElementById("locked").style.display = "inline";
    document.getElementById("unlocked").style.display = "none";
    var inputs = document.getElementsByTagName("input");
    for (var i = 0; i < inputs.length; i++) {
        if (inputs[i].type === 'text' || inputs[i].type === 'number' || inputs[i].type === 'file') {
            inputs[i].disabled = true;
        }
    }
    //disable the dragability
    var drags = document.getElementsByClassName("order");
    var deletes = document.getElementsByClassName("delete");
    if (drags.length > 0) {
        for (var i = 0; i < drags.length; i++) {
            drags[i].style.display = "none";
            deletes[i].style.display = "none";
        }
    }
});

//disable and reenable modification
$("#unlock_mod").click(function(){
    locked = false;
    show_message("Show Modification Unlocked");
    document.getElementById("locked").style.display = "none";
    document.getElementById("unlocked").style.display = "inline";
    var inputs = document.getElementsByTagName("input");
    for (var i = 0; i < inputs.length; i++) {
        console.log(inputs[i].type);
        if (inputs[i].type === 'text' || inputs[i].type === 'number' || inputs[i].type === 'file') {
            inputs[i].disabled = false;
        }
    }
    //show the dragability
    var drags = document.getElementsByClassName("order");
    var deletes = document.getElementsByClassName("delete");
    if (drags.length > 0) {
        for (var i = 0; i < drags.length; i++) {
            drags[i].style.display = "inline";
            deletes[i].style.display = "inline";
        }
    }
});

//empty the cue list
$("#empty_list").click(function(){
    if (locked == false) {
        //loop through the cues    
        var cues = document.getElementsByClassName("cue");
        if (cues.length > 0) {
            var cues_length = cues.length;
            for (var i = 0; i < cues_length; i++) {
                var empty_cue = cues_length - 1 - i;
                delete_cue(cues[empty_cue].id);
            }
        }
    }
    else {
        show_alert("Show modificiation is disabled - to enable visit the 'More' tab.")
    }
});

// Open file selector on div click
$("#cue_import_button").click(function(){
    if (locked == false) {
        $("#cue_import_file").click();
    }
    else {
        show_alert("Show modificiation is disabled - to enable visit the 'More' tab.")
    }
});

$("#start_cue_import_button").click(function(){
    $("#cue_import_file").click();
});

$("#save_show_button").click(function(){
    save_file();
});

$("#show_import_button").click(function(){
    if (locked == false) {
        $("#show_import_file").click();
    }
    else {
        show_alert("Show modificiation is disabled - to enable visit the 'More' tab.")
    }
});

$("#start_show_import_button").click(function(){
    $("#show_import_file").click();
});

// file selected
$("#cue_import_file").change(function(){
    var cue = $('#cue_import_file')[0].files[0];
    $('#cue_import_file').val("");
    add_cue(cue.path, cue.path, 1, 1, "", "");
});

// file selected
$("#show_import_file").change(function(){
    var show = $('#show_import_file')[0].files[0];
    $('#show_import_file').val("");
    //add a random string to prevent caching confusion
    var random = Math.random();
    filepath = show.path;
    show = show.path + "?" + random;
    $.ajax({
        url: show,
        dataType: "json",
        success: function (json) {
            // Process data here
            if (!json.openq) {
                show_alert("Invalid File - Not a Q Show Library");
            }
            $("#show").html(json.name);
            document.title = "OpenQ - " + json.name;
            //delay to keep the order
            var x = 300;
            $.each(json.cues, function(i, cue) {
                if (cue.title == "") {
                    cue.title = cue.src;
                }
                setTimeout(function() {
                    add_cue(cue.src, cue.title, cue.volume, cue.rate, cue.start, cue.end);
                }, x);
                x += 300;
            });
        },
        error: function() {
            show_alert("Unable to find show file");
        }
    });
});