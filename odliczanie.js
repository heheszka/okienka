// Konfiguracja świąt i imprez (miesiąc 1-12, dzień 1-31)
const wydarzenia = new Array(
    // --- NASZE IMPREZY 2026 ---
    { miesiac: 11, dzien: 19, nazwa: "Akademikowy Zlot Cweli i Cwelinek", typ: "impreza" },
    { miesiac: 11, dzien: 28, nazwa: "Szondrzejki", typ: "impreza" },
    { miesiac: 12, dzien: 4, nazwa: "Heated Rivalry Party", typ: "impreza" },

    // --- ŚWIĘTA STAŁE ---
    { miesiac: 1, dzien: 1, nazwa: "Nowy Rok", typ: "swieto" },
    { miesiac: 1, dzien: 6, nazwa: "Trzech Króli", typ: "swieto" },
    { miesiac: 5, dzien: 1, nazwa: "Święto Pracy", typ: "swieto" },
    { miesiac: 5, dzien: 3, nazwa: "Święto Konstytucji 3 Maja", typ: "swieto" },
    { miesiac: 11, dzien: 1, nazwa: "Wszystkich Świętych", typ: "swieto" },
    { miesiac: 11, dzien: 11, nazwa: "Święto Niepodległości", typ: "swieto" },
    { miesiac: 12, dzien: 24, nazwa: "Wigilia Bożego Narodzenia", typ: "swieto" },
    { miesiac: 12, dzien: 25, nazwa: "Boże Narodzenie (1. dzień)", typ: "swieto" },
    { miesiac: 12, dzien: 26, nazwa: "Boże Narodzenie (2. dzień)", typ: "swieto" }
);

const nazwyMiesiecy = new Array(
    "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
    "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"
);

function aktualizujOdliczanie() {
    const elTytul = document.getElementById("odliczanie-tytul");
    const elLiczba = document.getElementById("licznik-dni");
    const elOpis = document.getElementById("licznik-szczegoly");
    if (!elLiczba) return;

    const teraz = new Date();
    const dzisPolnoc = new Date(teraz.getFullYear(), teraz.getMonth(), teraz.getDate());

    // Szukamy wszystkich imprez (nie świąt) i znajdujemy najbliższą
    const imprezy = wydarzenia.filter(w => w.typ === "impreza");
    let najblizsza = null;
    let minDni = Infinity;

    imprezy.forEach(imp => {
        let dataImp = new Date(teraz.getFullYear(), imp.miesiac - 1, imp.dzien);
        // Jeśli impreza w tym roku już minęła, bierzemy przyszły rok
        if (dataImp < dzisPolnoc) {
            dataImp = new Date(teraz.getFullYear() + 1, imp.miesiac - 1, imp.dzien);
        }
        const roznicaDni = Math.round((dataImp - dzisPolnoc) / (1000 * 60 * 60 * 24));
        if (roznicaDni < minDni) {
            minDni = roznicaDni;
            najblizsza = { ...imp, data: dataImp, dni: roznicaDni };
        }
    });

    if (!najblizsza) return;

    elTytul.textContent = `Do ${najblizsza.nazwa} zostało`;

    if (najblizsza.dni === 0) {
        elLiczba.textContent = "TO DZIŚ! 🎉";
        elOpis.textContent = `Udanej imprezy: ${najblizsza.nazwa}!`;
    } else if (najblizsza.dni === 1) {
        elLiczba.textContent = "1 dzień";
        elOpis.textContent = `Jutro (${najblizsza.dzien} ${nazwyMiesiecy.at(najblizsza.miesiac - 1).toLowerCase()})`;
    } else {
        elLiczba.textContent = `${najblizsza.dni} dni`;
        elOpis.textContent = `${najblizsza.dzien} ${nazwyMiesiecy.at(najblizsza.miesiac - 1).toLowerCase()} ${najblizsza.data.getFullYear()}`;
    }
}

