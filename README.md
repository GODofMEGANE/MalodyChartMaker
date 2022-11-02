# MalodyChartMaker

chart_infoの保存形式
{
    id: 0, //elementと譜面データを紐づける
    type: 2, //0:なし(返り値のみで使用) 1:通常ノーツ 2:ロングノーツ
    column: 0, //列(0~3)
    beat: 0, //split分音符でbeat拍目
    length: 4, //ロングノーツの長さの拍数(type=2のみ)
    split: 4, //何分音符か
}