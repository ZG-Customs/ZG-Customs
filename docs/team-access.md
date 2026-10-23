# Osobni pristup serveru

Administrator koristi postojeći račun `ivanbartol`. Za ostale članove predviđeni su računi `rino`, `jagor`, `potjeh`, `marijan` i `juraj`, svaki s vlastitim kućnim direktorijem. Administrator ih priprema na Azure serveru:

```bash
sudo bash ~/apps/zg-customs/bin/prepare-team-accounts.sh
```

Skripta ne mijenja postojeće račune. Novi računi imaju zaključanu lozinku, praznu datoteku za javne ključeve i nemaju `sudo` ni Docker ovlasti. Prijava postaje moguća nakon dodavanja vlastitog javnog ključa. Docker grupa daje praktički administratorsku kontrolu nad serverom i dodjeljuje se samo osobama zaduženima za održavanje.

## Ključevi i prijava

Svaki član na svojem računalu, u Mac Terminalu ili Windows PowerShellu, izrađuje ključ za projekt:

```bash
ssh-keygen -t ed25519 -C "zg-customs-server" -f ~/.ssh/id_ed25519_zg_customs
```

Postavite lozinku ključa. Ako datoteka već postoji, nemojte je prepisivati. Administratoru šaljete samo sadržaj datoteke `id_ed25519_zg_customs.pub`; privatna datoteka bez nastavka `.pub` ostaje na vašem računalu.

Administrator provjerava s članom kome ključ pripada i njegov otisak (`ssh-keygen -lf <DATOTEKA.pub>`), a zatim javni ključ dodaje u `/home/<KORISNIK>/.ssh/authorized_keys`. Datoteka treba pripadati tom korisniku i imati ovlasti `600`, a direktorij `.ssh` ovlasti `700`. Postojeći ključevi se čuvaju. Azure mrežno pravilo za SSH treba dopuštati javnu IP adresu člana.

Primjer prijave nakon dodavanja ključa i mrežnog pravila:

```bash
ssh -i ~/.ssh/id_ed25519_zg_customs rino@<SERVER_IP>
```

Pristup API-ju i PostgreSQL-u kroz tunel s vlastitog računala:

```bash
ssh -N -i ~/.ssh/id_ed25519_zg_customs -L 18080:127.0.0.1:8080 -L 15432:127.0.0.1:5432 rino@<SERVER_IP>
```

API je dostupan na `http://localhost:18080/api/service-types`. DBeaver se povezuje na `localhost:15432`, bazu `zg_customs` i zasebno dodijeljeni PostgreSQL račun. Linux/SSH račun nije automatski račun u bazi. Osobne račune baze i njihova prava administrator dodjeljuje prema dogovorenom poslu; zajednička aplikacijska lozinka ne dijeli se automatski svim članovima.

## Svakodnevni razvoj

Frontend i backend razvijaju se lokalno, uz lokalnu bazu. Za uobičajeni razvoj nije potreban SSH. Kod i SQL migracije šalju se na vlastitu Git granu i pregledavaju kroz PR; zajedničku aplikaciju objavljuje automatizacija nakon prihvaćanja u `main` i uspješnog CI-ja. Na serveru se ne uređuje izvorni kod aktivne inačice.

Struktura zajedničke baze mijenja se Flyway migracijama u repozitoriju, kako promjene ostaju ponovljive i pregledane. DBeaver služi pregledu i dijagnostici te lokalnom razvoju. Pristup podacima zajedničke baze dodjeljuje se prema potrebi, počevši od čitanja.

Radna konfiguracija aplikacije i privatne lozinke ostaju u administratorskom direktoriju. Osobni server račun omogućuje vlastitu SSH prijavu i tunel, ali ne daje automatski pravo mijenjanja zajedničke aplikacije.
