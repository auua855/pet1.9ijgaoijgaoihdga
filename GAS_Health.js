// ======================================
// 🩺 体調管理スプレッドシート専用 GAS
// ======================================
// ★ このコードを「体調管理」のスプレッドシートのGASに貼り付けてください
// ★ FOLDER_ID を自分のGoogle DriveフォルダIDに書き換えてください

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action;

    if (action === 'addHealth') {
      var date = data.date;
      var petName = data.petName;
      var content = data.content;
      var photoBase64 = data.photoBase64;
      var photoMimeType = data.photoMimeType;
      var photoFileName = data.photoFileName;
      
      var photoId = "";

      // 写真データがある場合はGoogle Driveに保存
      if (photoBase64) {
        // ★ここにGoogle Driveの保存先フォルダIDを貼り付けてください★
        var FOLDER_ID = "ここにフォルダIDを貼り付けてください"; 
        var folder = DriveApp.getFolderById(FOLDER_ID);
        var decodedData = Utilities.base64Decode(photoBase64);
        var blob = Utilities.newBlob(decodedData, photoMimeType, photoFileName);
        var file = folder.createFile(blob);
        
        // ★自動的に「リンクを知っている全員が閲覧可」に変更する（シームレス表示のため）
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        
        photoId = file.getId(); 
      }

      // スプレッドシートに記録を書き込む
      var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
      sheet.appendRow([date, petName, content, photoId]);

      return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (action === 'updateHealth') {
      var rowNum = data.rowNum ? Number(data.rowNum) : null;
      var date = data.date;
      var petName = data.petName;
      var content = data.content;
      var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
      
      if (!rowNum && date && petName) {
        var rows = sheet.getDataRange().getValues();
        for (var i = 1; i < rows.length; i++) {
          var rowDateStr = String(rows[i][0]);
          if (rowDateStr.indexOf(date) !== -1 && rows[i][1] === petName) {
            rowNum = i + 1;
            break;
          }
        }
      }
      
      if (rowNum) {
        sheet.getRange(rowNum, 2).setValue(petName);
        sheet.getRange(rowNum, 3).setValue(content);
        return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
          .setMimeType(ContentService.MimeType.JSON);
      } else {
        return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "対象の行が見つかりませんでした" }))
          .setMimeType(ContentService.MimeType.JSON);
      }
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

    if (action === 'getHealth') {
      // ヘッダー行(1行目)をスキップし、2行目からデータ取得
      // 列: [日付, ペット名, 内容, 写真ID]
      for (var i = 1; i < data.length; i++) {
        if (!data[i][0]) continue;
        result.push({
          rowNum: i + 1,
          date: data[i][0],
          petName: data[i][1],
          content: data[i][2],
          photoId: data[i][3] || ""
        });
      }
    } else {
      return ContentService.createTextOutput("choko&pero Health API is Running.");
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
