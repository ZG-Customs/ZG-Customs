# 2. Analiza zahtjeva

Ovaj dokument opisuje zahtjeve web-aplikacije **ZG Customs** prema projektnom zadatku **AutoServis**, autorice Ede Jovičić (listopad 2026., str. 2–3), i projektnim odlukama tima. Zahtjevi opisuju očekivanu konačnu aplikaciju, a ne trenutačno implementirane ili ispitane funkcionalnosti.

U reviziji od **30. 10. 2026.** početnih 28 funkcijskih zahtjeva objedinjeno je u **16 glavnih zahtjeva**. Srodne radnje i podaci povezani su u cjelovite korisničke ciljeve; funkcionalnosti iz zadatka ostaju u opsegu. Revizija i prioriteti pripremljeni su za pregled tima na temelju povratne informacije asistentice koju je prenio član tima.

**Značenje prioriteta:**

| Prioritet | Značenje u ovom projektu |
| --- | --- |
| **Visok** | Potreban za osnovni tijek od prijave i zahtjeva za servis do evidencije završetka, za kontrolu pristupa ili za početnu domenski relevantnu vanjsku integraciju. Razvija se prvi. |
| **Srednji** | Nadograđuje osnovni tijek: dodatne ponude, upravljanje zaposlenicima, povijest i dokumenti te pretplate. Planira se nakon uspostave temeljnih ovisnosti. |
| **Nizak** | Dodatni pregled ili povratna informacija koji ne blokiraju pojedini servis: statistike, ocjene i pregled korištenja platforme. Razvija se nakon osnovnih procesa. |

Prioritet označava redoslijed razvoja, ne brisanje obveze iz zadatka. **I zahtjevi niskog prioriteta ostaju dio završnog opsega**, osim ako asistentica izričito odobri promjenu. Visok prioritet također ne određuje sam po sebi opseg prve predaje; on se usklađuje s kriterijima kolegija i planom tima.

## 2.1 Funkcijski zahtjevi

Svaki redak predstavlja korisnički cilj ili zaokruženu funkcionalnost. Pojedina polja obrazaca i povezani koraci opisani su kriterijima prihvaćanja. Samo složenija obrada servisa ima podoznake F-006.1–F-006.3 kako bi se njezini dijelovi mogli zasebno pratiti i ispitati.

