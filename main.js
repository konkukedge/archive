var jsonData;
var gameDictionary;
var selectedMenu=-1;

    const tooltip = document.createElement("div");
    tooltip.style.position = "fixed";
    tooltip.style.padding = "6px 10px";
    tooltip.style.background = "rgba(0, 0, 0, 0.75)";
    tooltip.style.color = "white";
    tooltip.style.fontSize = "14px";
    tooltip.style.borderRadius = "5px";
    tooltip.style.pointerEvents = "none";
    tooltip.style.whiteSpace = "nowrap";
    tooltip.style.zIndex = "9999";
    tooltip.style.display = "none";
$(document).ready(function(){
    $('#loader').show(); // 시작 시 로딩 표시
    gameDictionary = new Map();
    google.charts.load('current', { packages: ['corechart'] }).then(function () {
        var query = new google.visualization.Query('https://spreadsheets.google.com/tq?key=1RoujVUSQD7mOI2tpeqBszpjjt4tkgLEpr1LHcWND3O8&pub=1');
        query.send(function (response) {   
        console.log(response);         
        const dataTable = response.getDataTable();

        jsonData = dataTable.toJSON();            
        jsonData = JSON.parse(jsonData);
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

            if (imageLink.includes('storyphoto/viewer.html')) {
                try {
                    var url = new URL(imageLink);
                    imageLink = url.searchParams.get("src");
                } catch (e) {
                    console.error("Invalid image URL format: ", imageLink);
                }
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
            gameObject.rank = -1;
            if (jsonData.rows[i].c.length > 7) {
                gameObject.rank = jsonData.rows[i].c[7].v;
            }
            gameDictionary.get(key).push(gameObject);
        }
        initGame(lastKey);
        $('#loader').fadeOut(); // 데이터 로딩 완료 후 숨김
        });
      });

    document.body.appendChild(tooltip);
});

function initGame(key){
    $(".game").empty();
    const keyStr = '#' + key.replace(' ', '');
    if (selectedMenu !== -1) {
        $(selectedMenu).removeClass('selected');
    }
    $(keyStr).addClass('selected');
    selectedMenu = keyStr;
    
    const priorityMap = {
        1: 1,
        2: 2,
        3: 3,
        4: 4,
        5: 5,
        '-1': 6
    };

    const gameList = gameDictionary.get(key).slice().sort((a, b) => {
        const rankA = priorityMap[a.rank] ?? 6;
        const rankB = priorityMap[b.rank] ?? 6;
        return rankA - rankB;
    });

    for (let i = 0; i < gameList.length; i++) {
        const game = gameList[i];
        const newDiv = document.createElement("div");
        newDiv.className = "card";

        if (game.rank === 1) {
            newDiv.classList.add("rank-first");
            newDiv.setAttribute("data-rank-label", "1위");
        } else if (game.rank === 2) {
            newDiv.classList.add("rank-second");
            newDiv.setAttribute("data-rank-label", "2위");
        } else if (game.rank === 3) {
            newDiv.classList.add("rank-third");
            newDiv.setAttribute("data-rank-label", "3위");
        } else if (game.rank === 4) {
            newDiv.classList.add("rank-special");
            newDiv.setAttribute("data-rank-label", "장려상");
        } else if (game.rank === 5) {
            newDiv.classList.add("rank-external");
            newDiv.setAttribute("data-rank-label", "대외 수상");
        } else {
            newDiv.setAttribute("data-rank-label", "");
        }

        const img = document.createElement("img");
        img.setAttribute('src', game.image);
        img.setAttribute('referrerpolicy', 'no-referrer');

        const p1 = document.createElement("p");
        const starsSpan = document.createElement("span");
        starsSpan.style.color = "#e2703a";
        starsSpan.className = "maker";
        starsSpan.innerHTML = game.makers;
        p1.appendChild(starsSpan);

        const p2 = document.createElement("p");
        const fontSizeSpan = document.createElement("span");
        fontSizeSpan.className = "name";
        fontSizeSpan.innerHTML = game.name;
        p2.appendChild(fontSizeSpan);

        const p3 = document.createElement("p");
        const fontSizeSpan2 = document.createElement("span");
        fontSizeSpan2.className = "platform";
        fontSizeSpan2.innerHTML = game.platform;
        p3.appendChild(fontSizeSpan2);

        const cafe = document.createElement("a");
        cafe.href = game.cafe;
        cafe.target = "_blank";
        cafe.className = "cafe";
        cafe.innerHTML = "게임 소개";

        const downloadlink = document.createElement("a");
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
}

let currentMouseX;
let currentMouseY;
let tooltipTimer;   
  $(document).on("mouseenter", ".card", function (e) {
    const label = this.getAttribute("data-rank-label");
    if (label) {
      tooltipTimer = setTimeout(() => {
        tooltip.innerText = label;
        tooltip.style.top = currentMouseY + 15 + "px";
        tooltip.style.left = currentMouseX + 15 + "px";
        tooltip.style.display = "block";
      }, 1000);
    }
  });

  $(document).on("mousemove", ".card", function (e) {
    tooltip.style.top = e.clientY + 15 + "px";
    tooltip.style.left = e.clientX + 15 + "px";
    currentMouseX = e.clientX;
    currentMouseY = e.clientY;
  });

  $(document).on("mouseleave", ".card", function () {
    clearTimeout(tooltipTimer);
    tooltip.style.display = "none";
  });

typeToClassLabel = {
  1: { class: "rank-first", label: "1등" },
  2: { class: "rank-second", label: "2등" },
  3: { class: "rank-third", label: "3등" },
  4: { class: "rank-special", label: "장려상" },
  5: { class: "rank-external", label: "대외수상" },
};

function applyRankBadge(div, rank) {
  const info = typeToClassLabel[rank];
  if (info) {
    div.classList.add(info.class);
    div.setAttribute("data-rank-label", info.label);
  } else {
    div.removeAttribute("data-rank-label");
  }
}




