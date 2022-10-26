"use strict";

var ogg_source
var ogg_reader = new FileReader();
var ogg = new window.AudioContext();

const elm_body = document.getElementById('body');
const elm_index = document.getElementById('index');
const elm_4k = document.getElementById('4k');
const elm_oggfile_drop = document.getElementById('oggfile_drop');
const elm_oggfile_input = document.getElementById('oggfile_input');

ogg_reader.onload = function(){
    ogg.decodeAudioData(ogg_reader.result, function(buffer){
        if(ogg_source){
            ogg_source.stop();
        }
        ogg_source = ogg.createBufferSource();
        ogg_source.buffer = buffer;
        ogg_source.connect(ogg.destination);
        ogg_source.start(0);
    });
}

elm_oggfile_drop.addEventListener('dragover', 
    function(evt){
        evt.preventDefault();
        evt.dataTransfer.dropEffect = 'copy';
    }
);

elm_oggfile_drop.addEventListener('drop',
    function(evt){
        evt.stopPropagation();
        evt.preventDefault();
        var file = evt.dataTransfer.files[0];
        ogg_reader.readAsArrayBuffer(file);
        changePage('4k');
    }
, false);

elm_oggfile_input.addEventListener('change',
    function(){
        ogg_reader.readAsArrayBuffer(this.files[0]);
        changePage('4k');
    }
);

function changePage(page){
    Array.from(elm_body.children).forEach(element => {
        element.style.display = 'none';
    });
    switch(page){
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