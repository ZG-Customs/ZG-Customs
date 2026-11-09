# 5. Ispitivanje

Ispitivanje početne inačice obuhvaća katalog usluga, pristup PostgreSQL-u, izolaciju dijagnostičkih ruta i automatizaciju postavljanja. Poslovni obrasci uporabe još nisu implementirani, pa se njihove provjere navode kao plan. Postojanje testa u repozitoriju nije dokaz njegova uspješnog izvođenja na trenutačnoj reviziji.

## 5.1 Pristup ispitivanju

[BackendIntegrationTests](../backend/src/test/java/hr/fer/zgcustoms/BackendIntegrationTests.java) pokreće Spring Boot na slučajnom portu i provjerava HTTP odgovore te podatke u stvarnoj, zasebnoj PostgreSQL bazi. Migracije se primjenjuju prije provjere kataloga. [Testovi automatizacije](../tests/deployment/test_sync.py) provjeravaju odabir uspješnog CI izvođenja za točan commit i blokiranje postavljanja kada novije izvođenje nije uspješno.

[Provjera web-aplikacije](../tests/deployment/smoke_web.py) dohvaća HTML, JavaScript paket i katalog kroz Caddy te provjerava blokiranje javne dijagnostičke rute. To je HTTP provjera, ne izvršavanje korisničke interakcije u pregledniku. [GitHub Actions konfiguracija](../.github/workflows/ci.yml) povezuje provjere skripti, integracijske testove, izgradnju imageova i pokretanje cijele aplikacije sa svježom bazom.

