function doPost(e) {
  try {
    // アプリから送られてきたJSONデータをパース
    var data = JSON.parse(e.postData.contents);
    var action = data.action;

    if (action === 'addHealth') {
      var date = data.date;
      var petName = data.petName;
      var content = data.content;
      var photoBase64 = data.photoBase64;
      var photoMimeType = data.photoMimeType;
      var photoFileName = data.photoFileName;
      
      var photoUrl = "";

      // 1. 写真データがある場合はGoogle Driveに保存
      if (photoBase64) {
        // ★ここにGoogle Driveの保存先フォルダIDを貼り付けます★
        var FOLDER_ID = "ここにフォルダIDを貼り付けてください"; 
        var folder = DriveApp.getFolderById(FOLDER_ID);
        
        // Base64データをBlob（ファイル実体）に変換
        var decodedData = Utilities.base64Decode(photoBase64);
        var blob = Utilities.newBlob(decodedData, photoMimeType, photoFileName);
        
        // フォルダにファイルを作成
        var file = folder.createFile(blob);
        
        // 作成したファイルのURL（またはID）を取得
        photoUrl = file.getUrl(); 
      }

      // 2. スプレッドシートに記録を書き込む
      var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
      sheet.appendRow([date, petName, content, photoUrl]);

      return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // ─── 散歩記録の書き込み ───
    if (action === 'addWalk') {
      var walkDate = data.date;
      var walkPets = data.pets;       // カンマ区切りの文字列 例: "チョコ,ペロ"
      var walkDistance = data.distance;
      var walkDuration = data.duration || "";
      var walkCoords = data.coords || ""; // JSON文字列

      var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
      sheet.appendRow([walkDate, walkPets, walkDistance, walkDuration, walkCoords]);

      return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ─── データの取得（GETリクエスト） ───
// アプリ起動時や更新ボタンを押したときに、スプレッドシートのデータを読み込むための処理です
function doGet(e) {
  try {
    var action = e.parameter.action;
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = sheet.getDataRange().getValues();
    var result = [];

    // 体調記録の取得
    if (action === 'getHealth') {
      // 1行目はヘッダーとみなし、2行目から取得
      for (var i = 1; i < data.length; i++) {
        if (!data[i][0]) continue; // 空行はスキップ
        result.push({
          date: data[i][0],
          petName: data[i][1],
          content: data[i][2],
          photoUrl: data[i][3] || ""
        });
      }
    }
    // 散歩記録の取得
    else if (action === 'getWalk') {
      // 1行目はヘッダーとみなし、2行目から取得
      // スプレッドシート列: [date, pets, distance, duration, coords]
      for (var j = 1; j < data.length; j++) {
        if (!data[j][0]) continue; // 空行はスキップ
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
      // アクション指定がない場合（直接ブラウザで開いた時など）
      return ContentService.createTextOutput("choko&pero API Server is Running.");
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
