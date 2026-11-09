
import { tiimi1, tiimi2, tyolajit } from "./data/tiedot.js";
import { kokonaistunnit } from "./data/kokonaistunnit.js";

const sisalto = document.getElementById("sisalto");
const valikko = document.getElementById("paavalikko");
const valikkoNappi = document.getElementById("valikko-nappi");

// Mobiilivalikko
valikkoNappi.addEventListener("click", () => {
    valikko.classList.toggle("avaa");
});

// Sivujen vaihtaminen
valikko.addEventListener("click", (tapahtuma) => {
    const sivu = tapahtuma.target.dataset.sivu;

    if (!sivu) return;

    valikko.classList.remove("avaa");

    if (sivu === "tiimit") naytaTiimit();
    if (sivu === "kirjaus") naytaKirjaus();
    if (sivu === "raportit") naytaRaportit();
});

// TIIMIT
function naytaTiimit() {
    sisalto.innerHTML = `
        <h2>Tiimit</h2>

        <section class="tiimit">
            ${luoTiimi(tiimi1)}
            ${luoTiimi(tiimi2)}
        </section>

        <div class="jasenen-tiedot">
            <p>Valitse tiimin jäsen nähdäksesi hänen tietonsa.</p>
        </div>
    `;

    sisalto.querySelectorAll(".jasen").forEach((nappi) => {
        nappi.addEventListener("click", () => {
            const jasen = JSON.parse(nappi.dataset.jasen);

            sisalto.querySelector(".jasenen-tiedot").innerHTML = `
                <h3>${jasen.nimi}</h3>
                <p><strong>Rooli:</strong> ${jasen.rooli}</p>
                <p><strong>Osaaminen:</strong> ${jasen.osaaminen}</p>
                <p><strong>Kuvaus:</strong> ${jasen.kuvaus}</p>
            `;
        });
    });
}

function luoTiimi(tiimi) {
    return `
        <article class="tiimi">
            <h3>${tiimi.nimi}</h3>
            ${tiimi.jasenet.map((jasen) => `
                <button class="jasen"
                    data-jasen='${JSON.stringify(jasen)}'>
                    ${jasen.nimi}
                </button>
            `).join("")}
        </article>
    `;
}

// KIRJAUS
function naytaKirjaus() {
    sisalto.innerHTML = `
        <h2>Työtuntien kirjaus</h2>

        <form id="kirjaus-lomake">
            <label for="nimi">Nimi</label>
            <input id="nimi" type="text" required>

            <label for="paivamaara">Päivämäärä</label>
            <input id="paivamaara" type="date" required>

            <div id="kirjausrivit">
                ${luoKirjausrivi()}
            </div>

            <button type="button" id="lisaa-rivi">
                Lisää työtehtävä
            </button>

            <p id="tuntien-yhteensa">Tunteja yhteensä: 0</p>

            <button type="submit" id="laheta" disabled>
                Kirjaa tunnit
            </button>
        </form>

        <p id="kirjaus-viesti"></p>
    `;

    const lomake = document.getElementById("kirjaus-lomake");
    const rivit = document.getElementById("kirjausrivit");
    const laheta = document.getElementById("laheta");

    function paivitaTunnit() {
        const kentat = [...rivit.querySelectorAll(".tunnit")];
        let yhteensa = 0;
        let kelvollinen = true;

        kentat.forEach((kentta) => {
            if (kentta.value !== "") {
                const numero = Number(kentta.value);

                if (!Number.isFinite(numero) || numero < 0) {
                    kelvollinen = false;
                } else {
                    yhteensa += numero;
                }
            }
        });

        document.getElementById("tuntien-yhteensa").textContent =
            `Tunteja yhteensä: ${yhteensa}`;

        laheta.disabled =
            !document.getElementById("nimi").value.trim() ||
            !document.getElementById("paivamaara").value ||
            kentat[0].value === "" ||
            !kelvollinen ||
            yhteensa > 12;
    }

    document.getElementById("lisaa-rivi").addEventListener("click", () => {
        rivit.insertAdjacentHTML("beforeend", luoKirjausrivi());
        paivitaTunnit();
    });

    lomake.addEventListener("input", paivitaTunnit);

    lomake.addEventListener("submit", (tapahtuma) => {
        tapahtuma.preventDefault();

        document.getElementById("kirjaus-viesti").textContent =
            "Tuntikirjaus vastaanotettu. Tietoja ei tallenneta palvelimelle.";

        lomake.reset();
        paivitaTunnit();
    });
}

