# ZG Customs

🚗 **Web platforma za naručivanje vozila na servis, praćenje radova i upravljanje autoservisima.**

ZG Customs razvija šesteročlani studentski tim u sklopu kolegija [Programsko inženjerstvo](https://www.fer.unizg.hr/predmet/proinz) na Fakultetu elektrotehnike i računarstva Sveučilišta u Zagrebu, u akademskoj godini **2026./2027.** Projekt se temelji na zadanoj temi **AutoServis**, autorice Ede Jovičić.

> **Status projekta:** početna faza razvoja. Uspostavljeni su repozitorij i struktura projekta prema predlošku kolegija. Funkcionalnosti opisane u nastavku predstavljaju planirani opseg; aplikacija još nema funkcionalnu inačicu za demonstraciju.

## Opis aplikacije

ZG Customs povezuje vlasnike vozila, servisere i voditelje autoservisa kroz zajednički sustav za organizaciju servisiranja. Cilj je na jednom mjestu objediniti termine, tijek radova, odobravanje dodatnih troškova i servisnu povijest vozila. Vlasnicima vozila namijenjeno je besplatno korištenje, dok zadatak predviđa mjesečnu pretplatu autoservisa za napredne funkcionalnosti.

### Korisničke uloge

| Uloga u aplikaciji | Planirane mogućnosti |
| --- | --- |
| **Vlasnik vozila** | Evidencija vlastitih vozila, zahtjev za termin, praćenje statusa, prihvaćanje ili odbijanje dodatnih radova, pregled računa i povijesti, preuzimanje potvrde te ocjenjivanje servisa. |
| **Serviser** | Profil sa specijalizacijom i pripadnošću autoservisu, pregled dodijeljenih zahtjeva, evidencija radova, dijelova, vremena i napomena, izrada dodatnih ponuda te unos konačnog troška. |
| **Voditelj autoservisa** | Upravljanje serviserima i rasporedom, dodjela zahtjeva, pregled servisne povijesti unutar vlastitog autoservisa i statistike poslovanja. |
| **Administrator platforme** | Upravljanje korisnicima i autoservisima, deaktivacija korisničkih računa, određivanje cijene pretplate i pregled osnovnih podataka o korištenju platforme. |

### Ključne planirane funkcionalnosti

- **Prijava i korisnički profili:** autentifikacija putem vanjskog pružatelja identiteta uz OpenID Connect / OAuth 2.0, uz unos kontaktnih podataka i podataka o autoservisu prema ulozi.
- **Vozila i termini:** unos registarske oznake, marke, modela, godine proizvodnje i kilometraže te slanje zahtjeva za odabranu vrstu servisa i željeni termin.
- **Praćenje servisiranja:** prikaz statusa zahtjeva i slanje e-mail obavijesti o promjenama putem vanjske usluge.
- **Radovi i ponude:** evidencija izvršenih radova i ugrađenih dijelova te slanje ponuda za dodatne radove koje vlasnik može prihvatiti ili odbiti.
- **Povijest i dokumenti:** pregled obavljenih servisa i detaljnog računa, preuzimanje potvrde o servisu te ostavljanje ocjene i komentara nakon završetka.
- **Organizacija autoservisa:** raspored termina, dodjela servisera i pregled broja servisa prema vrsti, prosječnog trajanja te ukupne vrijednosti usluga.
- **Pretplate i administracija:** mjesečna pretplata autoservisa plaćena kreditnom karticom te upravljanje platformom kroz administratorsku ulogu.

Predviđeni statusi servisnog zahtjeva su: **zatražen**, **potvrđen**, **vozilo zaprimljeno**, **servis u tijeku**, **čeka odobrenje**, **završen** i **otkazan**. Dopušteni prijelazi između statusa razradit će se u analizi zahtjeva i modelima ponašanja.

Detaljan opseg, zahtjevi, obrasci uporabe, arhitektura i rezultati ispitivanja vodit će se u [projektnoj dokumentaciji](docs/Home.md). Stranice dokumentacije trenutačno sadrže predloške koje tim treba prilagoditi projektu.

<a id="deployment"></a>

## Postavljanje (deployment)

**Status:** aplikacija još nije javno postavljena.

| Podatak | Trenutačno stanje |
| --- | --- |
| Javni URL | **[DOPUNITI nakon prvog postavljanja]** |
| Platforma za hosting | Predložen je DigitalOcean s Linux poslužiteljem; konačan odabir treba potvrditi s timom i asistenticom. |
| Pristup demonstraciji | **[DOPUNITI: način prijave i pristup demonstracijskim ulogama]** |
| Ograničenja postavljene inačice | **[DOPUNITI nakon prve funkcionalne inačice]** |

**Planirani scenarij demonstracije:** vlasnik prijavljuje vozilo i traži termin, voditelj potvrđuje zahtjev i dodjeljuje servisera, a serviser evidentira radove. Vlasnik zatim prati status i pregledava završeni servis.

Detalji infrastrukture, konfiguracije i objave dokumentirat će se u [vodiču za postavljanje, instalaciju i konfiguraciju](docs/6-Postavljanje-instalacija-i-konfiguracija.md).

<a id="quick-start"></a>

## Brzi početak / instalacija

Repozitorij se može preuzeti preko SSH-a, uz Git i SSH ključ povezan s vlastitim GitHub računom:

```bash
git clone git@github.com:ZG-Customs/ZG-Customs.git
cd ZG-Customs
```

Upute za pokretanje aplikacije bit će dodane nakon uspostave prvog funkcionalnog razvojnog okruženja. Postojeće ogledne datoteke iz predloška ne predstavljaju implementaciju ZG Customsa.

| Stavka za dopunu | Sadržaj |
| --- | --- |
| Preduvjeti | **[DOPUNITI: potvrđene tehnologije, verzije i potrebni alati]** |
| Instalacija ovisnosti i pokretanje | **[DOPUNITI: provjerene naredbe za backend, frontend i bazu podataka]** |
| Konfiguracija | **[DOPUNITI: potrebne varijable okruženja i lokacija datoteke s oglednim vrijednostima]** |
| Lokalna adresa aplikacije | **[DOPUNITI nakon prvog pokretanja]** |
| Provjera rada i ispitivanje | **[DOPUNITI: osnovni korisnički tijek i naredbe za pokretanje stvarnih testova]** |

U repozitorij se ne pohranjuju lozinke, privatni SSH ključevi ni pristupni tokeni. Upute za konfiguraciju trebaju sadržavati nazive potrebnih varijabli i ogledne vrijednosti.

## Tehnologije

Sljedeći skup tehnologija predstavlja **prijedlog za dogovor tima i asistentice**, a ne popis već implementiranih tehnologija. Nakon konačnog odabira ovaj odjeljak treba uskladiti sa stvarnim rješenjem.

| Predložena tehnologija ili alat | Uloga u projektu | Razlog razmatranja |
| --- | --- | --- |
| **Java / Spring Boot** | Poslužiteljski dio, poslovna pravila i API aplikacije. | Većina tima najbolje poznaje Javu; prikladna je za objektno oblikovanje domene vozila, servisnih zahtjeva i ponuda. |
| **React / TypeScript** | Korisničko sučelje za vlasnike vozila, zaposlenike autoservisa i administratora. | Omogućuje organizaciju obrazaca, popisa i prikaza statusa kroz ponovno uporabive komponente. |
| **PostgreSQL** | Pohrana korisnika, vozila, autoservisa, zahtjeva i servisne povijesti. | Domenski podaci imaju jasne odnose i zahtijevaju dosljednost povezanih zapisa. |
| **Docker / Docker Compose** | Ujednačeno pokretanje aplikacije i baze podataka. | Olakšava usklađivanje razvojnog okruženja članova tima i poslužitelja. |
| **DigitalOcean / Linux** | Javno postavljanje aplikacije. | Omogućuje zasebno poslužiteljsko okruženje; tim treba preuzeti konfiguraciju i održavanje. |
| **GitHub Actions** | Automatizirana izgradnja, provjere i kasnije postavljanje aplikacije. | Povezuje provjere s promjenama u repozitoriju; postojeće ogledne tijekove rada treba prilagoditi projektu. |

**Vanjske integracije predviđene zadatkom:**

- Pružatelj identiteta za prijavu: **[DOPUNITI: odabrana usluga za OpenID Connect / OAuth 2.0]**.
- Usluga za e-mail obavijesti: **[DOPUNITI: odabrana usluga]**.
- Usluga za kartičnu naplatu pretplate: **[DOPUNITI: odabrana usluga i način demonstracije naplate]**.

<a id="team-members"></a>

## Članovi tima

Tim **ZG Customs** ima **6 članova**. U tablici se navodi primarni fokus rada, no svi članovi sudjeluju u razvoju, ispitivanju i dokumentiranju aplikacije.

| # | Ime i prezime | GitHub | Glavna uloga ili doprinos |
| --- | --- | --- | --- |
| 1 | Rino Bago | [@rinobagoFER](https://github.com/rinobagoFER) | Voditelj tima + full stack developer |
| 2 | Ivan Bartol | [@ivanbartol](https://github.com/ivanbartol) | DevOps, Git, CI/CD, postavljanje aplikacije + full stack pripomoć |
| 3 | Jagor Jureković | [@jj56894](https://github.com/jj56894) | **[DOPUNITI: glavna uloga]** |
| 4 | Potjeh Jureković | [@potjehjurekovic1](https://github.com/potjehjurekovic1) | **[DOPUNITI: glavna uloga]** |
| 5 | Marijan Smiljanić | [@msmilj](https://github.com/msmilj) | **[DOPUNITI: glavna uloga]** |
| 6 | Juraj Sviličić | [@sleepless-jura](https://github.com/sleepless-jura) | **[DOPUNITI: glavna uloga]** |

**Voditelj tima: Rino Bago**

Uloge se mogu mijenjati tijekom projekta. Stvarni doprinosi prate se kroz zadatke, povijest promjena i [pregled aktivnosti grupe](docs/A-Pregled-aktivnosti-grupe.md).

## Doprinos projektu

Promjene se razvijaju u granama oblika `<vrsta>/<username>-<zadatak>`, primjerice `docs/ivanbartol-readme`. Nakon commita i pusha radne grane otvara se pull request (PR) prema `main`.

- **Approval (odobrenje)** potvrđuje da je netko pregledao promjene i prihvaća ih. Potrebno je jedno odobrenje drugog člana s ovlasti Write/Admin; autor ne može odobriti vlastiti PR.
- **Merge (spajanje)** uključuje odobrene promjene u `main`. Nakon ispunjenih uvjeta pregleda mogu ga napraviti samo administratori, trenutačno voditelj `@rinobagoFER` te `@ivanbartol`.

Izravni push u `main` nije dopušten. Nove izmjene nakon odobrenja zahtijevaju ponovni pregled. Uz promjenu funkcionalnosti ažuriraju se pripadajuća dokumentacija i testovi.

**Evidencija zadataka i sastanci:** **[DOPUNITI: ploča zadataka i ritam sastanaka; predložen je GitHub Issues]**.

Projektna dokumentacija održava se u direktoriju [`docs/`](docs/), a PDF inačice službenih predaja pohranjivat će se u [`docs/deliverables/`](docs/deliverables/).

<a id="license"></a>

## Licenca

**Licenca aplikacije ZG Customs:** još nije odabrana. **[DOPUNITI nakon dogovora tima]**.

Postojeća datoteka [`LICENSE`](LICENSE) odnosi se na dokumentacijski predložak kolegija autora Vlade Sruka, pod licencom **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)**. Ona ne određuje automatski licencu studentske aplikacije.

Kod trećih strana, slike, ikone i drugi uključeni sadržaji zadržavaju vlastite licence i uvjete uporabe.

<a id="ai-usage"></a>

## Uporaba umjetne inteligencije

Pri radu na projektu primjenjuju se FER-ova [pravila o primjerenoj uporabi umjetne inteligencije](https://www.fer.unizg.hr/_download/repository/Policy%20on%20the%20appropriate%20use%20of%20artificial%20intelligence%20at%20the%20faculty%20of%20electrical%20engineering%20and%20computing%5B1%5D.pdf).

**Dosadašnja uporaba:** OpenAI Codex korišten je kao pomoć pri razradi početnog plana projekta te izradi i uređivanju ovog README-a prema predlošku kolegija i zadatku AutoServis.

**Pregled tima:** **[DOPUNITI: tko je pregledao tekst, koje je provjere proveo i koje je izmjene unio]**. Tim prije objave treba provjeriti točnost opisa i usklađenost sa stvarnim stanjem projekta. Daljnja uporaba alata i provjera rezultata bilježit će se u [projektnoj dokumentaciji](docs/Home.md#izjava-o-uporabi-umjetne-inteligencije).

<a id="code-of-conduct-and-support"></a>

## Kodeks ponašanja i podrška

Od članova tima očekuju se konstruktivna komunikacija, odgovorno izvršavanje dogovorenih obveza te pridržavanje Kodeksa ponašanja studenata FER-a i [Etičkog kodeksa IEEE-a](https://www.ieee.org/about/corporate/governance/p7-8.html).

Repozitorij sadrži [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md), koji treba dopuniti kontaktom za prijavu problema.

**Kontakt za pitanja i podršku:** **[DOPUNITI: kontakt voditelja ili dogovoreni kanal tima]**.

---

README je prilagođen predlošku kolegija Programsko inženjerstvo FER-a autora [Vlade Sruka](https://www.fer.unizg.hr/vlado.sruk), licenciranom pod [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/). Opis planirane aplikacije temelji se na zadatku *AutoServis*, Eda Jovičić, listopad 2026. Aplikaciju razvija studentski tim **ZG Customs**.
