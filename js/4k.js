"use strict";

let notes_elm_id = 0;
const elm_bpm = document.getElementById('bpm');
const elm_offset = document.getElementById('offset');
const elm_chart_start = document.getElementById('chart_start');
const elm_start = [
    document.getElementById('start-0'),
    document.getElementById('start-1'),
    document.getElementById('start-2'),
    document.getElementById('start-3')
]
const elm_info_dialog = document.getElementById('info_dialog');
const elm_settings_dialog = document.getElementById('settings_dialog');

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
let selected_place = {
    beat: -1,
    column: -1,
    split: -1
};
let time = new Date();
let chart_info = {
    bpm: 60,
    offset: 0,
    creator: "",
    version: "",
    id: 0,
    mode: 0,
    time: time.getTime(),
    song: {
        title: "",
        artist: "",
        id: 0
    },
    mode_ext: {
        column: 4,
        bar_begin: 0
    },
    notes: []
};

let selected_notes = {
    start: {},
    notes: []
};
let before_painted = {
    start_row: -1,
    start_column: -1,
    end_row: -1,
    end_column: -1
};
const SPLIT_VALUE = [2, 3, 4, 6, 8, 12, 16, 24, 32];
let split_value_index = 2;

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
                chart_grid.onclick = () => clickDiv(max_row - row - 1, column);
                chart_grid.addEventListener('mouseover', () => hoverGrid(max_row - row - 1, column));
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
function clickDiv(row, column) {
    let location_classname = 'row' + row + ' column' + column;
    if (notes_mode == 0 && selectNote(row, column, split).id == -1) {
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
    else if (notes_mode == 1 && selectNote(row, column, split).id == -1) {
        if (longnote_place.column != column) {
            longnote_place = reduction({
                beat: row,
                column: column,
                split: split
            });
        }
        else if(longnote_place.beat * split != row * longnote_place.split){
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
    else if (notes_mode == 2 && selectNote(row, column, split).id != -1) {
        if (selectNote(row, column, split).type == 1) {
            let note = document.getElementsByClassName('note ' + location_classname)[0];
            deleteNote(note.id);
        }
        else if (selectNote(row, column, split).type == 2) {
            let long = document.getElementsByClassName('long ' + location_classname)[0];
            deleteNote(long.id);
        }
    }
    else if (notes_mode == 3) {
        if (selected_place.beat == -1) {
            selected_place = reduction({
                beat: row,
                column: column,
                split: split
            });
        }
        else {
            selected_notes.start = selected_place;
            selected_notes.notes = selectNotes(selected_place.beat, selected_place.column, selected_place.split, row, column, split);
            console.log(selected_notes);
            selected_place = {
                beat: -1,
                column: -1,
                split: -1
            };
            if (before_painted.start_row != -1) {
                paintGrids(before_painted.start_row, before_painted.start_column, before_painted.end_row, before_painted.end_column);
            }
            popup("コピー完了!", 1, 1);
        }
    }
    else if (notes_mode == 4) {
        pasteNotes(selected_notes, { beat: row, column: column, split: split });
    }
}

//row, column, splitの情報からノーツを返す
function selectNote(row, column, arg_split) {
    let answer = {
        id: -1
    };
    let note_check = reduction({
        column: column,
        beat: row,
        split: arg_split
    });
    chart_info.notes.forEach((element) => {
        if (element.column == note_check.column && element.beat == note_check.beat && element.split == note_check.split) {
            answer = element;
            return answer;
        }
        if (element.column == note_check.column && element.type == 2) {
            let long_start = element.beat * note_check.split;
            let long_end = long_start + element.length * note_check.split;
            let check_beat = note_check.beat * element.split;
            if (isContain(check_beat, long_start, long_end)) {
                answer = element;
                return answer;
            }
        }
    });
    return answer;
}

//2組のrow, column, splitの情報から範囲に含まれるノーツの配列を返す
function selectNotes(start_row, start_column, start_arg_split, end_row, end_column, end_arg_split) {
    let answer = [];
    let start_check;
    let end_check;
    if (start_row * end_arg_split < end_row * start_arg_split) {
        start_check = reduction({
            column: Math.min(start_column, end_column),
            beat: start_row,
            split: start_arg_split
        });
        end_check = reduction({
            column: Math.max(start_column, end_column),
            beat: end_row,
            split: end_arg_split
        });
    }
    else {
        start_check = reduction({
            column: Math.min(start_column, end_column),
            beat: end_row,
            split: end_arg_split
        });
        end_check = reduction({
            column: Math.max(start_column, end_column),
            beat: start_row,
            split: start_arg_split
        });
    }
    chart_info.notes.forEach((element) => {
        if (isContain(element.beat * start_check.split / element.split, start_check.beat, end_check.beat) && isContain(element.column, start_check.column, end_check.column)) {
            answer.push(element);
        }
        if (isContain(element.column, start_check.column, end_check.column) && element.type == 2) {
            let long_end = start_check + element.length * start_check.split;
            if (isContain(long_end * start_check.split / element.split, start_check.beat, end_check.beat)) {
                answer.push(element);
            }
            else if (long_end * start_check.split / element.split > end_check.beat && element.beat * start_check.split / element.split < start_check.beat) {
                answer.push(element);
            }
        }
    });
    return answer;
}

//idから譜面データを削除し描画に反映させる
function deleteNote(id) {
    try {
        let note_type = -1;
        chart_info.notes.forEach((element, index) => {
            if (element.id == id) {
                note_type = element.type;
                chart_info.notes.splice(index, 1);
            }
        });
        if (note_type == 2) {
            document.getElementById('b' + id).remove();
        }
        document.getElementById(id).remove();
    } catch (e) {
        console.error(e);
        console.error("argument id:" + toString(id));
    }
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
            note.onclick = () => clickNote(note_info.id);
            note.addEventListener('mouseover', () => hoverNote(note_info));
            elm_start[note_info.column].appendChild(note);
            break;
        case 2:
            if (row == Math.floor(row)) {
                ongrid = true;
            }
            note.id = note_info.id;
            if (ongrid) note.className = 'long ' + location_classname;
            else note.className = 'long';
            note.style.bottom = (grid_height * (row + 0.5)) + 'vh';
            note.onclick = () => clickNote(note_info.id);
            note.addEventListener('mouseover', () => hoverNote(note_info));
            elm_start[note_info.column].appendChild(note);
            //ロングノーツの中間部分
            let length = note_info.length / note_info.split * split;
            let bridge = document.createElement('div');
            bridge.id = 'b' + note_info.id;
            bridge.className = 'bridge';
            bridge.style.height = (grid_height * length) + 'vh';
            bridge.style.bottom = (grid_height * (row + 0.5)) + 'vh';
            bridge.onclick = () => clickNote(note_info.id);
            bridge.addEventListener('mouseover', () => hoverNote(note_info));
            elm_start[note_info.column].appendChild(bridge);
            break;
    }
}

//描画されたノーツをクリックした際に発火
function clickNote(id) {
    let clicked_note;
    chart_info.notes.forEach(function (element) {
        if (element.id == id) {
            clicked_note = element;
            return;
        }
    });
    if (notes_mode == 2) {
        deleteNote(id);
    }
    if (notes_mode == 3) {
        if (selected_place.beat == -1) {
            selected_place = reduction({
                beat: clicked_note.beat,
                column: clicked_note.column,
                split: clicked_note.split
            });
        }
        else {
            selected_notes.start = selected_place;
            selected_notes.notes = selectNotes(selected_place.beat, selected_place.column, selected_place.split, clicked_note.beat, clicked_note.column, clicked_note.split);
            console.log(selected_notes);
            selected_place = {
                beat: -1,
                column: -1,
                split: -1
            };
            if (before_painted.start_row != -1) {
                paintGrids(before_painted.start_row, before_painted.start_column, before_painted.end_row, before_painted.end_column);
            }
            popup("コピー完了!", 1, 1);
        }
    }
    if (notes_mode == 4) {
        pasteNotes(selected_notes, clicked_note);
    }
}

function hoverGrid(row, column) {
    if (before_painted.start_row != -1) {
        paintGrids(before_painted.start_row, before_painted.start_column, before_painted.end_row, before_painted.end_column);
    }
    if (notes_mode == 1) {
        if (longnote_place.column == column) {
            let location = noteToGrid(longnote_place);
            paintGrids(location.row, location.column, row, column, 'palegreen');
            before_painted = {
                start_row: location.row,
                start_column: location.column,
                end_row: row,
                end_column: column
            }
        }
    }
    if (notes_mode == 3) {
        if (selected_place.beat == -1) {
            paintGrids(row, column, row, column, 'palegreen');
            before_painted = {
                start_row: row,
                start_column: column,
                end_row: row,
                end_column: column
            }
        }
        else {
            let location = noteToGrid(selected_place);
            paintGrids(location.row, location.column, row, column, 'palegreen');
            before_painted = {
                start_row: location.row,
                start_column: location.column,
                end_row: row,
                end_column: column
            }
        }
    }
}

function hoverNote(note) {
    if (notes_mode == 1) {
        if (before_painted.start_row != -1) {
            paintGrids(before_painted.start_row, before_painted.start_column, before_painted.end_row, before_painted.end_column);
        }
    }
    if (notes_mode == 3) {
        let location = noteToGrid(note);
        hoverGrid(location.row, location.column);
    }
}

function pasteNotes(copy, place) {
    if (copy.notes.length == 0) {
        alert("ノーツが選択されていません");
    }
    else {
        copy.notes.forEach(function (element) {
            let place_note;
            if (element.type == 1) {
                place_note = reduction({
                    id: notes_elm_id,
                    type: 1,
                    column: place.column + element.column - copy.start.column,
                    beat: place.beat * copy.start.split * element.split + element.beat * place.split * copy.start.split - copy.start.beat * place.split * element.split,
                    split: element.split * copy.start.split * place.split
                });
            }
            else if (element.type == 2) {
                place_note = reduction({
                    id: notes_elm_id,
                    type: 2,
                    column: place.column + element.column - copy.start.column,
                    beat: place.beat * copy.start.split * element.split + element.beat * place.split * copy.start.split - copy.start.beat * place.split * element.split,
                    length: element.length * copy.start.split * place.split,
                    split: element.split * copy.start.split * place.split
                });
            }
            if (place_note.beat < 0 || !isContain(place_note.column, 0, 3) || selectNote(place_note.beat, place_note.column, place_note.split).id != -1) {
                return;
            }
            notes_elm_id++;
            displayNote(place_note);
            chart_info.notes.push(place_note);
        });
    }
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

function noteToGrid(note) {
    let answer = {
        column: note.column,
        row: note.beat * split / note.split
    };
    return answer;
}

function paintGrids(start_row, start_column, end_row, end_column, color = -1) {
    for (let i = Math.min(start_row, end_row); i <= Math.max(start_row, end_row); i++) {
        for (let j = Math.min(start_column, end_column); j <= Math.max(start_column, end_column); j++) {
            let grid = document.getElementsByClassName('grid row' + i + ' column' + j)[0];
            if (color == -1) {
                grid.style.backgroundColor = null;
            }
            else {
                grid.style.backgroundColor = color;
            }
        }
    }
}

function openDialog(dialog_id) {
    if (dialog_id == 0) {
        closeDialog(1);
        elm_info_dialog.showModal();
    }
    if (dialog_id == 1) {
        closeDialog(0);
        elm_settings_dialog.showModal();
    }
}

function closeDialog(dialog_id) {
    if (dialog_id == 0) {
        elm_info_dialog.close();
    }
    if (dialog_id == 1) {
        elm_settings_dialog.close();
    }
}

function autocompBPM() {
    onLoading();
    detectBPM(ogg_source, 1).then(
        function (detected) {
            console.log("解析完了\nBPM:" + detected.tempo[0].tempo + "\n信頼度:" + detected.tempo[0].accuracy * 100 + "%\nOFFSET:" + detected.offset);
            alert("解析完了\nBPM:" + detected.tempo[0].tempo + "\n信頼度:" + Math.round(detected.tempo[0].accuracy * 10000) / 100 + "%\nOFFSET:" + detected.offset);
            elm_bpm.value = detected.tempo[0].tempo;
            elm_offset.value = detected.offset;
            chart_info.tempo = detected.tempo[0].tempo;
            chart_info.offset = detected.offset;
            setTimeout(() => makeChart().then(function () {
                onLoaded();
            }), 0);
        }
    );
}

elm_bpm.addEventListener('change', (event) => {
    onLoading();
    chart_info.tempo = elm_bpm.value;
    setTimeout(() => makeChart().then(function () {
        onLoaded();
    }), 0);
});

elm_offset.addEventListener('change', (event) => {
    chart_info.offset = elm_offset.value;
});

function exportChart() {
    let chart_JSON = exportToJSON(chart_info);
    let zip = new JSZip();
    let folder = zip.folder("0");
    folder.file("chart.mc", chart_JSON);
    folder.file("song.ogg", ogg_blob);
    zip.generateAsync({ type: "blob" }).then(function (content) {
        saveAs(content, "song.mcz");
    });
}

function changeSplit(value) {
    onLoading().then(function () {
        split_value_index = Math.min(8, Math.max(0, split_value_index + value));
        split = SPLIT_VALUE[split_value_index];
        document.getElementById('split_num').innerText = split;
        setTimeout(() => makeChart().then(function () {
            onLoaded();
        }), 0);
    });
}