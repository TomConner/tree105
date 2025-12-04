#!/bin/bash

source "$HOME/tree105/.env"

backup_dir="$HOME/tree105/work"
name="tree105"
stamp="$(date -u +"%Y-%m-%d.%H-%M-%S")"

db_dir="$(dirname ${TREE_DB})"
db_file="$(basename ${TREE_DB})"
TREE_DB_BACKUP="${backup_dir}/${stamp}-${db_file}"

# Extract the directory and filename using parameter expansion


mkdir -p "$backup_dir"
cd "$backup_dir"

sqlite3 "$TREE_DB" ".backup $TREE_DB_BACKUP"

compose_full_backup_file="$stamp-$name-compose-full.log"
docker compose -f /home/tom/tree105/docker-compose.yaml logs > "$compose_full_backup_file"
realpath "$compose_full_backup_file"

compose_backup_file="$stamp-$name-compose.log"
docker compose -f /home/tom/tree105/docker-compose.yaml logs --since 48h > "$compose_backup_file"
realpath "$compose_backup_file"

docker_backup_file="$stamp-$name-docker.log"
docker events \
    -f type=container \
    -f type=service \
    -f type=volume \
    -f type=daemon \
    -f type=network \
    --since 48h --until 0s > "$docker_backup_file"
realpath "$docker_backup_file"

backup_zip_file="$stamp-$name-backup.zip"
backup_zip_file_nostamp="$name-backup.zip"
zip "$backup_zip_file" \
        "$(basename $TREE_DB_BACKUP)" \
        "$compose_full_backup_file" \
        "$compose_backup_file" \
        "$docker_backup_file"
cp -p "$backup_zip_file" "$backup_zip_file_nostamp"
realpath "$backup_zip_file_nostamp"

