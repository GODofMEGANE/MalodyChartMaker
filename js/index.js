"use strict";

var oggfile;

const elm_body = document.getElementById('body');
const elm_index = document.getElementById('index');
const elm_4k = document.getElementById('4k');
const elm_oggfile_drop = document.getElementById('oggfile_drop');
const elm_oggfile_input = document.getElementById('oggfile_input');



elm_oggfile_drop.addEventListener('drop',
    function(evt){
        evt.stopPropagation();
        evt.preventDefault();
        oggfile = evt.dataTransfer.files;
        if(files.length > 1){
            oggfile = oggfile[0];
        }
        changePage('4k');
    }
, false)

elm_oggfile_input.addEventListener('change',
    function(){
        oggfile = this.files[0];
        changePage('4k');
    }
)

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