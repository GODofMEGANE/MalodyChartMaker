"use strict";

function detectBPM(ogg_src, threshold){
    //filter
    var context = new OfflineAudioContext(1, ogg_src.buffer.length, ogg_src.buffer.sampleRate);
    var source = context.createBufferSource();
    source.buffer = ogg_src.buffer;
    var filter = context.createBiquadFilter();
    filter.type = "lowpass";
    source.connect(filter);
    filter.connect(context.destination);
    source.start(0);
    context.startRendering()
    var filtered_buffer;
    context.oncomplete = function (e) {
        filtered_buffer = e.renderedBuffer;
        //decide threshold
        var peaks = [];
        var length = filtered_buffer.length;
        var data = filtered_buffer.getChannelData(0);
        var data_max = 0;
        for (var i = 0; i < Math.min(length, 60*40000);i++) {
            if(data_max < data[i]){
                data_max = data[i];
            }
        }
        threshold = data_max * 0.3;
        //find peaks
        for (var i = 0; i < Math.min(length, 60*40000);) {
            if ((data[i] + data[i]) / 2 > threshold) {
                peaks.push(i);
                i += 10000;
            }
            i++;
        }
        //calc interval
        var interval_counts = [];
        peaks.forEach(function (peak, index) {
            for (var i = 0; i < 10; i++) {
                var interval = peaks[index + i] - peak;
                var found_interval = interval_counts.some(function (interval_count) {
                    if (interval_count.interval === interval)
                        return interval_count.count++;
                });
                if (!found_interval) {
                    interval_counts.push({
                        interval: interval,
                        count: 1
                    });
                }
            }
        });
        //calc tempo
        var tempo_counts = [];
        interval_counts.forEach(function (interval_count, i) {
            console.log(interval_count);
            if(interval_count.interval === 0 || isNaN(interval_count.interval)) return;
            var theoretical_tempo = 60 / (interval_count.interval / 44100);
            // Adjust the tempo to fit within the 90-180 BPM range
            while (theoretical_tempo < 90) theoretical_tempo *= 2;
            while (theoretical_tempo > 180) theoretical_tempo /= 2;
            theoretical_tempo = Math.round(theoretical_tempo);
            var found_tempo = tempo_counts.some(function (tempo_count) {
                if (tempo_count.tempo === theoretical_tempo)
                    return tempo_count.count += interval_count.count;
            });
            if (!found_tempo) {
                tempo_counts.push({
                    tempo: theoretical_tempo,
                    count: interval_count.count
                });
            }
        });
        tempo_counts.sort((a, b) => b.count-a.count);
        console.log(tempo_counts);
    };
}