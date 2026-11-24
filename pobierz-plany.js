const fs = require("fs");

// Tutaj dopisujesz linki .ics znajomych (klucz = dokładnie takie samo imię jak w plany.js)
const zrodlaPlanow = {
    "Ola": "https://uek.krakow.pl" + "/api/calendar?url=https%3A%2F%2Fplanzajec.uek.krakow.pl%2Findex.php%3Ftyp%3DG%26id%3D188531%26okres%3D3&lektoraty=1"
};

async function start() {
    const wynikKoncowy = {};

    for (const [imie, link] of Object.entries(zrodlaPlanow)) {
        try {
            console.log(`Pobieram plan dla: ${imie}...`);
            const res = await fetch(link, {
                headers: { "User-Agent": "Mozilla/5.0" }
            });
            if (res.ok) {
                const tekst = await res.text();
                const zajecia = parsujIcsUek(tekst);
                if (zajecia.length > 0) {
                    wynikKoncowy[imie] = zajecia;
                    console.log(`Sukces! Pobrano ${zajecia.length} zajęć dla: ${imie}`);
                }
            }
        } catch (err) {
            console.error(`Błąd dla ${imie}:`, err.message);
        }
    }

    fs.writeFileSync("plany-z-uczelni.json", JSON.stringify(wynikKoncowy, null, 2));
}

function parsujIcsUek(tekst) {
    const czystyTekst = tekst.replace(/\r?\n[ \t]/g, "");
    const linie = czystyTekst.split(/\r?\n/);
    const wynik = new Array();
    let aktualne = null;

    for (const linia of linie) {
        if (linia === "BEGIN:VEVENT") {
            aktualne = {};
        } else if (linia === "END:VEVENT" && aktualne) {
            const czyPrzeniesione = aktualne.przedmiot && aktualne.przedmiot.toLowerCase().includes("(przen");
            if (!czyPrzeniesione && aktualne.data && aktualne.start && aktualne.koniec) {
                wynik.push(aktualne);
            }
            aktualne = null;
        } else if (aktualne) {
            if (linia.startsWith("DTSTART")) {
                const p = wyciagnijDateICzas(linia);
                if (p) { aktualne.data = p.data; aktualne.dzien = p.dzien; aktualne.start = p.czas; }
            } else if (linia.startsWith("DTEND")) {
                const p = wyciagnijDateICzas(linia);
                if (p) { aktualne.koniec = p.czas; }
            } else if (linia.startsWith("SUMMARY")) {
                const surowaNazwa = linia.split(":").slice(1).join(":").replace(/\\,/g, ",").trim();
                aktualne.kategoria = wykryjKategorieUek(surowaNazwa);
                aktualne.przedmiot = surowaNazwa.replace(/\s*\([^)]*\d+\/\d+\)\s*$/, "").trim();
            } else if (linia.startsWith("LOCATION")) {
                let sala = linia.split(":").slice(1).join(":").replace(/\\,/g, ",").trim();
                if (sala.startsWith("http")) {
                    sala = "Online";
                    if (aktualne.kategoria === "wykład") aktualne.kategoria = "wykład zdalny";
                }
                aktualne.sala = sala;
            }
        }
    }
    return wynik;
}

function wyciagnijDateICzas(linia) {
    const wartosc = linia.split(":").pop().trim();
    const m = wartosc.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})/);
    if (!m) return null;

    let rok = Number(m.at(1)), miesiac = Number(m.at(2)), dzien = Number(m.at(3));
    let godz = Number(m.at(4)), min = Number(m.at(5));

    if (wartosc.endsWith("Z")) {
        const dUtc = new Date(Date.UTC(rok, miesiac - 1, dzien, godz, min));
        const waw = new Date(dUtc.toLocaleString("en-US", { timeZone: "Europe/Warsaw" }));
        rok = waw.getFullYear(); miesiac = waw.getMonth() + 1; dzien = waw.getDate();
        godz = waw.getHours(); min = waw.getMinutes();
    }

    const dataObj = new Date(rok, miesiac - 1, dzien);
    return {
        data: `${rok}-${String(miesiac).padStart(2, "0")}-${String(dzien).padStart(2, "0")}`,
        dzien: dataObj.getDay(),
        czas: `${String(godz).padStart(2, "0")}:${String(min).padStart(2, "0")}`
    };
}

function wykryjKategorieUek(nazwa) {
    const n = nazwa.toLowerCase();
    if (n.includes("-el")) return "wykład zdalny";
    if (n.includes("(wyk")) return "wykład";
    if (n.includes("(ćw")) return "ćwiczenia";
    if (n.includes("(lab")) return "laboratorium";
    if (n.includes("(konw")) return "konwersatorium";
    if (n.includes("(lek")) return "lektorat";
    if (n.includes("(egz")) return "egzamin";
    return "inne";
}

start();
