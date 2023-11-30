#!/bin/zsh

name="tree105"
db_dir="$HOME/tree105/db"
db_file="$HOME/tree105/db/$name.sqlite"
backup_dir="$HOME"

stamp="$(date -u +"%Y-%m-%d.%H-%M-%S")"
db_backup_file="$backup_dir/$stamp-$name-db.sqlite"
compose_full_backup_file="$backup_dir/$stamp-$name-compose-full.log"
compose_backup_file="$backup_dir/$stamp-$name-compose.log"

sqlite3 "$db_file" ".backup $db_backup_file"
echo "$db_backup_file"

docker compose logs > "$compose_full_backup_file"
echo "$compose_full_backup_file"

docker compose logs --since 48h > "$log_backup_file"
echo "$log_backup_file"
