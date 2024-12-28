#!/bin/zsh

export local_tree="$HOME/tree105"
export local_work="$local_tree/work"

pull_backup() {
    local ssh_remote="tom@troop105treedrive.com"
    local remote_tree="${ssh_remote}:tree105"
    mkdir -p $local_work
    ssh "$ssh_remote" "tree105/bin/daily-server.sh"
    scp "$remote_tree/work/tree105-backup.zip" "$local_work"
    unzip "$local_work/tree105-backup.zip" -d "$local_work"
}

dev_front() {
    cd "$local_tree/admin-ui"
    npm run dev
}

dev_back() {
    cd "$local_tree/server"
    ./server
}

which pull_backup
which dev_front
which dev_back

#./emails sendem registered

