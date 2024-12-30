#!/bin/zsh

. "${HOME}/tree105/.env"
echo Environment: ${ENV_LABEL:?}
DB_FILE="${DB_DIR:?}/$(ls -t ${DB_DIR:?} | grep '\.sqlite' | head -1)"
echo DB_FILE: ${DB_FILE:?}

dev_admin() {
    cd "${TREE_HOME}/bin"
    . ./dev-admin.sh
}
pull_backup() {
    local ssh_remote="tom@troop105treedrive.com"
    local remote_tree="${ssh_remote}:tree105"
    local local_work="${TREE_HOME}/work"
    mkdir -p $local_work
    ssh "$ssh_remote" "tree105/bin/daily-server.sh"
    scp "$remote_tree/work/tree105-backup.zip" "$local_work"
    unzip "$local_work/tree105-backup.zip" -d "$local_work"
}

dev_front() {
    cd "${TREE_HOME}/admin-app"
    npm run dev
}

dev_server() {
    cd "${TREE_HOME}/bin"
    ./server
}

tdb() {
    sqlite3 ${DB_FILE:?}
}

which dev_admin
which pull_backup
which dev_front
which dev_server
which tdb

#./emails sendem registered

