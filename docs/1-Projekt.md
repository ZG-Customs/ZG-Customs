# 1. Opseg projekta


## 1.1 Problem i cilj projekta

Vlasnici vozila često nemaju jasan uvid u status popravka, opravdanost troškova ni urednu povijest održavanja zbog oslanjanja na telefonske pozive i papirnate evidencije, dok autoservisi gube vrijeme na ručnu koordinaciju radova. Platforma ZG Customs spaja vlasnike vozila, servisere i voditelje autoservisa na jednom mjestu te omogućuje jednostavni odabir termina, transparentno praćenje statusa servisa u stvarnom vremenu, odobravanje dodatnih ponuda te vođenje digitalne povijesti servisa.


## 1.2 Ciljani korisnici i dionici

| Skupina korisnika ili dionika | Potreba ili interes relevantan za ovaj projekt |
| --- | --- |
| Vlasnik vozila | Unijeti vozila, zatražiti termin servisa, primati e-mail obavijesti, prihvatiti dodatne ponude, pregledati račun i povijest te ocijeniti uslugu. | 
| Serviser | Pregledati dodijeljena vozila, unijeti radove, dijelove, utrošeno vrijeme i dodatne npomene, izraditi ponudu za dodatne radove te unijeti konačni trošak. |
| Voditelj autoservisa | Upravljati serviserima, dodjeljivati zadatke, prilagođavati raspored te pregledavati statistiku poslovanja.|
| Administrator platforme | Upravljati računima korisnika i autoservisera, postavljati cijenu mjesečne pretplate te pratiti statistiku korištenja. |
| Vanjski servisi za naplatu i autentifikaciju (Dionik) | Pružiti sigurnu autentifikaciju, dostavu e-mail obavijesti i kartičnu naplatu.|


## 1.3 Granice projekta

**Uključeno:** Registracija i prijava korisnika putem vanjskog servisa za autentifikaciju OAuth 2.0.
Upravljanje osobnim vozilima i slanje zahtjeva za servis od strane vlasnika.
Alati za servisere za unos obavljenih radova, ugrađenih dijelova, utrošenog vremena i dodatnih napomena.
Administrativni i upravljački alati za voditelje autoservisa (rasporedi, dodjeljivanje poslova, statistika).
Izrada računa, ocjenjivanje usluga, vođenje servisne povijesti i slanje e-mail obavijesti.
Sustav naplate mjesečne pretplate kreditnom karticom za autoservise i administrativno upravljanje platformom.

**Isključeno:** Integracija sa skladištima rezervnih dijelova (praćenje lagera je interno unutar servisa). Mobilne aplikacije (sustav je u ovoj fazi ograničen na web platformu).

**Vanjska ovisnost:** Vanjski servis za autentifikaciju korisnika (OAuth 2.0).
Vanjski servis za naplatu i upravljanje pretplatama (Stripe).
Vanjski servis za slanje e-mail obavijesti (Resend).


## 1.4 Postojeći pristupi i opravdanost projekta

Nakon kvarova ili potrebe za redovnim servisom, vlasnici vozila termin najčešće dogovaraju putem telefonskih poziva ili posjetom autoservisu, dok se evidencija o popravcima i računi često izdaju u papirnatom obliku. Predložena web platforma AutoServis spaja proces naručivanja, digitalnu komunikaciju između klijenta i servisera, odobravanje naknadnih troškova te povijest servisa na jednom mjestu. Aplikacija ne zamjenjuje zakonski propisane tehničke preglede niti službena jamstva proizvođača vozila, već služi kao poslovni i komunikacijski alat za organizaciju rada servisa.
