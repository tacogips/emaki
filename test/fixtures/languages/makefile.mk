# comment
.PHONY: all
include config.mk
ifeq (x,x)
build:
	echo $(VAR)
	echo ${VAR}
	echo "hello"
N = 42
other:
	echo done
VALUE = 3
include other.mk
ifeq (a,a)
result:
	echo $(VALUE)
	echo ${VALUE}
COUNT = 8
# end
other:
