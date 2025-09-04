// main.js

var jsonData;
var gameDictionary;
var selectedMenu = -1;

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx50iKmE7Wret4IQu4DG2LKje76QmpwhZ7Ywmf1Ehn0DGZok5ZozHHxvW9EK4wnRW3a8s6/exec";

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

$(document).ready(function() {
    $('#loader').show();
    gameDictionary = new Map();
    google.charts.load('current', {
        packages: ['corechart']
    }).then(function() {
        var query = new google.visualization.Query('https://spreadsheets.google.com/tq?key=1RoujVUSQD7mOI2tpeqBszpjjt4tkgLEpr1LHcWND3O8&pub=1');
        
        // 이 부분을 수정된 코드로 교체합니다.
        query.send(function(response) {
            // ▼▼▼▼▼ 에러 처리 코드 추가 ▼▼▼▼▼
            if (response.isError()) {
                console.error('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage());
                alert('데이터를 불러오는 데 실패했습니다. 구글 시트의 공유 설정을 확인하거나 잠시 후 다시 시도해주세요.');
                $('#loader').fadeOut(); // 에러 발생 시에도 로더를 숨깁니다.
                return; // 함수 실행 중단
            }
            // ▲▲▲▲▲ 에러 처리 코드 추가 ▲▲▲▲▲

            console.log(response);
            const dataTable = response.getDataTable();
            jsonData = dataTable.toJSON();
            jsonData = JSON.parse(jsonData);

            // 동적 메뉴 생성 (기존 코드)
            for (var i = 0; i < jsonData.rows.length; i++) {
                var key = jsonData.rows[i].c[0].v;
                if (!gameDictionary.has(key)) {
                    gameDictionary.set(key, []);
                    var htmlData = "<p id=\"" + key.replace(/ /g, '') + "\" class=\"menu\" onclick=\"initGame(\'" + key + "\')\">" + jsonData.rows[i].c[0].v;
                    $(".list ul").append(htmlData);
                }
                var gameObject = new Object();
                gameObject.name = jsonData.rows[i].c[1].v;
                gameObject.download = jsonData.rows[i].c[2].v;
                var imageLink = jsonData.rows[i].c[3].v;
                if (imageLink == "Default") {
                    imageLink = "https://cafe.naver.com/common/storyphoto/viewer.html?src=https%3A%2F%2Fcafeptthumb-phinf.pstatic.net%2FMjAyNDAzMTJfMjI5%2FMDAxNzEwMTcwMTI2NTc3.4WA779aYiTCx536tDZqXLKJP1zUJ7NvRF5ISZpDiH98g.VwrVOlo9pNcPzKfbkRRb01mdK6GOa8ExwiVAoj3IDEQg.PNG%2F%2525ED%252599%252594%2525EB%2525A9%2525B4_%2525EC%2525B2%252598_2024-03-12_001459.png%3Ftype%3Dw1600";
                }
                if (imageLink.includes('storyphoto/viewer.html')) {
                    try {
                        var url = new URL(imageLink);
                        imageLink = url.searchParams.get("src");
                    } catch (e) {
                        console.error("Invalid image URL format: ", imageLink);
                    }
                }
                try {
                    var split = imageLink.split('w');
                    if (split.length > 1) {
                        imageLink = imageLink.replace(split[split.length - 1], "300");
                    }
                } catch (e) {
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

            $('#loader').fadeOut();
            initIntro();
        });
    });

    document.body.appendChild(tooltip);

    // --- 후기 기능 이벤트 리스너 (기존과 동일) ---
    const modal = document.getElementById('review-modal');
    const closeButton = document.querySelector('.close-button');
    const reviewForm = document.getElementById('review-form');

    closeButton.onclick = () => modal.style.display = 'none';
    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };

    reviewForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const submitButton = this.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = '등록 중...';

        const formData = {
            gameName: document.getElementById('game-name-input').value,
            reviewerName: document.getElementById('reviewer-name').value,
            reviewContent: document.getElementById('review-text').value,
        };

        fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(formData),
            headers: { 'Content-Type': 'application/json' },
            mode: 'no-cors'
        })
        .then(() => {
            alert('후기가 성공적으로 등록되었습니다!');
            this.reset();
            fetchAndShowReviews(formData.gameName);
        })
        .catch(error => {
            console.error('Error:', error);
            alert('후기 등록에 실패했습니다.');
        })
        .finally(() => {
            submitButton.disabled = false;
            submitButton.textContent = '후기 등록';
        });
    });
});

