-- comment
(* block
middle comment
*)
tell application "Finder"
  set n to 42
end tell
set value to 3
if value then
  set value to 4
end if
tell application "Finder"
  set itemCount to 8
end tell
set result to "done"
return result
-- end
set value to 3
if value then
  set value to 4
