# Razvojno okruženje i Azure server

Ova inačica uspostavlja infrastrukturu: React / TypeScript / Vite, Caddy, Java 21 / Spring Boot 4.1.2, PostgreSQL 18.6 i Docker Compose. Početni frontend prikazuje četiri vrste servisa iz baze preko API-ja. Prijava, korisnici, vozila, naručivanje i vanjske integracije još nisu implementirani. [Upute za frontend i HTTPS](frontend.md) opisuju React razvoj i javnu domenu.

## Lokalno pokretanje

Potrebni su Git, Docker s Composeom i, za razvoj izvan containera, Java 21. Maven je uključen kroz Maven Wrapper (`backend/mvnw`, na Windowsu `backend/mvnw.cmd`).

```bash
git clone https://github.com/ZG-Customs/ZG-Customs.git
cd ZG-Customs
bash scripts/init-env.sh
docker compose up -d --build --wait
curl http://localhost:8080/api/service-types
curl http://localhost:8080/actuator/health/readiness
```

Na Windowsu se skripta može pokrenuti kroz Git Bash. Alternativno kopirajte `.env.example` u `.env` i postavite vlastite lozinke. Primjerne vrijednosti nisu namijenjene serveru. Docker Desktop mora koristiti Linux containere.

Lokalni frontend otvara se na `http://localhost:8088`. PostgreSQL sluša samo na `127.0.0.1:5432`, backend na `127.0.0.1:8080`. Portovi se po potrebi mijenjaju kroz `WEB_HTTP_PORT`, `DB_PORT` i `API_PORT` u `.env`. Backend unutar Docker mreže pristupa bazi preko naziva `postgres`, a ne preko `localhost`.

Za lokalni rad na Javi pokrenite samo `docker compose up -d postgres`, unesite `DB_PASSWORD` iz svoje `.env` u konfiguraciju pokretanja IDE-a i pokrenite `ZgCustomsApplication`. JDBC URL je `jdbc:postgresql://localhost:5432/zg_customs`, korisnik `zg_customs`. Nemojte pokretati lokalni Java proces i backend container na istom portu.

## Baza i migracije

- Podaci ostaju u Docker volumeu `zg-customs_postgres_data` i nakon ponovnog stvaranja containera.
- Inicijalizacijska skripta stvara administratorski račun `postgres` te aplikacijski račun `zg_customs` bez superuser ovlasti. Aplikacijski račun vlasnik je aplikacijske baze i može provoditi migracije.
- Flyway pri pokretanju primjenjuje SQL datoteke iz `backend/src/main/resources/db/migration`. Hibernate samo provjerava shemu (`validate`).
- Za svaku novu promjenu dodajte novu migraciju, npr. `V2__create_vehicles.sql`. Ne mijenjajte migraciju koja je već primijenjena na zajedničkom serveru.
- Promjena lozinke u `.env` ne mijenja postojeću lozinku u bazi. Postojeće račune treba zasebno ažurirati; nemojte brisati volume radi promjene lozinke.
- `docker compose down` zaustavlja aplikaciju i zadržava volume. **`docker compose down -v` briše bazu** i ne koristi se na zajedničkom serveru.

## SSH pristup s Maca ili Windowsa

Svaki član koristi vlastiti SSH ključ i račun kad mu se odobri pristup. Privatni ključevi se ne dijele. Priprema osobnih računa i dodavanje ključeva opisani su u [uputama za pristup članova tima](team-access.md). Za početni administratorski račun primjer veze je:

```bash
ssh -i ~/.ssh/id_ed25519_ivanbartol ivanbartol@<SERVER_IP>
```

Azure mrežno pravilo mora dopuštati SSH vezu. Ako je pristup ograničen na određene javne IP adrese, nakon promjene mreže treba ažurirati dopuštene adrese. Za javnu aplikaciju koriste se HTTP/HTTPS portovi Caddyja; port baze i izravni backend ostaju dostupni samo lokalno ili tunelom.

Linux račun `ivanbartol` i naziv njegova SSH ključa ne ovise o trenutačnom GitHub računu. Promjena GitHub računa ne zahtijeva preimenovanje server računa, putanja ili cron poslova. Ostali članovi u naredbama koriste vlastiti Linux račun i ključ.

Za pristup API-ju i bazi pokrenite na vlastitom računalu i ostavite Terminal otvoren:

```bash
ssh -N -i ~/.ssh/id_ed25519_ivanbartol \
  -L 18080:127.0.0.1:8080 -L 15432:127.0.0.1:5432 \
  ivanbartol@<SERVER_IP>
```

Na Windows PowerShellu napišite tu naredbu u jednom retku. API je zatim dostupan na `http://localhost:18080/api/service-types`, a DBeaver se povezuje na `localhost:15432`, bazu `zg_customs` i osobni PostgreSQL račun koji administrator zasebno dodjeljuje. SSH račun sam po sebi ne daje prijavu u bazu; aplikacijska lozinka ostaje privatna na serveru. DBeaver ima i ugrađenu SSH tunnel opciju, pa zaseban terminalski tunel tada nije potreban.

