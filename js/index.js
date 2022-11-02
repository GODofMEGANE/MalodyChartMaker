"use strict";

let ogg_source;
let ogg_reader = new FileReader();
let ogg_blob;
let ogg = new window.AudioContext();

const elm_body = document.getElementById('body');
const elm_index = document.getElementById('index');
const elm_4k = document.getElementById('4k');
const elm_oggfile_drop = document.getElementById('oggfile_drop');
const elm_oggfile_input = document.getElementById('oggfile_input');

ogg_reader.onload = function () {
    onLoading();
    ogg.decodeAudioData(ogg_reader.result, function (buffer) {
        if (ogg_source) {
            ogg_source.stop();
        }
        ogg_source = ogg.createBufferSource();
        ogg_source.buffer = buffer;
        ogg_source.connect(ogg.destination);
        detectBPM(ogg_source, 1).then(function(detected){
            chart_info.bpm = detected.tempo[0].tempo;
            chart_info.offset = detected.offset;
            elm_bpm.value = detected.tempo[0].tempo;
            console.log("解析完了\nBPM:" + detected.tempo[0].tempo + "\n信頼度:" + detected.tempo[0].accuracy * 100 + "%\nOFFSET:" + detected.offset);
            makeChart().then(function(){
                location.hash = "chart_start";
                console.log("Loading Complete");
                onLoaded();
            });
        })
        //ogg_source.start(0);
    });
}

elm_oggfile_drop.addEventListener('dragover',
    function (evt) {
        evt.preventDefault();
        evt.dataTransfer.dropEffect = 'copy';
    }
);

elm_oggfile_drop.addEventListener('drop',
    function (evt) {
        evt.stopPropagation();
        evt.preventDefault();
        let file = evt.dataTransfer.files[0];
        ogg_blob = file;
        ogg_reader.readAsArrayBuffer(file);
        changePage('4k');
    }
    , false);

elm_oggfile_input.addEventListener('change',
    function () {
        ogg_blob = this.files[0];
        ogg_reader.readAsArrayBuffer(this.files[0]);
        changePage('4k');
    }
);

function changePage(page) {
    Array.from(elm_body.children).forEach(element => {
        if(element.id != 'loading')element.style.display = 'none';
    });
    switch (page) {
        case 'index':
            elm_index.style.display = 'block';
            break;
        case '4k':
            elm_4k.style.display = 'block';
            break;
        default:
            console.error("Invalid page name \"", page, "\"");
            return false;
    }
    return true;
}