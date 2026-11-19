# 3. Obrasci uporabe

Obrasci opisuju planirano ponašanje sustava ZG Customs. U pregledanom kodu implementiran je samo dohvat kataloga vrsta servisa; opisani poslovni tijekovi nisu potvrda dovršene implementacije.

## 3.1 Dijagram obrazaca uporabe

![Slika 3.1. Obrasci uporabe sustava ZG Customs](<./assets/diagrams/3-1-zg-customs-system-UC.svg>)

**Slika 3.1. Obrasci uporabe sustava ZG Customs** — [PlantUML izvor](./puml/3-1-zg-customs-system-UC.puml).

Vlasnik vozila, serviser, voditelj i administrator specijalizacije su korisnika aplikacije. Vanjski sudionici su pružatelj identiteta, Resend i Stripe. Prijava je preduvjet zaštićenih radnji, a grupiranje ciljeva ne predstavlja odnos uključivanja.

## 3.2 Specifikacije obrazaca uporabe

U svim zaštićenim tijekovima poslužitelj provjerava aktivnost računa, ulogu te vlasništvo ili pripadnost autoservisu. Naziv Owner označava vlasnika vozila; vlasnik autoservisa ima ulogu Manager.

### UC-01: Registracija i prijava

| Element specifikacije | Opis |
| --- | --- |
| Primarni akter | Korisnik |
| Preduvjeti | Nema aktivne sjednice. |
| Glavni uspješni tok | Pokreće vanjsku prijavu; aplikacija provjerava identitet i povezuje ga s lokalnim računom. |
| Alternative i iznimke | Prekinuta ili neuspješna prijava ne otvara zaštićene radnje. |
| Ishod | Uspostavljena je sjednica; administrator nema javnu registraciju. |

### UC-02: Upravljanje profilom i odjava

| Element specifikacije | Opis |
| --- | --- |
| Primarni akter | Korisnik |
| Preduvjeti | Aktivan račun i sjednica. |
| Glavni uspješni tok | Pregledava i uređuje vlastite podatke ili se odjavljuje. |
| Alternative i iznimke | Nevaljani podaci ne spremaju se. |
| Ishod | Profil je ažuriran ili sjednica završena. |

### UC-03: Upravljanje vlastitim vozilima

| Element specifikacije | Opis |
| --- | --- |
| Primarni akter | Vlasnik vozila |
| Preduvjeti | Aktivan vlasnički račun. |
| Glavni uspješni tok | Unosi registraciju, marku, model, godinu i kilometražu; pregledava ili uklanja vlastito vozilo. |
| Alternative i iznimke | Tuđe vozilo nije dostupno; politiku uklanjanja uz postojeću povijest treba dovršiti. |
| Ishod | Vozilo je evidentirano ili uklonjeno iz aktivnog pregleda. |

### UC-04: Rezervacija servisnog termina

| Element specifikacije | Opis |
| --- | --- |
| Primarni akter | Vlasnik vozila |
| Preduvjeti | Vlastito vozilo i aktivan autoservis. |
| Glavni uspješni tok | 1. Odabire vozilo, uslugu i željeni termin.<br>2. Šalje zahtjev.<br>3. Prati odluku voditelja.<br>4. Prihvaća ili odbija ponuđeni zamjenski termin. |
| Alternative i iznimke | Nevaljan unos ne stvara rezervaciju; odbijanje zamjenskog termina otkazuje zahtjev. Pogreška pohrane ne smije prikazati uspjeh. |
| Ishod | Zahtjev je spremljen; nakon prihvaćanja termin je potvrđen. |

### UC-05: Praćenje servisa i obavijesti

| Element specifikacije | Opis |
| --- | --- |
| Primarni akter | Vlasnik vozila |
| Preduvjeti | Postoji vlastiti servis. |
| Glavni uspješni tok | Otvara servis i pregledava status i komentare; prima e-poštu o promjenama. |
| Alternative i iznimke | Nedostava poruke ne poništava spremljenu promjenu; ponavljanje slanja prikazano je kao prijedlog u arhitekturi. |
| Ishod | Vlasnik dobiva uvid u napredak. |

### UC-06: Pregled servisne povijesti i dokumenata

| Element specifikacije | Opis |
| --- | --- |
| Primarni akter | Vlasnik vozila; voditelj |
| Preduvjeti | Postoje dostupni servisni zapisi. |
| Glavni uspješni tok | Vlasnik pregledava povijest vozila i račun završenog servisa; voditelj pregledava radove svojeg autoservisa. |
| Alternative i iznimke | Pristup tuđim zapisima odbija se. |
| Ishod | Dostupan je pregled povijesti; vlasnik može preuzeti račun. |

### UC-07: Ocjenjivanje završenog servisa

