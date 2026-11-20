# 7. Zaključak i budući rad

**Cilj:** Objektivno procijeniti i dokumentirati konačni opseg onoga što je tim isporučio, kritički se osvrnuti na najvažnije inženjerske spoznaje stečene tijekom razvoja programa te identificirati realne mogućnosti nadogradnje.

## 7.1 Rezultati projekta

U prvom ciklusu vlasnik može registrirati račun, dodati vozilo, ponovno otvoriti svoj popis i arhivirati vozilo. Voditelj podnosi prijavu autoservisa, administrator o njoj odlučuje, a serviser može zatražiti članstvo. [Rezultati od 20. 11. 2026.](5-Ispitivanje.md) obuhvaćaju ispitne identitete, vlasničke ovlasti i dostupnost javne aplikacije.

## 7.2 Izazovi i naučene lekcije

Brisanje vozila s postojećom rezervacijom ugrozilo bi povijest servisa. Tim je zato uveo arhiviranje. [Integracijski test](../backend/src/test/java/hr/fer/zgcustoms/VehicleIntegrationTests.java) provjerava oba učinka iste radnje: vozilo nestaje s aktivnog popisa, a veza s rezervacijom ostaje sačuvana.

<details>
<summary><strong>Primjer: obrada lokacije pri prijavi događaja</strong></summary>

**Primjer — CrisisMap:** Tim se pri podnošenju prijava kriznih događaja u početku oslanjao na pristup lokaciji preglednika. Kada su korisnici odbili dopuštenje, nisu mogli zadati lokaciju. Tim je dodao mogućnost ručnog odabira lokacije i ispitao oba puta. To je pokazalo zašto funkcionalnost koja ovisi o dopuštenju od početka treba imati alternativni korisnički tijek.

**Analiza primjera:** Opis navodi poteškoću, odgovor tima i konkretnu naučenu lekciju. Ne tvrdi da je cijela aplikacija ispitana samo zato što je provjeren jedan tijek.

</details>

## 7.3 Budući rad

Sljedeći korisnički tijek povezuje zahtjev vlasnika za termin s odlukom voditelja i dodjelom servisera. Na potvrđeni termin nadovezuju se radni nalog, dodatne ponude i servisna povijest. Za Resend i Stripe planirane su odvojene provjere dostave i naplate. [Sljedivost zahtjeva](2-Analiza-zahtjeva.md#26-sljedivost-zahtjeva) navodi povezane zadatke i ispitne slučajeve.

---

>**Završna provjera:** Tvrdnje o dovršenim funkcionalnostima podudaraju se s postavljenom aplikacijom i rezultatima ispitivanja. Nedovršen rad jasno je naveden; planovi za budući rad ne prikazuju se kao dovršene funkcionalnosti. Utrošeno vrijeme i pojedinačni doprinosi dokumentirani su u dokumentu [A. Pregled aktivnosti grupe](A-Pregled-aktivnosti-grupe.md).
