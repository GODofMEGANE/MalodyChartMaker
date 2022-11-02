"use strict";

let notes_elm_id = 0;
let elm_bpm = document.getElementById('bpm');
let elm_chart_start = document.getElementById('chart_start');
let elm_start = [
    document.getElementById('start-0'),
    document.getElementById('start-1'),
    document.getElementById('start-2'),
    document.getElementById('start-3')
]

let notes_mode = 0;
let magnification = 1.0;
let max_row;
let split = 4;
let grid_height;
let longnote_place = {
    beat: -1,
    column: -1,
    split: -1
};
let chart_info = {
    bpm: 60,
    notes: []
};

//グリッド含め全ノーツを描画する
function makeChart() {
    return new Promise(function (resolve, reject) {
        if (magnification <= 0 || split <= 0) {
            reject();
        }
        Array.from(document.getElementsByClassName('grid_row')).forEach((element) => {
            element.remove();
        });
        Array.from(document.getElementsByClassName('start')).forEach((element) => {
            Array.from(element.children).forEach((note) => {
                note.remove();
            })
        });
        grid_height = 60 / split * magnification;
        max_row = Math.ceil(ogg_source.buffer.duration / (60 / chart_info.bpm * 4 / split) / split) * split;
        for (let row = 0; row < max_row; row++) {
            let chart_grid_row = document.createElement('div');
            chart_grid_row.className = 'grid_row row' + (max_row - row - 1);
            chart_grid_row.style.height = grid_height + 'vh';
            elm_chart_start.before(chart_grid_row);
            for (let column = 0; column < 4; column++) {
                let chart_grid = document.createElement('div');
                chart_grid.className = 'grid row' + (max_row - row - 1) + ' column' + column;
                chart_grid.style.height = grid_height + 'vh';
                if ((max_row - row - 1) % split == 0) chart_grid.innerHTML = '<hr width="100%" size="3" noshade="" color="black">';
                else chart_grid.innerHTML = '<hr width="100%" size="1" noshade="" color="lightgray">';
                const placeNotesOnclick = (note_row, note_col) => {
                    placeNote(note_row, note_col);
                }
                chart_grid.onclick = () => placeNotesOnclick(max_row - row - 1, column);
                chart_grid_row.appendChild(chart_grid);
            }
        }
        readNotesData();
        resolve();
    });
}

//chart_info.notesにある全ノーツを参照し描画する
function readNotesData() {
    chart_info.notes.forEach((element) => {
        displayNote(element);
    });
}

//divをクリックした際の動作
function placeNote(row, column) {
    let location_classname = 'row' + row + ' column' + column;
    if (notes_mode == 0 && selectNote(row, column, split).id == 0) {
        let note_info = reduction({
            id: notes_elm_id,
            type: 1,
            column: column,
            beat: row,
            split: split
        })
        notes_elm_id++;
        chart_info.notes.push(note_info);
        displayNote(note_info);
    }
    else if (notes_mode == 1) {
        if (longnote_place.column != column) {
            longnote_place = reduction({
                beat: row,
                column: column,
                split: split
            });
        }
        else {
            let note_info = reduction({
                id: notes_elm_id,
                type: 2,
                column: column,
                beat: Math.min(row * longnote_place.split, longnote_place.beat * split),
                split: split * longnote_place.split,
                length: Math.max(row * longnote_place.split, longnote_place.beat * split) - Math.min(row * longnote_place.split, longnote_place.beat * split)
            })
            console.log(note_info);
            notes_elm_id++;
            chart_info.notes.push(note_info);
            displayNote(note_info);
            longnote_place = {
                beat: -1,
                column: -1,
                split: -1
            };
        }
    }
    else if (notes_mode == 2) {
        if (selectNote(row, column, split).type == 1) {
            let note = document.getElementsByClassName('note ' + location_classname)[0];
            deleteNote(note.id);
        }
        else if (selectNote(row, column, split).type == 2) {
            let long = document.getElementsByClassName('long ' + location_classname)[0];
            deleteNote(long.id);
        }
    }
}

