# Razvojno okruženje i Azure server

Ova inačica uspostavlja infrastrukturu: Java 21 / Spring Boot 4.1.2, PostgreSQL 18.6 i Docker Compose. API čita četiri vrste servisa iz baze. Prijava, korisnici, vozila, naručivanje, frontend i vanjske integracije još nisu implementirani.

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

PostgreSQL sluša samo na `127.0.0.1:5432`, backend na `127.0.0.1:8080`. Portovi se po potrebi mijenjaju kroz `DB_PORT` i `API_PORT` u `.env`. Backend unutar Docker mreže pristupa bazi preko naziva `postgres`, a ne preko `localhost`.

Za lokalni rad na Javi pokrenite samo `docker compose up -d postgres`, unesite `DB_PASSWORD` iz svoje `.env` u konfiguraciju pokretanja IDE-a i pokrenite `ZgCustomsApplication`. JDBC URL je `jdbc:postgresql://localhost:5432/zg_customs`, korisnik `zg_customs`. Nemojte pokretati lokalni Java proces i backend container na istom portu.

## Baza i migracije

- Podaci ostaju u Docker volumeu `zg-customs_postgres_data` i nakon ponovnog stvaranja containera.
- Inicijalizacijska skripta stvara administratorski račun `postgres` te aplikacijski račun `zg_customs` bez superuser ovlasti. Aplikacijski račun vlasnik je aplikacijske baze i može provoditi migracije.
- Flyway pri pokretanju primjenjuje SQL datoteke iz `backend/src/main/resources/db/migration`. Hibernate samo provjerava shemu (`validate`).
- Za svaku novu promjenu dodajte novu migraciju, npr. `V2__create_vehicles.sql`. Ne mijenjajte migraciju koja je već primijenjena na zajedničkom serveru.
- Promjena lozinke u `.env` ne mijenja postojeću lozinku u bazi. Postojeće račune treba zasebno ažurirati; nemojte brisati volume radi promjene lozinke.
- `docker compose down` zaustavlja aplikaciju i zadržava volume. **`docker compose down -v` briše bazu** i ne koristi se na zajedničkom serveru.

## SSH pristup s Maca ili Windowsa

Svaki član koristi vlastiti SSH ključ i račun kad mu se odobri pristup. Privatni ključevi se ne dijele. Za početni administratorski račun primjer veze je:

```bash
ssh -i ~/.ssh/id_ed25519_ivanbartol ivanbartol@<SERVER_IP>
```

Azure mrežno pravilo mora dopuštati SSH s trenutačne javne IP adrese korisnika. Nakon promjene mreže možda treba ažurirati pravilo. Korisnicima aplikacije kasnije će se javno otvoriti samo HTTP/HTTPS preko reverse proxyja.

Za pristup API-ju i bazi pokrenite na vlastitom računalu i ostavite Terminal otvoren:

```bash
ssh -N -i ~/.ssh/id_ed25519_ivanbartol \
  -L 18080:127.0.0.1:8080 -L 15432:127.0.0.1:5432 \
  ivanbartol@<SERVER_IP>
```

Na Windows PowerShellu napišite tu naredbu u jednom retku. API je zatim dostupan na `http://localhost:18080/api/service-types`, a DBeaver se povezuje na `localhost:15432`, bazu `zg_customs`, korisnika `zg_customs` i privatnu aplikacijsku lozinku iz serverove `.env`. DBeaver ima i ugrađenu SSH tunnel opciju, pa zaseban terminalski tunel tada nije potreban.

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
2. GitHub Actions workflow **CI** pokreće integracijske testove na zasebnom PostgreSQL-u, provjerava skripte i Compose, gradi Docker image te pokreće aplikaciju sa svježe inicijaliziranom bazom i provjerava API.
3. Nakon pregleda i spajanja PR-a, CI se ponovno izvršava za točan commit na `main`.
4. Server svakih pet minuta provjerava `main`. Postavlja samo commit s uspješno dovršenim CI workflowom iz ovog repozitorija, događaja `push`, za tu istu verziju koda.
5. Server gradi image označen punim Git SHA-om, prije nadogradnje stvara kopiju postojeće baze i čeka da baza i backend budu zdravi. Tek tada zapisuje `current-sha`.

Ovo je postavljanje koje pokreće server: GitHub runner ne treba ulazni SSH pristup serveru. Kod se gradi na serveru; GHCR se u ovoj početnoj konfiguraciji ne koristi. Prvo probno postavljanje može se ručno izvesti iz radne grane, prije pregleda PR-a. Takva inačica služi provjeri infrastrukture; automatske nadogradnje prate samo `main`.

Primjer početne instalacije automatizacije, nakon provjere skripti:

```bash
mkdir -p "$HOME/apps/zg-customs"/{bin,state,logs,backups,releases}
git clone https://github.com/ZG-Customs/ZG-Customs.git "$HOME/apps/zg-customs/repo"
cd "$HOME/apps/zg-customs/repo"
bash scripts/init-env.sh "$HOME/apps/zg-customs/.env"
cp ops/deploy.sh ops/backup.sh ops/sync.py "$HOME/apps/zg-customs/bin/"
bash "$HOME/apps/zg-customs/bin/deploy.sh" "$(git rev-parse HEAD)"
```

U osobni `crontab -e`, uz očuvanje postojećih poslova, dodaju se:

```cron
*/5 * * * * /usr/bin/python3 /home/ivanbartol/apps/zg-customs/bin/sync.py >> /home/ivanbartol/apps/zg-customs/logs/sync.log 2>&1
30 3 * * * /bin/bash /home/ivanbartol/apps/zg-customs/bin/backup.sh >> /home/ivanbartol/apps/zg-customs/logs/backup.log 2>&1
```

Primjer koristi korisnika `ivanbartol`; na drugom serveru promijenite putanje. Vrijeme dnevne kopije prati vremensku zonu servera. Promjene skripti u `ops/` treba nakon pregleda ponovno kopirati u `bin/`; sama objava novog commita ne zamjenjuje instalirani upravljački kod.

Za ručnu provjeru automatizacije koristite `python3 ~/apps/zg-customs/bin/sync.py`. Neuspjeh GitHub API-ja ili nedovršen CI odgađaju postavljanje. Neuspjelo postavljanje označava se u `state/failed-sha`; automatizacija neće beskonačno ponavljati isti neuspjeli commit. Nakon otklanjanja uzroka pokrenite `deploy.sh` s punim SHA-om ili objavite ispravak kroz novi PR.

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

Sljedeći koraci su frontend, domena i HTTPS reverse proxy, OIDC prijava i autorizacija, poslovne funkcionalnosti, vanjske integracije te kopije izvan servera. Trenutačni API nema korisničke podatke ni operacije pisanja i ostaje dostupan samo lokalno/SSH tunelom. Ovo postavljanje samo po sebi ne ispunjava sve zahtjeve prvog ciklusa projekta.
