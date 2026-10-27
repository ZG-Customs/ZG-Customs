# 6. Postavljanje, instalacija i konfiguracija

Ovo poglavlje opisuje stvarno postavljenu početnu inačicu sustava **ZG Customs**, provjerenu 27. 10. 2026. Javno je dostupna na [https://zgcustoms.duckdns.org](https://zgcustoms.duckdns.org). Frontend prikazuje četiri vrste servisa dohvaćene iz backenda i baze. Prijava korisnika i poslovne funkcionalnosti još nisu implementirane.

## 6.1 Prikaz razmještaja

Sustav se izvodi na jednoj Azure virtualnoj mašini s Ubuntuom 24.04 LTS i približno 4 GB RAM-a. Docker Compose upravlja trima containerima:

| Dio | Izvršavanje i odgovornost | Komunikacija |
| --- | --- | --- |
| Korisnički preglednik | Izvršava izgrađeni React/TypeScript kod. | HTTPS prema `zgcustoms.duckdns.org:443`. |
| `web` | Caddy poslužuje statičke datoteke iz `frontend/dist` i upravlja HTTPS-om. | Javni TCP 80/443; HTTP preusmjerava na HTTPS, a `/api/*` prosljeđuje na `backend:8080`. |
| `backend` | Java 21 / Spring Boot 4.1.2 obrađuje zahtjeve i pokreće Flyway migracije. | HTTP u Docker mreži; JDBC prema `postgres:5432`. |
| `postgres` | PostgreSQL 18.6 čuva aplikacijske podatke u trajnom volumeu. | Dostupan backendu u Docker mreži i administratoru kroz SSH tunel. |

Na VM-u su portovi 8080 i 5432 vezani samo na `127.0.0.1`. Preglednik ne pristupa bazi izravno. Caddy javno blokira `/actuator` endpointove. Podaci baze i TLS certifikati ostaju u zasebnim Docker volumeima pri nadogradnji.

Konfiguracija razmještaja nalazi se u [`compose.yaml`](../compose.yaml) i [`frontend/Caddyfile`](../frontend/Caddyfile). DuckDNS omogućuje naziv javne domene, a GitHub čuva izvorni kod i rezultate CI-ja. Planirane integracije prijave, Resenda i Stripea još nisu povezane s ovom inačicom.

**Za dopunu prije službene predaje:** UML dijagram razmještaja i njegov PlantUML izvor prema opisanoj stvarnoj topologiji.

## 6.2 Lokalna instalacija i konfiguracija

Cijela aplikacija pokreće se pomoću Gita i Dockera s Composeom. Na Windowsu Docker Desktop treba koristiti Linux containere; za inicijalizacijsku skriptu koristi se Git Bash. [Brzi početak u README-u](../README.md#quick-start) sadrži naredbe, a [vodič za razvoj](deployment.md#lokalno-pokretanje) opisuje alternativu preko HTTPS kloniranja, Windows i razvoj iz IDE-a.

Za rad izvan containera koriste se Java 21 i uključeni Maven Wrapper za backend te Node.js 24 i `npm ci` za frontend. [Frontend vodič](frontend.md#lokalni-razvoj) opisuje Vite i automatsko osvježavanje lokalnog prikaza.

### Konfiguracijske varijable

[`scripts/init-env.sh`](../scripts/init-env.sh) stvara lokalnu `.env` s nasumičnim lozinkama i odbija prepisati postojeću datoteku. [`.env.example`](../.env.example) sadrži samo ogledne lokalne vrijednosti. Privatne vrijednosti za zajednički server čuva administrator izvan repozitorija.

| Varijabla | Namjena |
| --- | --- |
| `POSTGRES_PASSWORD` | Tajna lozinka administratorskog PostgreSQL računa; postavlja se pri inicijalizaciji baze. |
| `DB_PASSWORD` | Tajna lozinka aplikacijskog računa `zg_customs`; koriste je inicijalizacija baze i backend. |
| `DB_PORT`, `API_PORT` | Lokalni portovi baze i backenda; zadano 5432 i 8080. |
| `SITE_ADDRESS` | Caddy adresa; lokalno `:80`, na serveru `zgcustoms.duckdns.org`. |
| `WEB_BIND` | Adresa za objavu web portova: lokalno `127.0.0.1`, javno `0.0.0.0`. |
| `WEB_HTTP_PORT`, `WEB_HTTPS_PORT` | Web portovi: lokalno 8088/8443, na serveru 80/443. |
| `DB_URL`, `DB_USER` | Backendova JDBC adresa i korisnik; Compose ih postavlja za internu Docker mrežu. Za razvoj iz IDE-a koriste se lokalna adresa i lokalni račun. |
| `APP_VERSION` | Oznaka Docker imageova; skripta za objavu postavlja puni Git SHA. Lokalno je zadano `local`. |

Frontend poziva relativni `/api` na istom ishodištu. Nema zasebne varijable `VITE_API_BASE_URL` niti tajnih podataka baze u klijentskoj konfiguraciji.

### Baza i provjera rada

Pri prvom pokretanju praznog PostgreSQL volumea [`init-app-user.sh`](../ops/postgres/init-app-user.sh) stvara aplikacijski račun bez superuser ovlasti. Backend zatim primjenjuje [Flyway migracije](../backend/src/main/resources/db/migration/). Početna migracija stvara tablicu vrsta servisa i četiri početna zapisa. Flyway evidentira primijenjene migracije; one se ne ponavljaju pri svakom pokretanju. Hibernate provjerava postojeću shemu.

Nakon pokretanja cijelog sustava otvorite `http://localhost:8088` i provjerite prikaz četiriju vrsta servisa. `http://localhost:8080/actuator/health/readiness` treba vratiti stanje `UP`. Popis na stranici dohvaća se kroz Caddy i backend iz PostgreSQL-a, pa provjerava vezu svih triju dijelova. U ovoj inačici još nema poslovnih operacija unosa kroz sučelje.

Za dijagnostiku koristite `docker compose ps` i `docker compose logs --tail=100 web backend postgres` iz korijena lokalne kopije. Postupak [testiranja backenda](deployment.md#testiranje-backenda) koristi zasebnu testnu bazu. Podatke zajedničke baze mijenjaju verzionirane migracije; ne briše se volume radi resetiranja ili promjene lozinke.

## 6.3 Javno postavljanje i administracija

Frontend i backend grade se iz istog commita pomoću njihovih [Dockerfileova](../frontend/Dockerfile) ([backend](../backend/Dockerfile)). Izgradnja frontenda izvršava `npm ci` i `npm run build`; izgrađene datoteke poslužuje Caddy, a Vite razvojni poslužitelj ne pokreće se na javnom serveru. Backend se pakira Maven Wrapperom i izvršava kao Java aplikacija.

### Početna instalacija i konfiguracija domene

Administrator priprema Ubuntu, Git, Docker s Composeom i SSH pristup te serverovu mapu `~/apps/zg-customs/`. [Operativni vodič](deployment.md#provjere-i-postavljanje-iz-githuba) sadrži naredbe za kloniranje, privatnu `.env`, instalaciju skripti, početno postavljanje i cron. [Konfiguracija Azurea i DuckDNS-a](frontend.md#azure-i-duckdns) određuje javnu domenu, portove i HTTPS. Na postojećem serveru početna instalacija već je provedena.

### Automatske nadogradnje

1. Član tima razvija i provjerava promjene lokalno te otvara PR prema `main`.
2. GitHub Actions [CI](../.github/workflows/ci.yml) provjerava testove, skripte, izgradnju oba imagea i rad aplikacije sa svježom testnom bazom.
3. Nakon pregleda i mergea CI se izvršava i za točan commit na `main`.
4. Serverov [`sync.py`](../ops/sync.py), pokrenut cronom svakih pet minuta, postavlja novu inačicu tek kad pronađe uspješan CI za taj commit.
5. [`deploy.sh`](../ops/deploy.sh) izgradi imageove, izradi kopiju postojeće baze, pokrene containere i potvrdi njihovu spremnost prije zapisivanja `state/current-sha`.

To je kontinuirano postavljanje nakon provjerenog mergea. Promjene samo u radnoj grani ne mijenjaju javnu aplikaciju. Automatizacija trenutačno uključuje i promjene dokumentacije na `main`; zamjena containera može kratko prekinuti dostupnost. Instalirane upravljačke skripte u `bin/` održavatelj ažurira zasebno nakon pregleda promjena u `ops/`.

### Pristup, nadzor i oporavak

- Svaki član kojem treba SSH koristi vlastiti Linux račun i javni ključ. [Upute za osobni pristup](team-access.md) opisuju već pripremljene račune i dodjelu zasebnih prava baze. Uobičajeni frontend i backend razvoj odvija se lokalno.
- Administrator prati `state/current-sha`, zapise u `logs/` i stanje containera prema [uputama za upravljanje](deployment.md#upravljanje-i-sigurnosne-kopije). Linux račun `ivanbartol` ne ovisi o GitHub korisničkom imenu.
- Kopije baze nastaju prije nadogradnji i svakodnevno u 03:30 UTC. Čuvaju se **samo na istom serveru**; kopiranje izvan servera i politika zadržavanja još se trebaju uspostaviti.
- Obnova kopije prethodno je provjerena u zasebnoj testnoj bazi. Operativni vodič opisuje provjeru oporavka; automatski povrat migracija baze nije implementiran. `docker compose down -v` ne koristi se na zajedničkom serveru jer briše podatke.
- Administratorsko sučelje same aplikacije još nije implementirano. Linux administratorski račun nije korisnička uloga u aplikaciji.

[Zapis provjere od 27. 10. 2026.](deployment.md#provjera-javnog-postavljanja--27-10-2026) navodi tada aktivnu inačicu, provjerene javne endpointove, stanje containera i kopija. Dokumentaciju treba usklađivati s daljnjom implementacijom.
