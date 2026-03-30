.PHONY: help setup dev tests build-dev build build-httpd

PROJECT ?= navi
COMPOSE ?= docker compose
APP_SERVICE ?= $(PROJECT)_app
DEV_SERVICE ?= $(PROJECT)_dev_app
TEST_SERVICE ?= $(PROJECT)_tests
DEV_SHELL ?= /bin/bash
IMAGE ?= $(PROJECT)
DOCKERFILE_DEV ?= dockerfiles/dev_navy/Dockerfile
DOCKERFILE_PROD ?= dockerfiles/navy/Dockerfile
DOCKERFILE_HTTPD ?= dockerfiles/dev_httpd/Dockerfile

help:
	@echo "Usage:"
	@echo "  make setup      Prepare dev environment (.env + compose build)"
	@echo "  make dev        Open $(APP_SERVICE) container with $(DEV_SHELL)"
	@echo "  make tests      Open $(TEST_SERVICE) container with $(DEV_SHELL)"
	@echo "  make build-dev   Build development image from $(DOCKERFILE_DEV)"
	@echo "  make build       Build production image from $(DOCKERFILE_PROD)"
	@echo "  make build-httpd Build dev httpd image from $(DOCKERFILE_HTTPD)"

setup: .env
	$(COMPOSE) build base_build
	$(COMPOSE) run --rm $(APP_SERVICE) yarn install

dev: .env
	$(COMPOSE) run --rm $(APP_SERVICE) $(DEV_SHELL)

tests:
	$(COMPOSE) run --rm $(TEST_SERVICE) $(DEV_SHELL)

build-dev:
	docker build -f $(DOCKERFILE_DEV) . -t $(IMAGE):dev

build:
	docker build -f $(DOCKERFILE_PROD) . -t $(IMAGE):latest

build-httpd:
	docker build -f $(DOCKERFILE_HTTPD) . -t $(IMAGE):httpd

dev-app:
	$(COMPOSE) run --rm $(DEV_SERVICE) $(DEV_SHELL)

.env:
	cp .env.sample .env