Ponovljivo lokalno pokretanje i priprema testne baze opisani su u [operativnom vodiču](deployment.md#testiranje-backenda). Testiranje ne smije mijenjati zajedničku produkcijsku bazu. Dokazi izvođenja trebaju se tumačiti uz reviziju, okruženje i datum; ovdje se ne tvrdi da su testovi ponovno izvedeni tijekom uređivanja dokumentacije.

## 5.2 Ispitni slučajevi

### Postojeće automatizirane provjere

| ID | Scenarij i koraci | Očekivani rezultat | Izvor |
| --- | --- | --- | --- |
| IT-01 | Pokrenuti backend nad migriranom testnom bazom; dohvatiti `/api/service-types` i broj redaka u bazi. | HTTP 200, četiri zadane kategorije i potvrda PostgreSQL-a. | `catalogIsReadFromMigratedPostgresDatabase` |
| IT-02 | Pokušati umetnuti kategoriju s postojećim kodom `REGULAR_SERVICE`. | Baza odbija duplikat ograničenjem jedinstvenosti. | `databaseRejectsDuplicateServiceCodes` |
| IT-03 | Dohvatiti `/actuator/health/readiness` izravno na testnom backendu. | HTTP 200 i UP bez lozinki, JDBC adrese ili detalja komponenti. | `readinessChecksDatabaseWithoutExposingDetails` |
| IT-04 | Poslati POST na katalog i dohvatiti `/actuator/env`. | HTTP 405 za nepodržano pisanje i 404 za nedostupnu konfiguracijsku rutu. | `catalogDoesNotExposeUnauthenticatedWrites` |
| OP-01 | U testu odabira CI rezultata zadati uspješan push na main za točan commit te nepripadajuća izvođenja. | Samo odgovarajuće uspješno izvođenje dopušta postavljanje. | `test_accepts_only_successful_main_push_for_exact_commit` |
| OP-02 | Uz starije uspješno izvođenje zadati novije neuspješno ili nedovršeno ponovno izvođenje. | Stari uspjeh ne dopušta postavljanje. | `test_latest_failed_or_pending_rerun_blocks_previous_success` |
| ST-01 | Pokrenuti `smoke_web.py` s osnovnim URL-om testnog Caddyja. | Dostupni HTML, JavaScript i četiri kategorije; javni `/actuator/health` vraća 404. | [HTTP provjera](../tests/deployment/smoke_web.py) |

Oznake identificiraju specifikacije provjera, ne rezultate novog izvođenja. Java metode nalaze se u prethodno povezanom integracijskom testu, a Python metode u testu automatizacije.

### Planirane provjere poslovnih tijekova

Sljedeći slučajevi nisu izvedeni; zahtijevaju implementaciju pripadajućih funkcionalnosti iz [poglavlja 3](3-Obrasci-uporabe.md).

| ID | Postupak i ulaz | Očekivani rezultat |
| --- | --- | --- |
| PT-01 | Prijaviti isti vanjski identitet dvaput; ponoviti s prekinutom prijavom. | Isti lokalni račun; prekinuta prijava ne daje zaštićeni pristup. |
| PT-02 | Kao vlasnik poslati rezervaciju za svoje vozilo, zatim za tuđe vozilo. | Vlastiti zahtjev spremljen; tuđi odbijen bez promjene baze. |
| PT-03 | Kao voditelj predložiti termin; kao vlasnik prihvatiti, odnosno na drugom zahtjevu odbiti. | Prihvaćanje potvrđuje termin; odbijanje otkazuje zahtjev. |
| PT-04 | Kao nedodijeljeni serviser pokušati mijenjati servis; ponoviti kao dodijeljeni. | Neovlaštena promjena odbijena; dopuštena promjena trajno spremljena. |
| PT-05 | Predložiti dodatne radove; vlasnik odlučuje; pokušati ponovno riješiti istu ponudu. | Jedna odluka i odgovarajuća obavijest; ponovna odluka ne mijenja ishod. |
| PT-06 | Nakon spremanja ponude simulirati nedostupnost e-pošte. | Ponuda ostaje spremljena; ako se prihvati outbox prijedlog, obavijest se može ponovno poslati. |
| PT-07 | Završiti servis s radovima i troškom; pregledati povijest i preuzeti račun. | Podaci i iznos računa odgovaraju evidenciji. |
| PT-08 | Pokušati ocjene 0, 1, 5 i 6 te komentar bez ocjene. | Prihvaćene samo ocjene 1–5; komentar bez ocjene odbijen. |
| PT-09 | Odobriti autoservis voditelju, zatim mu pokušati odobriti drugi. | Prvi autoservis nastaje; drugi se odbija uz očuvanje postojećih podataka. |
| PT-10 | Ukloniti servisera s budućim dodjelama. | Stari radovi ostaju dostupni; budući poslovi prikazani za preraspodjelu. |
| PT-11 | Poslati valjan Stripe događaj dvaput i događaj nevaljana potpisa. | Jedna obrada valjanog događaja; nevaljani događaj ne mijenja pretplatu. |
| PT-12 | Deaktiviranim računom izravno pozvati zaštićenu rutu. | Zahtjev je odbijen bez obzira na prikaz korisničkog sučelja. |

## 5.3 Provedena ispitivanja i rezultati

[Zapis provjere javnog postavljanja od 27. 10. 2026.](deployment.md#provjera-javnog-postavljanja--27-10-2026) odnosi se na reviziju `a2f9eeb383e40c566f477db2d89f66f668d25080`. Prema tom zapisu sva tri spremnika bila su zdrava, naslovnica i katalog dostupni kroz HTTPS, HTTP preusmjeren na HTTPS, a javni Actuator endpoint vratio je 404. Provjereni su vezivanje internih portova na lokalno sučelje, instalirane skripte, cron i postojanje lokalne sigurnosne kopije.

Isti izvor bilježi raniju provjeru očuvanja podataka nakon ponovnog stvaranja spremnika te obnovu kopije u zasebnoj testnoj bazi; te provjere nisu ponovljene pri navedenom usklađivanju dokumentacije. Nema novog izvještaja o izvođenju svih testova na trenutačnoj radnoj kopiji, niti rezultata planiranih poslovnih scenarija.

## 5.4 Poznati nedostaci i ograničenja ispitivanja

- Početna inačica nema autentifikaciju ni poslovne operacije; HTTP 405 za katalog ne dokazuje ispravnost buduće autorizacije.
- HTTP provjera ne potvrđuje izvođenje Reacta, dostupnost tipkovnicom ni prilagodljivost prikaza. Za te zahtjeve potrebne su zasebne provjere preglednika.
- Dostava Resend poruka, Stripe naplata i provjera vanjskog identiteta nisu potvrđeni postojećim testovima.
- Lokalna sigurnosna kopija ne štiti od gubitka cijelog servera; nisu dokumentirani rezultati oporavka s vanjske lokacije.
- Politika brisanja, konflikt termina, definicija trajanja servisa i primjena novih cijena još nisu dovoljno određeni za konačne rubne ispitne slučajeve.