// 게임 목록 초기화 함수
function initGame(key) {
    $(".game").empty();
    const keyStr = '#' + key.replace(/ /g, '');
    if (selectedMenu !== -1) {
        $(selectedMenu).removeClass('selected');
    }
    $(keyStr).addClass('selected');
    selectedMenu = keyStr;

    const priorityMap = { 1: 1, 2: 2, 3: 3, 5: 4, 4: 5, '-1': 6 };
    const gameList = gameDictionary.get(key).slice().sort((a, b) => {
        const rankA = priorityMap[a.rank] ?? 6;
        const rankB = priorityMap[b.rank] ?? 6;
        return rankA - rankB;
    });

    for (let i = 0; i < gameList.length; i++) {
        const game = gameList[i];
        const newDiv = document.createElement("div");
        newDiv.className = "card";

        applyRankBadge(newDiv, game.rank);

        newDiv.addEventListener('click', () => {
            openReviewModal(game.name);
        });

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
        cafe.onclick = (e) => e.stopPropagation();
        const downloadlink = document.createElement("a");
        downloadlink.href = game.download;
        downloadlink.target = "_blank";
        downloadlink.className = "download";
        downloadlink.innerHTML = "다운로드";
        downloadlink.onclick = (e) => e.stopPropagation();
        newDiv.appendChild(img);
        newDiv.appendChild(p1);
        newDiv.appendChild(p2);
        newDiv.appendChild(p3);
        newDiv.appendChild(cafe);
        newDiv.appendChild(downloadlink);

        $(".game").append(newDiv);
    }
}

function openReviewModal(gameName) {
    const modal = document.getElementById('review-modal');
    document.getElementById('modal-game-title').textContent = gameName;
    document.getElementById('game-name-input').value = gameName;
    document.getElementById('review-list').innerHTML = '<p>후기를 불러오는 중...</p>';
    modal.style.display = 'block';
    fetchAndShowReviews(gameName);
}

function fetchAndShowReviews(gameName) {
    const reviewListDiv = document.getElementById('review-list');
    const reviewSheetQuery = new google.visualization.Query('https://spreadsheets.google.com/tq?key=1RoujVUSQD7mOI2tpeqBszpjjt4tkgLEpr1LHcWND3O8&gid=176236996');
    reviewSheetQuery.send(function(response) {
        if (response.isError()) {
            reviewListDiv.innerHTML = '<p>후기를 불러오는 데 실패했습니다.</p>';
            return;
        }
        const dataTable = response.getDataTable();
        const reviews = JSON.parse(dataTable.toJSON()).rows;
        const filteredReviews = reviews.filter(row => row.c[0] && row.c[0].v === gameName);
        reviewListDiv.innerHTML = '';
        if (filteredReviews.length === 0) {
            reviewListDiv.innerHTML = '<p>아직 작성된 후기가 없습니다.</p>';
        } else {
            filteredReviews.forEach(reviewData => {
                const reviewer = reviewData.c[1] ? reviewData.c[1].v : '익명';
                const content = reviewData.c[2] ? reviewData.c[2].v : '';
                const item = document.createElement('div');
                item.className = 'review-item';
                item.innerHTML = `
                    <p class="reviewer">${reviewer}</p>
                    <p>${content.replace(/\n/g, '<br>')}</p>
                `;
                reviewListDiv.appendChild(item);
            });
        }
    });
}

let currentMouseX;
let currentMouseY;
let tooltipTimer;
$(document).on("mouseenter", ".card", function(e) {
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
$(document).on("mousemove", ".card", function(e) {
    tooltip.style.top = e.clientY + 15 + "px";
    tooltip.style.left = e.clientX + 15 + "px";
    currentMouseX = e.clientX;
    currentMouseY = e.clientY;
});
$(document).on("mouseleave", ".card", function() {
    clearTimeout(tooltipTimer);
    tooltip.style.display = "none";
});

const typeToClassLabel = {
    1: { class: "rank-first", label: "1위" },
    2: { class: "rank-second", label: "2위" },
    3: { class: "rank-third", label: "3위" },
    4: { class: "rank-special", label: "장려상" },
    5: { class: "rank-external", label: "대외 수상" },
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

function initIntro() {
    $(".game").empty();
    const keyStr = '#edgeIntro';
    if (selectedMenu !== -1) {
        $(selectedMenu).removeClass('selected');
    }
    $(keyStr).addClass('selected');
    selectedMenu = keyStr;

    const introHtml = `
        <div class="intro-card">
            <h2>EDGE 동아리 소개</h2>
            <hr>
            <p>안녕하세요!</p>
            <p><strong>EDGE(Extreme Development Game Ecole)</strong>는 건국대학교 서울캠퍼스 유일 게임제작 중앙 동아리입니다.</p>
            <p>매년 교내 게임 개발 경진대회를 개최하여 학생들의 창의적인 게임을 발굴하고 시상하고 있습니다. 이 웹사이트는 역대 경진대회 출품작들을 한눈에 볼 수 있도록 정리한 아카이브입니다.</p>
            <h3>주요 활동</h3>
            <ul>
                <li>정기적인 게임 개발/기획 스터디 진행</li>
                <li>그 외 다양한 주제의 상호 스터디 진행</li>
                <li>매 학기 게임 개발 경진대회 진행</li>
                <li>전국 대학생 게임제작 동아리 연합 "UNIDEV" 활동</li>
            </ul>
            <div class="social-links">
                <a href="https://cafe.naver.com/imedge" target="_blank">네이버 카페 바로가기</a>
            </div>
        </div>
    `;
    $(".game").html(introHtml);
}
