-- Remove demo clinic rows if the old seed migration was applied

delete from public.messages where thread_id in ('P001', 'P002', 'P003', 'P004', 'P005');

delete from public.dispense_log where patient_id in ('P001', 'P002', 'P003', 'P004', 'P005')
  or med_id in ('M001', 'M002', 'M003', 'M004', 'M005', 'M006');

delete from public.inventory where id in ('M001', 'M002', 'M003', 'M004', 'M005', 'M006');

delete from public.patients where id in ('P001', 'P002', 'P003', 'P004', 'P005');
