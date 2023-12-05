#!/bin/zsh

ssh_remote="tom@troop105treedrive.com"
remote_tree="${ssh_remote}:tree105"
local_tree="$HOME/tree105"

ssh "$ssh_remote" "tree105/bin/daily-server.sh"
scp "$remote_tree/work/tree105-backup.zip" "$local_tree/work"
unzip "$local_tree/work/tree105-backup.zip" -d "$local_tree/work"

ls -lt "$local_tree/work" | head -10

echo "Extract is next. Continue → Enter"
read foo

cd "$HOME/tree105/bin"
./extract.sh | less

echo "Emails are next. Continue → Enter"
read foo

./emails sendem registered

cd "$local_path"
