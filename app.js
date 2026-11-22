//zamienia tekst "08:15" na minuty od północy (495)
function naMinuty(godzinaStr) {
    const [godz, min] = godzinaStr.split(":").map(Number);
    return godz * 60 + min;
}

//oblicza numer tygodnia w roku (parzysty / nieparzysty)
function pobierzTypTygodnia(data) {
    const startRoku = new Date(data.getFullYear(), 0, 1);
    const dni = Math.floor((data - startRoku) / (24 * 60 * 60 * 1000));
    const numerTygodnia = Math.ceil((dni + startRoku.getDay() + 1) / 7);
    return numerTygodnia % 2 === 0 ? "parzysty" : "nieparzysty";
}

//status jednej osoby
function sprawdzStatusOsoby(osoba, wymuszonyTydzien = null) {
    const teraz = new Date();
    const aktualnyDzien = teraz.getDay(); // 1 = Pon, 5 = Pt, 0 = Nd, 6 = Sob
    const aktualneMinuty = teraz.getHours() * 60 + teraz.getMinutes();
    const aktualnyTydzien = wymuszonyTydzien || pobierzTypTygodnia(teraz);

    //zajęcia tylko z dzisiaj i z odpowiedniego tygodnia
    const zajeciaDzis = osoba.zajecia
    .filter(z => z.dzien === aktualnyDzien)
    .filter(z => z.tydzien === "wszystkie" || z.tydzien === aktualnyTydzien)
    .sort((a, b) => naMinuty(a.start) - naMinuty(b.start));

  // Przypadek A: Brak zajęć dzisiaj (np. weekend lub wolny dzień)
    if (zajeciaDzis.length === 0) {
        return {
        status: "wolne",
        etykieta: "Wolny dzień",
        szczegoly: "Brak zajęć w planie"
        };
    }

  // Przypadek B: Sprawdź, czy osoba jest TERAZ na zajęciach
    const obecneZajecia = zajeciaDzis.find(z => {
        const start = naMinuty(z.start);
        const koniec = naMinuty(z.koniec);
        return aktualneMinuty >= start && aktualneMinuty < koniec;
    });

    if (obecneZajecia) {
        const zostaloMinut = naMinuty(obecneZajecia.koniec) - aktualneMinuty;
        const salaTekst = obecneZajecia.sala ? ` • ${obecneZajecia.sala}` : "";
        return {
            status: "zajecia",
            etykieta: `Na zajęciach (do ${obecneZajecia.koniec})`,
            szczegoly: `${obecneZajecia.przedmiot} ${salaTekst} (za ${zostaloMinut} min koniec)`
        };
    }

    // Szukamy najbliższych kolejnych zajęć dzisiaj
    const nastepneZajecia = zajeciaDzis.find(z => naMinuty(z.start) > aktualneMinuty);
    const pierwszeZajeciaStart = naMinuty(zajeciaDzis[0].start);

  // Przypadek C: Jeszcze przed pierwszymi zajęciami
    if (aktualneMinuty < pierwszeZajeciaStart) {
        const zaIleMinut = pierwszeZajeciaStart - aktualneMinuty;
        const salaTekst = zajeciaDzis[0].sala ? ` • ${zajeciaDzis[0].sala}` : "";
        return {
        status: "przed",
        etykieta: `Zaczyna o ${zajeciaDzis[0].start}`,
        szczegoly: `${zajeciaDzis[0].przedmiot} ${salaTekst} (za ${zaIleMinut} min)`
        };
    }

  // Przypadek D: Ma OKIENKO (były już jakieś zajęcia i są jeszcze kolejne)
    if (nastepneZajecia) {
        const dlugoscOkienka = naMinuty(nastepneZajecia.start) - aktualneMinuty;
        const salaTekst = nastepneZajecia.sala ? ` (${nastepneZajecia.sala})` : "";
        return {
        status: "okienko",
        etykieta: `MA OKIENKO (do ${nastepneZajecia.start})`,
        szczegoly: `Wolne przez ${dlugoscOkienka} min • Potem: ${nastepneZajecia.przedmiot} ${salaTekst}`
        };
    }

  // Przypadek E: Już po wszystkich zajęciach na dzisiaj
    return {
        status: "po",
        etykieta: "Po zajęciach",
        szczegoly: "Skończył(a) już na dzisiaj"
    };
}

// 4. Przykład użycia dla całej listy znajomych (zakładając, że masz tablicę `planyZnajomych`)
function generujListeStatusow() {
    return planyZnajomych.map(osoba => {
        const wynik = sprawdzStatusOsoby(osoba);
        return {
        imie: osoba.imie,
        kierunek: osoba.kierunek,
        ...wynik
        };
    });
}