Glavni zahtjevi numerirani su redom od **F-001** do **F-016**, bez preskakanja brojeva. Sve tablice aktera, ograničenja, promjena i sljedivosti koriste tu numeraciju. [Mapa spajanja](#mapa-spajanja-funkcijskih-zahtjeva) zasebno uspoređuje stare oznake iz `maina` s novima. Odabir Stripea i Resenda projektna je odluka; zadatak traži kartičnu pretplatu i vanjsku dostavu e-pošte, ali ne propisuje te pružatelje.

| ID | Opis | Prioritet | Izvor | Kriteriji prihvaćanja |
| --- | --- | --- | --- | --- |
| F-001 | Korisnik se registrira i prijavljuje putem vanjskog pružatelja identiteta uz OpenID Connect / OAuth 2.0. | Visok | Zadatak, str. 2; zahtjevi kolegija. | Uspješna vanjska prijava povezuje se s korisničkim računom u aplikaciji; ponovna prijava koristi isti račun. Neuspješna ili prekinuta prijava ne omogućuje zaštićene radnje. Pružatelja identiteta treba odabrati. |
| F-002 | Korisnik pri uspostavi profila navodi podatke potrebne za ulogu vlasnika vozila, servisera ili voditelja autoservisa. | Visok | Zadatak, str. 2. | Evidentira se uloga i pripadajući profil: vlasnik unosi osnovne osobne i kontaktne podatke; serviser ime, prezime, specijalizaciju i pripadnost autoservisu; voditelj podatke o autoservisu u kojem radi. Podaci se mogu ponovno pregledati. Obavezna polja i provjeru dodjele uloge treba dogovoriti; unos uloge sam po sebi ne smije zaobići NF-02. |
| F-003 | Vlasnik unosi svoja vozila i pregledava njihove osnovne podatke. | Visok | Zadatak, str. 2. | Uz vlasnika se pohranjuju registarska oznaka, marka, model, godina proizvodnje i kilometraža svakog unesenog vozila. Nakon ponovnog otvaranja vlasnik vidi iste podatke o svojim vozilima. |
| F-004 | Vlasnik traži termin za svoje vozilo i prati stanje servisnog zahtjeva. | Visok | Zadatak, str. 2. | Za odabrano vozilo pohranjuju se vrsta servisa i željeni termin; vlasnik može ponovno otvoriti zahtjev i vidjeti njegov trenutačni status. Primjeri vrsta su redovni servis, zamjena guma, popravak kočnica i dijagnostika. Primjeri statusa iz zadatka su zatražen, potvrđen, vozilo zaprimljeno, servis u tijeku, čeka odobrenje, završen i otkazan. Skup statusa, ovlasti za prijelaze i odabir autoservisa razrađuju se u 2.4. |
| F-005 | Sustav obavještava vlasnika e-poštom o promjenama statusa i važnim informacijama o servisu putem Resenda. | Visok | Zadatak, str. 2; odabir Resenda: tim. | Nakon promjene statusa poruka s pripadajućim zahtjevom i novim statusom dostavljena je u ispitni sandučić odgovarajućeg vlasnika. Ista provjera provodi se za dogovorene dodatne događaje. Popis važnih informacija i postupanje pri neuspjeloj dostavi treba razraditi. |
| F-006 | Serviser obrađuje dodijeljeni servis od pregleda zahtjeva do evidencije radova i završnog troška. | Visok | Zadatak, str. 2. | **F-006.1 — Pregled:** serviser vidi dodijeljene zahtjeve i pripadajuća vozila.<br>**F-006.2 — Evidencija:** uz odgovarajući servis sprema i ponovno pregledava obavljene radove, ugrađene dijelove, utrošeno vrijeme i napomene.<br>**F-006.3 — Završetak:** nakon radova evidentira završni status i konačni trošak; vlasnik vidi ažurirano stanje zahtjeva. |
| F-007 | Serviser predlaže dodatne radove, a vlasnik putem platforme prihvaća ili odbija ponudu. | Srednji | Zadatak, str. 2. | Ponuda je povezana sa servisom, sadrži opis dodatnih radova i procijenjeni trošak te je dostupna vlasniku vozila. Prihvaćanje ili odbijanje sprema se uz ponudu i vidljivo je serviseru. Postupak nastavka servisa nakon odbijanja treba dogovoriti. |
| F-008 | Voditelj upravlja serviserima svojeg autoservisa. | Srednji | Zadatak, str. 2. | Voditelju su dostupni popis servisera njegova autoservisa i dogovorene radnje upravljanja njihovom pripadnošću autoservisu. Ne može upravljati zaposlenicima drugog autoservisa. Način povezivanja, odobravanja i uklanjanja pripadnosti te učinak na otvorene dodjele treba razraditi. |
| F-009 | Voditelj organizira servisne zahtjeve dodjelom servisera i upravljanjem terminima. | Visok | Zadatak, str. 2. | Voditelj vidi zahtjeve svojeg autoservisa, dodjeljuje ih pripadajućim serviserima te postavlja ili mijenja termin. Nakon spremanja dodjela je vidljiva serviseru, a novi termin uz zahtjev vlasniku. Pravila potvrđivanja, otkazivanja i preklapanja termina treba dogovoriti. |
| F-010 | Sustav vodi servisnu povijest vozila i omogućuje njezin pregled vlasniku te voditelju odgovarajućeg autoservisa. | Srednji | Zadatak, str. 2–3. | Povijest sadrži datume i vrste servisa, radove, zamijenjene dijelove i troškove. Vlasnik vidi povijest svojih vozila; voditelj vidi zapise o svim vozilima servisiranima u njegovu autoservisu, ali samo radove svojeg autoservisa. Oba pregleda koriste iste pohranjene servisne zapise, uz ograničenja NF-02. |
| F-011 | Voditelj pregledava statistiku poslovanja svojeg autoservisa. | Nizak | Zadatak, str. 2. | Prikazani su broj obavljenih servisa prema vrsti, prosječno trajanje servisa i ukupna vrijednost obavljenih usluga. Za dogovoreno razdoblje i definiciju trajanja rezultati na kontrolnom skupu podataka moraju odgovarati očekivanim izračunima. |
| F-012 | Vlasnik za završeni servis pregledava detaljan račun i preuzima potvrdu o obavljenom servisu. | Srednji | Zadatak, str. 3. | Vlasnik može otvoriti račun povezan sa završenim servisom i preuzeti pripadajuću potvrdu. Podaci o radovima i trošku usklađeni su sa servisnom evidencijom. Pregled računa i preuzimanje potvrde provjeravaju se zasebno; format i obavezan sadržaj oba dokumenta treba dogovoriti. |
| F-013 | Vlasnik nakon završenog servisa ocjenjuje uslugu i ostavlja komentar. | Nizak | Zadatak, str. 3. | Ocjena i komentar spremaju se uz završeni servis tog vlasnika te se mogu ponovno pregledati. Korisnik ne može ocijeniti tuđi ili nezavršeni servis. Ljestvicu ocjenjivanja treba dogovoriti. |
| F-014 | Autoservis plaća mjesečnu pretplatu kreditnom karticom putem Stripea za napredne funkcionalnosti, a administrator određuje njezinu cijenu. | Srednji | Zadatak, str. 2–3; odabir Stripea: tim. | Ovlaštena osoba za autoservis može platiti mjesečnu pretplatu kreditnom karticom; rezultat je povezan s pretplatom i njezinim stanjem. Administrator može postaviti cijenu. Napredne funkcionalnosti, ovlaštenog platitelja, aktivaciju, istek, neuspjelu naplatu i primjenu nove cijene treba dogovoriti. |
| F-015 | Administrator upravlja korisnicima i autoservisima te deaktivira korisničke račune. | Visok | Zadatak, str. 3. | Administrator može pregledati korisnike i autoservise te provesti dogovorene upravljačke radnje, uključujući deaktivaciju odabranog računa. Deaktivirani račun ne može koristiti zaštićene radnje aplikacije. Ostale radnje upravljanja i učinak deaktivacije na aktivne prijave i postojeće servisne zahtjeve treba razraditi. |
| F-016 | Administrator pregledava osnovne podatke o korištenju platforme. | Nizak | Zadatak, str. 3. | Administratoru su prikazani dogovoreni pokazatelji korištenja platforme; vrijednosti na kontrolnom skupu podataka odgovaraju očekivanim rezultatima. Konkretne pokazatelje i razdoblje pregleda treba odrediti. |

**Raspodjela:** 8 visokih, 5 srednjih i 3 niska prioriteta. E-pošta ostaje visokog prioriteta jer daje domenski relevantnu vanjsku integraciju. Dodatne ponude i pretplate ostaju obavezne, ali slijede nakon osnovnog procesa servisiranja. Statistike i ocjene ne blokiraju taj proces pa imaju niski prioritet. Dodjela servisera pretpostavlja postojeće profile i pripadnost autoservisu iz F-002; cjelovito sučelje za upravljanje zaposlenicima iz F-008 razvija se nakon te osnove.

## 2.2 Nefunkcijski zahtjevi

Nefunkcijski zahtjevi određuju svojstva kvalitete koja vrijede kroz više korisničkih tijekova. Zadržano je svih osam prethodno prihvaćenih svojstava; nisu međusobno zamjenjiva. U ovoj reviziji predloženi su novi prioriteti za NF-01 i NF-04 te preciznija provjera mobilnog prikaza. Izvor označava raniji projektni dogovor, a ne odobrenje asistentice, ostvarenu implementaciju ili uspješno ispitivanje.

| ID | Opis | Prioritet | Izvor | Način provjere |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NF-01 | Korisničko sučelje mora omogućiti korištenje aplikacije na mobilnim uređajima. | Srednji | Zahtjev člana tima, 24. 10. 2026. | Predložena provjera: u pregledniku na širinama 360, 768 i 1280 CSS piksela provesti glavne tijekove svih uloga. Sadržaj mora biti čitljiv, a kontrole dostupne bez preklapanja i odsijecanja. |
| NF-02 | Pristup podacima i radnjama treba biti ograničen prema ulozi i pripadnosti vlasniku odnosno autoservisu, uz provjeru na poslužitelju. | Visok | Zahtjev člana tima, 24. 10. 2026. | Nakon dogovora matrice ovlasti pokušati dohvat i izmjenu podataka drugim korisničkim računom te izravnim zahtjevom prema poslužitelju; provjeriti da nedopušteni pristup nije omogućen. |
| NF-03 | Javno dostupna aplikacija treba koristiti HTTPS za prijenos podataka između preglednika i poslužitelja. | Visok | Zahtjev člana tima, 24. 10. 2026. | Provjeriti valjanost certifikata, preusmjeravanje s HTTP-a na HTTPS i prijenos aplikacijskih zahtjeva putem HTTPS-a. |
| NF-04 | Kod nevaljanog unosa ili neuspjele radnje aplikacija treba prikazati razumljivu poruku, bez lažne potvrde uspjeha ili otkrivanja tehničkih tajni. | Visok | Zahtjev člana tima, 24. 10. 2026. | Poslati obrazac s nedostajućim obaveznim podatkom i simulirati nedostupnost poslužitelja; provjeriti poruke, izostanak lažne potvrde i izostanak lozinki ili internih tragova pogreške u prikazu. |
| NF-05 | Glavne radnje u obrascima moraju biti dostupne tipkovnicom, uz vidljiv fokus, opisne oznake polja i poruke o pogreškama koje nisu izražene samo bojom. | Srednji | Zahtjev člana tima, 24. 10. 2026. | Bez miša ispuniti i poslati obrasce za unos vozila i zahtjeva za servis te prihvatiti ili odbiti ponudu. Provjeriti redoslijed fokusa, oznake polja i tekstualno objašnjenje pogrešaka. |
| NF-06 | Povezane promjene podataka unutar jedne poslovne radnje moraju se spremiti u cijelosti ili se u slučaju pogreške poništiti, bez djelomično spremljenih zapisa. | Visok | Zahtjev člana tima, 24. 10. 2026. | U ispitnom okruženju izazvati pogrešku tijekom spremanja završetka servisa i povezanih podataka o trošku. Provjeriti da se nijedna promjena te radnje nije djelomično spremila; pri uspješnom ponavljanju provjeriti sve povezane zapise. |
| NF-07 | Podaci o vozilima, servisima i korisnicima moraju se moći obnoviti iz sigurnosne kopije baze podataka. | Visok | Zahtjev člana tima, 24. 10. 2026. | Izraditi sigurnosnu kopiju ispitne baze i obnoviti je u zasebnu praznu bazu. Usporediti broj zapisa, odabrane vrijednosti i veze među korisnicima, vozilima i servisima. Postupak i rezultat obnove zabilježiti uz ispitni slučaj. |
| NF-08 | Lozinke za bazu, ključevi vanjskih servisa i pristupni tokeni ne smiju biti uključeni u verzionirani izvorni kod, isporučeni kod preglednika ni aplikacijske zapisnike. | Visok | Zahtjev člana tima, 24. 10. 2026. | U ispitnom okruženju koristiti prepoznatljive zamjenske tajne te provjeriti da ih nema u praćenim datotekama, izgrađenim datotekama sučelja i zapisnicima, uključujući zapise nakon izazvane pogreške. |

## 2.3 Dionici i akteri

Akteri izravno komuniciraju s aplikacijom. Projektni zadatak određuje četiri korisničke uloge te vanjske usluge prijave, e-pošte i kartične naplate. OAuth 2.0 je protokol, a ne naziv pružatelja identiteta; konkretan pružatelj još nije odabran. Stripe i Resend odabiri su tima.

| ID uloge ili aktera | Odnos prema sustavu | Relevantni zahtjevi |
| --- | --- | --- |
| A-01 — Vlasnik vozila | Prijavljuje se, unosi profil i vozila, traži servis, prati status, prima obavijesti, odlučuje o ponudi te pregledava povijest i dokumente i ocjenjuje uslugu. | F-001, F-002, F-003, F-004, F-005, F-007, F-010, F-012, F-013 |
| A-02 — Serviser | Prijavljuje se, navodi profil i autoservis, obrađuje dodijeljene servise i izrađuje ponude dodatnih radova. | F-001, F-002, F-006, F-007 |
| A-03 — Voditelj autoservisa | Prijavljuje se, navodi autoservis, upravlja zaposlenicima i rasporedom te pregledava povijest i statistiku. | F-001, F-002, F-008, F-009, F-010, F-011 |
| A-04 — Administrator platforme | Pristupa administraciji, upravlja korisnicima i autoservisima, deaktivira račune, određuje cijenu pretplate i pregledava korištenje platforme. | F-001, F-014, F-015, F-016 |
| A-05 — Vanjski pružatelj identiteta | Sudjeluje u vanjskoj registraciji i prijavi; konkretan pružatelj još nije odabran. | F-001 |
| A-06 — Resend | Dostavlja e-mail obavijesti vlasnicima vozila. | F-005 |
| A-07 — Stripe | Obrađuje kartičnu naplatu pretplata i aplikaciji vraća rezultat. | F-014 |
| D-01 — Autoservis | Koristi platformu za organizaciju servisiranja i plaća pretplatu. Osobu ovlaštenu za plaćanje treba odrediti; sama organizacija nije korisnik koji se prijavljuje. | F-002, F-006, F-007, F-008, F-009, F-010, F-011, F-014 |
| D-02 — Asistentica Eda Jovičić | Autorica zadatka i osoba za njegova pojašnjenja; nije korisnička uloga aplikacije. | Tumačenje opsega svih zahtjeva. |
| D-03 — Razvojni tim ZG Customs | Razrađuje, implementira, ispituje i dokumentira sustav; nije zasebna korisnička uloga aplikacije. | Svi zahtjevi. |

Nefunkcijski zahtjevi primjenjuju se na sve relevantne korisničke tijekove, a ne samo na jednu ulogu. Ovlasti i granice pristupa provjeravaju se prema NF-02 i kada u funkcijskom zahtjevu nisu ponovno ispisane.

## 2.4 Ograničenja i otvorena pitanja

| ID | Ograničenje | Izvor | Posljedica za realizaciju |
| --- | --- | --- | --- |
| C-01 | Rješenje je web-platforma. | Zadatak, str. 2. | Korisnički tijekovi dostupni su kroz preglednik; mobilni prikaz uređuje NF-01. |
| C-02 | Registracija i prijava koriste vanjskog pružatelja identiteta uz OpenID Connect / OAuth 2.0. | Zadatak, str. 2; zahtjevi kolegija. | Za F-001 odabrati pružatelja i način povezivanja identiteta s lokalnim profilom i ovlastima. |
| C-03 | Obavijesti vlasnicima šalju se preko vanjske usluge e-pošte; odabran je Resend. | Zadatak, str. 2; odabir pružatelja: tim. | F-005 provjerava stvarnu dostavu u ispitni sandučić, ne samo zapis obavijesti u bazi. |
| C-04 | Korištenje platforme besplatno je za vlasnike vozila. | Zadatak, str. 2. | Funkcionalnosti vlasnika ne uvjetovati plaćanjem vlasničke pretplate. |
| C-05 | Autoservisi plaćaju mjesečnu kartičnu pretplatu za napredne funkcionalnosti; odabran je Stripe. | Zadatak, str. 2; odabir pružatelja: tim. | Za F-014 odrediti prava pretplate, platitelja i obradu njezina stanja. To nije zahtjev za kartičnim plaćanjem pojedinog popravka. |

**Otvorena pitanja za tim i asistenticu:**

- **F-001, F-002, F-008, F-015:** koji se pružatelj identiteta koristi, koja su obavezna profilna polja, kako se provjeravaju uloge i pripadnost autoservisu te uspostavlja administrator? Koje radnje obuhvaća upravljanje zaposlenicima, korisnicima i autoservisima te kako utječu na aktivne prijave i otvorene zahtjeve?
- **F-004, F-006, F-009:** kako vlasnik odabire autoservis, tko potvrđuje ili otkazuje termin, koji su dopušteni prijelazi statusa i kako se rješava preklapanje termina?
- **F-005, F-007:** koje dodatne informacije pokreću e-poštu, što nakon neuspjele dostave i kako se servis nastavlja nakon odbijanja dodatnih radova?
- **F-012, F-013:** koji su format i obavezan sadržaj računa i potvrde te ljestvica ocjenjivanja?
- **F-011, F-016:** koja su razdoblja pregleda, definicija trajanja servisa i konkretni pokazatelji korištenja platforme?
- **F-014:** koje su funkcionalnosti napredne, tko plaća u ime autoservisa, koristi li demonstracija Stripeovo testno okruženje te koja su pravila aktivacije, isteka i neuspjele naplate? Kada promjena cijene vrijedi za postojeće pretplate?

Otvorene pojedinosti ne predstavljaju već dogovorene odluke. Odgovori i eventualne promjene opsega bilježe se nakon stvarnog dogovora.

## 2.5 Značajne promjene zahtjeva

| Datum | ID zahtjeva | Promjena i razlog | Izvor promjene |
| --- | --- | --- | --- |
| 24. 10. 2026. | NF-01 | Dodan mobilni prikaz. | Izričit zahtjev člana tima pri izradi analize. |
| 24. 10. 2026. | NF-02–NF-08 | Prihvaćeni kontrola pristupa, HTTPS, obrada pogrešaka, pristupačnost, cjelovitost spremanja, obnova podataka i zaštita tajni. | Uputa člana tima tijekom uređivanja analize. |
| 30. 10. 2026. | Funkcijski zahtjevi; mapa niže | Objedinjeno 28 stavki u 16 glavnih zahtjeva bez uklanjanja funkcionalnosti iz zadatka. Povezani detalji postali su kriteriji prihvaćanja. Na naknadni zahtjev člana tima uvedena je uzastopna numeracija F-001–F-016 i usklađena sva projektna pozivanja. | Ivan Bartol prenio je povratnu informaciju asistentice o prevelikom broju i preklapanju zahtjeva te zatražio lokalnu reviziju. Nova formulacija čeka pregled tima. |
| 30. 10. 2026. | F-007, F-008, F-010, F-012 | Srednji prioritet za dodatne ponude, cjelovito upravljanje zaposlenicima, povijest i dokumente: slijede nakon osnovnog tijeka, ali ostaju u završnom opsegu. Objedinjena servisna povijest obuhvaća i vlasnikov pregled, koji je prije imao visok prioritet. | Prijedlog redoslijeda razvoja u ovoj reviziji. |
| 30. 10. 2026. | F-011, F-013, F-016 | Prioritet spušten sa srednjeg na nizak jer statistike, ocjene i pregled korištenja ne blokiraju obavljanje servisa. | Prijedlog redoslijeda razvoja u ovoj reviziji. |
| 30. 10. 2026. | NF-01, NF-04 | Mobilni prikaz pomaknut na srednji prioritet; ispravna obrada pogrešaka na visoki jer osnovni tijek ne smije lažno potvrditi neuspjelu radnju ili otkriti tajne. Za NF-01 predložene su konkretne širine provjere. | Razrada zahtjeva prema uputi člana tima; za pregled tima. |

### Mapa spajanja funkcijskih zahtjeva

**Stare oznake** u lijevom stupcu odnose se isključivo na početni popis od 28 zahtjeva iz `maina` prije ove revizije (commit `3f5c98b`). **Nove oznake** u srednjem stupcu vrijede za ovu analizu i sve povezane tablice. Isti broj u ta dva stupca može označavati različitu funkcionalnost; pri usporedbi treba pratiti redak i opis, ne samo broj. U svim novim zadacima, obrascima uporabe i ispitivanjima koristi se nova numeracija.

Tablica obuhvaća svih 28 starih zahtjeva, uključujući one koji nisu spajani nego su samo dobili novi broj. Stare oznake navedene ovdje nisu dodatni aktivni zahtjevi.

| Stare oznake — main prije revizije | Nova oznaka — ova revizija | Funkcionalnost i razlog povezivanja |
| --- | --- | --- |
| F-001 | F-001 | Vanjska registracija i prijava ostaju zaseban zahtjev; oznaka se ne mijenja. |
| F-002, F-003, F-004, F-009 | F-002 | Uloga, osobni i kontaktni podaci, specijalizacija i autoservis objedinjeni su u uspostavu profila. |
| F-005 | F-003 | Evidencija vlastitih vozila; zahtjev nije spajan s drugim zahtjevima. |
| F-006, F-007 | F-004 | Podnošenje i praćenje vlastitog servisnog zahtjeva čine povezani korisnički tijek. |
| F-008 | F-005 | Obavijesti e-poštom; zahtjev nije spajan s drugim zahtjevima. |
| F-010, F-011, F-014 | F-006 | Pregled dodjele, evidencija radova i završetak servisa objedinjeni su uz podoznake F-006.1–F-006.3. |
| F-012, F-013 | F-007 | Izrada ponude i vlasnikova odluka čine cjelinu odobravanja dodatnih radova. |
| F-015 | F-008 | Upravljanje serviserima autoservisa; zahtjev nije spajan s drugim zahtjevima. |
| F-016, F-017 | F-009 | Dodjela servisera i raspored pripadaju organizaciji servisnog zahtjeva. |
| F-018, F-022 | F-010 | Jedinstvena servisna povijest ima dva ovlaštena pregleda: vlasnikov i voditeljev. |
| F-019 | F-011 | Statistika autoservisa; zahtjev nije spajan s drugim zahtjevima. |
| F-020, F-023 | F-012 | Račun i potvrda pripadaju dokumentima završenog servisa; obje mogućnosti ostaju zasebno provjerljive. |
| F-021 | F-013 | Ocjena i komentar nakon servisa; zahtjev nije spajan s drugim zahtjevima. |
| F-024, F-026 | F-014 | Naplata i administratorsko određivanje cijene pripadaju pretplati; oba aktera i njihove radnje ostaju navedeni. |
| F-025, F-027 | F-015 | Deaktivacija je konkretna radnja upravljanja korisničkim računima i autoservisima. |
| F-028 | F-016 | Administratorski pregled korištenja platforme; zahtjev nije spajan s drugim zahtjevima. |

## 2.6 Sljedivost zahtjeva

Tablica povezuje aktualne zahtjeve s postojećim [zadacima prvog sastanka](meeting-notes/sprint-01.md), planiranim komponentama i budućim provjerama. Svaki od 16 funkcijskih zahtjeva ima vlastiti redak. Oznake AS označavaju zadatke, ne dodatne funkcijske zahtjeve; njihove postojeće oznake nisu mijenjane. Stvarni UC i ispitni ID-ovi dodat će se nakon razrade; tablica ne potvrđuje da su testovi već provedeni.

| ID zahtjeva | Povezani zadaci | Planirana realizacija | Ispitivanje / provjera |
| --- | --- | --- | --- |
| F-001 | AS04 | Modul korisnika; Spring Security; vanjski pružatelj identiteta; PostgreSQL | Uspješna, prekinuta i neuspješna prijava; povezivanje identiteta bez dupliciranja računa. |
| F-002 | AS04, AS06 | React profili; modul korisnika i uloga; PostgreSQL | Obavezni podaci prema ulozi, specijalizacija i pripadnost autoservisu; ponovni pregled profila i provjera dodjele ovlasti. |
| F-003 | AS07 | Sučelje vlasnika; modul vozila; PostgreSQL | Unos svih osnovnih podataka i ponovni dohvat vlastitih vozila. |
| F-004 | AS05, AS09 | Sučelje vlasnika; modul servisnih zahtjeva; PostgreSQL | Zahtjev s vozilom, vrstom i terminom; prikaz promjena statusa i zabrana pristupa tuđem zahtjevu. |
| F-005 | AS08 | Modul obavijesti; Resend | Točan primatelj, zahtjev i status u poruci; stvarna dostava; dogovoreno postupanje pri neuspjehu. |
| F-006 (F-006.1–F-006.3) | AS06, AS10 | Sučelje servisera; moduli zahtjeva i radova; PostgreSQL | Pregled dodjele; spremanje i ponovno čitanje radova, dijelova, vremena i napomena; završetak s konačnim troškom. |
| F-007 | AS15 | Sučelja servisera i vlasnika; modul ponuda; PostgreSQL | Ponuda s opisom i iznosom; prihvaćanje i odbijanje; pohrana odluke i njezin prikaz serviseru. |
| F-008 | AS11 | Sučelje voditelja; modul zaposlenika autoservisa | Dogovorene radnje upravljanja zaposlenicima; zabrana upravljanja tuđim autoservisom. |
| F-009 | AS12 | Sučelje voditelja; modul rasporeda i dodjele | Dodjela serviseru; izmjena termina; vidljivost dodjele i termina odgovarajućim korisnicima. |
| F-010 | AS17, AS18 | Sučelja vlasnika i voditelja; servisna povijest; PostgreSQL | Potpunost povijesnog zapisa; vlasnik vidi svoja vozila, voditelj samo radove svojeg autoservisa. |
| F-011 | AS21 | Sučelje voditelja; izračuni statistike | Tri pokazatelja iz zadatka uspoređena s očekivanim izračunima kontrolnih podataka. |
| F-012 | AS17, AS19 | Sučelje vlasnika; modul servisnih dokumenata | Pregled detaljnog računa i preuzimanje potvrde; usklađenost troška s evidencijom; ovlasti. |
| F-013 | AS20 | Sučelje vlasnika; modul ocjena | Pohrana ocjene i komentara; zabrana ocjenjivanja tuđeg ili nezavršenog servisa. |
| F-014 | AS13, AS22 | Modul pretplata; Stripe; administratorsko određivanje cijene | Uspješna i neuspješna naplata; provjera izvora i ponovljene obrade Stripe obavijesti; dogovorena promjena cijene i prava pretplate. |
| F-015 | AS16 | Administratorsko sučelje; modul korisnika i autoservisa | Dogovorene upravljačke radnje; deaktivacija i odbijanje zaštićenog pristupa; zabrana radnji drugim ulogama. |
| F-016 | AS22 | Administratorski pregled korištenja | Dogovoreni pokazatelji u skladu s kontrolnim podacima. |
| NF-01 | AS24 | Prilagodljivi React/CSS prikazi | Glavni tijekovi svih uloga na dogovorenim širinama prikaza. |
| NF-02 | AS04, AS24 | Spring Security; provjere uloge, vlasništva i autoservisa | Neprijavljeni pristup, pogrešna uloga i izravni API zahtjevi za tuđe podatke. |
| NF-03 | AS03, AS14, AS24 | Caddy i HTTPS; Docker Compose; Azure | Valjan certifikat i HTTP preusmjeravanje; izravni backend i baza nisu javno izloženi. |
| NF-04 | AS24 | Validacija unosa i obrada pogrešaka u Reactu i Spring Bootu | Nevaljani unosi i nedostupne usluge bez lažne potvrde ili otkrivanja tajni. |
| NF-05 | AS24 | Semantička polja i kontrole; vidljivi fokus | Izvođenje obrazaca tipkovnicom i razumljive tekstualne poruke. |
| NF-06 | AS24 | Spring Boot transakcije; PostgreSQL ograničenja | Pogreška poništava povezane promjene; uspješno spremanje je cjelovito. |
| NF-07 | AS03, AS24 | Kopije PostgreSQL-a i operativne skripte | Obnova zasebne ispitne baze i usporedba zapisa i veza. |
| NF-08 | AS03, AS24 | Privatna konfiguracija; zaštita zapisnika | Zamjenske tajne nisu u Gitu, paketu preglednika ni zapisnicima. |

## 2.7 Pregled zahtjeva

| Kontrolna točka | Povratna informacija ili nalaz | Odluka o zahtjevu ili opsegu |
| --- | --- | --- |
| Radna revizija, 30. 10. 2026. | Prema informaciji člana tima, asistentica je upozorila na prevelik broj i preklapanje funkcijskih zahtjeva. Član tima zatražio je i realističniju raspodjelu prioriteta. | Pripremljen je prijedlog 16 glavnih zahtjeva, mape spajanja i novih prioriteta uz očuvan opseg. Potreban je pregled tima; ne tvrdi se da je asistentica odobrila pojedine nove formulacije. |
| Iteracija 1 | Dopuniti stvarnim nalazima nakon pregleda. | Nije evidentirano. |
| Demo 2 | Dopuniti stvarnim nalazima nakon pregleda. | Nije evidentirano. |
| Završni pregled | Dopuniti stvarnim nalazima nakon pregleda. | Nije evidentirano. |

**Preostalo za dopunu:** razriješiti otvorena pitanja iz 2.4, uskladiti nove prioritete u planu zadataka te povezati zahtjeve sa stvarnim obrascima uporabe i ispitnim slučajevima. Dokument ne tvrdi da su svi zahtjevi ostvareni ili provjereni.
