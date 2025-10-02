// ★★★ ここにデプロイしたGASのURLを貼り付けてください ★★★
const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbzQeHK-kMmobW1HduWWOuMTpIDs8X5vj7PG8CKZI7f3amzUEYVCaJP3uyC23L_lBe0z0A/exec';

/**
 * データをGAS APIから取得し、HTMLに表示するメイン関数
 */
async function fetchAndDisplayData() {
    const listElement = document.getElementById('hunt-list');
    
    try {
        const response = await fetch(GAS_API_URL);
        const result = await response.json();

        // GASからエラーが返された場合
        if (result.status === 'error') {
            listElement.innerHTML = `<p class="error">データ取得エラー: ${result.message}</p>`;
            return;
        }

        const data = result.data;
        
        if (!data || data.length === 0) {
            listElement.innerHTML = `<p>現在、報告されている討伐データはありません。</p>`;
            return;
        }

        // データを「討伐日時 (UTC)」の新しい順にソート（昇順なら逆順に）
        // 日付文字列をDateオブジェクトに変換して比較
        data.sort((a, b) => new Date(b['討伐日時 (UTC)']) - new Date(a['討伐日時 (UTC)']));
        
        // HTML要素を構築
        const htmlContent = data.map(item => {
            const utcTime = new Date(item['討伐日時 (UTC)']);
            // 日本時間（JST）に変換して表示
            const jstTime = utcTime.toLocaleString('ja-JP', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZone: 'Asia/Tokyo'
            });

            // カードの色やスタイルをランクによって変えることもできますが、今回はシンプルに統一
            return `
                <div class="hunt-card">
                    <div class="mob-name">${item['モブ名']} 
                        <span class="mob-rank rank-${item['ランク'].toLowerCase()}">${item['ランク']}ランク</span>
                    </div>
                    <div class="details">
                        <p>討伐日時 (JST): <span>${jstTime}</span></p>
                        <p>エリア: <span>${item['エリア']}</span></p>
                        <p>ワールド: <span>${item['ワールド']}</span></p>
                        <p>報告者: <span>${item['報告者'] || '不明'}</span></p>
                    </div>
                </div>
            `;
        }).join('');

        listElement.innerHTML = htmlContent;

    } catch (e) {
        // ネットワークエラーなど
        listElement.innerHTML = `<p class="error">ネットワーク接続に失敗しました。API URLを確認してください。</p>`;
        console.error("Fetch error:", e);
    }
}

// ページロード時にデータ取得を開始
fetchAndDisplayData();
