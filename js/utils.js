"use strict";

/**
 *- 曲のBPMとオフセットを推定します
 * @param {AudioBufferSourceNode} ogg_src 曲データのAudioSource
 * @param {number} accuracy BPMの精度
 * @return {{offset: number,
 *              count: number,
 *              tempo: [{
 *                  tempo: number,
 *                  count: number,
 *                  accuracy: number
 *              }]
 *          }} 推定したBPMとオフセットの情報
 */
function detectBPM(ogg_src, accuracy = 1) {
    return new Promise(function (resolve, reject) {
        const BPM_SECTION = 200; //msec
        const OFFSET_SECTION = 1; //msec
        const OFFSET_THRESHOLD = 0.005;
        let answer = { count: 0, offset: 0, tempo: [] };
        let offset_count = -1;
        accuracy = 1 / accuracy;
        //filter
        let context = new OfflineAudioContext(1, ogg_src.buffer.length, ogg_src.buffer.sampleRate);
        let sampling_rate = context.sampleRate;
        let source = context.createBufferSource();
        source.buffer = ogg_src.buffer;
        let lp = context.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 150;
        lp.Q.value = 1;
        let hp = context.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 100;
        hp.Q.value = 1;
        source.connect(lp);
        lp.connect(hp);
        hp.connect(context.destination);
        source.start(0);
        context.startRendering();
        let filtered_buffer;
        context.oncomplete = function (e) {
            filtered_buffer = e.renderedBuffer;
            //find peaks
            let peaks = [];
            let length = filtered_buffer.length;
            let datasize = Math.min(length, 180 * sampling_rate);
            let data = filtered_buffer.getChannelData(0);
            for (let i = 0; i < datasize; i += BPM_SECTION * Math.floor(sampling_rate / 1000)) {
                let max_index = -1;
                let max_value = -Infinity;
                for (let j = 0; (i + j < datasize && j < BPM_SECTION * Math.floor(sampling_rate / 1000)); j++) {
                    if (max_value < data[i + j]) {
                        max_index = [i + j];
                        max_value = data[i + j];
                    }
                }
                if (max_value > 0) {
                    peaks.push(max_index);
                }
            }
            //find offset
            let raw_context = new OfflineAudioContext(1, ogg_src.buffer.length, ogg_src.buffer.sampleRate);
            let raw_source = raw_context.createBufferSource();
            raw_source.buffer = ogg_src.buffer;
            raw_source.connect(raw_context.destination);
            raw_source.start(0);
            raw_context.startRendering();
            let raw_buffer;
            raw_context.oncomplete = function (e) {
                raw_buffer = e.renderedBuffer;
                let raw_data = raw_buffer.getChannelData(0);
                for (let i = 0; i < datasize; i += Math.floor(sampling_rate / 1000)) {
                    if (raw_data[i] < OFFSET_THRESHOLD) {
                        continue;
                    }
                    let data_sum = 0;
                    for (let j = 0; (i + j < datasize && j < Math.floor(sampling_rate / 1000) * OFFSET_SECTION); j++) {
                        data_sum += Math.abs(raw_data[i + j]);
                    }
                    //sums.push(data_sum / Math.floor(sampling_rate/1000) / OFFSET_SECTION);
                    if (data_sum / Math.floor(sampling_rate / 1000) / OFFSET_SECTION > OFFSET_THRESHOLD) {
                        offset_count = i;
                        break;
                    }
                }
                //calc interval
                let interval_counts = [];
                peaks.forEach(function (peak, index) {
                    for (let i = 1; i < 10; i++) {
                        let interval = peaks[index + i] - peak;
                        let found_interval = interval_counts.some(function (interval_count) {
                            if (interval_count.interval === interval)
                                return interval_count.count++;
                        });
                        if (!found_interval && interval !== 0 && !isNaN(interval)) {
                            interval_counts.push({
                                interval: interval,
                                count: 1
                            });
                        }
                    }
                });
                //calc tempo
                let tempo_counts = [];
                interval_counts.forEach(function (interval_count, i) {
                    if (interval_count.interval === 0 || isNaN(interval_count.interval)) return;
                    let theoretical_tempo = 60 / (interval_count.interval / sampling_rate);
                    // Adjust the tempo to fit within the 90-180 BPM range
                    while (Math.round(theoretical_tempo) <= 100) theoretical_tempo *= 2;
                    while (Math.round(theoretical_tempo) > 200) theoretical_tempo /= 2;
                    //if (Math.round(theoretical_tempo) <= 100) return;
                    //if (Math.round(theoretical_tempo) > 200) return;
                    theoretical_tempo = Math.round(theoretical_tempo * accuracy) / accuracy;
                    let found_tempo = tempo_counts.some(function (tempo_count) {
                        if (tempo_count.tempo === theoretical_tempo)
                            return tempo_count.count += interval_count.count;
                    });
                    if (!found_tempo) {
                        tempo_counts.push({
                            tempo: theoretical_tempo,
                            count: interval_count.count,
                            accuracy: 0
                        });
                    }
                });
                tempo_counts.forEach(function (tempo_count) {
                    tempo_count.accuracy = tempo_count.count / interval_counts.length;
                });
                tempo_counts.sort((a, b) => b.count - a.count);
                answer.count = interval_counts.length;
                answer.tempo = tempo_counts;
                let offset_msec = offset_count / sampling_rate * 1000;
                answer.offset = -(offset_msec % (60 / tempo_counts[0].tempo * 1000) - (60 / tempo_counts[0].tempo * 1000));
                resolve(answer);
            }
        };
    });
}

