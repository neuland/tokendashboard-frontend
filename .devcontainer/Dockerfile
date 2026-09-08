FROM mcr.microsoft.com/devcontainers/base:ubuntu

RUN apt-get update && apt-get install -y \
    bash \
    curl \
    wget \
    git \
    build-essential \
    git-delta \
    locales \
    ripgrep \
    jq \
 && localedef -i en_US -f UTF-8 UTF-8

WORKDIR /workspaces/tokendashboard-frontend

USER vscode
