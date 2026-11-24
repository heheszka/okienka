process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

module.exports = async function handler(req, res) {
    const linkIcs = req.query.url;
    if (!linkIcs) {
        return res.status(400).json({ error: "Brak parametru ?url=..." });
    }

    try {
        const odpowiedz = await fetch(linkIcs, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
        });

        if (!odpowiedz.ok) {
            return res.status(502).json({ error: `Błąd UEK: ${odpowiedz.status}` });
        }

        const tekstIcs = await odpowiedz.text();
        const zajecia = parsujIcsUek(tekstIcs);

        res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
        return res.status(200).json({ zajecia });
    } catch (blad) {
        return res.status(500).json({ error: blad.message });
    }
};

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
                const parsed = wyciagnijDateICzas(linia);
                if (parsed) {
                    aktualne.data = parsed.data;
                    aktualne.dzien = parsed.dzien;
                    aktualne.start = parsed.czas;
                }
            } else if (linia.startsWith("DTEND")) {
                const parsed = wyciagnijDateICzas(linia);
                if (parsed) {
                    aktualne.koniec = parsed.czas;
                }
            } else if (linia.startsWith("SUMMARY")) {
                const surowaNazwa = linia.split(":").slice(1).join(":").replace(/\\,/g, ",").trim();
                aktualne.kategoria = wykryjKategorieUek(surowaNazwa);
                aktualne.przedmiot = surowaNazwa.replace(/\s*\([^)]*\d+\/\d+\)\s*$/, "").trim();
            } else if (linia.startsWith("LOCATION")) {
                let sala = linia.split(":").slice(1).join(":").replace(/\\,/g, ",").trim();
                if (sala.startsWith("http")) {
                    sala = "Online";
                    if (aktualne.kategoria === "wykład") {
                        aktualne.kategoria = "wykład zdalny";
                    }
                }
                aktualne.sala = sala;
            }
        }
    }

    return wynik;
}

function wyciagnijDateICzas(linia) {
    const wartosc = linia.split(":").pop().trim();
    const dopasowanie = wartosc.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})/);
    if (!dopasowanie) return null;

    let rok = Number(dopasowanie.at(1));
    let miesiac = Number(dopasowanie.at(2));
    let dzien = Number(dopasowanie.at(3));
    let godz = Number(dopasowanie.at(4));
    let min = Number(dopasowanie.at(5));

    if (wartosc.endsWith("Z")) {
        const dUtc = new Date(Date.UTC(rok, miesiac - 1, dzien, godz, min));
        const warszawa = new Date(dUtc.toLocaleString("en-US", { timeZone: "Europe/Warsaw" }));
        rok = warszawa.getFullYear();
        miesiac = warszawa.getMonth() + 1;
        dzien = warszawa.getDate();
        godz = warszawa.getHours();
        min = warszawa.getMinutes();
    }

    const dataObj = new Date(rok, miesiac - 1, dzien);
    const dataStr = `${rok}-${String(miesiac).padStart(2, "0")}-${String(dzien).padStart(2, "0")}`;
    const czasStr = `${String(godz).padStart(2, "0")}:${String(min).padStart(2, "0")}`;

    return { data: dataStr, dzien: dataObj.getDay(), czas: czasStr };
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
