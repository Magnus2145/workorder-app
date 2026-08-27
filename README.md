# UGO Servis

Jednostavna web aplikacija za prijavu kvarova na ugostiteljskoj (UGO) opremi.

## Trenutna verzija

Korisnik može unijeti:

- ime i prezime
- firmu / naziv objekta
- telefon i e-mail
- vrstu UGO opreme
- proizvođača i model
- serijski broj
- lokaciju uređaja
- opis problema
- hitnost
- željeni termin

Servisni dio prikazuje zaprimljene naloge i omogućuje promjenu statusa:

- Novo
- U obradi
- Završeno

## Važno

Ovo je prva demo verzija. Prijave se spremaju u `localStorage`, što znači da su vidljive samo na uređaju i pregledniku na kojem su unesene.

Za produkcijsku verziju sljedeći korak je dodati backend i bazu podataka kako bi korisnici mogli slati prijave s različitih uređaja, a servis ih pregledavati na jednom administracijskom računu.

## Pokretanje

Aplikacija je napravljena u običnom HTML/CSS/JavaScriptu. Za lokalni pregled dovoljno je otvoriti `index.html` u pregledniku ili projekt poslužiti preko jednostavnog lokalnog web servera.
