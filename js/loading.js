'use strict';

const elm_loading = document.getElementById('loading');

function onLoading() {
    return new Promise(function (resolve, reject) {
        if (elm_loading.style.display != 'block') {
            elm_loading.style.display = 'block';
            resolve(true);
        }
        reject(false);
    });
}

function onLoaded() {
    return new Promise(function (resolve, reject) {
        if (elm_loading.style.display != 'none') {
            elm_loading.style.display = 'none';
            resolve(true);
        }
        reject(false);
    });
}

