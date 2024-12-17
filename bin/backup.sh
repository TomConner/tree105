#!/bin/zsh

name="tree105"
db_dir="$HOME/tree105/db"
db_file="$db_dir/$name.sqlite"
backup_dir="$HOME/tree105/work"

stamp="$(date -u +"%Y-%m-%d.%H-%M-%S")"

mkdir -p "$backup_dir"
pushd "$backup_dir"
pwd

db_backup_file="$stamp-$name-db.sqlite"
sqlite3 "$db_file" ".backup $db_backup_file"
echo "$db_backup_file"

compose_full_backup_file="$stamp-$name-compose-full.log"
docker compose -f /home/tom/tree105/docker-compose.yaml logs > "$compose_full_backup_file"
echo "$compose_full_backup_file"

compose_backup_file="$stamp-$name-compose.log"
docker compose -f /home/tom/tree105/docker-compose.yaml logs --since 48h > "$compose_backup_file"
echo "$compose_backup_file"

docker_backup_file="$stamp-$name-docker.log"
docker events \
    -f type=container \
    -f type=service \
    -f type=volume \
    -f type=daemon \
    -f type=network \
    --since 48h --until 0s > "$docker_backup_file"
echo "$docker_backup_file"

backup_zip_file="$stamp-$name-backup.zip"
backup_zip_file_nostamp="$name-backup.zip"
zip "$backup_zip_file" \
        "$db_backup_file" \
        "$compose_full_backup_file" \
        "$compose_backup_file" \
        "$docker_backup_file"
cp -p "$backup_zip_file" "$backup_zip_file_nostamp"
echo "$backup_zip_file_nostamp"

popd