/**
 *- 編集用の譜面形式から出力用の譜面形式に変換します
 * @param {{
 *  bpm: number,
 *  offset: number,
 *  creator: string,
 *  version: string,
 *  id: number,
 *  mode: number,
 *  time: number,
 *  song: {
 *      title: number,
 *      artist: number,
 *      id: number
 *  },
 *  mode_ext: {
 *      column: number,
 *      bar_begin: number
 *  },
 *  notes: [Note],
 *  events: [EventInfo]
 *  }} chart 編集中の譜面
 * @return {JSON} 出力用の譜面
 */
function exportToJSON(chart) {
    let JSON_data = {
        meta: {
            $ver: 0,
            creator: chart.creator,
            background: chart.background,
            version: chart.version,
            id: chart.id,
            mode: chart.mode,
            time: chart.time,
            song: {
                title: chart.song.title,
                artist: chart.song.artist,
                id: chart.song.id
            },
            mode_ext: {
                column: chart.mode_ext.column,
                bar_begin: chart.mode_ext.bar_begin
            }
        },
        time: [
            {
                beat: [
                    0,
                    0,
                    1
                ],
                bpm: chart.bpm
            }
        ],
        effect: [],
        note: []
    };
    chart.notes.forEach(
        function (element, index) {
            if (element.type == 1) {
                JSON_data.note.push({
                    beat: [
                        Math.floor(element.beat / element.split),
                        element.beat % element.split,
                        element.split
                    ],
                    column: element.column
                });
            }
            else if (element.type == 2) {
                JSON_data.note.push({
                    beat: [
                        Math.floor(element.beat / element.split),
                        element.beat % element.split,
                        element.split
                    ],
                    endbeat: [
                        Math.floor((element.beat + element.length) / element.split),
                        (element.beat + element.length) % element.split,
                        element.split
                    ],
                    column: element.column
                });
            }
        }
    )
    chart.events.foreach(
        function (element, index) {
            JSON_data.note.push({
                beat: [
                    Math.floor(element.beat / element.split),
                    element.beat % element.split,
                    element.split
                ],
                scroll: 1.0
            });
        }
    )
    JSON_data.note.push({
        beat: [
            0,
            0,
            1
        ],
        sound: "song.ogg",
        vol: 100,
        offset: chart.offset,
        type: 1
    });
    return JSON.stringify(JSON_data);
}

/**
 *- 2つの値の最大公約数を返します
 * @param {number} a 値1
 * @param {number} b 値2 
 */
function calcGcd(a = -1, b = -1) {
    if (a % b) {
        return calcGcd(b, a % b)
    } else {
        return b
    }
}

/**
 *- ノーツのデータを単純化し一意に決定させます
 * @param {Note} note ノーツデータ
 * @return {Note} 単純化後ノーツ
 */
function reduction(note) {
    if (note.type == 1 && note.beat == 0) {
        note.split = 1;
    }
    else if (note.type == 2) {
        let gcd = calcGcd(calcGcd(note.beat, note.split), note.length);
        note.beat /= gcd;
        note.split /= gcd;
        note.length /= gcd;
    }
    else {
        let gcd = calcGcd(note.beat, note.split);
        note.beat /= gcd;
        note.split /= gcd;
    }
    return note;
}

/**
 *- ある値が2つの値の間にあるかを判定します
 * @param {number} value 判定する値
 * @param {number} min 下限
 * @param {number} max 上限
 * @return {boolean} 含まれるならtrue
 */
function isContain(value = -1, min = 0, max = 0) {
    if (value >= min && value <= max) {
        return true;
    }
    else {
        return false;
    }
}