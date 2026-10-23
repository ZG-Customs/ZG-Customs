# Frontend i javna domena

Početni frontend koristi React, TypeScript i Vite. Prikazuje naslovnu stranicu ZG Customs te vrste servisa dohvaćene iz Spring Boot API-ja. Naručivanje, korisnički profili i prijava još nisu implementirani.

## Lokalni razvoj

Za razvoj je preporučen Node.js 24 LTS. Iz korijena repozitorija:

```bash
docker compose up -d --build backend
cd frontend
npm ci
npm run dev
```

Prije prvog pokretanja pripremite `.env` prema [uputama za razvoj](deployment.md). Vite ispisuje lokalnu adresu, obično `http://localhost:5173`. Nakon spremanja React/CSS datoteka osvježava prikaz. Pozive na `/api` razvojni poslužitelj prosljeđuje backendu na `127.0.0.1:8080`; cilj se podešava u `vite.config.ts` ako backend koristi drugi port.

```bash
npm run build
npm run preview
```

`build` provjerava TypeScript i stvara optimizirane datoteke u `frontend/dist`. `preview` služi lokalnoj provjeri tih datoteka. Izgrađene datoteke i `node_modules` ne šalju se u Git. U repozitorij se šalju izvorni kod, `package.json` i `package-lock.json`.

## Pokretanje cijele aplikacije

```bash
docker compose up -d --build --wait
```

Lokalni frontend dostupan je na `http://localhost:8088`. Docker tijekom izgradnje koristi Node.js, a konačni `web` container koristi Caddy za posluživanje HTML/CSS/JavaScript datoteka. U korisnikovu pregledniku React prikazuje sučelje. Caddy prosljeđuje `/api/*` backendu; backend pristupa PostgreSQL-u. Preglednik nema izravnu vezu s bazom.

```text
Preglednik → Caddy (React datoteke i HTTPS)
                   └→ /api/* → Spring Boot → PostgreSQL
```

Razvojni Vite poslužitelj ne koristi se za javno posluživanje aplikacije. Za promjenu frontenda izrađuje se novi Docker image, jednako kao za backend. Oba imagea označena su Git commitom i objavljuju se zajedno nakon pregleda PR-a i uspješnog CI-ja na `main`.

## Azure i DuckDNS

Domena je `zgcustoms.duckdns.org`, s A zapisom koji pokazuje na javnu IP adresu Azure VM-a. Na serveru su u privatnoj `~/apps/zg-customs/.env` potrebne ove dodatne vrijednosti:

```dotenv
SITE_ADDRESS=zgcustoms.duckdns.org
WEB_BIND=0.0.0.0
WEB_HTTP_PORT=80
WEB_HTTPS_PORT=443
```

Azure NSG treba dopuštati dolazni TCP promet na portovima `80` i `443`. Ako je Ubuntu firewall uključen, isto treba dopustiti i ondje. Caddy automatski pribavlja i obnavlja TLS certifikat te HTTP preusmjerava na HTTPS. Certifikati se čuvaju u volumeu `zg-customs_caddy_data`, koji treba očuvati pri nadogradnjama.

PostgreSQL `5432` i izravni backend `8080` ostaju vezani na `127.0.0.1`. Javni Caddy ne prosljeđuje `/actuator` endpointove. Prije dodavanja korisničkih podataka i operacija pisanja treba implementirati autentifikaciju i autorizaciju u backendu.

DuckDNS token nije potreban za ovo postavljanje i ne pohranjuje se u repozitorij. Ako se javna IP adresa servera promijeni, treba ažurirati A zapis. Nakon prvog otvaranja domene provjerite HTTPS i prikaz vrsta servisa. CI provjerava izgrađene datoteke, API preko Caddyja i nedostupnost management endpointova na javnom web ulazu.

Izvori: [Vite — lokalni razvoj](https://vite.dev/guide/), [Vite — izgradnja i objava](https://vite.dev/guide/static-deploy.html), [Caddy — automatski HTTPS](https://caddyserver.com/docs/quick-starts/https).