| Element specifikacije | Opis |
| --- | --- |
| Primarni akter | Vlasnik vozila |
| Preduvjeti | Vlastiti završeni servis, najviše mjesec dana od završetka. |
| Glavni uspješni tok | Odabire ocjenu 1–5 i po želji dodaje komentar. |
| Alternative i iznimke | Komentar bez ocjene, tuđi servis i unos nakon roka odbijaju se. |
| Ishod | Ocjena je spremljena uz servis. |

### UC-08: Odluka o dodatnim radovima

| Element specifikacije | Opis |
| --- | --- |
| Primarni akter | Vlasnik vozila |
| Preduvjeti | Neriješena ponuda za vlastiti servis. |
| Glavni uspješni tok | Pregledava opis i procijenjeni trošak te prihvaća ili odbija ponudu. |
| Alternative i iznimke | Već riješena ponuda ne prima novu odluku; odbijanje samo po sebi ne otkazuje servis. |
| Ishod | Odluka je spremljena i serviser se obavještava. |

### UC-09: Zahtjev za pridruživanje autoservisu

| Element specifikacije | Opis |
| --- | --- |
| Primarni akter | Serviser |
| Preduvjeti | Uspostavljen profil servisera. |
| Glavni uspješni tok | Odabire autoservis i šalje zahtjev za pridruživanje. |
| Alternative i iznimke | Do odobrenja nema ovlasti aktivnog člana tima. |
| Ishod | Zahtjev čeka odluku voditelja. |

### UC-10: Obrada dodijeljenog servisa

| Element specifikacije | Opis |
| --- | --- |
| Primarni akter | Serviser |
| Preduvjeti | Servis je dodijeljen tom serviseru. |
| Glavni uspješni tok | Pregledava vozilo i termin, mijenja status uz komentar, evidentira radove, dijelove i vrijeme te završni trošak. |
| Alternative i iznimke | Nedopušten prijelaz ili pristup tuđoj dodjeli odbija se; neuspjela pohrana ne mijenja stanje. |
| Ishod | Evidencija i status ažurirani su; završetak omogućuje račun i ocjenu. |

### UC-11: Predlaganje dodatnih radova

| Element specifikacije | Opis |
| --- | --- |
| Primarni akter | Serviser |
| Preduvjeti | Dodijeljen servis u tijeku. |
| Glavni uspješni tok | Unosi opis dodatnih radova i procijenjeni trošak te šalje ponudu vlasniku. |
| Alternative i iznimke | Nevaljan unos ili pogreška pohrane ne stvaraju ponudu. |
| Ishod | Ponuda čeka odluku vlasnika. |

### UC-12: Zahtjev za registraciju autoservisa

| Element specifikacije | Opis |
| --- | --- |
| Primarni akter | Voditelj |
| Preduvjeti | Autentificiran račun podnositelja. |
| Glavni uspješni tok | Podnosi podatke autoservisa na administratorski pregled. |
| Alternative i iznimke | Odbijena prijava ne stvara autoservis. |
| Ishod | Prijava čeka odluku; tek odobrenjem nastaje aktivan autoservis. |

### UC-13: Organizacija termina i dodjela servisa

| Element specifikacije | Opis |
| --- | --- |
| Primarni akter | Voditelj |
| Preduvjeti | Upravlja predmetnim autoservisom. |
| Glavni uspješni tok | Pregledava zahtjeve, prihvaća ih ili odbija, predlaže termine i dodjeljuje servisera. |
| Alternative i iznimke | Tuđi autoservis i dodjela neaktivnom članu odbijaju se; pravila kapaciteta termina nisu konačno definirana. |
| Ishod | Termin i dodjela dostupni su vlasniku odnosno serviseru. |

### UC-14: Upravljanje timom

| Element specifikacije | Opis |
| --- | --- |
| Primarni akter | Voditelj |
| Preduvjeti | Upravlja predmetnim autoservisom. |
| Glavni uspješni tok | Pregledava tim i opterećenje, odlučuje o članstvu i uklanja članove. |
| Alternative i iznimke | Povijest radova uklonjenog člana ostaje sačuvana; buduće dodjele zahtijevaju preraspodjelu. |
| Ishod | Članstvo je ažurirano. |

### UC-15: Pregled poslovanja i statistike

| Element specifikacije | Opis |
| --- | --- |
| Primarni akter | Voditelj |
| Preduvjeti | Pristup vlastitom autoservisu. |
| Glavni uspješni tok | Odabire razdoblje i pregledava broj završenih servisa, vrste, prosječno trajanje i ukupnu vrijednost. |
| Alternative i iznimke | Bez zapisa prikazuje se prazan pregled; definiciju trajanja treba usuglasiti. |
| Ishod | Prikazana je statistika odabranog razdoblja. |

### UC-16: Uređivanje autoservisa i radnog vremena

