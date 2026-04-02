.PHONY: help setup dev tests build-dev build build-httpd

PROJECT ?= navi
COMPOSE ?= docker compose
APP_SERVICE ?= $(PROJECT)_app
DEV_SERVICE ?= $(PROJECT)_dev_app
TEST_SERVICE ?= $(PROJECT)_tests
DEV_SHELL ?= /bin/bash
IMAGE ?= $(PROJECT)
APP_IMAGE ?= $(PROJECT)_app
DOCKERFILE_DEV ?= dockerfiles/dev_navi/Dockerfile
DOCKERFILE_DEV_APP ?= dockerfiles/dev_app/Dockerfile
DOCKERFILE_PROD ?= dockerfiles/production_navy/Dockerfile

help:
	@echo "Usage:"
	@echo "  make setup      Prepare dev environment (.env + compose build)"
	@echo "  make dev        Open $(APP_SERVICE) container with $(DEV_SHELL)"
	@echo "  make tests      Open $(TEST_SERVICE) container with $(DEV_SHELL)"
	@echo "  make dev-app    Build development image from $(DOCKERFILE_DEV)"
	@echo "  make build-dev  Build dev app image from $(DOCKERFILE_DEV)"
	@echo "  make build-dev-app Build dev app image from $(DOCKERFILE_DEV)"

setup: .env
	$(COMPOSE) build base_build
	$(COMPOSE) run --rm $(APP_SERVICE) yarn install

dev: .env
	$(COMPOSE) run --rm $(APP_SERVICE) $(DEV_SHELL)

tests:
	$(COMPOSE) run --rm $(TEST_SERVICE) $(DEV_SHELL)

dev-app:
	$(COMPOSE) run --rm $(DEV_SERVICE) $(DEV_SHELL)

build-dev:
	docker build -f $(DOCKERFILE_DEV) . -t $(IMAGE):dev

build-dev-app:
	docker build -f $(DOCKERFILE_DEV_APP) . -t $(APP_IMAGE):dev

build:
	docker build -f $(DOCKERFILE_PROD) . -t $(IMAGE):latest

.env:
	cp .env.sample .env
