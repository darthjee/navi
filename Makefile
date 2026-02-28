.PHONY: help setup dev tests build-dev build

PROJECT ?= navi
COMPOSE ?= docker compose
APP_SERVICE ?= $(PROJECT)_app
TEST_SERVICE ?= $(PROJECT)_tests
DEV_SHELL ?= /bin/bash
IMAGE ?= $(PROJECT)
DOCKERFILE_DEV ?= dockerfiles/dev_navy/Dockerfile
DOCKERFILE_PROD ?= dockerfiles/navy/Dockerfile

help:
	@echo "Usage:"
	@echo "  make setup      Prepare dev environment (.env + compose build)"
	@echo "  make dev        Open $(APP_SERVICE) container with $(DEV_SHELL)"
	@echo "  make tests      Open $(TEST_SERVICE) container with $(DEV_SHELL)"
	@echo "  make build-dev  Build development image from $(DOCKERFILE_DEV)"
	@echo "  make build      Build production image from $(DOCKERFILE_PROD)"

setup: .env
	$(COMPOSE) build $(APP_SERVICE)

dev: .env
	$(COMPOSE) run --rm $(APP_SERVICE) $(DEV_SHELL)

tests:
	$(COMPOSE) run --rm $(TEST_SERVICE) $(DEV_SHELL)

build-dev:
	docker build -f $(DOCKERFILE_DEV) . -t $(IMAGE):dev

build:
	docker build -f $(DOCKERFILE_PROD) . -t $(IMAGE):latest

.env:
	cp .env.sample .env
