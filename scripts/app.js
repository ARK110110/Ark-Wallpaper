import { weeklySchedule } from "./data.mjs";

let prayerTimes = {};

// convert "HH:mm" → menit
function toMinutes(time) {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
}

// VARIABEL GLOBAL UNTUK MOCKING (TARUH DI ATAS FUNGSI nowMinutes)
window.mockTime = null; 

// Fungsi mengambil waktu sekarang (bisa di-override untuk testing)
function nowMinutes() {
    // Jika kita sedang set waktu palsu, gunakan waktu palsu tersebut
    if (window.mockTime) {
        const [h, m] = window.mockTime.split(":").map(Number);
        return h * 60 + m;
    }

    // Jika tidak sedang testing, berjalan normal mengikuti jam komputer
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
}
// urutan waktu sholat
const order = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

// cari index aktif
function getActiveIndex() {
    const now = nowMinutes();

    const times = order.map(key => toMinutes(prayerTimes[key]));

    for (let i = 0; i < times.length; i++) {
        const start = times[i];
        const end = times[i + 1] ?? 24 * 60; // sampai akhir hari

        if (now >= start && now < end) {
            return i;
        }
    }

    return 0;
}

// render arc (SIMPEL VERSION DOM)
function renderArcs() {
    const activeIndex = getActiveIndex();

    document.querySelectorAll(".arc").forEach((arc, i) => {
        if (i === activeIndex) {
            arc.style.background = "white";
            arc.style.opacity = "1";
            arc.style.transform = "scale(1.05)";
        } else {
            arc.style.background = "rgba(255,255,255,0.15)";
            arc.style.opacity = "0.4";
            arc.style.transform = "scale(1)";
        }
    });
}

// update jam + arc tiap detik
function startClock() {
    setInterval(() => {
        const now = new Date();
        document.getElementById("clock").innerText =
            now.toLocaleTimeString("id-ID");

        renderArcs();
    }, 1000);
}

async function loadPrayerTimes(){

    const response =
        await fetch(
            "https://api.aladhan.com/v1/timingsByCity?city=Sukmajaya&country=Indonesia&method=11"
        );

    const data =
        await response.json();

    prayerTimes = {
        Subuh: data.data.timings.Fajr,
        Dzuhur: data.data.timings.Dhuhr,
        Ashar: data.data.timings.Asr,
        Maghrib: data.data.timings.Maghrib,
        Isya: data.data.timings.Isha
    };

    drawPrayerRing();
}

loadPrayerTimes();

const hariID = [
    "Minggu",
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu"
];

const hariEN = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
];

function updateClock(){

    const now = new Date();

    const h = String(
        now.getHours()
    ).padStart(2,"0");

    const m = String(
        now.getMinutes()
    ).padStart(2,"0");

    const s = String(
        now.getSeconds()
    ).padStart(2,"0");

    // =====================
    // MAIN CLOCK
    // =====================

    document.getElementById("clock").textContent =
        `${h}:${m}:${s}`;

    const dayIndex = now.getDay();

    document.getElementById("day").textContent =
    `${hariID[dayIndex].toUpperCase()} // ${hariEN[dayIndex].toUpperCase()}`;

    document.getElementById("date").textContent =
        now.toLocaleDateString("en-US",{
            month:"long",
            day:"numeric",
            year:"numeric"
        }).toUpperCase();

    document.getElementById("todayBtn").textContent =
        `Jadwal ${hariID[dayIndex]}`;

    document.getElementById("tomorrowBtn").textContent =
        `Jadwal ${hariID[(dayIndex + 1) % 7]}`;

    // =====================
    // PRAYER CLOCK
    // =====================

    const prayerClock =
        document.getElementById("prayerClock");

    const prayerDate =
        document.getElementById("prayerDate");

    if(prayerClock){
        prayerClock.textContent =
            `${h}:${m}:${s}`;
    }

    if(prayerDate){
        prayerDate.textContent =
            now.toLocaleDateString(
                "id-ID",
                {
                    weekday:"long",
                    day:"numeric",
                    month:"long",
                    year:"numeric"
                }
            );
    }

    updatePrayerHighlight();
}

setInterval(updateClock,1000);
setInterval(updateActiveSchedule,1000);
updateActiveSchedule();
updateClock();



function getToday(){
    return hariID[
        new Date().getDay()
    ];
}

function getTomorrow(){
    return hariID[
        (new Date().getDay()+1)%7
    ];
}

let opened = null;

