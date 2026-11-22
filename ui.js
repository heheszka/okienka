let wybranyTydzien = null;
const otwarteKarty = new Set();

const priorytetStatusu = {
    okienko: 1,
    przed: 2,
    zajecia: 3,
    po: 4,
    wolne: 5
};

const nazwyDni = ["Niedziela", "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota"];

// Słownik mapujący nazwy kategorii na klasy CSS
const koloryKategorii = {
    "ćwiczenia": "kat-cwiczenia",
    "ćwiczenia projektowe": "kat-cwiczenia",
    "wykład": "kat-wyklad",
    "wykład zdalny": "kat-wyklad-zdalny",
    "laboratorium": "kat-laboratorium",
    "konwersatorium": "kat-laboratorium",
    "lektorat": "kat-lektorat",
    "domyslny": "kat-inne"
};

function pobierzKlaseKategorii(kategoria) {
    if (!kategoria) return koloryKategorii.domyslny;
    const klucz = kategoria.toLowerCase().trim();
    return koloryKategorii[klucz] || koloryKategorii.domyslny;
}

function ustawTydzien(typ) {
    wybranyTydzien = typ;
    document.querySelectorAll('.kontrolki button').forEach(b => b.classList.remove('aktywny'));
    if (typ === null) document.getElementById('btn-auto').classList.add('aktywny');
    if (typ === 'parzysty') document.getElementById('btn-parz').classList.add('aktywny');
    if (typ === 'nieparzysty') document.getElementById('btn-nieparz').classList.add('aktywny');
    odswiezEkran();
}

// Funkcja budująca HTML całego planu danej osoby (z kolorami kategorii)
function generujHtmlPelnegoPlanu(zajecia) {
    const aktywnyTydzien = wybranyTydzien || pobierzTypTygodnia(new Date());
    let html = "";

    // Kolejność wyświetlania dni: od Poniedziałku (1) do Soboty (6), a na końcu Niedziela (0)
    const kolejnoscDni =new Array(1, 2, 3, 4, 5, 6, 0);

    kolejnoscDni.forEach(dzien => {
        const zajeciaDnia = zajecia
            .filter(z => z.dzien === dzien)
            .filter(z => z.tydzien === "wszystkie" || z.tydzien === aktywnyTydzien)
            .sort((a, b) => naMinuty(a.start) - naMinuty(b.start));

        if (zajeciaDnia.length > 0) {
            html += `<div class="dzien-naglowek">${nazwyDni[dzien]}</div>`;
            zajeciaDnia.forEach(z => {
                const klasaKoloru = pobierzKlaseKategorii(z.kategoria);
                const tag = z.kategoria ? `<span class="tag-kategoria">${z.kategoria}</span>` : "";

                html += `
                <div class="wiersz-zajec ${klasaKoloru}">
                    <span><strong>${z.start}–${z.koniec}</strong> ${z.przedmiot} ${tag}</span>
                    <span>${z.sala || ""}</span>
                </div>
                `;
            });
        }
    });

    return html || "<div style='color:#64748b'>Brak zajęć w tym tygodniu</div>";
}


function odswiezEkran() {
    const teraz = new Date();
    const dniKrotkie = ["Nd", "Pon", "Wt", "Śr", "Czw", "Pt", "Sob"];
    const godzina = teraz.toTimeString().slice(0, 5);
    document.getElementById("zegar").textContent = `${dniKrotkie[teraz.getDay()]}, ${godzina}`;

    const kontener = document.getElementById("lista-znajomych");
    kontener.innerHTML = "";

    const wyniki = planyZnajomych.map(osoba => ({
        imie: osoba.imie,
        kierunek: osoba.kierunek || "",
        zajecia: osoba.zajecia,
        ...sprawdzStatusOsoby(osoba, wybranyTydzien)
    })).sort((a, b) => priorytetStatusu[a.status] - priorytetStatusu[b.status]);

    wyniki.forEach(osoba => {
        const karta = document.createElement("div");
        const czyOtwarta = otwarteKarty.has(osoba.imie);
        karta.className = `karta ${osoba.status} ${czyOtwarta ? "rozwinieta" : ""}`;

        karta.innerHTML = `
        <div class="naglowek-karty">
            <span class="imie">${osoba.imie}</span>
            <span class="kierunek">${osoba.kierunek}</span>
        </div>
        <div class="status">${osoba.etykieta}</div>
        <div class="szczegoly">${osoba.szczegoly}</div>
        <div class="pelny-plan">
            ${generujHtmlPelnegoPlanu(osoba.zajecia)}
        </div>
        `;

        // Obsługa kliknięcia w kartę
        karta.addEventListener("click", () => {
            karta.classList.toggle("rozwinieta");
            if (karta.classList.contains("rozwinieta")) {
                otwarteKarty.add(osoba.imie);
            } else {
                otwarteKarty.delete(osoba.imie);
            }
        });

        kontener.appendChild(karta);
    });
}

odswiezEkran();
setInterval(odswiezEkran, 30000);
