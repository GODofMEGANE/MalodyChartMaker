"use strict";

function detectBPM(ogg_src, accuracy) {
    return new Promise(function (resolve, reject) {
        let answer = { count: 0, offset: 0, tempo: [] };
        let offset_count = -1;
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
        context.startRendering()
        let filtered_buffer;
        context.oncomplete = function (e) {
            filtered_buffer = e.renderedBuffer;
            //find peaks
            let peaks = [];
            let length = filtered_buffer.length;
            let datasize = Math.min(length, 180 * sampling_rate);
            let data = filtered_buffer.getChannelData(0);
            for (let i = 0; i < datasize; i += 1 * sampling_rate) {
                let max_index = -1;
                let max_value = -Infinity;
                for (let j = 0; j < 1 * sampling_rate; j++) {
                    if (offset_count == -1 && data[i + j] > 0.05) {
                        offset_count = i + j;
                    }
                    if (max_value < data[i + j]) {
                        max_index = [i + j];
                        max_value = data[i + j];
                    }
                }
                if (max_value > 0) {
                    peaks.push(max_index);
                }
            }
            //calc interval
            let interval_counts = [];
            peaks.forEach(function (peak, index) {
                for (let i = 0; i < 10; i++) {
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
                while (theoretical_tempo < 90) theoretical_tempo *= 2;
                while (theoretical_tempo > 180) theoretical_tempo /= 2;
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
            answer.offset = Math.round(offset_count / sampling_rate * 1000)-1000;
            resolve(answer);
        };
    });
}

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
            if(element.type == 1){
                JSON_data.note.push({
                    beat: [
                        Math.floor(element.beat/element.split),
                        element.beat%element.split,
                        element.split
                    ],
                    column: element.column
                });
            }
            else if(element.type == 2){
                JSON_data.note.push({
                    beat: [
                        Math.floor(element.beat/element.split),
                        element.beat%element.split,
                        element.split
                    ],
                    endbeat: [
                        Math.floor((element.beat+element.length)/element.split),
                        (element.beat+element.length)%element.split,
                        element.split
                    ],
                    column: element.column
                });
            }
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

function calcGcd(a, b) {
    if (a % b) {
        return calcGcd(b, a % b)
    } else {
        return b
    }
}

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

function isContain(value, min, max){
    if(value >= min && value <= max){
        return true;
    }
    else{
        return false;
    }
}