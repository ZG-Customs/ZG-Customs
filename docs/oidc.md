# Vanjska prijava i registracija

## Postavljanje

1. Kod odabranog OIDC pružatelja registriraj povjerljivi web klijent za Authorization Code tok sa scopeovima `openid profile email`. Dodaj točnu callback adresu `<OIDC_PUBLIC_URL>/api/auth/callback/external`.
2. Za Compose u lokalnom `.env` ili konfiguraciji hosta postavi `SPRING_PROFILES_ACTIVE=oidc`, `OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET` i `OIDC_PUBLIC_URL`. Za backend pokrenut izvan Composea postavi iste varijable u okruženju procesa. Javnu adresu upiši bez završne kose crte.
3. Za lokalni Compose postavi `OIDC_PUBLIC_URL=http://localhost:8088` i registriraj `http://localhost:8088/api/auth/callback/external`. Za Vite koristi adresu njegova lokalnog servera, primjerice `http://localhost:5173`. Za lokalni HTTP postavi `OIDC_SECURE_COOKIE=false`. Na produkciji koristi HTTPS i zadanu vrijednost `true`.
4. Primijeni postavke naredbom `docker compose up -d --wait`. Backend pri pokretanju OIDC profila mora moći dohvatiti discovery dokument pružatelja. Na lokalnom Composeu provjeri `http://localhost:8088/api/auth/provider`. Odgovor `{"enabled":true}` znači da je opcija prijave uključena. Ako dobiješ `{"enabled":false}`, provjeri `SPRING_PROFILES_ACTIVE=oidc` u `.env` aktivnog projekta.
5. U pregledniku klikni **Prijava vanjskim računom**, dovrši registraciju, odjavi se i ponovno se prijavi istim računom. Provjeri da `GET /api/me` vraća isti `id` i da se obrazac za registraciju više ne prikazuje.

## Prvi administrator

Prijavi namjenski administratorski identitet i ostavi ga na obrascu za registraciju. Operater s pristupom bazi potvrđuje točan par issuer i subject kod pružatelja te u transakciji promovira taj postojeći redak:

```sql
WITH account AS (
    UPDATE users SET status = 'ACTIVE'
    WHERE oidc_issuer = '<issuer>' AND oidc_subject = '<subject>'
      AND status = 'UNREGISTERED'
    RETURNING id
)
INSERT INTO user_roles (user_id, role_id)
SELECT account.id, roles.id FROM account CROSS JOIN roles WHERE roles.code = 'ADMIN'
RETURNING user_id;
```

Provjeri da je vraćen točno jedan redak i osvježi stranicu. Javni obrazac podržava vlasnika vozila, servisera i voditelja.

## Registracija i pristup

Vlasnik vozila dobiva aktivan račun nakon unosa kontakta. Voditelj podnosi prijavu autoservisa, a serviser bira aktivan autoservis i šalje zahtjev za članstvo. Administrator odlučuje o prijavama autoservisa, a voditelj o članstvu u svojem autoservisu. Odbijeni korisnik može poslati novi zahtjev. Uklanjanje prihvaćenog članstva vraća račun servisera u stanje čekanja. Status računa i pripadnost provjeravaju se na poslužitelju pri svakom poslovnom zahtjevu.

Trenutačni profil čita se preko `GET /api/me`. Aktivan račun može izmijeniti pojedina polja kroz `PATCH /api/me`. Izostavljena polja i vrijednosti `null` ostavljaju postojeće vrijednosti, a specijalizacije može mijenjati serviser.

Voditelj šalje `name`, `contactDetails` i `ownershipEvidence` na `POST /api/workshop-applications`. Dokaz se pohranjuje kao tekst i prikazuje administratoru pri pregledu zahtjeva. Serviser dohvaća aktivne autoservise s `GET /api/workshops` i šalje zahtjev bez tijela na `POST /api/workshops/{id}/membership-requests`.

## Nadogradnja postojeće baze

Konačna migracija V2 kreira shemu računa i autoservisa izravno nakon V1. Ako si lokalno primijenio radne verzije V2–V4, Flyway će prijaviti neusklađenu povijest. Za lokalni test s novom bazom zaustavi postojeći Compose projekt naredbom `docker compose down`, pa pokreni `docker compose -p zg-customs-v2 up -d --build --wait`. Time novi projekt dobiva zaseban volumen, a podaci stare baze ostaju dostupni pod starim projektom.
