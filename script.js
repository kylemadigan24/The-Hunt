// ★★★ GAS APIのURLは討伐報告（POST）でのみ使用します ★★★
const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbzQeHK-kMmobW1HduWWOuMTpIDs8X5vj7PG8CKZI7f3amzUEYVCaJP3uyC23L_lBe0z0A/exec';

// DOM要素の取得 (前回と変更なし)
const mobListElement = document.getElementById('mob-list');
const modal = document.getElementById('report-modal');
const closeButton = document.getElementsByClassName('close-button')[0];
const reportForm = document.getElementById('report-form');
const reportTimeInput = document.getElementById('report_time');
const messageElement = document.getElementById('message');
const submitButton = document.getElementById('submit-report-button');

/**
 * ユーティリティ: 現在時刻を <input type="datetime-local"> 形式にフォーマット
 */
function getCurrentDateTimeLocal() {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
}

/**
 * 討伐報告モーダルを表示し、モブ情報をセットする
 */
function openReportModal(mob) {
    // 必要な情報を表示・セット (前回と変更なし)
    document.getElementById('modal_mob_display').textContent = mob['モブ名'];
    document.getElementById('modal_area_display').textContent = mob['エリア'];

    document.getElementById('report_mobName').value = mob['モブ名'];
    document.getElementById('report_mobRank').value = mob['ランク'];
    document.getElementById('report_area').value = mob['エリア'];

    reportTimeInput.value = getCurrentDateTimeLocal();
    
    messageElement.classList.add('hidden');
    modal.style.display = 'block';
}

// モーダルイベントリスナー (前回と変更なし)
closeButton.onclick = closeReportModal;
window.onclick = function(event) {
    if (event.target == modal) {
        closeReportModal();
    }
}

function closeReportModal() {
    modal.style.display = 'none';
}

/**
 * モブ一覧データをローカルから取得し、HTMLに表示するメイン関数
 * ★API通信がなくなり、高速になります
 */
function displayMobList() {
    
    // mob-data.js で定義された ALL_MOBS_DATA を直接使用
    const mobList = ALL_MOBS_DATA; 
        
    if (!mobList || mobList.length === 0) {
        mobListElement.innerHTML = `<p>登録されているモンスター情報がありません。</p>`;
        return;
    }

        const htmlContent = mobList.map(mob => {
            
            return `
                <div class="mob-card">
                    
                    <div class="mob-info-group">
                        <div class="mob-rank-badge">${mob['ランク']}</div>
                        
                        <div class="mob-name-and-area">
                            <div class="mob-name">${mob['モブ名']}</div>
                            <div class="mob-area">エリア: ${mob['エリア']}</div>
                        </div>
                    </div>
                    
                    <div class="report-button-wrapper">
                        <button class="report-button" 
                                data-mob='${JSON.stringify(mob)}'>
                            報告
                        </button>
                    </div>
                    
                    <div class="mob-extra-info">
                        ${mob['備考（将来のマップツール用）'] || '（備考情報なし）'}
                    </div>
                </div>
            `;
        }).join('');

        mobListElement.innerHTML = htmlContent;
    
    document.querySelectorAll('.report-button').forEach(button => {
        button.addEventListener('click', () => {
            const mob = JSON.parse(button.getAttribute('data-mob'));
            openReportModal(mob);
        });
    });
}

// フォーム送信時の処理 (doPost) はGASへ送信するため変更なし
reportForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    submitButton.disabled = true;
    submitButton.textContent = '報告送信中...';
    messageElement.classList.add('hidden');

    // ... 中略（フォームデータの取得は変更なし） ...
    
    // フォームからデータを取得
    const mobName = document.getElementById('report_mobName').value;
    const mobRank = document.getElementById('report_mobRank').value;
    const area = document.getElementById('report_area').value;
    const reportTime = document.getElementById('report_time').value; // 編集された日時
    const world = document.getElementById('report_world').value;
    const reporter = document.getElementById('report_reporter').value;

    const payload = {
        mobName: mobName,
        mobRank: mobRank,
        area: area,
        world: world,
        reporter: reporter,
        reportTime: reportTime, // 討伐日時
        etTime: '' 
    };

    try {
        const response = await fetch(GAS_API_URL, { // ★GAS APIにPOST通信
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        const result = await response.json();

        if (result.status === 'success') {
            messageElement.textContent = result.message;
            messageElement.className = 'success';
            reportForm.reset(); 
            // 報告成功後、リストを再読み込みする処理は不要になりました
            setTimeout(closeReportModal, 1500); 
        } else {
            messageElement.textContent = result.message;
            messageElement.className = 'error';
        }
        
    } catch (error) {
        messageElement.textContent = '通信エラーが発生しました。';
        messageElement.className = 'error';
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = '報告を確定する';
        messageElement.classList.remove('hidden');
    }
});

// ページロード時にデータ表示を開始
displayMobList();