function toggleSchedule(type){

    const clockSection =
        document.getElementById("clockSection");

    const panel =
        document.getElementById("schedulePanel");

    const title =
        document.getElementById("scheduleTitle");

    const content =
        document.getElementById("scheduleContent");

    // CLOSE
    if(opened === type){

        panel.classList.remove(
            "panel-open"
        );

        clockSection.style.left = "50%";

        opened = null;

        return;
    }

    // OPEN
    const dayName =
        type === "today"
            ? getToday()
            : getTomorrow();

    title.textContent = dayName;

    const items = weeklySchedule[dayName];

    const html = items.map(item => `
        <div
            class="
                schedule-item
                flex
                justify-between
                items-center
                border-b
                border-zinc-800
                py-4
                px-3
                rounded-[8px]
                transition-all
                duration-500
            "
            data-time="${item.Time}"
            data-copy="1"
        >

            <span class="schedule-time text-zinc-500">
                ${item.Time}
            </span>

            <span class="schedule-task text-zinc-200">
                ${item.Task}
            </span>

        </div>
    `).join("");

    const duplicatedHtml = items.map(item => `
        <div
            class="
                schedule-item
                flex
                justify-between
                items-center
                border-b
                border-zinc-800
                py-4
                px-3
                rounded-[8px]
                transition-all
                duration-500
            "
            data-time="${item.Time}"
            data-copy="2"
        >

            <span class="schedule-time text-zinc-500">
                ${item.Time}
            </span>

            <span class="schedule-task text-zinc-200">
                ${item.Task}
            </span>

        </div>
    `).join("");

    content.innerHTML =
        html + duplicatedHtml;

    panel.classList.add(
        "panel-open"
    );

    clockSection.style.left = "28%";

    opened = type;

    updateActiveSchedule();
}

function updateActiveSchedule(){

    const now = new Date();

    const currentMinutes =
        now.getHours() * 60 +
        now.getMinutes();

    const items =
        document.querySelectorAll(
            '.schedule-item[data-copy="1"]'
        );

    document
        .querySelectorAll(".schedule-item")
        .forEach(item => {
            item.classList.remove("active");
        });

    let activeIndex = -1;

    items.forEach((item, index) => {

        const [hour, minute] =
            item.dataset.time
                .split(":")
                .map(Number);

        const itemMinutes =
            hour * 60 + minute;

        if(itemMinutes <= currentMinutes){
            activeIndex = index;
        }

    });

    if(activeIndex === -1) return;

    const firstCopy =
        document.querySelectorAll(
            '.schedule-item[data-copy="1"]'
        );

    const secondCopy =
        document.querySelectorAll(
            '.schedule-item[data-copy="2"]'
        );

    firstCopy[activeIndex]
        ?.classList.add("active");

    secondCopy[activeIndex]
        ?.classList.add("active");
}

function updatePrayerHighlight() {
    const arcs = document.querySelectorAll(".prayer-arc");
    const progressBar = document.getElementById("prayerProgressBar");
    
    if (arcs.length === 0 || !prayerTimes.Subuh) return;

    const now = nowMinutes();

    // Ambil semua waktu sholat dalam menit
    const times = [
        toMinutes(prayerTimes.Subuh),
        toMinutes(prayerTimes.Dzuhur),
        toMinutes(prayerTimes.Ashar),
        toMinutes(prayerTimes.Maghrib),
        toMinutes(prayerTimes.Isya)
    ];

    let activeIndex = -1;
    let currentStart = 0;
    let currentEnd = 0;

    // Logika penentuan sholat aktif beserta interval waktunya
    if (now >= times[0] && now < times[1]) {
        activeIndex = 0; // Subuh -> Dzuhur
        currentStart = times[0];
        currentEnd = times[1];
    } else if (now >= times[1] && now < times[2]) {
        activeIndex = 1; // Dzuhur -> Ashar
        currentStart = times[1];
        currentEnd = times[2];
    } else if (now >= times[2] && now < times[3]) {
        activeIndex = 2; // Ashar -> Maghrib
        currentStart = times[2];
        currentEnd = times[3];
    } else if (now >= times[3] && now < times[4]) {
        activeIndex = 3; // Maghrib -> Isya
        currentStart = times[3];
        currentEnd = times[4];
    } else {
        activeIndex = 4; // Isya -> Subuh keesokan hari
        currentStart = times[4];
        // Jika waktu sekarang sebelum subuh (00:00 - 04:37), tambah 24 jam ke waktu sekarang
        // Jika waktu sekarang setelah isya (19:01 - 23:59), tambah 24 jam ke waktu subuh target
        const isBeforeSubuh = now < times[0];
        currentEnd = times[0] + (isBeforeSubuh ? 0 : 24 * 60);
        if (isBeforeSubuh) {
            currentStart = times[4] - 24 * 60;
        }
    }

    // 1. Highlight Sektor Ring Utama
    arcs.forEach((arc, index) => {
        if (index === activeIndex) {
            arc.style.stroke = "rgba(255, 255, 255, 0.85)";
            arc.style.filter = "drop-shadow(0px 0px 8px rgba(255,255,255,0.5))";
        } else {
            arc.style.stroke = "rgba(255, 255, 255, 0.15)";
            arc.style.filter = "none";
        }
    });

    // 2. Update Real-time Progress Ring Bar
    if (progressBar) {
        const radius = parseFloat(progressBar.getAttribute("r"));
        const circumference = 2 * Math.PI * radius;
        
        const totalDuration = currentEnd - currentStart;
        const timePassed = now - currentStart;
        
        // Hitung persentase (0 sampai 1)
        let percentage = timePassed / totalDuration;
        percentage = Math.max(0, Math.min(1, percentage)); // batasi antara 0% - 100%

        // Hitung offset SVG dash
        const offset = circumference - (percentage * circumference);
        progressBar.style.strokeDashoffset = offset;
    }
}

