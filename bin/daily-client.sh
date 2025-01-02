#!/bin/zsh

ssh_remote="tom@troop105treedrive.com"
remote_tree="${ssh_remote}:tree105"
export local_tree="$HOME/tree105"
export local_work="$local_tree/work"
mkdir -p $local_work

ssh "$ssh_remote" "tree105/bin/daily-server.sh"
scp "$remote_tree/work/tree105-backup.zip" "$local_work"
unzip "$local_work/tree105-backup.zip" -d "$local_work"

ls -lt "$local_work" | head -10

echo "Extract is next. Continue → Enter"
read foo

cd "$HOME/tree105/bin"
./extract.sh | less

echo "New order summary is next. Continue → Enter"
read foo

./new-order-summary

echo "Emails are next. Continue → Enter"
read foo

./emails sendem registered

cd "$local_path"
