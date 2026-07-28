# Errevi Fleet - Modulo Mezzi v1

Questa versione collega la pagina **Mezzi** alla tabella `public.mezzi` di Supabase e permette:

- visualizzazione mezzi;
- ricerca e filtro per stato;
- inserimento;
- modifica;
- eliminazione;
- normalizzazione automatica della targa (maiuscolo e senza spazi).

## Aggiornamento tramite GitHub

1. Decomprimi lo ZIP.
2. Nel repository GitHub `MartinaC91/errevi-fleet` scegli **Add file > Upload files**.
3. Carica il contenuto della cartella, accettando la sostituzione dei file esistenti.
4. Esegui il commit. Vercel avvierà automaticamente un nuovo deploy.

## Passaggio Supabase necessario per il test

Apri **Supabase > SQL Editor > New query**, incolla il contenuto di:

`supabase/01-policy-test-mezzi.sql`

e premi **Run**.

Le policy sono esclusivamente temporanee perché il login non è ancora attivo. Prima dell'uso con dati aziendali verranno sostituite con policy basate su autenticazione e ruoli.
