let allSurahs = [];
let currentAudio = null;
let surahAyahsData = {};
let currentReciter = 'ar.alafasy';
let pressTimer = null;

const reciters = {
    'ar.alafasy': 'مشاري العفاسي',
    'ar.mahermuaiqly': 'ماهر المعيقلي',
    'ar.sudais': 'عبد الرحمن السديس',
    'ar.yasserdosari': 'ياسر الدوسري',
    'ar.abdulbasitmurattal': 'عبد الباسط عبد الصمد',
    'ar.minshawi': 'محمد صديق المنشاوي'
};

async function loadSurahs() {
    try {
        const response = await fetch('https://api.alquran.cloud/v1/surah');
        const result = await response.json();
        allSurahs = result.data;
        displaySurahs(allSurahs);
    } catch (error) {
        console.log("خطأ في التحميل:", error);
    }
}

function displaySurahs(surahs) {
    const container = document.getElementById('surahs-container');
    container.innerHTML = '';
    
    let reciterOptions = '';
    for (let key in reciters) {
        reciterOptions += `<option value="${key}">${reciters[key]}</option>`;
    }
    
    surahs.forEach(surah => {
        const card = document.createElement('div');
        card.className = 'surah-card';
        card.innerHTML = `
            <h3>سورة ${surah.name}</h3>
            <p>عدد الآيات: ${surah.numberOfAyahs} | ${surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}</p>
            
            <div style="margin: 6px 0;">
                <label style="font-size:11px; color:#ccc;">القارئ: </label>
                <select id="reciter-${surah.number}" onchange="changeReciter(${surah.number})" style="background:#252525; color:#fff; border:1px solid #444; border-radius:4px; padding:2px; font-size:11px;">
                    ${reciterOptions}
                </select>
            </div>

            <div class="btn-group">
                <button onclick="toggleAyahs(${surah.number}, this)">عرض الآيات</button>
                <button class="play-surah-btn" id="play-btn-${surah.number}" onclick="playFullSurah(${surah.number})" style="display:none;">استماع للسورة 🔊</button>
                <button style="background:#e53935; display:none;" id="stop-btn-${surah.number}" onclick="stopAudio()">إيقاف 🛑</button>
            </div>
            <div class="ayahs-box" id="ayahs-${surah.number}">
                <div id="list-${surah.number}">جاري تحميل الآيات...</div>
            </div>
        `;
        container.appendChild(card);
    });
}

function filterSurahs() {
    const query = document.getElementById('searchSurah').value.trim();
    const filtered = allSurahs.filter(s => s.name.includes(query) || s.englishName.toLowerCase().includes(query.toLowerCase()));
    displaySurahs(filtered);
}

function filterAyahs() {
    const query = document.getElementById('searchAyah').value.trim();
    if (!query) return;
    const cards = document.querySelectorAll('.surah-card');
    cards.forEach(card => {
        if (card.innerText.includes(query)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

async function changeReciter(surahNumber) {
    const select = document.getElementById(`reciter-${surahNumber}`);
    currentReciter = select.value;
    delete surahAyahsData[surahNumber];
    
    const box = document.getElementById(`ayahs-${surahNumber}`);
    if (box.style.display === 'block') {
        const listDiv = document.getElementById(`list-${surahNumber}`);
        listDiv.innerHTML = 'جاري تغيير القارئ...';
        await fetchAyahs(surahNumber);
    }
}

async function fetchAyahs(surahNumber) {
    const listDiv = document.getElementById(`list-${surahNumber}`);
    try {
        const res = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/${currentReciter}`);
        const data = await res.json();
        
        surahAyahsData[surahNumber] = data.data.ayahs;
        
        let html = '';
        data.data.ayahs.forEach((ayah, index) => {
            html += `
                <span class="ayah-text" 
                      id="ayah-${surahNumber}-${index}"
                      onmousedown="startLongPress(${surahNumber}, ${index})" 
                      ontouchstart="startLongPress(${surahNumber}, ${index})"
                      onmouseup="cancelLongPress()" 
                      ontouchend="cancelLongPress()"
                      title="اضغط مطولاً للاستماع والمتابعة من هذه الآية">
                    ${ayah.text} <span class="ayah-number">﴿${ayah.numberInSurah}﴾</span>
                </span>
            `;
        });
        listDiv.innerHTML = html;
    } catch (e) {
        listDiv.innerHTML = 'حدث خطأ أثناء تحميل الآيات.';
    }
}

async function toggleAyahs(surahNumber, btn) {
    const box = document.getElementById(`ayahs-${surahNumber}`);
    const listDiv = document.getElementById(`list-${surahNumber}`);
    const playBtn = document.getElementById(`play-btn-${surahNumber}`);
    
    if (box.style.display === 'block') {
        box.style.display = 'none';
        btn.innerText = 'عرض الآيات';
        playBtn.style.display = 'none';
        stopAudio();
        return;
    }
    
    box.style.display = 'block';
    btn.innerText = 'إخفاء الآيات';
    playBtn.style.display = 'inline-block';
    
    if (listDiv.innerHTML.includes('جاري تحميل')) {
        await fetchAyahs(surahNumber);
    }
}

function playFullSurah(surahNumber) {
    playAyahSequence(surahNumber, 0);
}

function startLongPress(surahNumber, ayahIndex) {
    pressTimer = setTimeout(() => {
        playAyahSequence(surahNumber, ayahIndex);
        if (navigator.vibrate) navigator.vibrate(50);
    }, 600);
}

function cancelLongPress() {
    clearTimeout(pressTimer);
}

function playAyahSequence(surahNumber, currentIndex) {
    const ayahs = surahAyahsData[surahNumber];
    if (!ayahs || currentIndex >= ayahs.length) return;
    
    const currentAyah = ayahs[currentIndex];
    
    stopAudio();
    
    const stopBtn = document.getElementById(`stop-btn-${surahNumber}`);
    if (stopBtn) stopBtn.style.display = 'inline-block';
    
    currentAudio = new Audio(currentAyah.audio);
    currentAudio.preload = "auto";
    currentAudio.play();
    
    highlightAyah(surahNumber, currentIndex);
    
    currentAudio.onended = () => {
        playAyahSequence(surahNumber, currentIndex + 1);
    };
}

function stopAudio() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
    document.querySelectorAll('[id^="stop-btn-"]').forEach(btn => btn.style.display = 'none');
    document.querySelectorAll('.ayah-text').forEach(el => el.style.color = '#fff');
}

function highlightAyah(surahNumber, index) {
    document.querySelectorAll('.ayah-text').forEach(el => el.style.color = '#fff');
    const activeEl = document.getElementById(`ayah-${surahNumber}-${index}`);
    if (activeEl) {
        activeEl.style.color = '#4CAF50';
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

loadSurahs();
