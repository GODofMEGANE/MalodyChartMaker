'use strict';

const elm_popup_text = document.getElementById('popup_text');

/**
 *- エラー等をポップアップ表示します
 * @param text 表示させる文字列
 * @param sec 表示させる秒数
 * @param fadeout フェードアウトさせる秒数
 */
function popup(text = "", sec = 1, fadeout = 0){
    elm_popup_text.innerText = text;
    elm_popup_text.style.transitionDuration = "0.2s";
    elm_popup_text.style.opacity = 1.0;
    elm_popup_text.style.visibility = "visible";
    setTimeout(function () {
        elm_popup_text.style.transitionDuration = `${fadeout}s`;
        elm_popup_text.style.opacity = 0.0;
        elm_popup_text.style.visibility = "hidden";
    }, sec * 1000);
    return;
}