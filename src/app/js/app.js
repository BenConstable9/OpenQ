//MAIN JS FOR APP
//Copyright Ben Constable 2017

//Call In Depndcies
const {dialog} = require('electron').remote;
const electron = require('electron').remote;
const {remote, ipcRenderer} = require ('electron');
const BrowserWindow = require('electron').remote.BrowserWindow;
const url = require('url');
const path = require('path');
var fs = require('fs');

// ** VARIABLES **
var locked = false;
var cue_id = 1;
var selected_id = "";
var selected_cue;
var cues = [];
var selected_video_source = "";
var playing_video = "";
var filepath = "";

// ** FUNCTIONS **

function external_screen() {
    //trigger the external display
    ipcRenderer.send('async', "ExternalScreen");
}

function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

//Update Slider Times
setInterval(function() {
    //cycle through all the cues
    var cue_rows = document.getElementsByClassName("cue");
    if (cue_rows.length > 0) {
        for (var i = 0; i < cue_rows.length; i++) {
            var cue_id = cue_rows[i].id;
            var cell_id = cue_id + "_";
            var end_id = cell_id + "end";
            var length_id = cell_id + "duration";
            var fadeout = document.getElementById(end_id).innerHTML;
            var length = document.getElementById(length_id).innerHTML;
            if (cues[cue_id].type == "Audio" && cues[cue_id].audio_object != null) {
                if (length == "-" || fadeout == "End") {
                    var duration = cues[cue_id].audio_object.duration;
                    if (isNaN(duration) == false) {
                        var minutes = Math.floor(duration / 60);
                        minutes = pad(minutes, 2);
                        var seconds = (duration - minutes * 60).toFixed(0);
                        seconds = pad(seconds, 2);
                        length = minutes + ":" + seconds;
                        document.getElementById(length_id).innerHTML = length;
                        document.getElementById(end_id).innerHTML = length;
                        document.getElementById("end_minute").value = minutes;
                        document.getElementById("end_second").value = seconds;
                        if (locked == false) {
                            document.getElementById("end_minute").disabled = false;
                            document.getElementById("end_second").disabled = false;
                        }
                    }
                }
                var time = cues[cue_id].audio_object.currentTime;
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
                if (cue_id == selected_id) {
                    var duration = cues[cue_id].audio_object.duration;
                    document.getElementById("elapsed").innerHTML = seek_sec;
                    document.getElementById("remaining").innerHTML = remaining_formatted;
                    document.getElementById("time-slider").value = time;
                    document.getElementById("time-slider").max = duration;
                    document.getElementById("remaining").innerHTML = "-" + remaining_formatted;
                }
                if (fadeout == seek_sec && seek_sec != "00:00" && length != seek_sec) {
                    fade_cue(cue_id);
                }
                if (cues[cue_id].faded == true && cue_id != selected_id && cues[cue_id].audio_object.paused == true) {
                    //unload it to save memory
                    delete cues[cue_id].audio_object;
                    stopped_cue(cue_id);
                    console.log("unloading");
                }
            }
            else {
                //todo fade out the video
            }
        }
    }
}, 100);

//Show The Alert
function show_message(message) {
    document.getElementById("message").innerHTML = "- " + message;
    setTimeout(function() {
        document.getElementById("message").innerHTML = "";
    }, 30000);    
}

