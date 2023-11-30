#!/bin/zsh

dbdir="$HOME/tree105/work"


db="$(ls -t $dbdir/*.sqlite | head -1)"
echo $db

sqlite3 $db '.read extract.sql'