## Raspored datoteka na serveru

```text
~/apps/zg-customs/
  .env                 # privatne lozinke, ovlasti 600; izvan Gita
  repo/                # kopija javnog GitHub repozitorija
  bin/                 # instalirane deploy/backup/sync skripte
  releases/<git-sha>/   # točno određena verzija izvornog koda
  state/current-sha    # posljednje uspješno postavljena verzija
  state/failed-sha     # neuspjela verzija, ako postoji
  backups/             # lokalne kopije baze
  logs/                # zapisi automatizacije
```

Server ne treba privatni GitHub ključ ni GitHub token za čitanje ovog javnog repozitorija. Privatni ključ s osobnog računala ne kopira se na server.

## Provjere i postavljanje iz GitHuba

1. Promjene se šalju na radnu granu i otvara se PR prema `main`.
2. GitHub Actions workflow **CI** pokreće integracijske testove na zasebnom PostgreSQL-u, provjerava skripte i Compose te gradi Docker imageove backenda i React/Caddy frontenda. Zatim pokreće sva tri containera sa svježom bazom i provjerava API, naslovnicu, JavaScript datoteku i blokiranje javnog pristupa management endpointovima.
3. Nakon pregleda i spajanja PR-a, CI se ponovno izvršava za točan commit na `main`.
4. Server svakih pet minuta provjerava `main`. Postavlja samo commit s uspješno dovršenim CI workflowom iz ovog repozitorija, događaja `push`, za tu istu verziju koda.
5. Server gradi oba aplikacijska imagea označena punim Git SHA-om, prije nadogradnje stvara kopiju postojeće baze i čeka da PostgreSQL, backend i web budu zdravi. Nakon dodatne provjere spremnosti backenda i weba zapisuje `current-sha`.

Ovo je postavljanje koje pokreće server: GitHub runner ne treba ulazni SSH pristup serveru. Kod se gradi na serveru; GHCR se u ovoj početnoj konfiguraciji ne koristi. Objava nije trenutačna: nakon mergea treba pričekati završetak CI-ja, sljedeću provjeru servera i izgradnju. Automatizacija trenutačno postavlja svaki novi uspješno provjereni commit na `main`, uključujući promjene samo u dokumentaciji. Pri zamjeni containera moguć je kratak prekid rada.

Brisanje radne grane ne mijenja objavljenu inačicu. Za novu funkcionalnost potreban je pregled i merge u `main`; lokalna izmjena ili push samo u radnu granu ne objavljuju se automatski.

Primjer početne instalacije automatizacije, nakon provjere skripti:

```bash
mkdir -p "$HOME/apps/zg-customs"/{bin,state,logs,backups,releases}
git clone https://github.com/ZG-Customs/ZG-Customs.git "$HOME/apps/zg-customs/repo"
cd "$HOME/apps/zg-customs/repo"
bash scripts/init-env.sh "$HOME/apps/zg-customs/.env"
cp ops/deploy.sh ops/backup.sh ops/sync.py ops/prepare-team-accounts.sh "$HOME/apps/zg-customs/bin/"
```

