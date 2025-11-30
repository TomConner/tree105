#!/usr/bin/env bash
set -e

echo "git pull"
cd ${HOME}/tree105
git pull

echo "hugo build"
cd ${HOME}/tree105/generator
hugo

echo "docker down"
cd ${HOME}/tree105
docker compose down server

echo "docker build"
docker compose build

echo "docker compose up"
docker compose up -d

echo "docker compose logs follow"
docker compose logs -f
