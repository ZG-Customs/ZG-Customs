# UML dijagrami

PlantUML izvori (`.puml`) nalaze se u ovoj mapi, a slike koje dokumentacija prikazuje u `docs/assets/diagrams/`.

Workflow **Generate PlantUML diagrams** provjerava i generira SVG slike kada PR prema `main` mijenja `.puml` datoteke ili sam workflow. Pokreće se i nakon takvih promjena na `main` te ručno preko **Actions → Generate PlantUML diagrams → Run workflow**. Ne stvara commitove i ne pusha u repozitorij.

## Ažuriranje dijagrama kroz PR

1. Promijeni `.puml` izvore na svojoj grani, pushaj je i otvori PR prema `main`.
2. Pričekaj uspješan job **Validate and Render Diagrams**. Ako ne prođe generiranje, pregledaj poruku greške, ispravi izvor i ponovno pushaj istu granu.
3. Otvori pregled workflow runa za posljednju izmjenu tog PR-a i u odjeljku **Artifacts** preuzmi `plantuml-diagrams`. Potrebna je GitHub prijava; artifact se čuva 14 dana.
4. Raspakiraj ZIP u privremenu mapu i pregledaj slike. Kopiraj njegov sadržaj u `docs/assets/diagrams/`, uz očuvanje podmapa i naziva. Kod preimenovanih ili uklonjenih dijagrama ukloni odgovarajuće stare SVG datoteke i ažuriraj poveznice u dokumentaciji.
5. Commitaj slike i izmijenjene Markdown datoteke na istu granu te ih pushaj prije konačnog pregleda i mergea PR-a.

Artifact je privremena datoteka za preuzimanje, a ne zamjena za SVG slike u repozitoriju. Dokumentacija se ažurira tek kada slike budu uključene u PR i spojene u `main`. Uspješno generiranje potvrđuje da se dijagram može iscrtati; tim i dalje pregledava njegov sadržaj i usklađenost sa zahtjevima.

Ako je promjena izvora već spojena u `main`, preuzmi artifact uspješnog runa za tu verziju i dodaj SVG slike kroz novi dokumentacijski PR. Ako je artifact istekao, ručno pokreni workflow za odgovarajuću granu.