//row, column, splitの情報からノーツを返す
function selectNote(row, column, split) {
    let answer = {
        id: -1
    };
    let note_check = reduction({
        column: column,
        beat: row,
        split: split
    });
    chart_info.notes.forEach((element) => {
        if (element.column == note_check.column && element.beat == note_check.beat && element.split == note_check.split) {
            answer = element;
        }
    });
    return answer;
}

//idから譜面データを削除し描画に反映させる
function deleteNote(id) {
    chart_info.notes.forEach((element, index) => {
        if (element.id == id) {
            chart_info.notes.splice(index, 1);
        }
    });
    document.getElementById(id).remove();
}

//引数のノーツに従って描画する
function displayNote(note_info) {
    let note = document.createElement('div');
    let row = note_info.beat / note_info.split * split;
    let location_classname = 'row' + row + ' column' + note_info.column;
    let ongrid = false;
    if (row == Math.floor(row)) {
        ongrid = true;
    }
    switch (note_info.type) {
        case 1:
            note.id = note_info.id;
            if (ongrid) note.className = 'note ' + location_classname;
            else note.className = 'note';
            note.style.bottom = (grid_height * (row + 0.5)) + 'vh';
            let placeNotesOnclick = (id) => {
                clickNote(id);
            }
            note.onclick = () => placeNotesOnclick(notes_elm_id);
            elm_start[note_info.column].appendChild(note);
            break;
        case 2:
            console.log(note_info);
            if (row == Math.floor(row)) {
                ongrid = true;
            }
            note.id = note_info.id;
            if (ongrid) note.className = 'long ' + location_classname;
            else note.className = 'long';
            note.style.bottom = (grid_height * (row + 0.5)) + 'vh';
            let placeLongsOnclick = (id) => {
                clickNote(id);
            }
            note.onclick = () => placeLongsOnclick(notes_elm_id);
            elm_start[note_info.column].appendChild(note);
            //ロングノーツの中間部分
            let length = note_info.length / note_info.split * split;
            let bridge = document.createElement('div');
            bridge.className = 'bridge';
            bridge.style.height = (grid_height * (length + 0.5)) + 'vh';
            bridge.style.bottom = (grid_height * (row + 0.5)) + 'vh';
            bridge.onclick = () => placeLongsOnclick(notes_elm_id);
            elm_start[note_info.column].appendChild(bridge);
            break;
    }
}

//描画されたノーツをクリックした際に発火
function clickNote(id) {
    chart_info.notes.forEach((element) => {
        if (element.id == id) {
            if (notes_mode == 2) {
                deleteNote(id);
            }
        }
    });
}

function changeNotesMode(mode) {
    notes_mode = mode;
    let children = Array.from(document.getElementById('select_notes_submenu').children).slice(1);
    children = children.concat(Array.from(document.getElementById('tool_notes_submenu').children).slice(1));
    Array.from(children).forEach(function (element, index) {
        element.style.backgroundColor = '';
        if (index == notes_mode) {
            element.style.backgroundColor = 'skyblue';
        }
    });
}

function openDialog() {
    let dialog = document.getElementById('info_dialog');
    dialog.style.visibility = 'visible';
    dialog.style.opacity = 1.0;

}

function closeDialog() {
    let dialog = document.getElementById('info_dialog');
    dialog.style.visibility = 'hidden';
    dialog.style.opacity = 0.0;
}

function autocompBPM() {
    detectBPM(ogg_source, 1).then(
        function (detected) {
            console.log("解析完了\nBPM:" + detected.tempo[0].tempo + "\n信頼度:" + detected.tempo[0].accuracy * 100 + "%");
            alert("解析完了\nBPM:" + detected.tempo[0].tempo + "\n信頼度:" + Math.round(detected.tempo[0].accuracy * 10000) / 100 + "%");
            elm_bpm.value = detected.tempo[0].tempo;
            chart_info.tempo = detected.tempo[0].tempo;
            makeChart();
        }
    );
}

elm_bpm.addEventListener('change', (event) => {
    onLoading();
    chart_info.tempo = elm_bpm.value;
    makeChart();
    onLoaded();
});