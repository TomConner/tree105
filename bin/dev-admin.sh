#!/bin/zsh

. "/tree105/.env"

DB_BACKUP_FILE="/tree105/work/$(ls -t /tree105/work | grep '\.sqlite' | head -1)"
DEV_DB="/tree105/db/tree105-dev.sqlite"

tstat() {
    echo Environment: ${ENV_LABEL:?}
    echo DB_BACKUP_FILE: "${DB_BACKUP_FILE}"
    echo DEV_DB: "${DEV_DB}"
    alias tdb="sqlite3 ${DEV_DB:?}"
}

da() {
    local _da=/tree105/bin/dev-admin.sh
    vim ${_da}
    . ${_da}
}
pb() {
    pushd /tree105
    dc stop server

    local ssh_remote="tom@troop105treedrive.com"
    local remote_tree="${ssh_remote}:tree105"
    local local_work="${TREE_HOME}/work"
    mkdir -p $local_work
    ssh "$ssh_remote" "tree105/bin/daily-server.sh"
    scp "$remote_tree/work/tree105-backup.zip" "$local_work"
    unzip "$local_work/tree105-backup.zip" -d "$local_work"
    DB_BACKUP_FILE="/tree105/work/$(ls -t /tree105/work | grep '\.sqlite' | head -1)"
    cp -puv "${DB_BACKUP_FILE}" "${DEV_DB}"
    echo DB_BACKUP_FILE: "${DB_BACKUP_FILE}"
    echo DEV_DB: "${DEV_DB}"

    cd server
    tdb '.read import-stripe-charges.sql'
    tdb '.read import-contacts.sql'
    tdb '.read pickups-view.sql'
    tdb '.read email-history-view.sql'

    dcupd
    popd
}

tb() {
    dc stop server
    dcb
    (cd /tree105/admin-app; npm run build)
    dcupd
}

dev_front() {
    cd "${TREE_HOME}/admin-app"
    npm run dev
}

dev_server() {
    cd "${TREE_HOME}/bin"
    ./server
}

alias build-deploy='git pull; hugo; dcd server; dc build; dcupd; dclf'

bdpl() {
    # build deploy
    cd ${HOME}/tree105
    git pull
    cd ${HOME}/tree105/generator
    hugo
    cd ${HOME}/tree105
    dcd server
    dc build
    dcupd
    dclf
}
