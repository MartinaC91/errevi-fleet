-- POLICY TEMPORANEE PER TEST SENZA LOGIN.
-- ATTENZIONE: rendono la tabella mezzi leggibile e modificabile tramite la chiave pubblica.
-- Non inserire dati sensibili e sostituirle con policy per utenti autenticati prima dell'uso aziendale.

drop policy if exists "mezzi_test_select" on public.mezzi;
drop policy if exists "mezzi_test_insert" on public.mezzi;
drop policy if exists "mezzi_test_update" on public.mezzi;
drop policy if exists "mezzi_test_delete" on public.mezzi;

create policy "mezzi_test_select" on public.mezzi for select to anon using (true);
create policy "mezzi_test_insert" on public.mezzi for insert to anon with check (true);
create policy "mezzi_test_update" on public.mezzi for update to anon using (true) with check (true);
create policy "mezzi_test_delete" on public.mezzi for delete to anon using (true);
