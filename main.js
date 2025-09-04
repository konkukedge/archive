// main.js (전체 교체)

var jsonData;
var gameDictionary;
var selectedMenu = -1;

// ✅ Google Apps Script 웹 앱 URL (위 단계에서 복사한 URL로 교체하세요)
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx50iKmE7Wret4IQu4DG2LKje76QmpwhZ7Ywmf1Ehn0DGZok5ZozHHxvW9EK4wnRWfDyA/exec";

// ✅ 마우스 툴팁 엘리먼트 생성
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
    $('#loader').show(); // 시작 시 로딩 표시
    gameDictionary = new Map();
    google.charts.load('current', {
        packages: ['corechart']
    }).then(function() {
        // 게임 목록 불러오기
        var query = new google.visualization.Query('https://spreadsheets.google.com/tq?key=1RoujVUSQD7mOI2tpeqBszpjjt4tkgLEpr1LHcWND3O8&pub=1');
        query.send(function(response) {
            console.log(response);
            const dataTable = response.getDataTable();

            jsonData = dataTable.toJSON();
            jsonData = JSON.parse(jsonData);
            for (var i = 0; i < jsonData.rows.length; i++) {
                var key = jsonData.rows[i].c[0].v;
                if (!gameDictionary.has(key)) {
                    gameDictionary.set(key, []);
                    var htmlData = "<p id=\"" + key.replace(' ', '') + "\" class=\"menu\" onclick=\"initGame(\'" + key + "\')\">" + jsonData.rows[i].c[0].v;
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
            initGame(lastKey);
            $('#loader').fadeOut(); // 데이터 로딩 완료 후 숨김
            initIntro();
        });
    });

    document.body.appendChild(tooltip);

    // --- 후기 기능 이벤트 리스너 (추가) ---
    const modal = document.getElementById('review-modal');
    const closeButton = document.querySelector('.close-button');
    const reviewForm = document.getElementById('review-form');

    // 닫기 버튼이나 모달 바깥을 클릭하면 닫힘
    closeButton.onclick = () => modal.style.display = 'none';
    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };

    // 후기 폼 제출 이벤트
    reviewForm.addEventListener('submit', function(e) {
        e.preventDefault(); // 기본 제출 동작 방지
        const submitButton = this.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = '등록 중...';

        const formData = {
            gameName: document.getElementById('game-name-input').value,
            reviewerName: document.getElementById('reviewer-name').value,
            reviewContent: document.getElementById('review-text').value,
        };

        // Google Apps Script로 데이터 전송
        fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(formData),
            headers: { 'Content-Type': 'application/json' },
            mode: 'no-cors' // 응답을 받지 않는 모드
        })
        .then(() => {
            alert('후기가 성공적으로 등록되었습니다!');
            // 폼 초기화 및 후기 목록 새로고침
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
    const keyStr = '#' + key.replace(' ', '');
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

        // 수상 등급별 클래스 설정
        applyRankBadge(newDiv, game.rank);

        // ✅ 카드 클릭 시 후기 모달 열기 (이벤트 추가)
        newDiv.addEventListener('click', () => {
            openReviewModal(game.name);
        });

        // 카드 내용 생성 (기존과 동일)
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
        cafe.onclick = (e) => e.stopPropagation(); // 링크 클릭 시 모달 안 뜨게 함
        const downloadlink = document.createElement("a");
        downloadlink.href = game.download;
        downloadlink.target = "_blank";
        downloadlink.className = "download";
        downloadlink.innerHTML = "다운로드";
        downloadlink.onclick = (e) => e.stopPropagation(); // 링크 클릭 시 모달 안 뜨게 함
        newDiv.appendChild(img);
        newDiv.appendChild(p1);
        newDiv.appendChild(p2);
        newDiv.appendChild(p3);
        newDiv.appendChild(cafe);
        newDiv.appendChild(downloadlink);

        $(".game").append(newDiv);
    }
}

// --- 후기 관련 함수들 (추가) ---

// 후기 모달을 여는 함수
function openReviewModal(gameName) {
    const modal = document.getElementById('review-modal');
    document.getElementById('modal-game-title').textContent = gameName;
    document.getElementById('game-name-input').value = gameName; // 폼의 숨겨진 필드에 게임 이름 저장
    document.getElementById('review-list').innerHTML = '<p>후기를 불러오는 중...</p>';
    modal.style.display = 'block';
    fetchAndShowReviews(gameName);
}

// 구글 시트에서 후기를 불러와 표시하는 함수
function fetchAndShowReviews(gameName) {
    const reviewListDiv = document.getElementById('review-list');
    
    // 후기 시트의 GID를 사용해야 합니다.
    const reviewSheetQuery = new google.visualization.Query('https://spreadsheets.google.com/tq?key=1RoujVUSQD7mOI2tpeqBszpjjt4tkgLEpr1LHcWND3O8&gid=176236996');
    
    reviewSheetQuery.send(function(response) {
        if (response.isError()) {
            reviewListDiv.innerHTML = '<p>후기를 불러오는 데 실패했습니다.</p>';
            return;
        }

        const dataTable = response.getDataTable();
        const reviews = JSON.parse(dataTable.toJSON()).rows;
        
        // 해당 게임의 후기만 필터링
        const filteredReviews = reviews.filter(row => row.c[0] && row.c[0].v === gameName);

        reviewListDiv.innerHTML = ''; // 기존 목록 초기화

        if (filteredReviews.length === 0) {
            reviewListDiv.innerHTML = '<p>아직 작성된 후기가 없습니다.</p>';
        } else {
            // 최신순으로 정렬 (시트에 날짜 데이터가 있다면 사용)
            // filteredReviews.reverse(); // 간단하게 역순으로
            filteredReviews.forEach(reviewData => {
                const reviewer = reviewData.c[1] ? reviewData.c[1].v : '익명';
                const content = reviewData.c[2] ? reviewData.c[2].v : '';

                const item = document.createElement('div');
                item.className = 'review-item';
                item.innerHTML = `
                    <p class="reviewer">${reviewer}</p>
                    <p>${content.replace(/\n/g, '<br>')}</p> 
                `; // 줄바꿈 문자 처리
                reviewListDiv.appendChild(item);
            });
        }
    });
}


// --- 기존 툴팁 및 뱃지 관련 코드 (수정 없음) ---
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
            <p><strong>EDGE(Enjoy & Development Game Every Day)</strong>는 게임 개발에 관심 있는 학생들이 모여 자유롭게 아이디어를 공유하고, 다양한 게임을 직접 만들어보는 동아리입니다.</p>
            <p>매년 교내 게임 개발 경진대회를 개최하여 학생들의 창의적인 게임을 발굴하고 시상하고 있습니다. 이 웹사이트는 역대 경진대회 출품작들을 한눈에 볼 수 있도록 정리한 아카이브입니다.</p>
            <h3>주요 활동</h3>
            <ul>
                <li>정기적인 게임 개발 스터디 및 프로젝트 진행</li>
                <li>게임 개발 경진대회 참여 및 주최</li>
                <li>게임 잼(Game Jam) 참가 및 자체 개발</li>
                <li>외부 개발자 특강 및 세미나 개최</li>
            </ul>
            <div class="social-links">
                <a href="https://cafe.naver.com/edgeclub" target="_blank">네이버 카페 바로가기</a>
            </div>
        </div>
    `;
    $(".game").html(introHtml);
}
