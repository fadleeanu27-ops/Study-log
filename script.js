let db = JSON.parse(localStorage.getItem('study_v8_db')) || {};
const datePicker = document.getElementById('datePicker');
const subjectInput = document.getElementById('subjectInput');
const saveBadge = document.getElementById('saveBadge');

if (!datePicker.value) datePicker.valueAsDate = new Date();
const colors = ['#6366F1', '#10B981', '#F59E0B', '#F43F5E', '#8B5CF6', '#06B6D4'];

function formatTime(totalMins) {
    if (totalMins === 0) return "0 นาที";
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    if (h > 0) return m > 0 ? `${h} ชม. ${m} น.` : `${h} ชม.`;
    return `${m} นาที`;
}

function autoSave() {
    localStorage.setItem('study_v8_db', JSON.stringify(db));
    localStorage.setItem('study_v8_user', document.getElementById('userName').value);
    saveBadge.style.opacity = "1";
    setTimeout(() => saveBadge.style.opacity = "0", 1200);
    render();
}

function addSubject() {
    const name = subjectInput.value.trim();
    if (!name) return;
    const date = datePicker.value;
    if (!db[date]) db[date] = [];
    const color = colors[db[date].length % colors.length];
    db[date].push({ name, color, ticks: new Array(144).fill(0) });
    subjectInput.value = '';
    autoSave();
}

function toggleTick(subIdx, tickIdx) {
    const date = datePicker.value;
    db[date][subIdx].ticks[tickIdx] = db[date][subIdx].ticks[tickIdx] === 1 ? 0 : 1;
    autoSave();
}

function render() {
    const date = datePicker.value;
    const list = document.getElementById('subjectList');
    list.innerHTML = '';
    let grandTotal = 0;
    const subjects = db[date] || [];

    if (subjects.length === 0) {
        list.innerHTML = `<div class="text-center py-20 text-slate-200 italic font-light">ยังไม่มีข้อมูลในวันนี้</div>`;
    }

    subjects.forEach((sub, subIdx) => {
        const subMins = sub.ticks.filter(t => t === 1).length * 10;
        grandTotal += subMins;

        const card = document.createElement('div');
        let hoursHTML = '';
        for (let h = 0; h < 24; h++) {
            let ticksHTML = '';
            let hasActive = false;
            for (let m = 0; m < 6; m++) {
                const idx = (h * 6) + m;
                const active = sub.ticks[idx] === 1;
                if (active) hasActive = true;
                ticksHTML += `<div onclick="toggleTick(${subIdx}, ${idx})" class="tick-box ${active ? '' : 'bg-slate-50 empty-tick'}" style="${active ? `background-color:${sub.color};` : ''}"></div>`;
            }
            hoursHTML += `<div class="hour-row ${hasActive ? 'has-data-row' : 'no-data-row'} mb-2.5"><span class="text-[10px] font-bold text-slate-200 font-mono">${String(h).padStart(2, '0')}:00</span><div class="tick-grid">${ticksHTML}</div></div>`;
        }

        card.innerHTML = `
            <div class="flex justify-between items-end mb-6 group">
                <div>
                    <h3 class="font-bold text-2xl text-slate-700 tracking-tight">${sub.name}</h3>
                    <p class="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">${formatTime(subMins)}</p>
                </div>
                <button onclick="deleteSub(${subIdx})" class="btn-delete opacity-0 group-hover:opacity-100 text-slate-200 hover:text-red-400 text-[10px] font-bold uppercase transition-all">Delete</button>
            </div>
            <div>${hoursHTML}</div>
        `;
        list.appendChild(card);
    });

    document.getElementById('grandTotal').innerText = formatTime(grandTotal);
    document.getElementById('userName').value = localStorage.getItem('study_v8_user') || "";
}

function openStats() {
    const date = datePicker.value;
    const subjects = db[date] || [];
    let totalMins = 0;
    subjects.forEach(s => totalMins += s.ticks.filter(t => t === 1).length * 10);
    const totalHours = totalMins / 60;

    document.getElementById('modalTotalTime').innerText = formatTime(totalMins);
    const box = document.getElementById('evaluationBox');
    const txt = document.getElementById('evaluationText');

    if (totalHours >= 8) {
        txt.innerText = "ดีมาก! 🌟";
        box.className = "py-6 rounded-[2rem] text-center border-2 eval-excellent";
    } else if (totalHours < 7) {
        txt.innerText = "ต้องขยันมากกว่านี้ ✍️";
        box.className = "py-6 rounded-[2rem] text-center border-2 eval-harder";
    } else {
        txt.innerText = "พยายามได้ดีแล้ว 👍";
        box.className = "py-6 rounded-[2rem] text-center border-2 eval-standard";
    }
    document.getElementById('statsModal').classList.remove('hidden');
}

function closeStats() { document.getElementById('statsModal').classList.add('hidden'); }

function deleteSub(idx) { 
    if(confirm('ลบวิชานี้?')) { 
        db[datePicker.value].splice(idx, 1); 
        autoSave(); 
    } 
}

async function takeScreenshot() {
    const area = document.getElementById('capture-area');
    area.classList.add('is-capturing');
    setTimeout(async () => {
        const canvas = await html2canvas(area, { scale: 3, backgroundColor: "#ffffff", borderRadius: 40 });
        const link = document.createElement('a');
        link.download = `StudyLog-${datePicker.value}.png`;
        link.href = canvas.toDataURL();
        link.click();
        area.classList.remove('is-capturing');
    }, 200);
}

// บันทึกชื่ออัตโนมัติเมื่อหยุดพิมพ์
let nameTimeout;
document.getElementById('userName').addEventListener('input', () => {
    clearTimeout(nameTimeout);
    nameTimeout = setTimeout(autoSave, 800);
});

datePicker.addEventListener('change', render);
render();