function generujKalendarz() {
    const siatka = document.getElementById("kalendarz-siatka");
    const naglowek = document.getElementById("kalendarz-naglowek");
    const legenda = document.getElementById("kalendarz-legenda");
    if (!siatka) return;

    const teraz = new Date();
    const rok = teraz.getFullYear();
    const miesiac = teraz.getMonth(); // 0-11
    const dzisiaj = teraz.getDate();

    naglowek.textContent = `${nazwyMiesiecy.at(miesiac)} ${rok}`;
    siatka.innerHTML = "";
    legenda.innerHTML = "";

    // Pierwszy dzień miesiąca (zamieniamy niedzielę 0 na 7, żeby tydzień zaczynał się od Pn)
    const pierwszyDzienTyg = new Date(rok, miesiac, 1).getDay() || 7;
    const liczbaDniWMiesiacu = new Date(rok, miesiac + 1, 0).getDate();

    // Puste kafelki przed 1. dniem miesiąca
    for (let i = 1; i < pierwszyDzienTyg; i++) {
        const pusty = document.createElement("div");
        pusty.className = "dzien-komorka pusty";
        siatka.appendChild(pusty);
    }

    // Wydarzenia tylko z bieżącego miesiąca
    const wydarzeniaMiesiaca = wydarzenia.filter(w => w.miesiac === miesiac + 1);

    // Kafelki z dniami miesiąca
    for (let d = 1; d <= liczbaDniWMiesiacu; d++) {
        const komorka = document.createElement("div");
        komorka.className = "dzien-komorka";
        komorka.textContent = d;

        if (d === dzisiaj) {
            komorka.classList.add("dzis");
        }

        const zdarzenie = wydarzeniaMiesiaca.find(w => w.dzien === d);
        if (zdarzenie) {
            komorka.classList.add(zdarzenie.typ); // doda klasę "swieto" lub "impreza"
        }

        siatka.appendChild(komorka);
    }

    // Legenda pod kalendarzem dla bieżącego miesiąca
    wydarzeniaMiesiaca.forEach(w => {
        const kolorKropki = w.typ === "impreza" ? "#9333ea" : "#ef4444";
        legenda.innerHTML += `
            <div class="legenda-wiersz">
                <span class="legenda-kropka" style="background: ${kolorKropki}"></span>
                <span><strong>${w.dzien}.${String(w.miesiac).padStart(2, "0")}</strong> – ${w.nazwa}</span>
            </div>
        `;
    });
}

async function sprawdzPrzypomnienieOImprezie() {
    if (!("Notification" in window)) return;

    // Prosimy o zgodę na powiadomienia przy pierwszym wejściu
    if (Notification.permission === "default") {
        await Notification.requestPermission();
    }
    if (Notification.permission !== "granted") return;

    const teraz = new Date();
    const dzisPolnoc = new Date(teraz.getFullYear(), teraz.getMonth(), teraz.getDate());
    const dzisKlucz = dzisPolnoc.toISOString().slice(0, 10);

    // Sprawdzamy tylko wydarzenia z typ: "impreza" (pomijamy święta)
    const imprezy = wydarzenia.filter(w => w.typ === "impreza");

    imprezy.forEach(imp => {
        const dataImp = new Date(teraz.getFullYear(), imp.miesiac - 1, imp.dzien);
        const roznicaDni = Math.round((dataImp - dzisPolnoc) / (1000 * 60 * 60 * 24));
        const kluczPowiadomienia = `przypomnienie_${imp.nazwa}_${dzisKlucz}`;

        // Jeśli impreza jest DZIŚ (0) lub JUTRO (1) i jeszcze dziś nie przypominano
        if ((roznicaDni === 0 || roznicaDni === 1) && !localStorage.getItem(kluczPowiadomienia)) {
            const tekst = roznicaDni === 0
                ? `🎉 Dzisiaj: ${imp.nazwa}!`
                : `⏰ Przypomnienie: Jutro ${imp.nazwa}!`;

            new Notification("Okienka na Studiach", {
                body: tekst,
                icon: "images/ikona-192.png"
            });

            localStorage.setItem(kluczPowiadomienia, "wyslano");
        }
    });
}

// Uruchamiamy wszystko od razu i sprawdzamy co minutę
aktualizujOdliczanie();
generujKalendarz();
sprawdzPrzypomnienieOImprezie();

setInterval(() => {
    aktualizujOdliczanie();
    generujKalendarz();
    sprawdzPrzypomnienieOImprezie();
}, 60000);
