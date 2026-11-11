begin;
-- The participant allowance stays fixed. Existing proof/reviews cannot be replaced.
-- The challenge row is already locked FOR UPDATE in stakeup_community, serializing
-- pass consumption with settlement; completed challenges stay immutable.
do $$declare def text;old text:=$q$if clock_timestamp()>o.deadline_at then raise exception 'Choose or cancel a grace day before its upload deadline.';end if;$q$;begin
 def:=pg_get_functiondef('public.stakeup_community(text,jsonb)'::regprocedure);
 if position(old in def)=0 then raise exception 'Unexpected community function version';end if;
 def:=replace(def,old,$q$if p_action='grace_cancel'and clock_timestamp()>o.deadline_at then raise exception 'A used past grace pass cannot be cancelled.';end if;$q$);
 execute def;
end;$$;
commit;
