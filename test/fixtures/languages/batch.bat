REM comment
@echo "hello"
set N=42
:label
echo %VAR%
for %%i in (1) do echo %%i
if yes goto label
set X=3
if yes echo yes
echo %X%
goto done
:done
REM end
set Y=8
echo %Y%
echo "done"
set Z=9
set X=3
if yes echo yes
echo %X%
