-- Correct three misspelt district names. Post office names are left exactly as
-- India Post spells them. Safe to run more than once.
update public.post_offices set district = 'Vijayapura'      where lower(district) = 'vjaypura';
update public.post_offices set district = 'Shivamogga'      where lower(district) = 'shivmogga';
update public.post_offices set district = 'Chikkamagaluru'  where lower(district) = 'chikkamangaluru';
