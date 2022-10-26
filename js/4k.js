"use strict";

var notes_mode = 0;
var chart_info = {
    bpm: 60
};

function makeChart(){

}

function changeNotesMode(mode){
    notes_mode = mode;
    var children = Array.from(document.getElementById('select_notes_submenu').children).slice(1);
    children = children.concat(Array.from(document.getElementById('tool_notes_submenu').children).slice(1));
    Array.from(children).forEach(function(element, index){
        element.style.backgroundColor = '';
        if(index == notes_mode){
            element.style.backgroundColor = 'skyblue';
        }
    });
}

function openDialog(){
    document.getElementById('info_dialog').style.visibility = 'visible';
}

function closeDialog(){
    document.getElementById('info_dialog').style.visibility = 'hidden';
}

function autocompBPM(){
    detectBPM(ogg_source, 1).then(
        function(detected){
            console.log("解析完了\nBPM:" + detected.tempo[0].tempo + "\n信頼度:" + detected.tempo[0].accuracy*100 + "%");
            alert("解析完了\nBPM:" + detected.tempo[0].tempo + "\n信頼度:" + Math.round(detected.tempo[0].accuracy*10000)/100 + "%");
            document.getElementById('bpm').value = detected.tempo[0].tempo;
            chart_info.tempo = document.getElementById('bpm').value;
        }
    );
}