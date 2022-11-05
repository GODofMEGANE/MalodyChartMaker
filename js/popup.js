'use strict';

const elm_popup_text = document.getElementById('popup_text');

function popup(text, sec, fadeout = 0){
    elm_popup_text.innerText = text;
    elm_popup_text.style.transitionDuration = "0.2s";
    elm_popup_text.style.opacity = 1.0;
    elm_popup_text.style.visibility = "visible";
    setTimeout(function () {
        elm_popup_text.style.transitionDuration = fadeout + "s";
        elm_popup_text.style.opacity = 0.0;
        elm_popup_text.style.visibility = "hidden";
    }, sec*1000);
}