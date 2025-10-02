// ★★★ ここにデプロイしたGASのURLを貼り付けてください ★★★
const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbzQeHK-kMmobW1HduWWOuMTpIDs8X5vj7PG8CKZI7f3amzUEYVCaJP3uyC23L_lBe0z0A/exec';

// DOM要素の取得
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
    // 日本時間 (+9時間) に合わせてフォーマット
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
}

/**
 * 討伐報告モーダルを表示し、モブ情報をセットする
 */
function openReportModal(mob) {
    // 3. 必要な情報を表示
    document.getElementById('modal_mob_display').textContent = mob['モブ名'];
    document.getElementById('modal_area_display').textContent = mob['エリア'];

    // フォームの隠しフィールドにモブ情報をセット
    document.getElementById('report_mobName').value = mob['モブ名'];
    document.getElementById('report_mobRank').value = mob['ランク'];
    document.getElementById('report_area').value = mob['エリア'];

    // 4. 現在時刻をセットし、編集可能にする
    reportTimeInput.value = getCurrentDateTimeLocal();
    
    messageElement.classList.add('hidden'); // メッセージを隠す
    modal.style.display = 'block';
}

/**
 * モーダルを閉じる
 */
function closeReportModal() {
    modal.style.display = 'none';
}

// モーダルイベントリスナー
closeButton.onclick = closeReportModal;
window.onclick = function(event) {
    if (event.target == modal) {
        closeReportModal();
    }
}

/**
 * GAS APIからモブ一覧データを取得し、HTMLに表示するメイン関数
 */
async function fetchAndDisplayMobList() {
    mobListElement.innerHTML = `<p>データを読み込み中...</p>`; // ローディングメッセージ

    try {
        const response = await fetch(GAS_API_URL);
        const result = await response.json();

        if (result.status === 'error') {
            mobListElement.innerHTML = `<p class="error">データ取得エラー: ${result.message}</p>`;
            return;
        }

        const mobList = result.mobList; // GASから返されるモブ一覧
        // const huntList = result.huntList; // 討伐履歴は今回は表示に使用しません
        
        if (!mobList || mobList.length === 0) {
            mobListElement.innerHTML = `<p>登録されているモンスター情報がありません。</p>`;
            return;
        }

        // 1. ホームページ上に最初から全モンスターを表示
        const htmlContent = mobList.map(mob => {
            // 最終討伐時間の検索ロジックなどをここに将来的に追加
            
            return `
                <div class="mob-card">
                    <div class="mob-info">
                        <div class="mob-name">${mob['モブ名']} 
                            <span class="mob-rank">${mob['ランク']}ランク</span>
                        </div>
                        <div class="mob-area">
                            エリア: ${mob['エリア']}
                        </div>
                    </div>
                    
                    <button class="report-button" 
                            data-mob='${JSON.stringify(mob)}'>
                        討伐報告
                    </button>
                    
                    <div class="mob-extra-info">
                        ${mob['備考（将来のマップツール用）'] || '（備考情報なし）'}
                    </div>
                </div>
            `;
        }).join('');

        mobListElement.innerHTML = htmlContent;

        // ボタンにイベントリスナーを追加
        document.querySelectorAll('.report-button').forEach(button => {
            button.addEventListener('click', () => {
                // data-mob 属性からモブ情報を取得
                const mob = JSON.parse(button.getAttribute('data-mob'));
                openReportModal(mob);
            });
        });

    } catch (e) {
        mobListElement.innerHTML = `<p class="error">ネットワーク接続に失敗しました。API URLを確認してください。</p>`;
        console.error("Fetch error:", e);
    }
}

// フォーム送信時の処理 (doPost)
reportForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    submitButton.disabled = true;
    submitButton.textContent = '報告送信中...';
    messageElement.classList.add('hidden');

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
        etTime: '' // ET討伐時間はGAS側で計算するか、今回は空で送る
    };

    try {
        const response = await fetch(GAS_API_URL, {
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
            // 報告成功後、リストを再読み込み
            fetchAndDisplayMobList(); 
            // モーダルを自動で閉じる
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

// ページロード時にデータ取得を開始
fetchAndDisplayMobList();
