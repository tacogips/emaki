program Demo;
var count: integer;
var title: string;
procedure Reset;
begin
  count := 0;
end;
BEGIN
  { c }
  title := 'it''s';
  count := 42;
  (* multi
     line comment
     remains open *)
  // explanatory line
  if count > 0 then
  begin
    count := count + 1;
  end;
  Reset;
  count := count + 2;
End.
