function aktualizujOdliczanie() {
    const elLiczba = document.getElementById("licznik-dni");
    const elOpis = document.getElementById("licznik-szczegoly");
    if (!elLiczba) return;

    const teraz = new Date();
    const biezacyRok = teraz.getFullYear();
    
    // Miesiące w JS liczy się od 0, więc listopad to 10
    let cel = new Date(biezacyRok, 10, 28, 0, 0, 0);

    // Jeśli w tym roku jest już po 28 listopada, odliczaj do 28 listopada przyszłego roku
    if ((teraz.getMonth() === 10 && teraz.getDate() > 28) || teraz.getMonth() > 10) {
        cel = new Date(biezacyRok + 1, 10, 28, 0, 0, 0);
    }

    const dzisPolnoc = new Date(teraz.getFullYear(), teraz.getMonth(), teraz.getDate());
    const celPolnoc = new Date(cel.getFullYear(), cel.getMonth(), cel.getDate());
    const roznicaMs = celPolnoc - dzisPolnoc;
    const dni = Math.round(roznicaMs / (1000 * 60 * 60 * 24));

    if (dni === 0) {
        elLiczba.textContent = "TO DZIŚ! 🎉";
        elOpis.textContent = "Udanych Szondrzejek!";
    } else if (dni === 1) {
        elLiczba.textContent = "1 dzień";
        elOpis.textContent = "Jutro (28 listopada)";
    } else {
        elLiczba.textContent = `${dni} dni`;
        elOpis.textContent = `28 listopada ${cel.getFullYear()}`;
    }
}

aktualizujOdliczanie();
setInterval(aktualizujOdliczanie, 60000);
