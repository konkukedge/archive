var jsonData;
var gameDictionary;
var selectedMenu=-1;
$(document).ready(function(){
    gameDictionary = new Map();
    google.charts.load('current', { packages: ['corechart'] }).then(function () {
        var query = new google.visualization.Query('http://spreadsheets.google.com/tq?key=1RoujVUSQD7mOI2tpeqBszpjjt4tkgLEpr1LHcWND3O8&pub=1');
        query.send(function (response) {            
        var dataTable = response.getDataTable();
        jsonData = dataTable.toJSON();            
        jsonData = JSON.parse(jsonData);
        console.log(jsonData)
        var lastKey;
        for(var i=0; i < jsonData.rows.length; i++) {
            var key = jsonData.rows[i].c[0].v;
            if(!gameDictionary.has(key)){
                gameDictionary.set(key,[]);
                var htmlData = "<p id=\""+key.replace(' ','')+"\" class=\"menu\" onclick=\"initGame(\'"+key+"\')\">" + jsonData.rows[i].c[0].v;
                $(".list ul").append(htmlData);
                lastKey = key;
            }
            var htmlData = "";
            var link = jsonData.rows[i].c[2].v;
            var gameObject = new Object();
            gameObject.name = jsonData.rows[i].c[1].v;
            gameObject.download = link;
            var imageLink = jsonData.rows[i].c[3].v;
            if(imageLink=="Default"){
                imageLink = "https://cafe.naver.com/common/storyphoto/viewer.html?src=https%3A%2F%2Fcafeptthumb-phinf.pstatic.net%2FMjAyNDAzMTJfMjI5%2FMDAxNzEwMTcwMTI2NTc3.4WA779aYiTCx536tDZqXLKJP1zUJ7NvRF5ISZpDiH98g.VwrVOlo9pNcPzKfbkRRb01mdK6GOa8ExwiVAoj3IDEQg.PNG%2F%2525ED%252599%252594%2525EB%2525A9%2525B4_%2525EC%2525BA%2525A1%2525EC%2525B2%252598_2024-03-12_001459.png%3Ftype%3Dw1600";
            }
            try{
                var split = imageLink.split('w');
                if(split.length>1){
                    imageLink=imageLink.replace(split[split.length-1],"300");
                }

            }catch(e){
                imageLink = jsonData.rows[i].c[3].v;
            }
            gameObject.image = imageLink;
            gameObject.cafe = jsonData.rows[i].c[4].v;
            gameObject.makers = jsonData.rows[i].c[5].v;
            gameObject.platform = jsonData.rows[i].c[6].v;
            gameDictionary.get(key).push(gameObject);
        }
        initGame(lastKey);
        });
      });

});

function initGame(key){
    $(".game").empty();
    var keyStr = '#'+key.replace(' ','');
    if(selectedMenu != -1){
        $(selectedMenu).removeClass('selected');
    }
    $(keyStr).addClass('selected');
    selectedMenu = keyStr;
    gameList = gameDictionary.get(key);
    for(let i = 0; i<gameList.length; i++){
        var game = gameList[i];
        var newDiv = document.createElement("div");
        newDiv.className = "card";
        
        var img = document.createElement("iframe");
        img.setAttribute('src',game.image);
        img.setAttribute("scrolling","no");
        console.log(img.src);
        var p1 = document.createElement("p");
        var starsSpan = document.createElement("span");
        starsSpan.style.color = "#e2703a";
        starsSpan.className = "maker"
        starsSpan.innerHTML = game.makers;
        p1.appendChild(starsSpan);
        
        var p2 = document.createElement("p");
        var fontSizeSpan = document.createElement("span");
        fontSizeSpan.className = "name"
        fontSizeSpan.innerHTML = game.name;
        p2.appendChild(fontSizeSpan);
        var p3 = document.createElement("p");
        var fontSizeSpan2 = document.createElement("span");
        fontSizeSpan2.className = "platform"
        fontSizeSpan2.innerHTML = game.platform;
        p3.appendChild(fontSizeSpan2);
        var cafe = document.createElement("a");
        cafe.href = game.cafe;
        cafe.target="_blank";
        cafe.className = "cafe";
        cafe.innerHTML = "게임 소개";
        var downloadlink = document.createElement("a");
        downloadlink.href = game.download;
        downloadlink.target = "_blank";
        downloadlink.className = "download";
        downloadlink.innerHTML = "다운로드";
        
        newDiv.appendChild(img);
        newDiv.appendChild(p1);
        newDiv.appendChild(p2);
        newDiv.appendChild(p3);
        newDiv.appendChild(cafe);
        newDiv.appendChild(downloadlink);
        
        $(".game").append(newDiv);
    }
    console.log(gameList);
}