function luoKirjausrivi() {
    return `
        <div class="kirjausrivi">
            <label>Työlaji</label>

            <select class="tyolaji">
                ${tyolajit.map((laji) =>
                    `<option>${laji}</option>`
                ).join("")}
            </select>

            <label>Tunnit</label>

            <input class="tunnit"
                type="number"
                min="0"
                max="12"
                step="0.5"
                required>
        </div>
    `;
}

// RAPORTIT
function naytaRaportit() {
    sisalto.innerHTML = `
        <h2>Raportit</h2>
        <p>Valitse päivämääräväli raporttia varten.</p>

        <label for="alku">Alkupäivä</label>
        <input id="alku" type="date"
            min="2022-10-03" max="2022-10-14">

        <label for="loppu">Loppupäivä</label>
        <input id="loppu" type="date"
            min="2022-10-03" max="2022-10-14">

        <button id="nayta-raportti">Näytä raportti</button>

        <p id="raportti-teksti"></p>

        <canvas id="raportti-kangas"
            width="700" height="300"
            style="max-width: 100%;">
        </canvas>
    `;

    document.getElementById("nayta-raportti")
        .addEventListener("click", piirraRaportti);
}

function piirraRaportti() {
    const alku = document.getElementById("alku").value;
    const loppu = document.getElementById("loppu").value;
    const canvas = document.getElementById("raportti-kangas");
    const konteksti = canvas.getContext("2d");
    const teksti = document.getElementById("raportti-teksti");

    konteksti.clearRect(0, 0, canvas.width, canvas.height);

    if (!alku || !loppu || alku > loppu) {
        teksti.textContent = "Valitse kelvollinen päivämääräväli.";
        return;
    }

    const tulokset = kokonaistunnit.filter((rivi) =>
        rivi.pvm >= alku && rivi.pvm <= loppu
    );

    if (tulokset.length === 0) {
        teksti.textContent = "Valitulta ajalta ei löydy tietoja.";
        return;
    }

    const yhteensa = tulokset.reduce(
        (summa, rivi) => summa + rivi.tunteja, 0
    );

    const paivat = [...new Set(
        tulokset.map((rivi) => rivi.pvm)
    )];

    const paivittaiset = paivat.map((paiva) => ({
        paiva,
        tunnit: tulokset
            .filter((rivi) => rivi.pvm === paiva)
            .reduce((summa, rivi) => summa + rivi.tunteja, 0)
    }));

    teksti.textContent =
        `Työtunteja yhteensä: ${yhteensa} tuntia`;

    konteksti.fillStyle = "#005246";
    konteksti.font = "18px Roboto";
    konteksti.fillText("Työtunnit päivittäin", 20, 25);

    const suurin = Math.max(
        ...paivittaiset.map((paiva) => paiva.tunnit)
    );

    const palkinLeveys = Math.min(
        45, 600 / paivittaiset.length
    );

    paivittaiset.forEach((paiva, indeksi) => {
        const korkeus = (paiva.tunnit / suurin) * 190;
        const x = 30 + indeksi * (600 / paivittaiset.length);

        konteksti.fillStyle = "#FF9254";
        konteksti.fillRect(
            x, 250 - korkeus, palkinLeveys, korkeus
        );

        konteksti.fillStyle = "#000000";
        konteksti.font = "12px Roboto";
        konteksti.fillText(
            paiva.tunnit, x, 240 - korkeus
        );

        konteksti.fillText(
            paiva.paiva.slice(8), x, 270
        );
    });
}

// ALOITUS
naytaTiimit();