function drawPrayerRing(){
    const svg = document.getElementById("prayerSvg");
    if(!svg) return;

    svg.innerHTML = "";

    const cx = 400;
    const cy = 400;
    const radius = 250;
    const progressRadius = 220; // Radius lebih kecil agar berada di dalam ring utama

    const prayers = [
        {name:"Subuh",time:prayerTimes.Subuh},
        {name:"Dzuhur",time:prayerTimes.Dzuhur},
        {name:"Ashar",time:prayerTimes.Ashar},
        {name:"Maghrib",time:prayerTimes.Maghrib},
        {name:"Isya",time:prayerTimes.Isya}
    ];

    // --- SEKTOR RING UTAMA (5 WAKTU SHOLAT) ---
    prayers.forEach((prayer,index)=>{
        const startAngle = -35  + (index * 72);
        const endAngle = startAngle + 71;
        const path = describeArc(cx, cy, radius, startAngle, endAngle);

        svg.innerHTML += `
            <path
                data-index="${index}"
                class="prayer-arc"
                d="${path}"
                fill="none"
                stroke="rgba(255,255,255,.15)"
                stroke-width="35"
                style="transition: stroke 0.5s ease, filter 0.5s ease;"
            />
        `;

        // Titik tengah arc untuk Label teks
        const middle = (startAngle + endAngle) / 2;
        const pos = polarToCartesian(cx, cy, radius + 90, middle);

        svg.innerHTML += `
            <text
                x="${pos.x}"
                y="${pos.y}"
                fill="white"
                text-anchor="middle"
                font-size="20"
            >
                ${prayer.name}
            </text>

            <text
                x="${pos.x}"
                y="${pos.y + 25}"
                fill="#71717a"
                text-anchor="middle"
                font-size="18"
            >
                ${prayer.time}
            </text>
        `;
    });

    // --- TAMBAHKAN RING PROGRESS (LINGKARAN PENUH DI DALAM) ---
    // Keliling lingkaran = 2 * Math.PI * radius = 2 * 3.14159 * 220 ≈ 1382.3
    const circumference = 2 * Math.PI * progressRadius;
    
    // Buat element lingkaran penuh menggunakan tag <circle>
    svg.innerHTML += `
        <circle
            id="prayerProgressBar"
            cx="${cx}"
            cy="${cy}"
            r="${progressRadius}"
            fill="none"
            stroke="rgba(255, 255, 255, 0.4)" 
            stroke-width="4"
            stroke-dasharray="${circumference}"
            stroke-dashoffset="${circumference}"
            transform="rotate(-90 ${cx} ${cy})"
            style="transition: stroke-dashoffset 1s linear; filter: drop-shadow(0px 0px 4px rgba(255,255,255,0.3));"
        />
    `;
}

function polarToCartesian(
    cx,
    cy,
    radius,
    angle
){

    const rad =
        (angle - 90)
        * Math.PI
        / 180;

    return {
        x:
            cx +
            radius *
            Math.cos(rad),

        y:
            cy +
            radius *
            Math.sin(rad)
    };
}

function describeArc(
    x,
    y,
    radius,
    startAngle,
    endAngle
){

    const start =
        polarToCartesian(
            x,
            y,
            radius,
            endAngle
        );

    const end =
        polarToCartesian(
            x,
            y,
            radius,
            startAngle
        );

    return `
        M ${start.x} ${start.y}
        A ${radius} ${radius}
        0 0 0
        ${end.x}
        ${end.y}
    `;
}

window.toggleSchedule = toggleSchedule

document
    .getElementById("todayBtn")
    .addEventListener("click", () => {
        toggleSchedule("today");
    });

document
    .getElementById("tomorrowBtn")
    .addEventListener("click", () => {
        toggleSchedule("tomorrow");
    });

// =====================
// PRAYER VIEW TOGGLE
// =====================
document
    .getElementById("clock")
    .addEventListener("click", () => {

        document
            .getElementById("mainDashboard")
            .classList.add(
                "dashboard-hidden"
            );

        document
            .getElementById("prayerView")
            .classList.add(
                "show"
            );

    });

document
    .getElementById("prayerView")
    .addEventListener("click", () => {

        document
            .getElementById("mainDashboard")
            .classList.remove(
                "dashboard-hidden"
            );

        document
            .getElementById("prayerView")
            .classList.remove(
                "show"
            );

    });

    