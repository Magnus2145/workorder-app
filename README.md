# UGO Servis

Web aplikacija za prijavu kvarova i vođenje servisnih naloga za profesionalnu ugostiteljsku (UGO) opremu.

## Što korisnik može napraviti

- unijeti ime, firmu, telefon i e-mail
- odabrati vrstu UGO opreme
- upisati proizvođača, model i serijski broj
- upisati lokaciju uređaja
- detaljno opisati kvar
- označiti hitnost
- odabrati željeni termin
- priložiti JPG, PNG ili WEBP fotografiju do 1,5 MB
- nakon slanja dobiti jedinstveni broj servisnog naloga

## Servisni pregled

Servisni dio sada ima:

- statistiku ukupnih, novih, aktivnih i hitnih naloga
- pretragu po broju naloga, korisniku, firmi, opremi, lokaciji i drugim podacima
- filtriranje po statusu i hitnosti
- sortiranje po datumu ili hitnosti
- statuse `Novo`, `U obradi` i `Završeno`
- detaljan pregled kontakta i podataka o uređaju
- pregled priložene fotografije
- interne servisne bilješke
- kopiranje broja naloga
- pojedinačno brisanje naloga

## Važno

Ovo je naprednija demo verzija, ali još uvijek koristi `localStorage`. To znači da su prijave dostupne samo u pregledniku i na uređaju na kojem su unesene.

Fotografije također koriste prostor preglednika, pa aplikacija automatski pokušava spremiti prijavu bez fotografije ako nema dovoljno lokalnog prostora.

## Sljedeći korak za pravu produkcijsku aplikaciju

Za korištenje u stvarnom servisu treba dodati backend i online bazu podataka. Tada bi korisnik mogao poslati prijavu s bilo kojeg mobitela ili računala, a servis bi sve prijave vidio na jednom administratorskom računu.

Moguće nadogradnje:

- prijava servisera / administratora
- Supabase ili Firebase baza
- slike spremljene u cloud storage
- e-mail obavijest nakon prijave
- obavijest servisu o hitnom kvaru
- javna stranica za provjeru statusa po broju naloga
- dodjela servisera nalogu
- evidencija dijelova, rada i troškova
- PDF servisni zapisnik

## Pokretanje

Aplikacija je napravljena u običnom HTML-u, CSS-u i JavaScriptu. Za lokalni pregled otvorite `index.html` u pregledniku ili projekt poslužite preko jednostavnog lokalnog web servera.
