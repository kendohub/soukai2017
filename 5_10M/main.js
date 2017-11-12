var Bleacon = require("bleacon");
var cnt = 0
var fs = require("fs");

//サンプル取得回数
var loopnum = 5;

//実際に計測されたRSSI
var actual_rssi = [];

//距離毎の中央値
var median_1 = -70; //5M
var median_2 = -92; //10M
var median_3 = -500;

//メッセージ
var message_1 = "5M以内にいます"
var message_2 = "10M以内にいます"
var message_3 = "どこかににいます"

//中央値からの差に対応する重み　要素数は　幅＋１　設定する
var diff_rssi_weight = [11, 19, 17, 15, 13, 11, 9, 7, 5, 3, 1];

//前回の距離判定
var before_distance = null;

//計測対象のUUID (セキュリティのため実行時に環境変数から渡す)
if (process.env.TARGET_UUID == null) {
  var TARGET_UUID = "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
} else {
  var TARGET_UUID = process.env.TARGET_UUID
}

Bleacon.startScanning();
Bleacon.on("discover", function(bleacon) {
  if(bleacon["uuid"] == TARGET_UUID)
  {
		cnt++;
		console.dir(cnt + "回目");
//		console.dir(bleacon);
		console.dir(bleacon["rssi"]);
//		console.dir(bleacon["accuracy"]);

		//計測されたRSSIを保管
		actual_rssi.push(bleacon["rssi"]);

		//指定回数の計測を行ったら以下の処理を行う
		if(cnt >= loopnum){
			var sum_1 = 0;
			var sum_2 = 0;
			var sum_3 = 0;
			var diff = 0;

			//古いRSSIを破棄 (ちゃんと配列のlengthがloopnum個になる)
			actual_rssi.shift();

			//距離毎の重みの合計を算出
			for(var i=0; i<loopnum; i++){

				diff = median_1 - actual_rssi[i];

				if(diff < 0){ diff *= (-1); }

				if(diff < (diff_rssi_weight.length - 1)){
					sum_1 += diff_rssi_weight[diff];
				}


				diff = median_2 - actual_rssi[i];

				if(diff < 0){ diff *= (-1);}

				if(diff < (diff_rssi_weight.length - 1)){
					sum_2 += diff_rssi_weight[diff];
				}


				diff = median_3 - actual_rssi[i];

				if(diff < 0){ diff *= (-1);}

				if(diff < (diff_rssi_weight.length - 1)){
					sum_3 += diff_rssi_weight[diff];
				}
			}


			//距離判定
			var distance = null;

			if(sum_1 == 0 && sum_2 == 0 && sum_3 ==0){
				distance = "どこにいるのか分からないです";
			}
			else if(sum_1 > sum_2){
				if(sum_1 > sum_3){
					distance = message_1;
				}
				else{
					distance = message_3;
				}
			}
			else{
				if(sum_2 > sum_3){
					distance = message_2;
				}
				else{
					distance = message_3;
				}
			}

			console.dir("距離判定結果：：：：：：" + distance);

			//前回の距離判定と異なる場合のみメッセージを送信する
			if(distance != before_distance){
				before_distance = distance;
				var bocco_api = require("../bocco_api/bocco_api.js");

				console.dir("メッセージ送信中．．．");
				bocco_api.sendmessage(distance);
				console.dir("メッセージ送信完了！");
				if (before_distance == message_2 && distance == message_3) {
					console.dir("メッセージ送信中．．．");
					bocco_api.sendmessage("よし、行ったようだな");
					console.dir("メッセージ送信完了！");
				}
			}

		}//if(cnt == loopnum)
	}
});

