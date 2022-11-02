'use strict';

const elm_loading = document.getElementById('loading');

function onLoading(){
    if(elm_loading.style.display != 'block'){
        elm_loading.style.display = 'block';
        return true;
    }
    return false;
}

function onLoaded(){
    if(elm_loading.style.display != 'none'){
        elm_loading.style.display = 'none';
        return true;
    }
    return false;
}

