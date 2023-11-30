#!/bin/zsh

db="/home/tom/tree105/db/tree105.sqlite"

sqlite3 $db '.read /home/tom/tree105/bin/how_many.sql'
sudo sqlite3 $db '.read /home/tom/tree105/bin/active.sql'
