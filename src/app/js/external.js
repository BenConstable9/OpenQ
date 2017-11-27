const { remote, ipcRenderer } = require ('electron');

var video = document.getElementById("external_video");
var cue_id = "";

//Listen For Message
ipcRenderer.on ('message', (event, message) => {
    cue_id = message.cue_id;
    if (message.command == "play") {
        console.log(message);
        video.src = message.src;
        video.load();
        video.play();
    }
    else if (message.command == "fade") {
        $("#external_video").fadeOut(5000, function() {
            //send message to render saying fade complete
            video.src = "";
            video.load();
            $("#external_video").fadeIn();
        });
    }
});

video.onended = function() {
    $("#external_video").fadeOut(5000, function() {
        //send message to render saying fade complete
        video.src = "";
        video.load();
        $("#external_video").fadeIn();
    });
};