| Element specifikacije | Opis |
| --- | --- |
| Primarni akter | Voditelj |
| Preduvjeti | Pristup vlastitom autoservisu. |
| Glavni uspješni tok | Uređuje podatke i radno vrijeme autoservisa. |
| Alternative i iznimke | Nevaljani podaci ne spremaju se. |
| Ishod | Postavke su ažurirane. |

### UC-17: Upravljanje pretplatom i načinom plaćanja

| Element specifikacije | Opis |
| --- | --- |
| Primarni akter | Voditelj |
| Preduvjeti | Pristup vlastitom autoservisu. |
| Glavni uspješni tok | Pregledava pretplatu te kroz Stripe upravlja pretplatom i načinom plaćanja. |
| Alternative i iznimke | Povratak s naplate ne dokazuje uplatu; stanje se potvrđuje provjerenim događajem pružatelja. |
| Ishod | Pretplata odražava potvrđeni rezultat naplate. |

### UC-18: Odobravanje i deaktivacija autoservisa

| Element specifikacije | Opis |
| --- | --- |
| Primarni akter | Administrator |
| Preduvjeti | Administratorske ovlasti. |
| Glavni uspješni tok | Pregledava prijave, prihvaća ili odbija registraciju te deaktivira postojeći autoservis. |
| Alternative i iznimke | Prijava se ne odobrava voditelju koji već upravlja drugim autoservisom. |
| Ishod | Odobrenjem nastaje autoservis s jednim voditeljem; odbijanje ostaje na prijavi. |

### UC-19: Upravljanje korisničkim računima

| Element specifikacije | Opis |
| --- | --- |
| Primarni akter | Administrator |
| Preduvjeti | Administratorske ovlasti. |
| Glavni uspješni tok | Pregledava korisnike prema ulozi i stanju te deaktivira ili ponovno aktivira račun. |
| Alternative i iznimke | Neovlaštena promjena odbija se. |
| Ishod | Deaktivirani račun nema pristup zaštićenim radnjama. |

### UC-20: Određivanje cijene i pregled pretplata

| Element specifikacije | Opis |
| --- | --- |
| Primarni akter | Administrator |
| Preduvjeti | Administratorske ovlasti. |
| Glavni uspješni tok | Pregledava pretplate i određuje mjesečnu cijenu. |
| Alternative i iznimke | Primjena nove cijene na postojeće pretplate ostaje otvorena odluka. |
| Ishod | Nova cijena je evidentirana prema dogovorenim pravilima. |

### UC-21: Pregled statistike platforme

| Element specifikacije | Opis |
| --- | --- |
| Primarni akter | Administrator |
| Preduvjeti | Administratorske ovlasti. |
| Glavni uspješni tok | Pregledava broj korisnika, autoservisa, završenih servisa i aktivnih pretplata. |
| Alternative i iznimke | Neovlašteni pristup odbija se. |
| Ishod | Prikazani su pokazatelji platforme. |

### UC-22: Preuzimanje termina (.ics)

| Element specifikacije | Opis |
| --- | --- |
| Primarni akter | Vlasnik vozila |
| Preduvjeti | Potvrđen vlastiti termin. |
| Glavni uspješni tok | Preuzima termin u formatu .ics i može ga uvesti u kalendar. |
| Alternative i iznimke | Nepotvrđeni termin nije dostupan za izvoz. |
| Ishod | Preuzeta je kalendarska datoteka; izravna integracija Google kalendara nije predviđena. |

### UC-23: Brisanje vlastitog računa

| Element specifikacije | Opis |
| --- | --- |
| Primarni akter | Vlasnik vozila |
| Preduvjeti | Aktivan vlastiti račun. |
| Glavni uspješni tok | Pokreće brisanje vlastitog računa. |
| Alternative i iznimke | Politika zadržavanja osobnih podataka, vozila i povijesti nije definirana; fizičko brisanje nije specificirano. |
| Ishod | Predviđen je prestanak korištenja računa; konačan postupak ovisi o politici zadržavanja. |

## 3.3 Provjera dosljednosti obrazaca uporabe

Oznake UC-01–UC-23 odgovaraju postojećem dijagramu. Povezivanje zahtjeva i ispitivanja održava se u [matrici sljedivosti](2-Analiza-zahtjeva.md#26-sljedivost-zahtjeva); ona još nema konačne UC oznake. Ovdje se ne uvodi druga matrica.

Prema odluci oblikovanja, račun ujedno služi kao potvrda obavljenog servisa. Naziv UC-06 i pojedine UML bilješke još spominju potvrdu zasebno; zaseban dokument nije dio aktualnog modela ServiceDocument. Brisanje računa, učinak deaktivacije na otvorene poslove, kapacitet termina i primjena cijene pretplate još zahtijevaju razradu prije implementacije. Njihovi ishodi nisu prikazani kao već ostvarena ponašanja.