Na **novom serveru**, prije prvog postavljanja uredite privatnu `.env` prema [konfiguraciji domene i HTTPS-a](frontend.md#azure-i-duckdns), usmjerite DNS i dopustite TCP portove 80 i 443. Početnu pregledanu inačicu postavite iz serverove mape `repo/` naredbom `bash "$HOME/apps/zg-customs/bin/deploy.sh" "$(git rev-parse HEAD)"`. Ovi koraci početne instalacije već su provedeni na postojećem serveru.

U osobni `crontab -e`, uz očuvanje postojećih poslova, dodaju se:

```cron
*/5 * * * * /usr/bin/python3 /home/ivanbartol/apps/zg-customs/bin/sync.py >> /home/ivanbartol/apps/zg-customs/logs/sync.log 2>&1
30 3 * * * /bin/bash /home/ivanbartol/apps/zg-customs/bin/backup.sh >> /home/ivanbartol/apps/zg-customs/logs/backup.log 2>&1
```

Primjer koristi korisnika `ivanbartol`; na drugom serveru promijenite putanje. Vrijeme dnevne kopije prati vremensku zonu servera. Promjene skripti u `ops/` treba nakon pregleda ponovno kopirati u `bin/`; sama objava novog commita ne zamjenjuje instalirani upravljački kod.

Za ručno pokretanje automatizacije administrator može upotrijebiti `python3 ~/apps/zg-customs/bin/sync.py`; ta naredba može pokrenuti stvarno postavljanje, pa nije samo provjera stanja. Za čitanje trenutačne verzije koristite `cat ~/apps/zg-customs/state/current-sha`. Neuspjeh GitHub API-ja ili nedovršen CI odgađaju postavljanje. Neuspjelo postavljanje označava se u `state/failed-sha`; automatizacija neće beskonačno ponavljati isti neuspjeli commit. Nakon otklanjanja uzroka pokrenite `deploy.sh` s punim SHA-om ili objavite ispravak kroz novi PR.

## Upravljanje i sigurnosne kopije

```bash
root="$HOME/apps/zg-customs"
export APP_VERSION="$(cat "$root/state/current-sha")"
docker compose --project-name zg-customs --env-file "$root/.env" \
  -f "$root/releases/$APP_VERSION/compose.yaml" ps
docker compose --project-name zg-customs --env-file "$root/.env" \
  -f "$root/releases/$APP_VERSION/compose.yaml" logs --tail=100 backend
bash "$root/bin/backup.sh"
```

Kopije nastaju prije nadogradnje i jednom dnevno ako je cron instaliran. To su **kopije na istom serveru**: prije spremanja stvarnih korisničkih podataka treba uspostaviti kopiranje izvan servera i dogovoriti zadržavanje kopija. Kopiju možete preuzeti s Maca/Windowsa pomoću `scp`, uz isti SSH ključ. Kopije se ne stavljaju u Git.

Oporavak najprije provjerite u zasebnoj praznoj bazi: `pg_restore --exit-on-error --no-owner --no-privileges --dbname=<TEST_DB> <backup.dump>`. Ne obnavljajte preko aktivne baze bez dogovora i nove sigurnosne kopije. Vraćanje starog Docker imagea samo po sebi ne vraća migracije baze; zato automatski rollback nakon promjene sheme nije uključen.

Pratite slobodni disk (`df -h`, `docker system df`), lokalne kopije, release direktorije i stare imageove. Brisanje starih inačica radi se nakon provjere potrebnih kopija i rollback verzija; ne koristi se globalni `docker system prune --volumes`.

## Testiranje backenda

Integracijski testovi koriste **zasebnu** bazu `zg_customs_test`, ne zajedničku aplikacijsku bazu. Primjer lokalnog testnog containera:

```bash
docker run --rm -d --name zg-customs-test-db \
  -e POSTGRES_DB=zg_customs_test -e POSTGRES_USER=zg_customs_test \
  -e POSTGRES_PASSWORD=test-only-password \
  -p 127.0.0.1:55432:5432 postgres:18.6-bookworm
cd backend
./mvnw -B verify
docker stop zg-customs-test-db
```

Pričekajte da `pg_isready` u testnom containeru potvrdi spremnost prije testova. Testovi provjeravaju čitanje podataka kroz HTTP iz stvarnog PostgreSQL-a, migraciju i jedinstvenost šifre vrste servisa, health odgovor i zabranu neimplementiranih operacija pisanja. Testovi automatizacije pokreću se iz korijena s `python3 -m unittest discover -s tests/deployment -v`.

## Preostalo za javnu aplikaciju

Sljedeći koraci su OIDC prijava i autorizacija, poslovne funkcionalnosti i njihovo korisničko sučelje, vanjske integracije te kopije izvan servera. Trenutačni javni API daje samo vrste servisa, bez korisničkih podataka i operacija pisanja. Management endpointi ostaju dostupni samo lokalno/SSH tunelom. Ovo postavljanje samo po sebi ne ispunjava sve zahtjeve prvog ciklusa projekta.

## Provjera javnog postavljanja — 27. 10. 2026.

Provjera je provedena čitanjem stanja servera i javnim HTTP zahtjevima, bez novog postavljanja:

- Aktivna inačica: `a2f9eeb383e40c566f477db2d89f66f668d25080`, jednaka provjerenom `main` i oznakama oba aplikacijska imagea.
- Sva tri containera (`web`, `backend`, `postgres`) imaju status `healthy`; zapis automatizacije potvrđuje uspješno postavljanje te inačice.
- [Javna naslovnica](https://zgcustoms.duckdns.org) i `/api/service-types` odgovaraju preko HTTPS-a; API vraća četiri vrste servisa. HTTP preusmjerava na HTTPS, a javni `/actuator/health` vraća `404`.
- Web koristi javne TCP portove 80/443; baza 5432 i izravni backend 8080 vezani su na `127.0.0.1`.
- Instalirane skripte `deploy.sh`, `backup.sh` i `sync.py` odgovaraju sadržaju u provjerenom `main`.
- Cron provjerava `main` svakih pet minuta i izrađuje kopiju baze u 03:30 UTC. Posljednja zatečena kopija nastala je 27. 10. 2026. u 03:30 UTC; kopije se čuvaju na istom serveru.
- Privatna `.env` ima ovlasti `600`. Osobni Linux računi pet članova postoje bez `sudo` i Docker grupa. Osobni PostgreSQL računi još nisu dodijeljeni; postoje prijavni računi `postgres` i `zg_customs`.

Pri početnom postavljanju prethodno su provjereni očuvanje probnog zapisa nakon ponovnog stvaranja PostgreSQL containera i obnova sigurnosne kopije u zasebnu testnu bazu. Te provjere nisu ponovno izvođene pri ovom usklađivanju dokumentacije. Ovaj zapis opisuje stanje na navedeni datum; buduće objave prate se kroz `state/current-sha` i zapise automatizacije.
