"use strict";

function detectBPM(ogg_src, accuracy){
    var answer = {count: 0, tempo: []};
    //filter
    var context = new OfflineAudioContext(1, ogg_src.buffer.length, ogg_src.buffer.sampleRate);
    var sampling_rate = context.sampleRate;
    var source = context.createBufferSource();
    source.buffer = ogg_src.buffer;
    var lp = context.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 150;
    lp.Q.value = 1;
    var hp = context.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 100;
    hp.Q.value = 1;
    source.connect(lp);
    lp.connect(hp);
    hp.connect(context.destination);
    source.start(0);
    context.startRendering()
    var filtered_buffer;
    context.oncomplete = function(e){
        filtered_buffer = e.renderedBuffer;
        //find peaks
        var peaks = [];
        var length = filtered_buffer.length;
        var datasize = Math.min(length, 180*sampling_rate);
        var data = filtered_buffer.getChannelData(0);
        for(var i = 0; i < datasize; i+=1*sampling_rate){
            var max_index = -1;
            var max_value = -Infinity;
            for(var j = 0;j < 1*sampling_rate; j++){
                if(max_value < data[i+j]){
                    max_index = [i+j];
                    max_value = data[i+j];
                }
            }
            if(max_value > 0){
                peaks.push(max_index);
            }
        }
        //calc interval
        var interval_counts = [];
        peaks.forEach(function (peak, index) {
            for(var i = 0; i < 10; i++){
                var interval = peaks[index+i] - peak;
                var found_interval = interval_counts.some(function(interval_count){
                    if(interval_count.interval === interval)
                        return interval_count.count++;
                });
                if(!found_interval && interval !== 0 && !isNaN(interval)){
                    interval_counts.push({
                        interval: interval,
                        count: 1
                    });
                }
            }
        });
        //calc tempo
        var tempo_counts = [];
        interval_counts.forEach(function(interval_count, i){
            if(interval_count.interval === 0 || isNaN(interval_count.interval))return;
            var theoretical_tempo = 60 / (interval_count.interval / sampling_rate);
            // Adjust the tempo to fit within the 90-180 BPM range
            while(theoretical_tempo < 90)theoretical_tempo *= 2;
            while(theoretical_tempo > 180)theoretical_tempo /= 2;
            theoretical_tempo = Math.round(theoretical_tempo*accuracy)/accuracy;
            var found_tempo = tempo_counts.some(function (tempo_count){
                if (tempo_count.tempo === theoretical_tempo)
                    return tempo_count.count += interval_count.count;
            });
            if(!found_tempo){
                tempo_counts.push({
                    tempo: theoretical_tempo,
                    count: interval_count.count,
                    accuracy: 0
                });
            }
        });
        tempo_counts.forEach(function(tempo_count){
            tempo_count.accuracy = tempo_count.count / interval_counts.length;
        });
        tempo_counts.sort((a, b) => b.count-a.count);
        answer.count = interval_counts.length;
        answer.tempo = tempo_counts;
    };
    console.log(answer);
    return answer;
}