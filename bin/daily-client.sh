#!/bin/zsh

ssh_remote=tom@troop105treedrive.com
local_path="$HOME/tree105/work"

get_file() {
    file="$1"
    remote_path="${ssh_remote}:${file}"
    scp "$remote_path" "$local_path"
}

ssh "$ssh_remote" /home/tom/tree105/bin/daily-server.sh
sleep 2

echo "backup..."
for file in $(ssh "$ssh_remote" /home/tom/tree105/bin/backup.sh); do
    sleep 2

    echo "$file"
    get_file "$file"
done

echo ""

ls -lt "$local_path" | head -10

echo "Extract is next. Continue → Enter"
read foo

cd "$HOME/tree105/bin"
./extract.sh | less

echo "Emails are next. Continue → Enter"
read foo

./emails sendem registered

cd "$local_path"