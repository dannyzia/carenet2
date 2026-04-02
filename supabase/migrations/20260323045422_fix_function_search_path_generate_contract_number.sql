
CREATE OR REPLACE FUNCTION public.generate_contract_number()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path = ''
AS $function$
BEGIN
  NEW.contract_number := 'CTR-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
    LPAD((nextval('public.contract_number_seq'))::TEXT, 4, '0');
  RETURN NEW;
END;
$function$;
