//MAIN JS FOR APP
//Copyright Ben Constable 2017

//Call In Depndcies
const {dialog} = require('electron').remote;
var fs = require('fs');

// ** VARIABLES **
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
    var rowCount = $('#cue_list >tbody >tr').length;
    for (var i = 1; i <= rowCount; i++) {
        var time = howl_objects[i][0].seek();
        var cell_id = i + "_";
        var position_id = cell_id + "position";
        var minutes = Math.floor(time / 60);
        minutes = pad(minutes, 2);
        var seconds = (time - minutes * 60).toFixed(0)
        seconds = pad(seconds, 2);
        seek_sec = minutes + ":" + seconds;
        if (isNaN(seconds)) {
            seek_sec = "00:00";
        }
        document.getElementById(position_id).innerHTML = seek_sec; 
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
        var alertHtml = "<div id='message' class='alert alert-success alert-dismissible' role='alert' style='display:none'><button type='button' class='close' data-dismiss='message' aria-label='Close'><span aria-hidden='true'>&times;</span></button><strong>Message</strong> <span id='messagecontent'></span></div>"
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
        var title_id = row.id + "_title";
        cue_json.title = document.getElementById(title_id).innerHTML;
        cue_json.volume = howl._volume;
        cue_json.rate = howl._rate;
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

//Add New Cue
function add_cue(src, title, volume, rate) {
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
        console.log(howl_objects[num_cues][0]);
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
            minutes = pad(minutes, 2);
            var seconds = (duration - minutes * 60).toFixed(0);
            seconds = pad(seconds, 2);
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
        var result = title.substring(n + 1);
        title = result.replace(/\.[^/.]+$/, "");
        var status = "Loading...";
        var duration = "Calculating...";
        var controls = "Controls";
        var position = "00:00";
        volume = (volume * 100);
        volume = volume + "%";
        rate = (rate * 100);
        rate = rate + "%";
        var cue_num = $('#cue_list >tbody >tr').length;
        var start = "00:00";
        var end = "00:00";
        var elements = [cue_num, title, duration, position, start, end, volume, rate, status, controls];
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
                name = "start";
            }
            else if (y == 5) {
                name = "end";
            }
            else if (y == 6) {
                name = "volume";
            }
            else if (y == 7) {
                name = "rate";
            }
            else if (y == 8) {
                name = "status";
            }
            var cell_id = cue_id + "_" + name;
            cell.setAttribute("id", cell_id);
            cell.innerHTML = elements[y];
        }
        document.getElementById(cue_id).addEventListener("click", function() {
            select_cue(cue_id);
        });
    });
    request.fail(function(jqXHR, textStatus, errorThrown) {
        var error = "Unable to load file - " + src;
        show_alert(error);
    });
}

function renumber() {
    console.log("Renumbering Cues");
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

//detect change in name
$('#cue_name').bind('input', function() {
    var name_id = selected_id + "_title";
    document.getElementById(name_id).innerHTML = $('#cue_name').val();
});

//Button Event Listeners

$("#go").click(function(){
    fire_cue();
});

$("#fade").click(function(){
    fade_cue();
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

$("#cue_delete_button").click(function(){
    if (selected_id != "") {
        //find the id
        document.getElementById(selected_id).remove();
        //delete the howler
        howl_objects[selected_id][0].unload();
        delete howl_objects[selected_id];
        //select another cue
        selected_howler = "";
        selected_cue = "";
        selected_id = "";
        var new_cue_id = $("#cue_list").find(' tbody tr:first').attr('id');
        var rowCount = $('#cue_list >tbody >tr').length;
        if (rowCount > 0) {
            select_cue(new_cue_id);
            renumber();
        }
        else {
            //hide the taskbar and the cue list
            document.getElementById("start").style.display = "block";
            document.getElementById("taskbar").style.display = "none";
            document.getElementById("cue_list_div").style.display = "none";
        }
    }
});

// Open file selector on div click
$("#cue_import_button").click(function(){
    $("#cue_import_file").click();
});

$("#start_cue_import_button").click(function(){
    $("#cue_import_file").click();
});

$("#save_show_button").click(function(){
    save_file();
});

$("#show_import_button").click(function(){
    $("#show_import_file").click();
});

$("#start_show_import_button").click(function(){
    $("#show_import_file").click();
});

// file selected
$("#cue_import_file").change(function(){
    var cue = $('#cue_import_file')[0].files[0];
    $('#cue_import_file').val("");
    add_cue(cue.path, cue.path, 1, 1);
});

// file selected
$("#show_import_file").change(function(){
    var show = $('#show_import_file')[0].files[0];
    $('#show_import_file').val("");
    document.getElementById("cue_list_body").innerHTML = "";
    //add a random string to prevent howler.js confusion
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
                console.log(cue.title);
                setTimeout(function() {
                    add_cue(cue.src, cue.title, cue.volume, cue.rate);
                }, x);
                x += 300;
            });
        }
    });
});