function write_file() {
    var file = {};
    var name = $("#show").html();
    file.openq = "1.0.0";
    file.name = name;
    file.cues = [];
    //get the cue content
    var cue_rows = document.getElementsByClassName("cue");
    for (var i = 0; i < cue_rows.length; i++) {
        var row = cue_rows[i].id;
        var cue_json = {};
        var s = cues[row].src;
        var n = s.indexOf('?');
        cue_json.src = s.substring(0, n != -1 ? n : s.length);
        cue_json.type = cues[row].type;
        var title_id = row + "_title";
        var start_id = row + "_start";
        var end_id = row + "_end";
        cue_json.title = document.getElementById(title_id).innerHTML;
        cue_json.start = document.getElementById(start_id).innerHTML;
        cue_json.end = document.getElementById(end_id).innerHTML;
        file.cues.push(cue_json);
    }
    var json = JSON.stringify(file);
    fs.writeFile(filepath, json, (err) => {
        if(err){
            show_message("An error ocurred creating the file: "+ err.message)
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
            show_message("You didn't save the file");
        }
        else {
            filepath = filename;
            var name = filename.substring(filename.lastIndexOf('/')+1);
            name = filename.substring(filename.lastIndexOf('\\')+1);
            name = name.slice(0, -5);
            document.getElementById("name").innerHTML = name;
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

function stopping(cue_id) {
    if (document.getElementById(cue_id).dataset.type == "Video") {
        playing_video = "";
    }
    document.getElementById(cue_id).classList.remove("success");
    if (selected_id == cue_id) {
        document.getElementById(cue_id).classList.add("info");
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
}

//Add New Cue
function add_cue(src, title, start, end) {
    //show the taskbar and the cue list
    document.getElementById("start").style.display = "none";
    document.getElementById("taskbar").style.display = "block";
    document.getElementById("cue_list_div").style.display = "block";
    src = src.replace(/\\/g, "/");
    //now detect the cue type - audio or video
    var format = src.split('.').pop().toLowerCase();
    var videos = ["mp4", "ogg", "webm"];
    if (videos.indexOf(format) >= 0) {
        var type = "Video";
    }
    else {
        var type = "Audio";
    }
    var request = new XMLHttpRequest();
    request.open('GET', src, true);
    // Decode asynchronously
    request.onload = function() {
        //the file exists
        var cue = {
            cue_id: cue_id,
            src: src,
            type: type,
            playing: false,
            faded: false,
            audio_object: null
        };
        //push it to the main array
        cues[cue_id] = cue;
        
        //add to the table
        var cue_list = document.getElementById("cue_list_body");
        var cue_row = cue_list.insertRow(-1);
        cue_row.setAttribute("id", cue_id);
        cue_row.setAttribute("class", "cue");
        //format duration
        var duration = "-";
        title = title.replace(/\\/g, "/");
        var n = title.lastIndexOf('/');
        var result = title.substring(n + 1);
        title = result.replace(/\.[^/.]+$/, "");
        var delete_id = cue_id + "_delete";
        var drag_id = cue_id + "_drag";
        var inline_controls = "<i title='Delete cue' id='"+delete_id+"' class='fa fa-trash delete' aria-hidden='true'></i>&nbsp;&nbsp;<i id='"+drag_id+"' dragable='true' ondragstart='set_drag(event)' title='Drag to reorder cue' class='fa fa-bars order' aria-hidden='true'></i>";
        var position = "00:00";
        //todo replace this
        var cue_num = $('#cue_list >tbody >tr').length;
        if (start == "") {
            start = "00:00";
        }
        var remaining = "00:00";
        var elements = [cue_num, title, type, duration, position, remaining, start, end, "Unloaded", inline_controls];
        for (var y = 0; y < elements.length; ++y) {
            //add cell and create text
            var cell = cue_row.insertCell(y);
            var name = "";
            if (y == 0) {
                name = "num";
            }
            else if (y == 1) {
                name = "title";
            }
            else if (y == 2) {
                name = "type";
            }
            else if (y == 3) {
                name = "duration";
            }
            else if (y == 4) {
                name = "position";
            }
            else if (y == 5) {
                name = "remaining";
            }
            else if (y == 6) {
                name = "start";
            }
            else if (y == 7) {
                name = "end";
            }
            else if (y == 8) {
                name = "status";
            }
            else if (y == 9) {
                name = "inline_controls";
            }
            var cell_id = cue_id + "_" + name;
            cell.setAttribute("id", cell_id);
            cell.setAttribute("class", name);
            cell.innerHTML = elements[y];
            if (y != 9) {
                document.getElementById(cell_id).addEventListener("click", function() {
                    select_cue(this.parentNode.id);
                });
            }
        }
        //add the event listeners
        document.getElementById(delete_id).addEventListener("click", function() {
            delete_confirm(this.parentNode.parentNode.id);
        });
        document.getElementById(cue_id).addEventListener("drop", function() {
            drop_row(event);
        });
        document.getElementById(cue_id).addEventListener("dragover", function() {
            allow_drop(event);
        });
        
        //increase the cue number
        cue_id += 1;
    }
    //todo handle error
    request.send();
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

// Set up the controls for the user
function set_controls(row_id) {
    var fire = document.getElementById("go");
    var fade = document.getElementById("fade");
    var cue_object = cues[row_id];
    
    //disable button if sound is already playing
    if(cue_object.playing == true) {
        fire.disabled = true;
        fire.style.display = "none";
        fade.style.display = "block";
        fade.disabled = false;
        document.getElementById("stop").disabled = false;
        document.getElementById("pause").disabled = false;
    } else {
        fire.disabled = false;
        fire.style.display = "block";
        fade.style.display = "none";
        fade.disabled = true;
    }
    
    //set up start and end inputs
    var cell_id = row_id + "_";
    var status_id = cell_id + "status";
    document.getElementById(status_id).innerHTML = "Ready";
    var start_id = cell_id + "start";
    var start_time = document.getElementById(start_id).innerHTML;
    start_time = start_time.split(":");
    var seconds = (60 * parseFloat(start_time[0])) + parseFloat(start_time[1]);
    document.getElementById("start_minute").value = start_time[0];
    document.getElementById("start_second").value = start_time[1];
    var end_id = cell_id + "end";
    var end_time = document.getElementById(end_id).innerHTML;
    
    //reset the slider
    document.getElementById("time-slider").value = 0;
    
    if (end_time != "End") {
        end_time = end_time.split(":");
        //set up the start and end controls
        document.getElementById("end_minute").value = end_time[0];
        document.getElementById("end_second").value = end_time[1];
        if (locked == false) {
            document.getElementById("end_minute").disabled = false;
            document.getElementById("end_second").disabled = false;
        }
    } else {
        if (locked == false) {
            document.getElementById("end_minute").disabled = true;
            document.getElementById("end_second").disabled = true;
        }
    }
    //add row details to taskbar
    var title_id = cell_id + "title";
    document.getElementById("cue_name").value = document.getElementById(title_id).innerHTML;
}

//Select a Cue
function select_cue(row_id) {
    if (row_id != "") {
        //get the object
        //pass in id of row to select it
        if (selected_cue !== undefined && selected_cue != "") {
            selected_cue.classList.remove("cue_selected");
            selected_cue.classList.remove("info");
        }
        
        selected_cue = document.getElementById(row_id);
        selected_id = row_id;
        selected_cue.classList.add("cue_selected");
        selected_cue.classList.add("info");

        var cue_object = cues[row_id];
        
        if (cue_object.type == "Audio") {
            //see if already has an object
            if (cue_object.audio_object == null) {
                var source = new Audio();
                source.src = cue_object.src;
                cues[row_id]["audio_object"] = source;
                set_controls(row_id)
            } else {
                set_controls(row_id);
            }
        }
    }
}

//Play It
function fire_cue() {
    var cue_id = selected_id;
    var cue_object = cues[cue_id];
    var cell_id = cue_id + "_";
    if (cue_object.type == "Audio") {
        cue_object.audio_object.play();
    } else {
        var volume_id = cell_id + "volume";
        cue_volume = (parseFloat(document.getElementById(volume_id).innerHTML.replace("%", ""))) / 100;
        var external = remote.getGlobal('external');
        external.webContents.send('message', {command: "play", src: selected_video_source, cue_id: cue_id, volume: cue_volume});
        playing_video = cue_id;
    }
    cues[cue_id].playing = true;
    selected_cue.classList.add("success");
    selected_cue.classList.remove("danger");
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

//reset buttons back to the normal state
function reset_cue_buttons(cue_id) {
    document.getElementById("go").disabled = false;
    document.getElementById("go").style.display = "block";
    document.getElementById("fade").style.display = "none";
    document.getElementById("fade").disabled = false;
    document.getElementById(cue_id).classList.add("info");
}

//Handle the event once the cue has stopped
function stopped_cue(cue_id) {
    var cue_object = cues[cue_id];
    cues[cue_id].playing = false;
    selected_cue.classList.remove("success");
    selected_cue.classList.remove("danger");
    var cell_id = cue_id + "_";
    var status_id = cell_id + "status";
    if (cue_id == selected_id) {
        reset_cue_buttons(cue_id);
        document.getElementById("stop").disabled = true;
        document.getElementById("pause").disabled = true;
        document.getElementById(status_id).innerHTML = "Ready";
    } else {
        document.getElementById(status_id).innerHTML = "Unloaded";
    }
}

//Stop it
function stop_cue() {
    var cue_id = selected_id;
    var cue_object = cues[cue_id];
    if (cue_object.type == "Audio") {
        cue_object.audio_object.pause();
        cue_object.audio_object.currentTime = 0;
    } else {
        //todo stop video
    }
    stopped_cue(cue_id);
}

//Pause It
function pause_cue() {
    var cue_id = selected_id;
    var cue_object = cues[cue_id];
    cues[cue_id].playing = false;
    if (cue_object.type == "Audio") {
        cue_object.audio_object.pause();
    } else {
        //todo stop video
    }
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
    document.getElementById("fade").disabled = true;
    var cue_to_fade = document.getElementById(cue_id);
    cue_to_fade.classList.remove("success");
    cue_to_fade.classList.add("warning");
    var cell_id = cue_id + "_";
    var status_id = cell_id + "status";
    document.getElementById(status_id).innerHTML = "Fading";
    if (cues[cue_id].type == "Audio") {
        var cue_object = cues[cue_id];
        var fade_audio = setInterval(function () {

            // Only fade if not at zero already
            if (cue_object.audio_object.volume != 0.0) {
                cue_object.audio_object.volume -= 0.02;
            }
            // When volume at zero stop all the intervalling
            if (cue_object.audio_object.volume <= 0.02) {
                clearInterval(fade_audio);
                cue_object.audio_object.pause();
                cue_object.audio_object.currentTime = 0;
                cue_object.audio_object.volume = 1;
                cues[cue_id].faded = true;
            }
        }, 50);
    }
    else {
        var external = remote.getGlobal('external');
        external.webContents.send('message', {command: "fade"});
    }
    setTimeout(function() {
        cue_to_fade.classList.remove("warning");
    }, 5000);
}

function delete_cue(cue_id) {
    if (cue_id != "") {
        //find the id
        if (cues[cue_id].type == "Audio") {
            //delete the audio
            delete cues[cue_id];
        }
        else {
            selected_video_source = "";
        }
        document.getElementById(cue_id).remove();
        selected_cue = "";
        selected_id = "";
        var rowCount = document.getElementsByClassName("cue").length;
        if (rowCount > 0) {
            var new_cue_id = document.getElementsByClassName("cue")[0].id;
            select_cue(new_cue_id);
            renumber();
            show_message("Cue deleted successfully.");
        } else {
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

function update_time() {
    var time = document.getElementById("time-slider").value;
    cues[selected_id].audio_object.currentTime = time;
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

function toggle_lock() {
    show_message("Show Modification Toggled");
    var drags = document.getElementsByClassName("order");
    var deletes = document.getElementsByClassName("delete");
    var inputs = document.getElementsByTagName("input");
    if (locked == true) {
        locked = false;
        document.getElementById("toggle_lock").innerHTML = "Disable Modification";
        document.getElementById("locked").style.display = "none";
        document.getElementById("unlocked").style.display = "inline";
        for (var i = 0; i < inputs.length; i++) {
            if (inputs[i].type === 'text' || inputs[i].type === 'number' || inputs[i].type === 'file') {
                inputs[i].disabled = false;
            }
        }
        //show the dragability
        if (drags.length > 0) {
            for (var i = 0; i < drags.length; i++) {
                drags[i].style.display = "inline";
                deletes[i].style.display = "inline";
            }
        }
    } else {
        //locking
        locked = true;
        document.getElementById("toggle_lock").innerHTML = "Enable Modification";
        document.getElementById("locked").style.display = "inline";
        document.getElementById("unlocked").style.display = "none";
        for (var i = 0; i < inputs.length; i++) {
            if (inputs[i].type === 'text' || inputs[i].type === 'number' || inputs[i].type === 'file') {
                inputs[i].disabled = true;
            }
        }
        //disable the dragability
        if (drags.length > 0) {
            for (var i = 0; i < drags.length; i++) {
                drags[i].style.display = "none";
                deletes[i].style.display = "none";
            }
        }
    }
}

//Empty the list Cue Import
function empty_list() {
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
        show_message("Show modificiation is disabled.")
    }
}

// Trigger the Cue Import
function cue_import_trigger() {
    if (locked == false) {
        document.getElementById("cue_import_file").click();
    }
    else {
        show_message("Show modificiation is disabled.")
    }
}

// Trigger the Show Import
function show_import_trigger() {
    if (locked == false) {
        document.getElementById("show_import_file").click();
    }
    else {
        show_message("Show modificiation is disabled.")
    }
}

// ** EVENT LISTENERS **

//detect change in name
$('#cue_name').bind('input', function() {
    var name_id = selected_id + "_title";
    document.getElementById(name_id).innerHTML = document.getElementById("cue_name").value;
});

// file selected
$("#cue_import_file").change(function(){
    var cue = $('#cue_import_file')[0].files[0];
    $('#cue_import_file').val("");
    add_cue(cue.path, cue.path, "", "End");
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
                show_message("Invalid File - Not a Q Show Library");
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
                    add_cue(cue.src, cue.title, cue.start, cue.end);
                }, x);
                x += 300;
            });
        },
        error: function() {
            show_message("Unable to find show file");
        }
    });
});

//Button Event Listeners

//Import Buttons
document.getElementById("cue_import_button").addEventListener("click", cue_import_trigger);
document.getElementById("start_cue_import_button").addEventListener("click", function() {document.getElementById("cue_import_file").click();});

document.getElementById("show_import_button").addEventListener("click", show_import_trigger);
document.getElementById("start_show_import_button").addEventListener("click", function() {document.getElementById("show_import_file").click();});

//Menu Buttons
document.getElementById("empty_list").addEventListener("click", empty_list);
//document.getElementById("enable_video").addEventListener("click", external_screen);
document.getElementById("save_show_button").addEventListener("click", save_file);
document.getElementById("toggle_lock").addEventListener("click", toggle_lock);

//Control Buttons
document.getElementById("go").addEventListener("click", fire_cue);
document.getElementById("fade").addEventListener("click", function() {fade_cue(selected_id);});
document.getElementById("pause").addEventListener("click", pause_cue);
document.getElementById("stop").addEventListener("click", stop_cue);
document.getElementById("play").addEventListener("click", fire_cue);
document.getElementById("time-slider").addEventListener("input", update_time);
document.getElementById("start_minute").addEventListener("input", update_start);
document.getElementById("start_second").addEventListener("input", update_start);
document.getElementById("end_minute").addEventListener("input", update_end);
document.getElementById("end_second").addEventListener("input", update_end);

//Listen for IPC Messages
//Listen For Message
ipcRenderer.on ('message', (event, message) => {
    if (message.data == "stopping") {
        stopping(message.cue_id);
    }
});