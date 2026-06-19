// ======================================
// 🐾 散歩記録スプレッドシート専用 GAS
// ======================================
// ★ このコードを「散歩記録」のスプレッドシートのGASに貼り付けてください

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action;

    if (action === 'addWalk') {
      var walkDate = data.date;
      var walkPets = data.pets;         // カンマ区切り 例: "チョコ,ペロ"
      var walkDistance = data.distance;
      var walkDuration = data.duration || "";
      var walkCoords = data.coords || ""; // JSON文字列

      var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
      // 列: [日付, ペット名, 距離, 時間, GPS座標]
      sheet.appendRow([walkDate, walkPets, walkDistance, walkDuration, walkCoords]);

      return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var action = e.parameter.action;
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = sheet.getDataRange().getDisplayValues();
    var result = [];

    if (action === 'getWalk') {
      // ヘッダー行(1行目)をスキップし、2行目からデータ取得
      // 列: [日付, ペット名, 距離, 時間, GPS座標]
      for (var j = 1; j < data.length; j++) {
        if (!data[j][0]) continue;
        var petsStr = data[j][1] || "";
        result.push({
          date: data[j][0],
          pets: petsStr.indexOf(',') !== -1 ? petsStr.split(',').map(function(s) { return s.trim(); }) : petsStr,
          distance: Number(data[j][2]) || 0,
          duration: data[j][3] || "",
          coords: data[j][4] ? JSON.parse(data[j][4]) : []
        });
      }
    } else {
      return ContentService.createTextOutput("choko&pero Walk API is Running.");
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
