'use strict';

const elm_loading = document.getElementById('loading');

/**
 *- ロード画面を表示させます
 * @return {Promise<boolean>} 成功したかどうか
 */
function onLoading() {
    return new Promise(function (resolve, reject) {
        if (elm_loading.style.display != 'block') {
            elm_loading.style.display = 'block';
            resolve(true);
        }
        reject(false);
    });
}

/**
 *- ロード画面を非表示にします
 * @return {Promise<boolean>} 成功したかどうか
 */
function onLoaded() {
    return new Promise(function (resolve, reject) {
        if (elm_loading.style.display != 'none') {
            elm_loading.style.display = 'none';
            resolve(true);
        }
        reject(false);
    });
}

