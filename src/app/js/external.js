const { remote, ipcRenderer } = require ('electron');

var video = document.getElementById("external_video");

//Listen For Message
ipcRenderer.on ('message', (event, message) => {
    if (message.command == "play") {
        video.src = message.src;
        video.load();
        video.volume = message.volume;
        video.play();
        video.dataset.cue_id = message.cue_id;
    }
    else if (message.command == "volume") {
        video.volume = message.volume;
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
    //send message to render saying fade complete
    var controller = remote.getGlobal('controller');
    console.log(video.dataset.cue_id);
    controller.webContents.send('message', {data: "stopping", cue_id: video.dataset.cue_id});
    //Now fade out
    $("#external_video").fadeOut(5000, function() {
        video.src = "";
        video.load();
        $("#external_video").fadeIn();
    });
};

