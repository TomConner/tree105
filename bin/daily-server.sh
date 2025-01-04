#!/bin/zsh

db="$treedir/db/tree105.sqlite"
bin="$treedir/bin"

#sqlite3 $db ".read $bin/how-many.sql"
#sudo sqlite3 $db ".read $bin/active.sql"

"$bin/backup.sh"
